---
title: Estado con useState
sidebar_position: 5
description: useState, actualizaciones funcionales, inmutabilidad con objetos y arrays, batching, snapshot del estado y dónde poner el estado (levantarlo), con los favoritos de ripopola.
---

# Estado con useState

<Tech ids={['react', 'typescript']} />

<Estado tipo="construye">Un botón de favorito y una lista de favoritos en memoria (en el 4.4 se pasa a Zustand con persistencia).</Estado>

## Concepto

```tsx
const [value, setValue] = useState(initialValue);
```

- `value` es el estado **de este render** (una foto, no una variable viva).
- `setValue(nuevo)` **no cambia** `value` en ese momento: le pide a React un
  render nuevo donde `value` va a valer `nuevo`.
- Si el nuevo valor es igual (`Object.is`) al actual, React puede saltear el render.

### El estado es una foto

```tsx
function Contador() {
  const [n, setN] = useState(0);
  function sumarTres() {
    setN(n + 1);
    setN(n + 1);
    setN(n + 1); // las tres usan n = 0 → queda en 1
  }
  function sumarTresBien() {
    setN((prev) => prev + 1);
    setN((prev) => prev + 1);
    setN((prev) => prev + 1); // cada una recibe el valor pendiente → 3
  }
}
```

Regla: si el valor nuevo **depende del anterior**, usá la forma funcional.

### Batching

React agrupa todas las actualizaciones de un mismo evento (y también de
promesas y timeouts) en **un solo render**. Por eso cambiar tres estados
seguidos no produce tres renders.

### Inmutabilidad

React compara por referencia. Con objetos y arrays siempre creás uno nuevo:

| Quiero | Mal (muta) | Bien (nuevo) |
| --- | --- | --- |
| Agregar | `list.push(x)` | `[...list, x]` |
| Quitar | `list.splice(i, 1)` | `list.filter((t) => t.id !== id)` |
| Cambiar uno | `list[i].name = 'x'` | `list.map((t) => (t.id === id ? { ...t, name: 'x' } : t))` |
| Cambiar un campo | `town.name = 'x'` | `{ ...town, name: 'x' }` |
| Ordenar | `list.sort()` | `list.toSorted()` |

### Inicialización perezosa

`useState(calcularAlgoCaro())` ejecuta la función **en cada render** (aunque
use el valor solo la primera vez). Pasá la función, sin llamarla:
`useState(() => calcularAlgoCaro())`.

### Dónde vive el estado

- Si solo lo usa un componente, ahí.
- Si lo usan dos hermanos, **se levanta** al padre común y se pasa por props.
- Si se puede **calcular** de otro estado o de props, **no es estado**: es una
  variable del render. Duplicarlo genera desincronizaciones.

```tsx
// ❌ estado derivado duplicado
const [towns, setTowns] = useState<Town[]>([]);
const [count, setCount] = useState(0);
// ✅ se calcula
const count = towns.length;
```

## Si venís de Angular

<Angular>

| Angular (signals) | React |
| --- | --- |
| `count = signal(0)` | `const [count, setCount] = useState(0)` |
| `count()` (leer) | `count` |
| `count.set(1)` | `setCount(1)` |
| `count.update(c => c + 1)` | `setCount(c => c + 1)` |
| `total = computed(() => ...)` | `const total = ...` en el render (o `useMemo` si es caro) |
| Mutar un array dentro de un signal no notifica | Igual: hay que crear uno nuevo |

La gran diferencia: un signal es una caja viva que leés cuando querés. En
React el valor es una **constante del render**; dentro de un `setTimeout`
viejo vas a ver el valor de cuando se creó ("closure obsoleta").

</Angular>

## En ripopola: favoritos en memoria

`apps/web/components/towns/favorite-button.tsx`:

```tsx
'use client';

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: () => void;
  townName: string;
};

export function FavoriteButton({ isFavorite, onToggle, townName }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Quitar ${townName} de favoritos` : `Guardar ${townName} en favoritos`}
      onClick={onToggle}
    >
      {isFavorite ? '★' : '☆'}
    </button>
  );
}
```

El estado vive en el padre, porque la lista y el contador lo necesitan:

```tsx
'use client';

import { useState } from 'react';
import { FavoriteButton } from './favorite-button';

export function TownListWithFavorites({ towns }: { towns: { id: string; name: string }[] }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  function toggle(id: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev); // nuevo Set: no mutar el anterior
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <p>{favoriteIds.size} favoritos</p>
      <ul>
        {towns.map((t) => (
          <li key={t.id}>
            {t.name}
            <FavoriteButton isFavorite={favoriteIds.has(t.id)} onToggle={() => toggle(t.id)} townName={t.name} />
          </li>
        ))}
      </ul>
    </>
  );
}
```

Fijate: `FavoriteButton` es **controlado** (no tiene estado propio), y el
contador es derivado (`favoriteIds.size`), no otro estado.

## Errores comunes

- **Leer el estado justo después de `set`** esperando el valor nuevo.
- **Mutar y después setear el mismo objeto**: misma referencia, React no re-renderiza.
- **Estado derivado duplicado** (guardar `count` aparte de la lista).
- **Inicializar estado desde una prop y esperar que se sincronice**:
  `useState(props.x)` usa la prop solo la primera vez. Si tiene que seguirla,
  no es estado (o se resetea con `key`, tema 1.7).

<Resumen>

- `useState` devuelve el valor de este render y una función que pide uno nuevo.
- Si el nuevo depende del anterior: `set(prev => ...)`.
- Objetos y arrays se reemplazan, nunca se mutan.
- Lo que se puede calcular no es estado. El estado compartido se levanta al padre.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué `console.log(count)` después de `setCount(count + 1)` muestra el valor viejo?**
Porque el estado es una foto del render actual. `setCount` agenda un render
nuevo; el valor cambia recién en ese render.

**2. ¿Cuándo usar la forma funcional del setter?**
Cuando el valor nuevo depende del anterior, sobre todo con varias
actualizaciones seguidas o dentro de callbacks asíncronos.

**3. ¿Qué es el batching?**
React agrupa las actualizaciones de estado de un mismo tick en un solo render.
Desde React 18 aplica también a promesas, timeouts y eventos nativos.

**4. ¿Por qué el estado tiene que ser inmutable?**
Porque React compara referencias para decidir si algo cambió. Si mutás, la
referencia es la misma y no hay render (y además rompés memoizaciones).

**5. ¿Qué significa "levantar el estado"?**
Moverlo al ancestro común más cercano de los componentes que lo necesitan y
pasarlo por props, para tener una única fuente de verdad.

**6. ¿Qué es estado derivado y por qué evitarlo como estado?**
Datos que se pueden calcular de otro estado o de props. Guardarlos aparte
obliga a sincronizarlos a mano y genera errores.

## Glosario

| Término | Qué es |
| --- | --- |
| Setter | La función que devuelve `useState` para pedir un nuevo valor. |
| Actualización funcional | `set(prev => next)`: calcula a partir del valor pendiente. |
| Batching | Agrupar varias actualizaciones en un render. |
| Levantar estado | Subirlo al padre común. |
| Componente controlado | Su valor lo decide el padre por props. |
| Closure obsoleta | Función que recuerda el estado de un render viejo. |
