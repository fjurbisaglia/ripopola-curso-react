---
title: Mutaciones, invalidación y actualizaciones optimistas
sidebar_position: 3
description: useMutation, invalidar queries después de escribir, actualizar la caché a mano, actualizaciones optimistas con rollback y cuándo preferir Server Actions.
---

# Mutaciones, invalidación y actualizaciones optimistas

<Tech ids={['reactquery', 'react']} />

<Estado tipo="construye">Guardar un pueblo como favorito (optimista) y publicar o despublicar una vivienda desde el panel.</Estado>

## Concepto

Una **mutación** es una escritura (POST, PATCH, DELETE). TanStack Query la
maneja con `useMutation`:

```tsx
const mutation = useMutation({
  mutationFn: (input: NewListing) => createListing(input),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['listings'] }),
});

mutation.mutate(data);            // dispara
mutation.isPending;               // enviando
mutation.isError; mutation.error; // falló
```

A diferencia de las queries, las mutaciones **no se ejecutan solas** ni se
cachean: corren cuando llamás a `mutate`.

### Después de escribir: tres estrategias

| Estrategia | Cómo | Cuándo |
| --- | --- | --- |
| **Invalidar** | `invalidateQueries({ queryKey })` marca como viejas y re-pide las que estén en pantalla | Por defecto. Simple y siempre correcto. |
| **Actualizar la caché** | `setQueryData(key, nuevo)` con la respuesta del servidor | Cuando la respuesta trae el objeto actualizado y querés ahorrar una petición. |
| **Optimista** | Cambiar la caché **antes** de la respuesta y revertir si falla | Acciones frecuentes y que casi nunca fallan: favoritos, "me gusta", marcar como leído. |

### Optimista con rollback

```tsx
useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (townId, ctx) => {
    await ctx.client.cancelQueries({ queryKey: ['favorites'] });      // que no pise un refetch en curso
    const previous = ctx.client.getQueryData<string[]>(['favorites']);
    ctx.client.setQueryData<string[]>(['favorites'], (old = []) =>
      old.includes(townId) ? old.filter((id) => id !== townId) : [...old, townId],
    );
    return { previous };                                                // contexto para el rollback
  },
  onError: (_err, _townId, onMutateResult, ctx) => {
    ctx.client.setQueryData(['favorites'], onMutateResult?.previous);  // volver atrás
  },
  onSettled: (_d, _e, _v, _r, ctx) => ctx.client.invalidateQueries({ queryKey: ['favorites'] }),
});
```

:::info La firma de los callbacks
En TanStack Query 5 los callbacks reciben, al final, un contexto con el
`client`. Si tu versión no lo trae, usá el `queryClient` de `useQueryClient()`.
Revisá la firma exacta en los tipos de tu versión.
:::

### TanStack Query o Server Actions

En Next hay otra forma de mutar: las **Server Actions** (8.1), que corren en el
servidor y revalidan la caché de Next. La regla en ripopola:

- Si la pantalla se pinta con **Server Components** → Server Action +
  `updateTag`/`refresh` (8.1).
- Si la pantalla es **interactiva y vive en el cliente** con TanStack Query
  (mapa, listas del panel con filtros) → `useMutation` + invalidación.

## Si venís de Angular

<Angular>

| Angular | TanStack Query |
| --- | --- |
| `http.post(...).subscribe()` + un signal `saving` | `useMutation` con `isPending` |
| Después de guardar, volver a llamar al servicio que lista | `invalidateQueries` |
| `tap` para actualizar el store antes de la respuesta + `catchError` para revertir | `onMutate` + `onError` |
| Efectos de NgRx para orquestar | Callbacks de la mutación |

</Angular>

## En ripopola

### Publicar una vivienda desde el panel

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { browserApi } from '@ripopola/frontend-api/browser';
import { unwrap } from '@ripopola/frontend-api';

export function PublishToggle({ listingId, published }: { listingId: string; published: boolean }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (next: boolean) =>
      unwrap(await browserApi.PATCH('/api/v1/listings/{id}', {
        params: { path: { id: listingId } },
        body: { published: next },
      })),
    onSuccess: (listing) => {
      queryClient.setQueryData(['listings', 'detail', listingId], listing); // ya tenemos el objeto
      queryClient.invalidateQueries({ queryKey: ['listings', 'list'] });   // las listas, que se re-pidan
    },
  });

  return (
    <button disabled={mutation.isPending} onClick={() => mutation.mutate(!published)}>
      {mutation.isPending ? 'Guardando…' : published ? 'Despublicar' : 'Publicar'}
      {mutation.isError && <span role="alert"> No se pudo guardar</span>}
    </button>
  );
}
```

`mutate` vs `mutateAsync`: `mutate` maneja el error en el estado de la
mutación; `mutateAsync` devuelve una promesa que tenés que envolver en
`try/catch`.

## Errores comunes

- **Olvidar invalidar**: la lista sigue mostrando lo viejo.
- **Optimista sin `cancelQueries`**: un refetch en curso pisa el cambio optimista.
- **Optimista en operaciones que fallan seguido** (validaciones del servidor):
  la UI "rebota" y confunde.
- **`mutateAsync` sin `try/catch`**: promesa rechazada sin manejar.

<Resumen>

- `useMutation` para escrituras; no se ejecuta sola ni se cachea.
- Después de escribir: invalidar (por defecto), `setQueryData` o optimista.
- Optimista = `onMutate` (guardar y cambiar), `onError` (revertir), `onSettled` (sincronizar).
- Server Actions cuando la pantalla es de servidor; `useMutation` cuando vive en el cliente.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué hace `invalidateQueries`?**
Marca como viejas las queries que coinciden con la key y vuelve a pedir las que
están en uso, para que la UI refleje la escritura.

**2. ¿Cómo implementás una actualización optimista con rollback?**
En `onMutate` cancelo las queries afectadas, guardo el valor anterior y aplico
el cambio; en `onError` restauro el anterior; en `onSettled` invalido para sincronizar.

**3. ¿Cuándo no conviene una actualización optimista?**
Cuando la operación falla con frecuencia o tiene validaciones del servidor
que el usuario debe ver, porque la UI cambia y vuelve atrás.

**4. ¿Diferencia entre `mutate` y `mutateAsync`?**
`mutate` no devuelve promesa y el error queda en el estado de la mutación;
`mutateAsync` devuelve una promesa que hay que manejar.

## Glosario

| Término | Qué es |
| --- | --- |
| Mutación | Operación que cambia datos en el servidor. |
| Invalidar | Marcar datos cacheados como viejos para volver a pedirlos. |
| Rollback | Volver al estado anterior si la operación falla. |
