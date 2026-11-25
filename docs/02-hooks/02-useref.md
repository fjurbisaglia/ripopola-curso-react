---
title: useRef y el DOM
sidebar_position: 2
description: Refs para acceder al DOM y para guardar valores que no disparan render, ref como prop en React 19, callbacks de ref y useImperativeHandle.
---

# useRef y el DOM

<Tech ids={['react']} />

<Estado tipo="construye">Foco automático en el buscador, y la referencia a la instancia del mapa.</Estado>

## Concepto

`useRef` devuelve una caja `{ current }` que **persiste entre renders** y que,
al cambiar, **no dispara un render**. Tiene dos usos:

### 1. Referenciar un nodo del DOM

```tsx
const inputRef = useRef<HTMLInputElement>(null);

<input ref={inputRef} />
<button onClick={() => inputRef.current?.focus()}>Buscar</button>
```

React pone el nodo en `current` durante el commit y lo vuelve a `null` al desmontar.

### 2. Guardar un valor que no es de la UI

Un id de temporizador, la instancia de una librería, el valor anterior de algo:

```tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

Regla: **no leas ni escribas `ref.current` durante el render** (salvo para
inicializarlo). Las refs son para eventos y efectos. Si un valor se muestra en
pantalla, es estado.

### `ref` como prop (React 19)

Antes había que envolver con `forwardRef`. Ahora `ref` es una prop más:

```tsx
function SearchInput({ ref, ...props }: React.ComponentProps<'input'>) {
  return <input ref={ref} className="rounded border px-3 py-2" {...props} />;
}
```

### Callback refs con limpieza

Podés pasar una función como `ref`; React la llama con el nodo. En React 19
puede devolver una limpieza:

```tsx
<div
  ref={(node) => {
    const observer = new ResizeObserver(() => {/* ... */});
    observer.observe(node!);
    return () => observer.disconnect();
  }}
/>
```

### `useImperativeHandle`

Expone una API reducida en vez del nodo entero (por ejemplo `focus()` y
`clear()`). Usalo poco: React es declarativo y una API imperativa es la excepción.

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| `viewChild<ElementRef>('input')` | `useRef<HTMLInputElement>(null)` + `ref={inputRef}` |
| `ElementRef.nativeElement` | `ref.current` |
| Una propiedad de la clase que no está en la plantilla | `useRef` (persiste y no dispara render) |
| Template reference variable `#input` | `ref={inputRef}` |

En una clase de Angular cualquier propiedad persiste. En un componente de
función, las variables locales **se recrean en cada render**: por eso hacen
falta `useState` (si dispara render) o `useRef` (si no).

</Angular>

## En ripopola

### Foco en el buscador al abrir

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function SearchDialogInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // sincronizar con el DOM: efecto
  }, []);

  return <input ref={inputRef} type="search" aria-label="Buscar pueblos" />;
}
```

Para un input simple también existe `autoFocus`, pero el patrón sirve para
cualquier nodo.

### La instancia del mapa

`react-map-gl` expone el mapa por ref (lo usamos en el 5.2):

```tsx
import { useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';

const mapRef = useRef<MapRef>(null);

function flyToTown(lng: number, lat: number) {
  mapRef.current?.flyTo({ center: [lng, lat], zoom: 12 });
}

<Map ref={mapRef} /* ... */ />
```

## Errores comunes

- **Usar una ref para algo que se ve en pantalla**: cambia y la UI no se entera.
- **Leer `ref.current` en el render** esperando el nodo: en el primer render es `null`.
- **Variables locales para guardar cosas entre renders**: se pierden.
- **Seguir usando `forwardRef`** en código nuevo: ya no hace falta.

<Resumen>

- `useRef` persiste entre renders y no dispara renders.
- Sirve para nodos del DOM y para valores que no son UI.
- No se lee ni se escribe en el render: en eventos y efectos.
- En React 19 `ref` es una prop; los callback refs pueden devolver limpieza.

</Resumen>

## Preguntas de entrevista

**1. ¿Diferencia entre `useRef` y `useState`?**
Los dos persisten entre renders, pero cambiar el estado dispara un render y
cambiar una ref no. Lo que se muestra va en estado.

**2. ¿Por qué no hay que leer refs durante el render?**
Porque el render debe ser puro y predecible; la ref puede cambiar sin que React
lo sepa y en el primer render el nodo todavía no existe.

**3. ¿Qué cambió con `forwardRef` en React 19?**
`ref` pasó a ser una prop normal en componentes de función; `forwardRef` ya no hace falta.

**4. ¿Para qué sirve `useImperativeHandle`?**
Para exponer al padre una API limitada (por ejemplo `focus`) en vez del nodo
entero. Es una vía de escape a lo imperativo.

## Glosario

| Término | Qué es |
| --- | --- |
| Ref | Caja mutable `{ current }` que persiste entre renders. |
| Callback ref | Función que React llama con el nodo al montar. |
| Imperativo | Decir "hacé esto" (`focus()`) en vez de describir el estado. |
