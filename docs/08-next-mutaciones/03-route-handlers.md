---
title: Route Handlers
sidebar_position: 3
description: Endpoints HTTP propios de Next con route.ts - métodos, Request y Response, params, caché, cuándo hacen falta si ya hay una API en Nest, y los que usa ripopola - webhook de revalidación, health check y la imagen OG.
---

# Route Handlers

<Tech ids={['nextdotjs', 'typescript']} />

<Estado tipo="construye">Los endpoints propios de la web: `/internal/revalidate` (7.4) y `/internal/health` para Cloud Run. El resto se ve como concepto.</Estado>

## Concepto

Un archivo `route.ts` dentro de `app/` define un **endpoint HTTP**. Exporta
una función por método, con las APIs web estándar `Request` y `Response`:

```ts title="app/internal/health/route.ts"
export function GET() {
  return Response.json({ status: 'ok' });
}
```

- Métodos: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
- `request: NextRequest` agrega `nextUrl` (con `searchParams`) y `cookies`.
- El segundo argumento trae los `params` (asíncronos) de los segmentos dinámicos.
- En una misma carpeta no puede haber `page.tsx` y `route.ts`.

```ts title="app/internal/towns/[slug]/route.ts"
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, ctx: RouteContext<'/internal/towns/[slug]'>) {
  const { slug } = await ctx.params;
  const lang = request.nextUrl.searchParams.get('lang') ?? 'es';
  return Response.json({ slug, lang });
}
```

`RouteContext<'/ruta'>` es otro helper global, como `PageProps`.

### Caché

Un `GET` es dinámico por defecto. Con Cache Components, si querés cachear la
respuesta, sacás el trabajo a una función con `'use cache'` y la llamás desde
el handler. `POST` y los demás métodos nunca se cachean.

### ¿Para qué, si ya hay una API?

En el curso de referencia los Route Handlers son **la** API (REST con
Prisma dentro de Next). En ripopola la API es Nest, así que en Next quedan
solo los endpoints que pertenecen al **frontend**:

| Endpoint | Por qué en Next y no en Nest |
| --- | --- |
| Webhook de revalidación (7.4) | Toca la caché de Next: solo Next puede hacerlo |
| Health check | Cloud Run pregunta si **esta** app está viva |
| `opengraph-image`, `sitemap.xml`, `robots.txt` | Son Route Handlers especiales que genera Next (6.6) |
| Webhooks de terceros que solo afectan al front | Por ejemplo, el CMS de la landing si algún día hay uno |

Todo lo que es negocio (pueblos, viviendas, usuarios, pagos) va a Nest: un
solo lugar con reglas, permisos y tests.

### Route Handler o Server Action

| | Route Handler | Server Action |
| --- | --- | --- |
| Quién lo llama | Cualquiera por HTTP (otro servidor, un webhook, una app móvil) | Tu propia UI de React |
| URL | Estable, la elegís vos | Id cifrado que cambia en cada build |
| Métodos | Todos | Solo POST |
| Para | Integraciones | Mutaciones desde la interfaz |

## Si venís de Angular

<Angular>

Angular no tiene endpoints propios: con `@angular/ssr` podías agregar rutas al
servidor Express de `server.ts` (`server.get('/api/...')`). Un Route Handler es
eso, pero por archivo y con `Request`/`Response` estándar en vez de `req`/`res`
de Express.

</Angular>

## En ripopola

### 1. Health check

```ts title="apps/web/app/internal/health/route.ts"
export function GET() {
  return Response.json({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' });
}
```

Cloud Run lo usa como *startup probe* y *liveness probe* (12.3). No llama a la
API a propósito: si Nest está caída, la web igual puede servir lo cacheado, y
reiniciarla no arregla nada. El panel tiene el mismo archivo.

### 2. Revalidación

Ya lo escribiste en el 7.4: `apps/web/app/internal/revalidate/route.ts`,
protegido con un secreto, llamado por Nest.

### 3. Una convención para lo interno

Todo lo propio de Next que no es una página va bajo `/internal/*`:

- No choca con `/api/*`, que en desarrollo se reenvía a Nest.
- En producción, el balanceador (12.3) puede bloquear `/internal/*` desde
  internet y dejarlo solo para la red interna, con el secreto como segunda capa.
- `robots.ts` lo excluye (6.6).

<Alternativa title="Next como API (el curso de referencia)">
Con Route Handlers + Prisma se arma una API REST completa dentro de Next
(el AdminTodos del curso de referencia). Es lo normal en proyectos chicos
con un solo frontend. Lo vemos como concepto en el 8.6, con lo que cambia
cuando hay varios clientes.
</Alternativa>

## Errores comunes

- **Un `route.ts` en `app/api/...`** con el rewrite de desarrollo: Next
  atiende primero sus rutas, así que tapás el endpoint de Nest con el mismo path.
- **Lógica de negocio en Next** "porque era más rápido": dos APIs que mantener.
- **Webhooks sin verificar** el secreto o la firma.
- **Leer `request.json()` dos veces**: el cuerpo es un stream, se consume una vez.
- **Esperar que un `GET` se cachee solo**: en Next 15+ ya no.

<Resumen>

- `route.ts` exporta funciones por método HTTP con `Request` y `Response` estándar.
- En ripopola solo los endpoints del frontend: revalidación, health check, OG y sitemap.
- Route Handler para integraciones; Server Action para mutaciones desde la UI.
- Convención: `/internal/*` para lo propio de Next.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es un Route Handler?**
Un archivo `route.ts` que define un endpoint HTTP con una función por método,
usando `Request` y `Response` de la plataforma web.

**2. ¿Cuándo usás un Route Handler y cuándo una Server Action?**
Route Handler cuando lo llama alguien externo o necesitás una URL estable y
otros métodos; Server Action para mutaciones desde tu propia interfaz.

**3. Si tenés un backend aparte, ¿para qué querés Route Handlers?**
Para lo que pertenece al frontend: webhooks que invalidan la caché de Next,
health checks, imágenes OG, sitemap. El negocio queda en el backend.

**4. ¿Se cachea un GET de un Route Handler?**
No por defecto desde Next 15. Con Cache Components se cachea el trabajo
interno con `'use cache'`.

## Glosario

| Término | Qué es |
| --- | --- |
| Route Handler | Endpoint HTTP definido con `route.ts`. |
| `NextRequest` | `Request` extendido con `nextUrl` y `cookies`. |
| `RouteContext` | Helper global con el tipo de los `params` de una ruta. |
| Health check | Endpoint que la plataforma consulta para saber si la app está viva. |
