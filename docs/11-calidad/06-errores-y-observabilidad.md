---
title: Errores y observabilidad
sidebar_position: 6
description: Dónde se pierden los errores en una app Next (servidor, cliente, Server Actions), instrumentation.ts y onRequestError, Sentry con source maps, logs estructurados, global-error y qué mirar en producción.
---

# Errores y observabilidad

<Tech ids={['sentry', 'nextdotjs', 'googlecloud']} />

<Estado tipo="construye">Sentry en la web y el panel (servidor y navegador), `instrumentation.ts`, logs en JSON para Cloud Logging y `global-error.tsx`.</Estado>

## Concepto

En una SPA los errores ocurren en un solo lugar: el navegador. En Next hay
varios, y cada uno se pierde de una forma distinta:

| Dónde | Ejemplo | Si no hacés nada |
| --- | --- | --- |
| Render en el servidor | La API respondió 500 en un Server Component | El usuario ve `error.tsx`; vos, un log en Cloud Run |
| Server Action | Nest caída al publicar | El usuario ve un error genérico; el detalle queda en el servidor |
| Route Handler | El webhook de revalidación falla | Nest reintenta; nadie se entera |
| Navegador | Un `undefined` en un componente de cliente | `error.tsx` en pantalla; vos no te enterás nunca |
| Navegador, fuera de React | Un `onClick` async que falla | Ni siquiera `error.tsx` |

En producción, Next **oculta los mensajes** de los errores del servidor al
cliente (por seguridad) y manda solo un `digest`: un id para buscarlo en los
logs. Sin observabilidad, ese id no sirve de nada.

### Las piezas

- **`instrumentation.ts`**: código que corre al arrancar el servidor
  (`register`) y un *hook* que Next llama en **cada error del servidor**
  (`onRequestError`), con la ruta, el tipo de render y el `digest`.
- **`instrumentation-client.ts`**: corre en el navegador antes de que la app
  sea interactiva. Para inicializar el monitoreo del cliente.
- **Un servicio de errores** (Sentry): agrupa, deduplica, muestra el stack
  con el código original (source maps) y avisa.
- **Logs estructurados**: JSON en la salida estándar, que Cloud Logging indexa.

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `ErrorHandler` global | `error.tsx` / `global-error.tsx` en pantalla + `onRequestError` en el servidor |
| `@sentry/angular` con `TraceService` | `@sentry/nextjs` (servidor, navegador y proxy) |
| Interceptor que loguea errores HTTP | `onError` global del `QueryClient` + `onRequestError` |

</Angular>

## En ripopola

### 1. Sentry

```bash
pnpm dlx @sentry/wizard@latest -i nextjs     # en cada app; revisá lo que genera
```

El asistente crea la configuración del servidor y del cliente, envuelve
`next.config.ts` con `withSentryConfig` (sube los **source maps** en el build
y los borra del output público) y agrega `global-error.tsx`. Lo importante:

```ts title="apps/web/instrumentation.ts"
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.APP_ENV,          // production, staging
      release: process.env.APP_VERSION,          // el SHA del commit (12.4)
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;   // cada error del servidor, con su ruta
```

```ts title="apps/web/instrumentation-client.ts"
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,       // el DSN es público por diseño
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,                          // ni IP ni cookies
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

- **`release`** une el error con el commit: Sentry dice "empezó en esta versión".
- **Sampling**: 10 % de las trazas de rendimiento; los errores, todos.
- **Privacidad (RGPD)**: `sendDefaultPii: false`, y en el panel identificá al
  usuario por id (`Sentry.setUser({ id })`), nunca por correo.

### 2. Los errores que no ve React

```ts title="apps/panel/app/providers.tsx (fragmento)"
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ApiError && error.status < 500) return;   // 4xx esperados: no son bugs
      Sentry.captureException(error, { tags: { queryKey: JSON.stringify(query.queryKey) } });
    },
  }),
});
```

Y en `error.tsx` (6.5), en vez de `console.error`:

```tsx
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

### 3. Logs estructurados

Cloud Run manda la salida estándar a **Cloud Logging**. Si cada línea es un
JSON con `severity` y `message`, se puede filtrar por nivel, ruta o usuario:

```ts title="libs/frontend/api/src/logger.ts"
import 'server-only';

type Level = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export function log(severity: Level, message: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ severity, message, ...fields, time: new Date().toISOString() }));
}
```

```ts
log('WARNING', 'La API tardó más de 2 s', { path: '/api/v1/towns/albarracin', ms: 2310 });
```

Lo mismo que en Nest (curso de Nest, *logging*): con el mismo formato, una
búsqueda en Cloud Logging trae las líneas de la web y de la API juntas.

### 4. `global-error.tsx`

```tsx title="apps/web/app/global-error.tsx"
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: unknown }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <h1>Algo salió mal</h1>
        <p>Ya nos enteramos. Probá recargar la página.</p>
      </body>
    </html>
  );
}
```

Atrapa los errores del layout raíz, donde ningún `error.tsx` llega. Reemplaza
todo el documento, por eso tiene su propio `<html>` (fijo en español: el
layout con el idioma es justamente lo que falló).

### 5. Qué mirar en producción

| Señal | Dónde | Alerta si... |
| --- | --- | --- |
| Errores nuevos | Sentry | Aparece un error que no existía en la versión anterior |
| Tasa de errores 5xx | Cloud Run (métricas) | Supera el 1 % en 5 minutos |
| Latencia p95 | Cloud Run | La web supera 1 s |
| Web Vitals | Sentry o el endpoint del 11.4 | LCP p75 > 2,5 s |
| Revalidaciones fallidas | Logs de Nest (cola BullMQ) | Trabajos en estado `failed` |

<Alternativa title="OpenTelemetry, Datadog, LogRocket">
Next soporta **OpenTelemetry** (`@vercel/otel` en `instrumentation.ts`) para
mandar trazas a cualquier backend, incluido Cloud Trace: así una petición se
ve de punta a punta, de la web a Nest. **Datadog** y **New Relic** cubren
todo en uno (y cuestan acorde). **LogRocket** y la *session replay* de Sentry
graban la sesión del usuario: útiles, pero revisá el RGPD antes.
</Alternativa>

## Errores comunes

- **`console.error` como estrategia**: nadie lee la consola del navegador del usuario.
- **Reportar los 4xx esperados** (validación, 404): ruido que tapa lo importante.
- **Source maps públicos**: exponen tu código; súbelos a Sentry y no los sirvas.
- **Mandar datos personales** a servicios de terceros.
- **Sin `release`**: no sabés qué deploy rompió qué.
- **Logs en texto libre**: imposibles de filtrar.

<Resumen>

- Los errores ocurren en el servidor, en Server Actions, en el navegador y fuera de React.
- `instrumentation.ts` + `onRequestError` para el servidor; `instrumentation-client.ts` para el navegador.
- Sentry con `release`, source maps privados y sin datos personales.
- Errores fuera de React: `onError` del `QueryClient`; los 4xx esperados no se reportan.
- Logs JSON con `severity` para Cloud Logging; `global-error.tsx` para el layout raíz.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es el `digest` de un error en Next?**
Un id que Next muestra en el cliente en lugar del mensaje real de un error del
servidor, para no filtrar detalles; sirve para encontrarlo en los logs.

**2. ¿Para qué sirve `instrumentation.ts`?**
Para correr código al arrancar el servidor (inicializar monitoreo) y para
recibir cada error del servidor con `onRequestError`.

**3. ¿Qué errores no atrapa un error boundary?**
Los de manejadores de eventos, código async fuera del render y errores del
servidor que no llegan a la UI. Se reportan por otros caminos.

**4. ¿Por qué subir los source maps a Sentry y no servirlos?**
Para ver el stack con el código original sin exponer el código fuente a cualquiera.

**5. ¿Qué es un log estructurado?**
Un log en un formato con campos (JSON) en vez de texto libre, que se puede
filtrar y agregar por nivel, ruta o cualquier otro campo.

## Glosario

| Término | Qué es |
| --- | --- |
| Observabilidad | Poder entender qué pasa en producción a partir de logs, métricas y trazas. |
| `onRequestError` | Hook de Next que recibe cada error del servidor. |
| Source map | Archivo que relaciona el código compilado con el original. |
| Release | Versión desplegada a la que se asocian los errores. |
| Sampling | Registrar solo una parte de los eventos para controlar el costo. |
