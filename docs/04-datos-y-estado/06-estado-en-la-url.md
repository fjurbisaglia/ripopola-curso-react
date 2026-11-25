---
title: Estado en la URL
sidebar_position: 6
description: Por qué los filtros, la página y la vista van en la URL, cómo leer y escribir searchParams en Next, y nuqs para tenerlos tipados en cliente y servidor.
---

# Estado en la URL

<Tech ids={['nextdotjs', 'react']} />

<Estado tipo="construye">Los filtros del buscador (`q`, `country`, `page`, `sort`) en la URL con nuqs, leídos igual en el cliente y en el servidor.</Estado>

## Concepto

Si un estado responde a "¿qué está mirando el usuario?", va en la **URL**:

- Se puede **compartir** ("mirá estos pueblos de Teruel con menos de 2.000 habitantes").
- Sobrevive a recargar la página y funciona con **atrás/adelante**.
- El **servidor** lo recibe en la petición: puede renderizar el resultado
  filtrado y Google puede indexar `/pueblos?region=teruel`.

En ripopola: búsqueda, filtros, orden, página, vista (mapa o lista) y el
pueblo seleccionado en el mapa.

### Con lo que trae Next

- En un **Server Component** (`page.tsx`), `searchParams` llega como prop (una promesa).
- En un **componente de cliente**, `useSearchParams()` lee y `useRouter()` /
  `<Link>` escriben.

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
}
```

Funciona, pero todo es `string`, hay que parsear y validar en cada lugar.

### nuqs

**nuqs** es "useState, pero en la URL", con parsers tipados que se comparten
entre cliente y servidor.

```bash
pnpm add -E nuqs
```

```tsx title="apps/web/app/layout.tsx"
import { NuqsAdapter } from 'nuqs/adapters/next/app';
// ...
<body><NuqsAdapter><Providers>{children}</Providers></NuqsAdapter></body>
```

## Si venís de Angular

<Angular>

| Angular | Next + nuqs |
| --- | --- |
| `ActivatedRoute.queryParamMap` | `searchParams` (servidor) / `useSearchParams` o `useQueryState` (cliente) |
| `router.navigate([], { queryParams, queryParamsHandling: 'merge' })` | `setQuery(...)` de nuqs (hace el merge solo) |
| `withComponentInputBinding()` para recibir query params como inputs | `searchParams` como prop de la página |

</Angular>

## En ripopola

### 1. Los parsers, en un solo lugar

```ts title="apps/web/features/search/search-params.ts"
import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs/server';

export const searchParsers = {
  q: parseAsString.withDefault(''),
  country: parseAsStringLiteral(['ES', 'IT'] as const),
  page: parseAsInteger.withDefault(1),
  sort: parseAsStringLiteral(['relevance', 'population', 'name'] as const).withDefault('relevance'),
  view: parseAsStringLiteral(['list', 'map'] as const).withDefault('list'),
};

export const loadSearchParams = createLoader(searchParsers);
```

`nuqs/server` se puede importar desde el servidor y desde el cliente.

### 2. En el servidor (la página)

```tsx title="apps/web/app/pueblos/page.tsx"
import type { SearchParams } from 'nuqs/server';
import { loadSearchParams } from '@/features/search/search-params';

export default async function TownsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { q, country, page, sort } = await loadSearchParams(searchParams); // tipados y con defaults
  // ...pedir a la API con estos filtros (7.6)
}
```

### 3. En el cliente (los filtros)

```tsx
'use client';

import { useQueryStates } from 'nuqs';
import { searchParsers } from './search-params';

export function SearchFilters() {
  const [{ q, country }, setFilters] = useQueryStates(searchParsers, {
    shallow: false,   // que el servidor vuelva a renderizar la página con los nuevos filtros
    history: 'replace',
  });

  return (
    <>
      <input value={q} onChange={(e) => setFilters({ q: e.target.value, page: 1 })} aria-label="Buscar pueblos" />
      <select value={country ?? ''} onChange={(e) => setFilters({ country: (e.target.value || null) as 'ES' | 'IT' | null, page: 1 })}>
        <option value="">Todos los países</option>
        <option value="ES">España</option>
        <option value="IT">Italia</option>
      </select>
    </>
  );
}
```

- Cambiar un filtro **resetea la página** a 1.
- `shallow: true` (por defecto) cambia la URL sin pedirle nada al servidor:
  útil cuando el que reacciona es TanStack Query en el cliente (el mapa).
- `shallow: false` hace que Next vuelva a renderizar el Server Component de la página.
- Para no navegar en cada tecla, nuqs acepta `limitUrlUpdates` con debounce.

## Errores comunes

- **Duplicar el filtro en `useState` y en la URL**: dos fuentes de verdad.
- **No resetear la página** al cambiar filtros: "página 7 de 2".
- **`history: 'push'` en cada tecla**: el botón atrás se vuelve inútil.
- **Indexar combinaciones infinitas de filtros**: SEO (6.6) con `noindex` o canonical.

<Resumen>

- Lo que describe qué está mirando el usuario va en la URL.
- En Next: `searchParams` en el servidor, `useSearchParams` en el cliente.
- nuqs da parsers tipados compartidos y un `useState` sincronizado con la URL.
- `shallow: false` cuando la página de servidor tiene que reaccionar.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué estado conviene guardar en la URL?**
El que define lo que el usuario está viendo: filtros, búsqueda, orden, página,
pestaña. Así se comparte, sobrevive a recargas y lo puede renderizar el servidor.

**2. ¿Cómo leés los query params en el App Router?**
En un Server Component, con la prop `searchParams` (asíncrona); en uno de
cliente, con `useSearchParams`.

**3. ¿Qué diferencia hay entre `router.push` y `router.replace`?**
`push` agrega una entrada al historial; `replace` reemplaza la actual. Para
filtros que cambian seguido, `replace`.

**4. ¿Qué aporta nuqs?**
Parsers y valores por defecto tipados, compartidos entre servidor y cliente, y
una API tipo `useState` que actualiza la URL con merge, debounce y opciones de historial.

## Glosario

| Término | Qué es |
| --- | --- |
| Search params | Los parámetros después del `?` de la URL. |
| Shallow | Cambiar la URL sin que el servidor vuelva a renderizar. |
| Parser | Convierte el string de la URL en un tipo (número, literal) y al revés. |
