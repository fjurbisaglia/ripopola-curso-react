---
title: Pedir datos en el servidor
sidebar_position: 1
description: Server Components async que llaman a la API de Nest, peticiones en paralelo y cascadas, cache de React para deduplicar, pasar promesas al cliente con use y por qué no hace falta un endpoint propio.
---

# Pedir datos en el servidor

<Tech ids={['nextdotjs', 'nestjs', 'react']} />

<Estado tipo="construye">La capa de datos de servidor de ripopola: `getTown`, `getTownListings` y `getTownJobs` con `cache`, y la ficha del pueblo pidiendo en paralelo.</Estado>

## Concepto

En un Server Component pedís datos con `await`, directamente:

```tsx
export default async function TownPage({ params }: PageProps<'/pueblos/[slug]'>) {
  const { slug } = await params;
  const town = await getTown(slug); // llama a Nest desde el servidor de Next
  return <h1>{town.name}</h1>;
}
```

Sin `useEffect`, sin estado de carga, sin endpoint intermedio: el servidor de
Next llama a Nest por la red interna y devuelve HTML. El navegador no ve la
petición.

### Cascadas (waterfalls)

```tsx
// ❌ En serie: 3 viajes, uno detrás del otro
const town = await getTown(slug);
const listings = await getTownListings(town.id);
const jobs = await getTownJobs(town.id);
```

Si las peticiones no dependen entre sí, **lanzalas juntas**:

```tsx
// ✅ En paralelo
const town = await getTown(slug);
const [listings, jobs] = await Promise.all([getTownListings(town.id), getTownJobs(town.id)]);
```

Mejor todavía: que cada sección pida lo suyo dentro de su propio `Suspense`
(7.2). Así la ficha se ve mientras viviendas y empleos llegan por separado.

Si la API lo permite, también podés evitar la dependencia: Nest puede aceptar
el `slug` en `/towns/{slug}/listings` y así las tres peticiones salen juntas.

### Deduplicar con `cache`

El layout, la página y `generateMetadata` pueden necesitar el mismo pueblo.
`cache` de React memoiza **por petición**:

```ts
import { cache } from 'react';
export const getTown = cache(async (slug: string) => { /* ... */ });
```

Dentro de una misma petición, `getTown('albarracin')` se ejecuta una vez
aunque lo llames en cinco componentes. Entre peticiones no guarda nada (eso es
`'use cache'`, 7.3).

### Pasar una promesa al cliente

Si un componente de cliente necesita los datos, podés empezar la petición en
el servidor **sin esperarla** y pasarle la promesa:

```tsx
// servidor
const reviewsPromise = getTownReviews(town.id); // sin await
<Suspense fallback={<ReviewsSkeleton />}>
  <Reviews reviewsPromise={reviewsPromise} />
</Suspense>

// cliente
'use client';
function Reviews({ reviewsPromise }: { reviewsPromise: Promise<Review[]> }) {
  const reviews = use(reviewsPromise);
  // ...con estado, filtros, interacción
}
```

### Server Components y la API: ¿hace falta un BFF?

En el mercado vas a ver Next con su propia base de datos (Prisma en Server
Components). En ripopola **Nest es el backend**: los Server Components llaman a
Nest. Next no tiene lógica de negocio ni acceso a la base. Esto mantiene una
sola fuente de reglas (y la app móvil del futuro usa la misma API).

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| Resolver de ruta (`ResolveFn`) | `await` en el Server Component |
| `forkJoin([a$, b$])` | `Promise.all([a, b])` |
| `shareReplay` para no repetir la petición en varios componentes | `cache` de React (por petición) |
| `TransferState` para no repetir en el cliente lo que pidió SSR | No hace falta: los Server Components no se ejecutan en el cliente |
| Servicio con `HttpClient` | Funciones `server-only` que usan `publicApi` |

</Angular>

## En ripopola

```ts title="apps/web/features/towns/api.ts"
import 'server-only';
import { cache } from 'react';
import { publicApi } from '@ripopola/frontend-api/server';
import { ApiError, unwrap } from '@ripopola/frontend-api';

export const getTown = cache(async (slug: string) => {
  try {
    return unwrap(await publicApi.GET('/api/v1/towns/{slug}', { params: { path: { slug } } }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
});

export const getTownListings = cache(async (townId: string) =>
  unwrap(await publicApi.GET('/api/v1/towns/{id}/listings', { params: { path: { id: townId }, query: { status: 'published' } } })),
);
```

En el 7.3 estas funciones se marcan con `'use cache'` para que entren en el
shell estático.

## Errores comunes

- **Cascadas sin darte cuenta**: `await` uno detrás de otro cuando podían ir juntos.
- **Crear un Route Handler en Next para que el Server Component lo llame**: es
  un viaje de red de más. Llamá directo a Nest (o a la función).
- **Llamar a `fetch('/api/...')` relativo en el servidor**: no hay origen; usá `API_INTERNAL_URL`.
- **Confundir `cache` (por petición) con `'use cache'` (entre peticiones).**

<Resumen>

- Server Components async: `await` de datos directamente, sin efectos ni endpoints intermedios.
- Peticiones independientes en paralelo (`Promise.all` o Suspense separados).
- `cache` de React deduplica dentro de una petición.
- Una promesa se puede pasar a un Client Component y leerla con `use`.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo se piden datos en un Server Component?**
Haciendo el componente `async` y esperando la llamada directamente; el
resultado se renderiza en el servidor y no se repite en el cliente.

**2. ¿Qué es una cascada de peticiones y cómo la evitás?**
Peticiones en serie que podrían ir en paralelo. Se evita con `Promise.all`,
iniciando las promesas antes de esperarlas, o separando en límites de Suspense.

**3. ¿Para qué sirve `cache` de React?**
Para memoizar una función durante una petición del servidor, así varios
componentes pueden pedir el mismo dato sin repetir la llamada.

**4. ¿Cuándo pasarías una promesa a un Client Component?**
Cuando el componente necesita interactividad con esos datos y querés empezar la
petición en el servidor sin bloquear el resto de la página.

## Glosario

| Término | Qué es |
| --- | --- |
| Waterfall | Peticiones encadenadas que podrían ser paralelas. |
| BFF | Backend for Frontend: una capa de servidor pensada para un frontend. |
| Deduplicar | Evitar repetir la misma petición. |
