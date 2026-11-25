---
title: El build de producción y las variables por entorno
sidebar_position: 1
description: Qué hace next build, cómo leer su salida (rutas prerenderizadas y dinámicas), output standalone, variables de build y de runtime, una imagen para varios entornos, deploymentId y el desfase de versiones.
---

# El build de producción y las variables por entorno

<Tech ids={['nextdotjs', 'nx', 'docker']} />

<Estado tipo="construye">El build de la web y del panel con `output: 'standalone'`, leído ruta por ruta, y la estrategia de variables para tener una imagen por entorno o una para todos.</Estado>

## Concepto

### Qué hace `next build`

1. Compila TypeScript y empaqueta servidor y cliente (Turbopack).
2. **Prerenderiza** lo que puede: páginas estáticas y el *shell* de las que
   tienen partes dinámicas (7.2).
3. Escribe en `.next/` todo lo que `next start` necesita.

La salida te dice qué pasó con cada ruta:

```
Route (app)                                Size
┌ ◐ /[locale]                                ...
├ ◐ /[locale]/pueblos/[slug]                 ...
│   ├ /es/pueblos/albarracin
│   └ /it/paesi/albarracin
├ ƒ /internal/revalidate
└ ○ /robots.txt

○  (Static)   prerenderizada como contenido estático
◐  (Partial Prerender)  shell estático + contenido dinámico transmitido
ƒ  (Dynamic)  renderizada en cada petición
```

**Leelo en cada PR que toca rutas.** Si la ficha del pueblo pasa de `◐` a
`ƒ`, algo leyó cookies o cabeceras fuera de un `<Suspense>` y perdiste la caché.

### `output: 'standalone'`

Con `standalone`, Next copia a `.next/standalone/` un `server.js` y **solo
los `node_modules` que usa** (los rastrea en el build). La imagen de Docker
pasa de ~1 GB a ~150 MB. Lo que **no** copia: `.next/static` y `public/`, que
van aparte (12.2).

### Variables: build y runtime

| Tipo | Cuándo se fija | Ejemplos en ripopola |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | En el **build**: el valor queda escrito en el JavaScript | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SENTRY_DSN` |
| Las demás | En **runtime**, al leer `process.env` en el servidor | `API_INTERNAL_URL`, `REVALIDATE_SECRET`, `SENTRY_DSN` |

Consecuencia: una imagen construida con `NEXT_PUBLIC_API_URL=https://api.staging...`
llama a staging para siempre, aunque la despliegues en producción.

Dos estrategias:

| | Una imagen por entorno | Una imagen para todos |
| --- | --- | --- |
| Cómo | El build recibe las `NEXT_PUBLIC_*` del entorno | El navegador no usa `NEXT_PUBLIC_*` con URLs |
| Pro | Simple | Lo que probaste en staging es **exactamente** lo que va a producción |
| Contra | Dos builds; staging y producción no son la misma imagen | Hay que diseñarlo |

Ripopola empieza con **una imagen por entorno** (staging y producción), que es
lo más simple con dos entornos. Si se vuelve un problema, el camino a una sola
imagen: el navegador usa rutas relativas (`/api/...`) con los rewrites de
Next también en producción, y los valores públicos se pasan desde el servidor
(un Server Component los lee en runtime y los entrega como props).

### Desfase de versiones (*version skew*)

Durante un deploy conviven dos versiones: un usuario con la pestaña abierta
tiene el JS viejo y pide al servidor nuevo una Server Action que ya no existe.
Next lo mitiga si le decís qué versión es cada build:

```ts
const nextConfig: NextConfig = {
  deploymentId: process.env.APP_VERSION,   // el SHA del commit
};
```

Con `deploymentId`, si el cliente y el servidor no coinciden, Next hace una
recarga completa en la siguiente navegación en vez de fallar raro. Ojo: el
`deploymentId` también forma parte de la clave de `'use cache'`, así que cada
deploy empieza con la caché vacía (con un cache handler compartido, 12.3, las
entradas viejas simplemente dejan de usarse).

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `ng build` → `dist/` con archivos estáticos (o `server/` con SSR) | `next build` → `.next/`, siempre con un servidor (salvo `output: 'export'`) |
| `fileReplacements` con `environment.prod.ts` | `.env.production` y variables del entorno |
| Budgets | La tabla de rutas + Lighthouse CI (11.4) |
| Prerender de rutas con `@angular/ssr` | `○` y `◐` en la salida del build |

</Angular>

## En ripopola

### 1. La configuración final

```ts title="apps/web/next.config.ts"
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  deploymentId: process.env.APP_VERSION,
  images: { remotePatterns: [new URL('https://storage.googleapis.com/ripopola-media/**')] },
  // cacheHandlers: 12.3
  async headers() { /* 11.5 */ return []; },
  async rewrites() { /* 4.1, para desarrollo y previews */ return []; },
};

export default withSentryConfig(createNextIntlPlugin()(nextConfig), { silent: true });
```

### 2. Construir con Nx

```bash
pnpm nx build web
pnpm nx build panel
```

Nx guarda en caché el resultado: si no cambió nada que afecte a la web, el
build es instantáneo. En un monorepo, `standalone` reproduce la estructura de
carpetas desde la raíz, así que el `server.js` queda en
`.next/standalone/apps/web/server.js`. Revisá la ruta exacta en tu build
antes de escribir el Dockerfile.

### 3. Probar el build en local

```bash
pnpm nx build web && pnpm nx start web     # next start en 4200, contra tu API local
```

Recorré las páginas importantes y mirá en DevTools → *Network* que las
fichas respondan rápido la segunda vez (caché) y que no haya JS de más.

### 4. Los archivos de variables

```bash title="apps/web/.env.production (sí se sube: sin secretos)"
NEXT_PUBLIC_SITE_URL=https://ripopola.com
NEXT_PUBLIC_API_URL=https://api.ripopola.com
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

Los secretos (`REVALIDATE_SECRET`, `SENTRY_AUTH_TOKEN`) nunca en archivos:
en Secret Manager y en los secretos de GitHub Actions (12.3 y 12.4).

## Errores comunes

- **No leer la salida del build**: una ruta que se volvió dinámica pasa desapercibida.
- **Esperar que una `NEXT_PUBLIC_*` cambie sin rebuild.**
- **Copiar `.next/standalone` y olvidar `static` y `public`**: la página sin CSS ni imágenes.
- **Construir en una máquina y usar `.env.local`**: el build toma valores de desarrollo.
- **Sin `deploymentId`**: errores raros en Server Actions durante los deploys.

<Resumen>

- `next build` compila y prerenderiza; la tabla de rutas dice qué es estático, parcial o dinámico.
- `output: 'standalone'`: servidor mínimo para Docker; `static` y `public` aparte.
- `NEXT_PUBLIC_*` se fija en el build; el resto se lee en runtime.
- Una imagen por entorno para empezar; una sola imagen si el navegador no depende de `NEXT_PUBLIC_*`.
- `deploymentId` contra el desfase de versiones.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué significan los símbolos de la salida de `next build`?**
Estático (prerenderizado completo), prerender parcial (shell estático con
partes dinámicas transmitidas) y dinámico (render en cada petición).

**2. ¿Por qué una variable `NEXT_PUBLIC_` no cambia al redeployar la misma imagen?**
Porque se reemplaza por su valor en el JavaScript durante el build. Para
cambiarla hay que volver a construir.

**3. ¿Qué es `output: 'standalone'`?**
Un modo de build que genera un servidor mínimo con solo las dependencias que
usa la app, pensado para contenedores.

**4. ¿Qué es el version skew y cómo lo manejás?**
Clientes con una versión vieja hablando con un servidor nuevo durante un
deploy. Se mitiga identificando cada build (`deploymentId`) para forzar una
recarga cuando no coinciden.

## Glosario

| Término | Qué es |
| --- | --- |
| Standalone | Salida de build con un servidor Node mínimo y autónomo. |
| Prerender | Generar el HTML en el build. |
| Version skew | Desfase entre la versión del cliente y la del servidor. |
| `deploymentId` | Identificador del build que Next usa para detectar el desfase. |
