---
title: Transiciones y render concurrente
sidebar_position: 7
description: Render concurrente, useTransition, useDeferredValue, Activity y useEffectEvent - mantener la interfaz fluida mientras se filtran miles de pueblos o se cambia de pestaña.
---

# Transiciones y render concurrente

<Tech ids={['react']} />

<Estado tipo="construye">El filtro de la lista de pueblos con `useDeferredValue`, las pestañas de la ficha con `useTransition` y `<Activity>` para conservar el estado del mapa oculto.</Estado>

## Concepto

Desde React 18 el render es **interrumpible**. React distingue dos tipos de
actualizaciones:

| Urgente | No urgente (transición) |
| --- | --- |
| Escribir, hacer clic, presionar | Mostrar el resultado de eso |
| Tiene que responder ya | Puede esperar y hasta descartarse si llega algo más nuevo |

Si marcás una actualización como **transición**, React la renderiza "de
fondo" y, si el usuario escribe algo nuevo, la abandona y empieza otra. La
interfaz no se traba.

### `useTransition`

```tsx
const [isPending, startTransition] = useTransition();

function selectTab(tab: Tab) {
  startTransition(() => {
    setTab(tab); // render no urgente
  });
}
```

- `isPending` permite mostrar que algo se está preparando sin esconder lo actual.
- En React 19 `startTransition` acepta funciones **async**: lo que pase
  adentro (incluida una llamada al servidor) cuenta como transición. Es la base
  de las **Actions** (2.8).
- Las navegaciones de Next (`<Link>`, `router.push`) ya son transiciones.

### `useDeferredValue`

Cuando no controlás el setter (el valor viene por props), podés pedir una
versión "atrasada":

```tsx
const deferredQuery = useDeferredValue(query);
// la lista pesada usa deferredQuery: el input responde al instante
```

React primero renderiza con el valor viejo (rápido) y después intenta con el
nuevo de fondo.

| | Debounce | `useDeferredValue` |
| --- | --- | --- |
| Espera un tiempo fijo | Sí | No: se adapta a la velocidad del dispositivo |
| Evita peticiones de red | Sí | No |
| Para | Llamadas a la API | Renders pesados en el cliente |

### `<Activity>` (React 19.2)

Oculta una parte de la UI **sin desmontarla**: conserva su estado y su DOM, y
pausa sus efectos mientras está oculta.

```tsx
<Activity mode={view === 'map' ? 'visible' : 'hidden'}>
  <TownsMap />
</Activity>
```

Al volver al mapa, está en el mismo lugar y zoom, sin volver a cargar.

### `useEffectEvent` (React 19.2)

A veces un efecto necesita **leer** un valor sin **reaccionar** a sus cambios:

```tsx
const onConnected = useEffectEvent(() => {
  showToast(`Conectado como ${userName}`); // lee el userName actual
});

useEffect(() => {
  const socket = connect(municipalityId);
  socket.on('connect', onConnected);
  return () => socket.disconnect();
}, [municipalityId]); // userName no reconecta el socket
```

## Si venís de Angular

<Angular>

Angular no tiene render interrumpible: la detección de cambios corre hasta el
final. Lo que hacés en Angular para que algo pesado no trabe la UI:

| Angular | React |
| --- | --- |
| `debounceTime` de RxJS | debounce para red; `useDeferredValue` para renders pesados |
| `@defer` para posponer partes | `Suspense` + transiciones |
| Ocultar con `[hidden]` para no destruir | `<Activity mode="hidden">` |
| `untracked()` dentro de un `effect` | `useEffectEvent` |

`untracked()` es exactamente la idea de `useEffectEvent`: leer sin crear dependencia.

</Angular>

## En ripopola

### Filtrar miles de pueblos en el cliente

El mapa del panel de superadmin carga todos los pueblos de una región y los
filtra en el cliente:

```tsx
'use client';

import { useDeferredValue, useState } from 'react';

export function TownFilterList({ towns }: { towns: { id: string; name: string }[] }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filtrar pueblos" />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <HeavyTownList towns={towns} query={deferredQuery} />
      </div>
    </>
  );
}
```

Para que funcione, `HeavyTownList` tiene que estar memoizado (con React
Compiler lo está; sin él, `memo`). Si no, se re-renderiza con el padre igual.

### Pestañas de la ficha del pueblo

```tsx
const [tab, setTab] = useState<'viviendas' | 'empleos' | 'incentivos'>('viviendas');
const [isPending, startTransition] = useTransition();

<button onClick={() => startTransition(() => setTab('empleos'))}>Empleos</button>
{isPending && <Spinner />}
```

Si la pestaña de empleos suspende (carga datos), React **sigue mostrando la
pestaña anterior** en vez de saltar al fallback del Suspense. Esa es la otra
gran ventaja de las transiciones.

## Errores comunes

- **Usar transiciones para inputs controlados**: el valor del input tiene que
  ser urgente; la transición va en lo que se calcula a partir de él.
- **`useDeferredValue` sin memoizar el hijo**: no ganás nada.
- **Debounce para renders locales** y `useDeferredValue` para peticiones: al revés.

<Resumen>

- Las transiciones marcan actualizaciones no urgentes e interrumpibles.
- `useTransition` cuando controlás el setter; `useDeferredValue` cuando tenés el valor.
- Con una transición, React no reemplaza lo visible por un fallback de Suspense.
- `<Activity>` oculta sin perder estado; `useEffectEvent` lee sin crear dependencia.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es el render concurrente?**
La capacidad de React de preparar varias versiones de la UI, pausar e
interrumpir renders y priorizar los urgentes sobre las transiciones.

**2. ¿Diferencia entre `useTransition` y `useDeferredValue`?**
`useTransition` envuelve la actualización (necesitás el setter);
`useDeferredValue` te da una copia atrasada de un valor que ya tenés.

**3. ¿Debounce o `useDeferredValue`?**
Debounce para no disparar peticiones de red; `useDeferredValue` para que un
render pesado no trabe el input, adaptándose al dispositivo.

**4. ¿Qué pasa si una transición hace que un componente suspenda?**
React mantiene la UI anterior visible (con `isPending`) en vez de mostrar el
fallback del Suspense.

**5. ¿Qué resuelve `useEffectEvent`?**
Leer valores actuales dentro de un efecto sin agregarlos a las dependencias,
para que el efecto no se reinicie cuando cambian.

## Glosario

| Término | Qué es |
| --- | --- |
| Transición | Actualización no urgente e interrumpible. |
| Render concurrente | Renders que se pueden pausar, abandonar y priorizar. |
| `isPending` | Indica que una transición se está procesando. |
| `Activity` | Componente para ocultar UI conservando su estado. |
