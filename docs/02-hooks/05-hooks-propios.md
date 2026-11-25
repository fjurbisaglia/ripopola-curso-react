---
title: Hooks propios y reglas de los hooks
sidebar_position: 5
description: Las reglas de los hooks y por qué existen, cómo extraer lógica a hooks propios, useDebouncedValue, useMediaQuery con useSyncExternalStore y cómo testearlos.
---

# Hooks propios y reglas de los hooks

<Tech ids={['react', 'typescript', 'vitest']} />

<Estado tipo="construye">`useDebouncedValue` (para el buscador) y `useMediaQuery` (mapa o lista en móvil).</Estado>

## Concepto

### Las reglas

1. Llamá a los hooks **solo en el nivel superior** de un componente o de otro
   hook: nunca dentro de `if`, bucles, callbacks ni después de un `return` temprano.
2. Llamalos **solo desde componentes o hooks propios** (funciones que empiezan con `use`).

¿Por qué? React no sabe "cómo se llama" cada `useState`: los identifica **por
el orden** en que se llaman en cada render. Si un `if` saltea uno, todos los
siguientes quedan corridos y reciben el estado equivocado.

(`use()` es la excepción: puede ir dentro de condiciones.)

### Qué es un hook propio

Una función que empieza con `use` y llama a otros hooks. Sirve para **reutilizar
lógica con estado**, no el estado en sí: cada componente que la llama tiene su
propia copia.

```tsx
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle] as const;
}
```

Cuándo extraer uno:
- La misma combinación de hooks aparece en dos lugares.
- Un componente se volvió difícil de leer y la lógica tiene un nombre claro
  (`useGeolocation`, `useTownSearch`).
- Querés testear la lógica aparte.

No hace falta un hook para cada cosa: si no usa hooks, es una función normal.

### Suscribirse a algo externo: `useSyncExternalStore`

Para leer de una fuente externa que cambia (media queries, `navigator.onLine`,
un store propio) sin errores de concurrencia ni de hidratación:

```tsx
useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```

Es lo que usan por dentro Zustand y otras librerías de estado.

## Si venís de Angular

<Angular>

Un hook propio cumple el rol de un **servicio sin `providedIn: 'root'`**, o de
las funciones `inject()` que armás en Angular moderno (`injectGeolocation()`):
lógica reutilizable que vive en el contexto del componente que la llama.

La diferencia: un servicio `root` es **uno solo** para toda la app. Un hook
crea estado **por cada componente** que lo usa. Para estado compartido
necesitás Context o un store.

</Angular>

## En ripopola

### `useDebouncedValue`

El buscador no tiene que pedir a la API en cada tecla:

```tsx title="apps/web/hooks/use-debounced-value.ts"
'use client';

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id); // si el valor cambia antes, se cancela
  }, [value, delayMs]);

  return debounced;
}
```

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebouncedValue(query, 300);
// la consulta a la API usa debouncedQuery (5.1)
```

### `useMediaQuery`

En móvil, ripopola muestra mapa **o** lista; en escritorio, los dos:

```tsx title="apps/web/hooks/use-media-query.ts"
'use client';

import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches, // en el navegador
    () => serverFallback,                   // en el servidor (no hay window)
  );
}
```

```tsx
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

:::warning Hidratación
En el servidor no se sabe el ancho de pantalla. Si el HTML del servidor y el
primer render del cliente no coinciden, React avisa de un *hydration
mismatch*. `getServerSnapshot` existe para eso. Cuando se pueda, resolvé el
responsive con CSS (`hidden lg:block`) en vez de JavaScript.
:::

### Testear un hook

```tsx
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useDebouncedValue } from './use-debounced-value';

it('devuelve el valor después del retardo', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
    initialProps: { v: 'alb' },
  });
  rerender({ v: 'albarr' });
  expect(result.current).toBe('alb');
  act(() => vi.advanceTimersByTime(300));
  expect(result.current).toBe('albarr');
});
```

## Errores comunes

- **Hooks dentro de condiciones** o después de un `return` temprano.
- **Llamar a un hook desde una función normal** o un manejador de eventos.
- **Creer que dos componentes comparten estado** porque usan el mismo hook.
- **Hooks que no usan hooks**: es una función, sin `use`.

<Resumen>

- Los hooks se llaman siempre en el mismo orden: React los identifica por posición.
- Un hook propio reutiliza lógica, no estado: cada llamada tiene el suyo.
- `useSyncExternalStore` es la forma correcta de leer fuentes externas.
- Los hooks se testean con `renderHook`.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué no se pueden llamar hooks dentro de un `if`?**
Porque React guarda el estado de los hooks en una lista y los identifica por
el orden de llamada. Saltearse uno desordena los siguientes.

**2. ¿Dos componentes que usan el mismo hook propio comparten estado?**
No. Cada llamada crea su propio estado. Para compartir hace falta levantar el
estado, Context o un store.

**3. ¿Para qué existe `useSyncExternalStore`?**
Para suscribirse a fuentes externas de forma segura con el render concurrente
(sin "tearing") y con un valor para el servidor que evita errores de hidratación.

**4. ¿Qué es el debounce y cómo lo implementás en React?**
Esperar a que el valor deje de cambiar por un tiempo antes de usarlo. Con un
efecto que arma un `setTimeout` y lo cancela en la limpieza.

**5. ¿Cómo testeás un hook propio?**
Con `renderHook` de Testing Library, `rerender` para cambiar las props y
`act` para avanzar timers o disparar actualizaciones.

## Glosario

| Término | Qué es |
| --- | --- |
| Hook propio | Función `useX` que combina otros hooks. |
| Debounce | Esperar a que un valor se estabilice antes de usarlo. |
| Tearing | Partes de la UI mostrando versiones distintas de un mismo dato. |
| Hydration mismatch | El HTML del servidor no coincide con el primer render del cliente. |
