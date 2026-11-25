---
title: El buscador de pueblos
sidebar_position: 1
description: Un combobox de búsqueda de pueblos con debounce, TanStack Query, navegación con teclado y accesibilidad, usando el componente Command de shadcn.
---

# El buscador de pueblos

<Tech ids={['react', 'reactquery', 'shadcnui', 'nextdotjs']} />

<Estado tipo="construye">El buscador del encabezado: escribís "alba", aparecen sugerencias de pueblos y con Enter vas a la ficha.</Estado>

## Concepto

Un buscador con sugerencias junta casi todo lo visto hasta acá:

| Pieza | Tema |
| --- | --- |
| Input controlado | 1.6 |
| Debounce para no pedir en cada tecla | 2.5 |
| Datos del servidor con caché y cancelación | 4.2 |
| Navegación con teclado y ARIA de combobox | 3.5 |
| Navegar a la ficha | 6.4 |

El patrón de accesibilidad es el **combobox** de WAI-ARIA: un input con
`role="combobox"`, una lista con `role="listbox"`, la opción activa marcada con
`aria-activedescendant`, flechas para moverse y Enter para elegir. Escribirlo a
mano es largo; usamos **`Command`** de shadcn (basado en `cmdk`), que lo resuelve.

### Del lado de la API

Nest expone `GET /api/v1/towns/suggest?q=alba&limit=8` (búsqueda por prefijo
con `unaccent` e índice trigram en PostgreSQL). Si todavía no existe, usá
`GET /api/v1/towns?q=alba&pageSize=8`.

## Si venís de Angular

<Angular>

En Angular lo harías con un `FormControl`, `valueChanges.pipe(debounceTime(300),
distinctUntilChanged(), switchMap(q => api.suggest(q)))` y `MatAutocomplete`.
En React:

| RxJS | React |
| --- | --- |
| `debounceTime(300)` | `useDebouncedValue(q, 300)` |
| `distinctUntilChanged()` | La query key: si no cambia, no se pide |
| `switchMap` (cancela la anterior) | TanStack Query cancela con el `signal` al cambiar la key |
| `filter(q => q.length >= 2)` | `enabled: q.length >= 2` |
| `MatAutocomplete` | `Command` de shadcn / Radix Popover |

</Angular>

## En ripopola

### 1. Instalar el componente

```bash
cd apps/web
pnpm dlx shadcn@latest add command popover
```

### 2. La query

```ts title="apps/web/features/search/queries.ts"
import { queryOptions } from '@tanstack/react-query';
import { browserApi } from '@ripopola/frontend-api/browser';
import { unwrap } from '@ripopola/frontend-api';

export const suggestQuery = (q: string) =>
  queryOptions({
    queryKey: ['towns', 'suggest', q],
    queryFn: async ({ signal }) =>
      unwrap(await browserApi.GET('/api/v1/towns/suggest', { params: { query: { q, limit: 8 } }, signal })),
    enabled: q.length >= 2,
    staleTime: 5 * 60_000, // las sugerencias cambian poco
  });
```

### 3. El componente

```tsx title="apps/web/features/search/town-search.tsx"
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { suggestQuery } from './queries';

export function TownSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q.trim(), 250);
  const { data = [], isFetching } = useQuery(suggestQuery(debouncedQ));

  return (
    <Command shouldFilter={false} label="Buscar pueblos" className="rounded-lg border">
      <CommandInput value={q} onValueChange={setQ} placeholder="Buscá un pueblo…" />
      <CommandList>
        {debouncedQ.length >= 2 && !isFetching && <CommandEmpty>No encontramos pueblos con ese nombre.</CommandEmpty>}
        {data.length > 0 && (
          <CommandGroup heading="Pueblos">
            {data.map((town) => (
              <CommandItem key={town.id} value={town.slug} onSelect={() => router.push(`/pueblos/${town.slug}`)}>
                <span className="font-medium">{town.name}</span>
                <span className="ml-2 text-sm text-slate-500">{town.region}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
```

- `shouldFilter={false}`: el filtrado lo hace la API, no `cmdk`.
- `onSelect` se dispara con clic **y** con Enter.
- Flechas, foco y ARIA los maneja `Command`.

### 4. Resaltar lo que coincide

```tsx
function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLocaleLowerCase('es').indexOf(query.toLocaleLowerCase('es'));
  if (!query || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-bold">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}
```

Nada de `dangerouslySetInnerHTML` para resaltar: JSX alcanza y es seguro.

<Ejercicio title="Búsquedas recientes">

Guardá las últimas 5 búsquedas elegidas en un store de Zustand con `persist`
y mostralas como grupo "Recientes" cuando el input está vacío.

<details>
<summary>Pista</summary>

Un store con `recent: { slug, name }[]` y una acción `push` que deduplica y
corta a 5. Llamala en `onSelect` antes de navegar. Ojo con la hidratación (4.4).

</details>
</Ejercicio>

## Errores comunes

- **Pedir con 1 letra**: miles de resultados inútiles. `enabled: q.length >= 2`.
- **Dejar que `cmdk` filtre** resultados que ya filtró la API (y con otra lógica).
- **Comparar sin normalizar acentos**: "albarracin" no encuentra "Albarracín". Hacelo en la API con `unaccent`.
- **Hacer el combobox a mano** y olvidar el teclado.

<Resumen>

- Input controlado → debounce → query con `enabled` → lista accesible.
- TanStack Query hace de `switchMap`: cancela y cachea por key.
- `Command` de shadcn resuelve el patrón combobox accesible.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo implementás un autocompletado en React sin saturar la API?**
Debounce del texto, mínimo de caracteres con `enabled`, caché por query key y
cancelación de peticiones viejas con el `signal`.

**2. ¿Qué es el patrón combobox y por qué no escribirlo a mano?**
El patrón ARIA para un input con lista de opciones: roles, opción activa,
teclado y anuncios. Es fácil de romper; conviene una librería probada.

**3. ¿Cómo resaltás texto sin `dangerouslySetInnerHTML`?**
Partiendo el string en antes, coincidencia y después, y envolviendo la
coincidencia en un elemento con JSX.

## Glosario

| Término | Qué es |
| --- | --- |
| Combobox | Input con lista de opciones seleccionables. |
| `cmdk` | Librería de menús de comandos accesibles (base de `Command`). |
| Trigram | Índice de PostgreSQL para búsquedas por similitud de texto. |
