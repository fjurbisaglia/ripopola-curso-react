---
title: useEffect y la sincronización
sidebar_position: 1
description: Para qué existe useEffect, dependencias, limpieza, el doble efecto de StrictMode, condiciones de carrera y por qué casi nunca hace falta - con la geolocalización y el título del documento en ripopola.
---

# useEffect y la sincronización

<Tech ids={['react']} />

<Estado tipo="construye">`useEffect` para escuchar el tamaño de pantalla y para la ubicación del usuario ("pueblos cerca mío").</Estado>

## Concepto

Un efecto **sincroniza un componente con un sistema externo**: algo que React
no controla (una API del navegador, un widget de terceros, una conexión, un
temporizador).

```tsx
useEffect(() => {
  // 1. conectarse / suscribirse / arrancar algo
  const id = setInterval(tick, 1000);
  // 2. limpieza: desconectarse
  return () => clearInterval(id);
}, [/* 3. dependencias */]);
```

- Corre **después** del commit (cuando el DOM ya está actualizado).
- Las **dependencias** son todos los valores reactivos (props, estado,
  variables del componente) que usa adentro. Si cambian, React corre la
  limpieza del efecto anterior y vuelve a correr el efecto.
- `[]` = solo al montar (y limpia al desmontar). Sin array = después de cada render.

### StrictMode lo corre dos veces

En desarrollo, React monta, desmonta y vuelve a montar cada componente para
comprobar que tu limpieza funciona. Si ves dos peticiones o dos suscripciones,
**no es un bug de React**: te falta la limpieza.

### Probablemente no necesitás un efecto

La regla de react.dev: si no hay un sistema externo, no hay efecto.

| Querés... | En vez de un efecto |
| --- | --- |
| Calcular algo a partir de props o estado | Calculalo en el render (o `useMemo`). |
| Reaccionar a un clic o un envío | Hacelo en el manejador del evento. |
| Resetear estado cuando cambia una prop | Usá `key` (1.7). |
| Pedir datos | TanStack Query (4.2) o un Server Component (7.1). |
| Avisarle al padre que algo cambió | Llamá a su callback en el mismo evento. |
| Encadenar estados (A cambia → set B → set C) | Calculá todo en el evento. |

### Condiciones de carrera al pedir datos

Si pedís datos en un efecto y el usuario cambia rápido de pueblo, la respuesta
vieja puede llegar después de la nueva:

```tsx
useEffect(() => {
  let ignore = false;
  fetchTown(slug).then((t) => {
    if (!ignore) setTown(t);
  });
  return () => {
    ignore = true; // la respuesta de un slug viejo se descarta
  };
}, [slug]);
```

Este es uno de los motivos por los que en producción se usan TanStack Query o
Server Components en vez de `fetch` en efectos.

### `useLayoutEffect`

Igual que `useEffect`, pero corre **antes de que el navegador pinte**. Solo
para medir el DOM y corregir la posición sin parpadeo (un tooltip). En el
servidor no corre.

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| `effect(() => ...)` con dependencias automáticas | `useEffect(fn, deps)` con dependencias explícitas |
| `ngOnInit` | `useEffect(fn, [])` (pero casi nunca para pedir datos) |
| `ngOnDestroy` / `DestroyRef.onDestroy` | la función que devuelve el efecto |
| `ngOnChanges` | no existe: calculás en el render o usás `key` |
| `afterNextRender` / `afterRenderEffect` | `useLayoutEffect` / `useEffect` |
| `takeUntilDestroyed()` | la limpieza del efecto |

En Angular un `effect` descubre solo lo que lee. En React **vos** declarás las
dependencias y el linter (`react-hooks/exhaustive-deps`) te avisa si falta
alguna. No lo desactives: una dependencia faltante es un bug.

</Angular>

## En ripopola: "pueblos cerca mío"

`apps/web/hooks/use-geolocation.ts`:

```tsx
'use client';

import { useEffect, useState } from 'react';

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lng: number; lat: number }
  | { status: 'error'; message: string };

export function useGeolocation(enabled: boolean): GeoState {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', message: 'Tu navegador no permite geolocalización' });
      return;
    }
    setState({ status: 'loading' });
    const id = navigator.geolocation.watchPosition(
      (pos) => setState({ status: 'ready', lng: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => setState({ status: 'error', message: err.message }),
      { enableHighAccuracy: false, maximumAge: 60_000 },
    );
    return () => navigator.geolocation.clearWatch(id); // limpieza
  }, [enabled]);

  return state;
}
```

El sistema externo es la API de geolocalización: hay efecto y hay limpieza.
Fijate el orden `lng, lat`: GeoJSON y la API de Nest usan longitud primero.

Uso:

```tsx
const [wantsLocation, setWantsLocation] = useState(false);
const geo = useGeolocation(wantsLocation);

<button onClick={() => setWantsLocation(true)}>Pueblos cerca mío</button>
{geo.status === 'ready' && <NearbyTowns lng={geo.lng} lat={geo.lat} />}
```

El pedido de permiso sale de un clic (evento); el efecto solo sincroniza
mientras `enabled` sea `true`.

## Errores comunes

- **Dependencias incompletas** para "que no se repita": genera datos viejos.
- **Objetos o funciones nuevas en las dependencias** (`{ a: 1 }` en cada
  render): el efecto corre siempre. Movelas adentro del efecto o fuera del componente.
- **`setState` en un efecto que depende de ese estado**: bucle infinito.
- **`async` directo en `useEffect`**: el efecto debe devolver la limpieza, no
  una promesa. Declarás una función `async` adentro y la llamás.
- **Efectos en cadena** que sincronizan estados entre sí.

<Resumen>

- Un efecto sincroniza con algo externo; si no hay algo externo, no hay efecto.
- Dependencias = todo valor reactivo usado adentro. El linter manda.
- La limpieza deshace lo que hizo el efecto; StrictMode la pone a prueba.
- Los datos se piden con TanStack Query o Server Components, no con efectos.

</Resumen>

## Preguntas de entrevista

**1. ¿Para qué sirve `useEffect`?**
Para sincronizar un componente con un sistema externo después del commit:
suscripciones, APIs del navegador, widgets de terceros, conexiones.

**2. ¿Por qué en desarrollo los efectos corren dos veces?**
Porque StrictMode monta, desmonta y remonta para verificar que la limpieza
sea correcta. En producción corre una vez.

**3. ¿Qué pasa si omitís una dependencia?**
El efecto ve valores de un render viejo (closure obsoleta) y no se vuelve a
ejecutar cuando debería. Es un bug, aunque "funcione".

**4. ¿Cómo evitás condiciones de carrera al pedir datos en un efecto?**
Con una bandera `ignore` en la limpieza o un `AbortController`. Mejor aún,
con una librería como TanStack Query que lo resuelve.

**5. Nombrá tres casos donde se usa un efecto y no hacía falta.**
Calcular datos derivados, reaccionar a un clic y resetear estado cuando cambia
una prop. Se resuelven en el render, en el evento y con `key`.

**6. ¿Diferencia entre `useEffect` y `useLayoutEffect`?**
`useLayoutEffect` corre antes de pintar y bloquea; sirve para medir el DOM sin
parpadeo. `useEffect` corre después de pintar y es el que se usa casi siempre.

## Glosario

| Término | Qué es |
| --- | --- |
| Efecto | Código que sincroniza con un sistema externo después del commit. |
| Dependencias | Valores reactivos que, al cambiar, vuelven a ejecutar el efecto. |
| Limpieza | Función que devuelve el efecto para deshacerlo. |
| Condición de carrera | Una respuesta vieja que pisa a una nueva. |
| `exhaustive-deps` | Regla del linter que verifica las dependencias. |
