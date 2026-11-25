---
title: Estado de la interfaz con Zustand
sidebar_position: 4
description: Cuándo hace falta un store global, Zustand con selectores, acciones, persistencia en localStorage, el problema de la hidratación y los stores por petición en Next, con los favoritos y la vista mapa o lista.
---

# Estado de la interfaz con Zustand

<Tech ids={['zustand', 'react', 'nextdotjs']} />

<Estado tipo="construye">Un store de UI (vista mapa o lista, panel de filtros abierto) y los favoritos de visitantes anónimos guardados en `localStorage`.</Estado>

## Concepto

Después de sacar los datos del servidor (TanStack Query) y lo que va en la URL
(4.6), queda poco estado global: preferencias de UI y alguna cosa que
comparten partes lejanas de la pantalla. Para eso alcanza un store chico.

**Zustand** es un store mínimo basado en hooks:

```ts
import { create } from 'zustand';

type UiState = {
  view: 'map' | 'list';
  filtersOpen: boolean;
  setView: (v: UiState['view']) => void;
  toggleFilters: () => void;
};

export const useUiStore = create<UiState>()((set) => ({
  view: 'list',
  filtersOpen: false,
  setView: (view) => set({ view }),
  toggleFilters: () => set((s) => ({ filtersOpen: !s.filtersOpen })),
}));
```

```tsx
const view = useUiStore((s) => s.view);          // selector: solo re-renderiza si cambia view
const setView = useUiStore((s) => s.setView);
```

- **Sin Provider** (no hace falta envolver la app).
- **Selectores**: el componente se suscribe a una parte; si cambia otra, no se
  re-renderiza. Esto es lo que Context no tiene.
- `set` hace un *merge* superficial del estado.
- Las acciones viven dentro del store.

### Seleccionar varias cosas

```ts
import { useShallow } from 'zustand/react/shallow';

const { view, filtersOpen } = useUiStore(useShallow((s) => ({ view: s.view, filtersOpen: s.filtersOpen })));
```

Sin `useShallow`, devolver un objeto nuevo en el selector haría que siempre "cambie".

### Persistir

```ts
import { persist } from 'zustand/middleware';

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({ ids: [], toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })) }),
    { name: 'ripopola-favorites' }, // clave en localStorage
  ),
);
```

### Zustand en Next: dos cuidados

1. **Hidratación**: en el servidor no hay `localStorage`. El primer render del
   cliente tiene que coincidir con el HTML del servidor, así que los datos
   persistidos aparecen **después** de hidratar. Para lo que depende de
   `localStorage`, mostrá un estado neutro hasta que el store esté rehidratado
   o renderizá ese pedacito solo en el cliente.
2. **Un store global de módulo se comparte entre peticiones en el servidor.**
   Para estado de UI que solo se usa en el cliente no es problema. Si
   necesitás inicializar el store con datos de la petición (del usuario),
   usá el patrón de **store por petición**: `createStore` + un Provider con
   Context que crea la instancia una vez por árbol.

## Si venís de Angular

<Angular>

| Angular | Zustand |
| --- | --- |
| Servicio `providedIn: 'root'` con signals | `create(...)` (store de módulo) |
| `computed()` sobre el estado del servicio | Selectores, o un cálculo en el componente |
| NgRx SignalStore (`withState`, `withMethods`) | Muy parecido: estado + acciones en un objeto |
| Leer `service.view()` en la plantilla | `useUiStore((s) => s.view)` |

Si usaste SignalStore, Zustand te va a resultar natural: un objeto con estado
y métodos, sin ceremonia.

</Angular>

## En ripopola

### Favoritos anónimos

Una persona puede guardar favoritos sin cuenta. Cuando inicie sesión (sección
9), se suben a la API y pasan a ser estado del servidor.

```ts title="apps/web/features/favorites/favorites-store.ts"
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FavoritesState = {
  ids: string[];
  toggle: (townId: string) => void;
  clear: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (townId) =>
        set((s) => ({ ids: s.ids.includes(townId) ? s.ids.filter((x) => x !== townId) : [...s.ids, townId] })),
      clear: () => set({ ids: [] }),
    }),
    { name: 'ripopola-favorites', version: 1 },
  ),
);
```

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useFavoritesStore } from './favorites-store';

export function FavoriteToggle({ townId, townName }: { townId: string; townName: string }) {
  const isFavorite = useFavoritesStore((s) => s.ids.includes(townId));
  const toggle = useFavoritesStore((s) => s.toggle);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []); // después de hidratar ya podemos usar lo de localStorage

  const pressed = hydrated && isFavorite;
  return (
    <button aria-pressed={pressed} onClick={() => toggle(townId)} aria-label={`Favorito: ${townName}`}>
      {pressed ? '★' : '☆'}
    </button>
  );
}
```

`version` permite migrar el formato guardado si algún día cambia.

<Alternativa title="Jotai, Valtio, MobX, Redux Toolkit">
**Jotai** (estado en "átomos", del mismo autor que Zustand), **Valtio**
(mutación con proxies), **MobX** (observables, muy parecido a la reactividad
de Angular) y **Redux Toolkit** (4.5). En ofertas de trabajo vas a ver sobre
todo Redux Toolkit en código existente y Zustand en proyectos nuevos.
</Alternativa>

## Errores comunes

- **Guardar datos de la API en Zustand**: es trabajo de TanStack Query.
- **Leer todo el store** (`useUiStore()` sin selector): re-renderiza con cualquier cambio.
- **Selector que devuelve un objeto nuevo** sin `useShallow`.
- **Mostrar datos de `localStorage` en el primer render**: error de hidratación.

<Resumen>

- Zustand: store mínimo, sin Provider, con selectores.
- Para estado de UI compartido; no para datos del servidor.
- `persist` guarda en `localStorage`; cuidado con la hidratación.
- En el servidor, store por petición si depende de datos del usuario.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué ventaja tiene Zustand sobre Context para estado global?**
Las suscripciones con selectores: cada componente se re-renderiza solo si
cambia la parte que lee. Con Context, todos los consumidores se re-renderizan.

**2. ¿Cómo dividís el estado en una app React moderna?**
Datos del servidor en TanStack Query (o Server Components), estado navegable en
la URL, estado local en `useState`, y lo poco global de UI en un store como Zustand.

**3. ¿Qué problema hay con `persist` y el render en servidor?**
El servidor no tiene `localStorage`, así que el HTML no incluye esos datos; si
el cliente los usa en el primer render, hay mismatch de hidratación.

**4. ¿Por qué un store de módulo puede ser peligroso en Next?**
Porque en el servidor el módulo se comparte entre peticiones, y el estado de un
usuario podría filtrarse a otro. Se usa un store por petición.

## Glosario

| Término | Qué es |
| --- | --- |
| Store | Contenedor de estado global con acciones. |
| Selector | Función que extrae una parte del estado. |
| `persist` | Middleware de Zustand que guarda el estado en el navegador. |
| Rehidratar | Cargar en el store lo que estaba guardado. |
