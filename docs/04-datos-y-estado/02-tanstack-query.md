---
title: TanStack Query
sidebar_position: 2
description: Estado del servidor vs estado de la UI, queries, query keys, staleTime y gcTime, estados de carga y error, reintentos, DevTools y el patrón queryOptions, con el listado de pueblos.
---

# TanStack Query

<Tech ids={['reactquery', 'react', 'nextdotjs']} />

<Estado tipo="construye">El `QueryClientProvider`, las DevTools y las queries de pueblos con `queryOptions`.</Estado>

## Concepto

### Estado del servidor no es estado de la UI

| Estado de la UI | Estado del servidor |
| --- | --- |
| Es tuyo (panel abierto, pestaña activa) | Es una **copia** de algo que vive en la API |
| Siempre está actualizado | Puede quedar **viejo** |
| Síncrono | Asíncrono: carga, error, reintento |
| Zustand, `useState` | **TanStack Query** |

TanStack Query es una **caché de datos del servidor** en el cliente. Resuelve
lo que harías a mano con efectos: carga, errores, reintentos, deduplicar
peticiones iguales, cancelar las viejas, refrescar al volver a la pestaña y
mostrar datos cacheados mientras trae los nuevos.

### Query

```tsx
const { data, isPending, isError, error, isFetching } = useQuery({
  queryKey: ['towns', 'list', { country, q, page }],
  queryFn: ({ signal }) => fetchTowns({ country, q, page }, signal),
  staleTime: 60_000,
});
```

- **`queryKey`**: identifica el dato en la caché. Es un array serializable. Si
  cambia algo de la key, es otra query (se pide de nuevo o se sirve de caché).
- **`queryFn`**: la función que trae el dato. Recibe un `signal` para cancelar.
- **`isPending`**: no hay datos todavía. **`isFetching`**: hay una petición en
  curso (puede haber datos viejos en pantalla).

### Frescura y recolección

| Opción | Por defecto | Qué hace |
| --- | --- | --- |
| `staleTime` | 0 | Cuánto tiempo el dato se considera fresco. Mientras sea fresco, no se vuelve a pedir. |
| `gcTime` | 5 min | Cuánto se guarda en caché un dato que nadie está usando. |
| `refetchOnWindowFocus` | `true` | Refresca al volver a la pestaña si está viejo. |
| `retry` | 3 (cliente) | Reintentos con espera exponencial. |

Con `staleTime: 0`, cada vez que un componente monta la query, se muestra lo
cacheado **y** se pide de nuevo de fondo (*stale-while-revalidate*).

### `queryOptions`: definir una vez

```ts
export const townQueries = {
  all: () => ['towns'] as const,
  list: (filters: TownFilters) =>
    queryOptions({
      queryKey: [...townQueries.all(), 'list', filters],
      queryFn: ({ signal }) => fetchTowns(filters, signal),
      staleTime: 60_000,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: [...townQueries.all(), 'detail', slug],
      queryFn: ({ signal }) => fetchTown(slug, signal),
    }),
};
```

Así la key y la función nunca se separan, y se reutilizan en `useQuery`,
`prefetchQuery` (7.7) e invalidaciones (4.3). Las keys jerárquicas permiten
invalidar `['towns']` y que caigan todas las de pueblos.

## Si venís de Angular

<Angular>

| Angular | TanStack Query |
| --- | --- |
| `httpResource()` / `resource()` | `useQuery` |
| `shareReplay(1)` en un servicio para cachear | La caché de TanStack Query, por key |
| `switchMap` para cancelar la petición anterior | Cambia la key → la query vieja se cancela sola (con `signal`) |
| `retry(3)` de RxJS | `retry` |
| Un store de NgRx con `loading/error/data` por entidad | No hace falta: lo da la query |

Existe **TanStack Query para Angular** (`@tanstack/angular-query`), con la
misma API sobre signals. Lo que aprendas acá te sirve allá.

</Angular>

## En ripopola

### 1. Instalar y proveer

```bash
pnpm add -E @tanstack/react-query
pnpm add -D -E @tanstack/react-query-devtools
```

```tsx title="apps/web/app/providers.tsx"
'use client';

import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000 }, // con SSR, evita repetir en el cliente lo que vino del servidor
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();     // en el servidor: uno por petición
  browserQueryClient ??= makeQueryClient();   // en el navegador: uno solo
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Y en `app/layout.tsx`: `<body><Providers>{children}</Providers></body>`.

:::warning Un QueryClient por petición en el servidor
Si crearas un `QueryClient` global en el módulo, en el servidor se
**compartiría entre usuarios** distintos. Por eso: nuevo en el servidor, único en el navegador.
:::

### 2. Las queries de pueblos

```ts title="apps/web/features/towns/queries.ts"
import { queryOptions } from '@tanstack/react-query';
import { browserApi } from '@ripopola/frontend-api/browser';
import { unwrap } from '@ripopola/frontend-api';

export type TownFilters = { q?: string; country?: 'ES' | 'IT'; page?: number };

export const townQueries = {
  all: () => ['towns'] as const,
  list: (filters: TownFilters) =>
    queryOptions({
      queryKey: [...townQueries.all(), 'list', filters],
      queryFn: async ({ signal }) =>
        unwrap(await browserApi.GET('/api/v1/towns', { params: { query: filters }, signal })),
    }),
};
```

### 3. Usarla

```tsx
'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { townQueries, type TownFilters } from './queries';

export function TownResults({ filters }: { filters: TownFilters }) {
  const { data, isPending, isError, isPlaceholderData } = useQuery({
    ...townQueries.list(filters),
    placeholderData: keepPreviousData, // al cambiar de página, mantiene la anterior mientras carga
  });

  if (isPending) return <TownGridSkeleton />;
  if (isError) return <p role="alert">No pudimos cargar los pueblos.</p>;

  return (
    <div style={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
      <TownGrid towns={data.items} />
    </div>
  );
}
```

Abrí las DevTools (el ícono abajo a la derecha): vas a ver cada key, si está
fresca o vieja, y podés invalidarla a mano.

### 4. Con Suspense

`useSuspenseQuery` no devuelve `isPending`: suspende, y `data` nunca es
`undefined`. Los estados de carga y error los manejan `Suspense` y el error
boundary (2.6).

## Errores comunes

- **Keys que no incluyen todos los parámetros**: dos filtros distintos comparten caché.
- **Copiar `data` a un `useState`**: duplicás el estado y se desincroniza.
- **`staleTime: 0` con SSR**: el cliente vuelve a pedir lo que acaba de llegar del servidor.
- **Guardar estado de UI en TanStack Query** (o datos del servidor en Zustand).

<Resumen>

- TanStack Query es una caché del estado del servidor, no un gestor de estado general.
- `queryKey` identifica el dato; `queryFn` lo trae; `staleTime` define cuándo está viejo.
- `queryOptions` junta key y función para reutilizarlas.
- Un `QueryClient` por petición en el servidor, uno solo en el navegador.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué no pedir datos con `useEffect` y `useState`?**
Porque hay que resolver a mano carga, error, cancelación, condiciones de
carrera, caché, deduplicación y refresco. TanStack Query lo resuelve.

**2. ¿Diferencia entre `staleTime` y `gcTime`?**
`staleTime` dice cuánto tiempo el dato es fresco y no se vuelve a pedir;
`gcTime` cuánto se conserva en memoria un dato que ya nadie usa.

**3. ¿Diferencia entre `isPending` e `isFetching`?**
`isPending` es que no hay datos todavía; `isFetching` es que hay una petición en
curso, aunque haya datos cacheados en pantalla.

**4. ¿Cómo diseñás las query keys?**
Jerárquicas, de lo general a lo particular (`['towns', 'list', filtros]`), con
todos los parámetros que cambian el resultado. Así se invalida por prefijo.

**5. ¿Por qué el `QueryClient` no puede ser global en el servidor?**
Porque el módulo vive entre peticiones y la caché de un usuario quedaría
visible para otro.

## Glosario

| Término | Qué es |
| --- | --- |
| Estado del servidor | Copia local de datos que viven en otro lado. |
| Query key | Identificador de un dato en la caché. |
| Stale | Dato considerado viejo, candidato a refrescarse. |
| Stale-while-revalidate | Mostrar lo viejo mientras se trae lo nuevo. |
| `keepPreviousData` | Mantener los datos anteriores mientras carga la nueva key. |
