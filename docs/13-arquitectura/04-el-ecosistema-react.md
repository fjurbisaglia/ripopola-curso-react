---
title: El ecosistema - Vite, React Router, TanStack Start, Astro y el Pages Router
sidebar_position: 4
description: Concepto - las otras formas de hacer apps React que vas a encontrar en el trabajo (SPA con Vite, React Router en modo framework, TanStack Start, Astro), cuándo elegir cada una y la tabla de equivalencias entre Pages Router y App Router.
---

# El ecosistema React

<Tech ids={['vite', 'reactrouter', 'astro', 'nextdotjs', 'react']} />

<Estado tipo="concepto">Lo que vas a ver en otras empresas y en entrevistas. Ripopola usa Next con App Router.</Estado>

## Concepto

React es la librería; hay varias formas de armar una app con ella. Un senior
sabe en cuál está parado y por qué.

### SPA con Vite

```bash
pnpm create vite@latest mi-app -- --template react-ts
```

- Todo se renderiza en el navegador (CSR). El servidor solo entrega un
  `index.html` vacío y el JS.
- Rutas con **React Router** (modo librería: `createBrowserRouter`) o
  **TanStack Router** (rutas tipadas de punta a punta).
- Datos con TanStack Query contra una API.
- Se despliega como estáticos en un bucket o CDN: barato y simple.
- **Para**: paneles internos, apps detrás de login, herramientas donde el SEO
  no importa. Es lo que usa el curso de referencia para las primeras apps, y
  muchísimo código en empresas.

### React Router en modo framework (ex Remix)

React Router 7 absorbió a Remix: con su plugin de Vite es un framework con
SSR, `loader` (leer datos en el servidor) y `action` (mutaciones con
formularios), muy apegado a la plataforma web (`Request`, `Response`,
`<Form>`). Corre en cualquier servidor JS.

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  return getTown(params.slug);
}
export default function Town({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

### TanStack Start

Framework sobre TanStack Router con SSR, *server functions* y streaming,
con tipado de rutas y parámetros muy fuerte. Más nuevo; atractivo si ya usás
el ecosistema TanStack.

### Astro

Para sitios **de contenido**: genera HTML estático y solo hidrata las "islas"
interactivas (que pueden ser componentes React). Ideal para blogs, docs y
landings; no para apps muy interactivas.

### Cuándo cada uno

| Necesidad | Opción |
| --- | --- |
| SEO, contenido dinámico, caché, imágenes, todo integrado | **Next.js** |
| Panel interno sin SEO, despliegue estático barato | Vite + React Router o TanStack Router |
| SSR cercano a los estándares web, sin atarse a una plataforma | React Router (modo framework) |
| Tipado de rutas extremo y ecosistema TanStack | TanStack Start |
| Sitio de contenido con poca interactividad | Astro |
| App móvil | React Native con Expo (otro curso) |

¿Ripopola podría ser una SPA? El panel sí (no necesita SEO). Pero tener las
dos apps en Next comparte conocimiento, librerías y despliegue, y el panel
igual aprovecha Server Components y Server Actions.

## Pages Router: el Next que vas a encontrar en código existente

Antes del App Router (Next 13), Next usaba `pages/`. Sigue soportado y hay
muchísimo código así. Las equivalencias:

| Pages Router | App Router |
| --- | --- |
| `pages/pueblos/[slug].tsx` | `app/pueblos/[slug]/page.tsx` |
| `pages/_app.tsx` | `app/layout.tsx` (layout raíz) |
| `pages/_document.tsx` | `app/layout.tsx` (`<html>` y `<body>`) |
| `getServerSideProps` | Server Component `async` que pide los datos (dinámico) |
| `getStaticProps` | Server Component con `'use cache'` |
| `getStaticProps` + `revalidate: 60` (ISR) | `cacheLife` / revalidación a demanda con etiquetas |
| `getStaticPaths` | `generateStaticParams` |
| `pages/api/*.ts` (API Routes) | `app/**/route.ts` (Route Handlers) |
| `useRouter` de `next/router` | `useRouter`, `usePathname`, `useSearchParams` de `next/navigation` |
| `next/head` | `metadata` / `generateMetadata` |
| `_error.tsx`, `404.tsx` | `error.tsx`, `not-found.tsx` |
| `middleware.ts` | `proxy.ts` (Next 16) |
| Todo es componente de cliente (hidratado) | Server Components por defecto |

Las dos pueden convivir en una app durante una migración (rutas en `pages/` y
en `app/`), pero no la misma ruta en los dos.

## Si venís de Angular

<Angular>

Angular es un solo framework con una forma oficial de hacer las cosas. En
React hay que elegir, y en entrevistas te van a preguntar por qué elegiste lo
que elegiste. La respuesta senior no es "porque es lo mejor", sino qué
necesidad cubre y qué costo tiene.

</Angular>

<Resumen>

- Vite + React Router o TanStack Router: SPA, sin SEO, barata de desplegar.
- React Router en modo framework (ex Remix) y TanStack Start: SSR con otros enfoques.
- Astro: contenido con islas interactivas.
- Next: SEO, caché, Server Components y todo integrado; lo elegimos para ripopola.
- Pages Router: código existente; saber traducir cada concepto al App Router.

</Resumen>

## Preguntas de entrevista

**1. ¿Cuándo usarías una SPA con Vite en vez de Next?**
Para apps detrás de login sin necesidad de SEO, donde un despliegue estático
simple y barato alcanza, o cuando el equipo no quiere operar un servidor.

**2. ¿Qué equivale a `getServerSideProps` en el App Router?**
Un Server Component async que pide los datos en el render; con Cache
Components es dinámico salvo que se cachee con `'use cache'`.

**3. ¿Qué pasó con Remix?**
Se fusionó con React Router: React Router 7 en modo framework ofrece loaders,
actions y SSR, y es la continuación de Remix.

**4. ¿Qué es la arquitectura de islas?**
Servir HTML estático e hidratar solo los componentes interactivos de forma
independiente, como hace Astro.

## Glosario

| Término | Qué es |
| --- | --- |
| SPA | Single Page Application: todo se renderiza en el navegador. |
| Pages Router | El sistema de rutas anterior de Next, en `pages/`. |
| Loader / action | Funciones de React Router para leer y mutar datos en el servidor. |
| Islas | Componentes interactivos aislados dentro de una página estática. |
