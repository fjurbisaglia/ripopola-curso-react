---
title: Perfilar el rendimiento
sidebar_position: 3
description: Cómo medir antes de optimizar - React DevTools y su Profiler, el componente Profiler, las pistas de rendimiento de React en Chrome, INP y listas largas con virtualización.
---

# Perfilar el rendimiento

<Tech ids={['react', 'lighthouse']} />

<Estado tipo="construye">Una sesión de perfilado del listado y el mapa de pueblos, y virtualización de la lista larga del panel.</Estado>

## Concepto

La regla de oro: **medí, cambiá una cosa, volvé a medir**. Las herramientas:

### 1. React DevTools

Extensión del navegador con dos pestañas:

- **Components**: el árbol, las props, el estado y los hooks de cada
  componente. Con "Highlight updates when components render" ves en vivo qué se re-renderiza.
- **Profiler**: grabás una interacción y te muestra cada commit con:
  - **Flamegraph**: cada barra es un componente; el ancho es el tiempo.
  - **Ranked**: los componentes ordenados por tiempo de render.
  - **"Why did this render?"** (activalo en la configuración): estado, props o
    contexto que cambió, o "el padre se renderizó".

### 2. Pistas de React en el panel Performance de Chrome

En React 19.2 los perfiles de Chrome muestran pistas propias de React
(Scheduler y Components): en qué prioridad se trabajó, cuánto tardó cada
componente, cuándo se bloqueó el hilo. Útil para cruzar React con layout,
pintado y JavaScript de terceros.

### 3. `<Profiler>` en el código

Para medir en producción o en pruebas:

```tsx
import { Profiler } from 'react';

<Profiler id="TownGrid" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 16) reportSlowRender(id, phase, actualDuration);
}}>
  <TownGrid towns={towns} />
</Profiler>
```

### Qué buscar

| Síntoma | Causa típica | Solución |
| --- | --- | --- |
| Todo se renderiza al escribir | Estado demasiado arriba | Bajar el estado, children |
| Un componente tarda mucho en cada render | Cálculo caro o lista enorme | Memoizar, virtualizar |
| Muchos commits seguidos | Efectos en cadena | Calcular en el evento |
| El input se traba | Render pesado sincrónico | `useDeferredValue` / transición |
| Carga inicial lenta | JavaScript de más en el cliente | Server Components, `lazy` (11.4) |

### INP: la métrica que mide esto

**INP** (*Interaction to Next Paint*) es la Core Web Vital que mide cuánto
tarda la página en responder visualmente a una interacción. Bueno: menos de
**200 ms**. Los renders lentos de React impactan directamente en INP. La
medimos con datos reales en el 11.4.

### Listas largas: virtualizar

Si el panel de superadmin muestra 8.000 pueblos, ningún `memo` alcanza:
dibujar 8.000 filas es caro. **Virtualizar** = dibujar solo las filas visibles.

```bash
pnpm add -E @tanstack/react-virtual
```

```tsx
'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function TownsTable({ towns }: { towns: { id: string; name: string }[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: towns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={towns[row.index].id}
            style={{ position: 'absolute', top: 0, transform: `translateY(${row.start}px)`, height: row.size, width: '100%' }}
          >
            {towns[row.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

:::warning Virtualización y accesibilidad
Lo que no está en el DOM no lo encuentra `Ctrl+F` ni un lector de pantalla.
Para el sitio público preferí paginación (7.6); virtualizá en el panel.
:::

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| Angular DevTools (Profiler de detección de cambios) | React DevTools (Profiler de commits) |
| `cdk-virtual-scroll-viewport` | `@tanstack/react-virtual` |
| Buscar ciclos de detección de cambios innecesarios | Buscar renders innecesarios ("why did this render") |

</Angular>

## En ripopola: una sesión de perfilado

1. Abrí `/pueblos` en modo desarrollo con React DevTools.
2. Activá "Highlight updates" y escribí en el buscador. ¿Se pinta la grilla entera?
3. Grabá con el Profiler: escribí "alb" y pará. Mirá el **Ranked**.
4. Activá "Record why each component rendered". Elegí `TownCard`: ¿por qué se renderizó?
5. Aplicá una solución (bajar el estado, `useDeferredValue`) y volvé a grabar.

:::info Desarrollo vs producción
En desarrollo React es más lento (StrictMode, avisos). Para números reales,
perfilá un build de producción (`next build && next start`) o mirá INP con datos de campo.
:::

## Errores comunes

- **Optimizar a ojo** sin grabar un perfil.
- **Medir en desarrollo** y sacar conclusiones absolutas.
- **Virtualizar contenido que tiene que indexar Google.**
- **Mirar solo React**: a veces lo lento es un script de terceros o el layout.

<Resumen>

- Medí con React DevTools (Profiler y "why did this render") y el panel Performance.
- INP mide cuánto tarda la respuesta a una interacción: menos de 200 ms.
- Listas enormes: virtualizar (en el panel); en el sitio público, paginar.
- Perfilá builds de producción para números reales.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo encontrás un problema de rendimiento en una app React?**
Reproduzco la interacción lenta, grabo con el Profiler de React DevTools, miro
los componentes más caros y por qué se renderizaron, aplico un cambio y vuelvo a medir.

**2. ¿Qué es INP?**
Interaction to Next Paint, la Core Web Vital de capacidad de respuesta: el
tiempo desde una interacción hasta el siguiente pintado. Bueno, menos de 200 ms.

**3. ¿Qué es la virtualización y cuándo la usás?**
Renderizar solo los elementos visibles de una lista larga. Para miles de
filas en un panel; no para contenido que necesita SEO o búsqueda del navegador.

**4. ¿Por qué no medir el rendimiento en modo desarrollo?**
Porque React agrega comprobaciones, StrictMode duplica renders y no hay
optimizaciones del build; los números no representan producción.

**5. ¿Para qué sirve el componente `<Profiler>`?**
Para medir tiempos de render de un subárbol desde el código, por ejemplo para
reportar renders lentos a un sistema de monitoreo.

## Glosario

| Término | Qué es |
| --- | --- |
| Flamegraph | Gráfico de barras anidadas con el tiempo de cada componente. |
| Commit | Cada vez que React aplica cambios al DOM. |
| INP | Interaction to Next Paint. |
| Virtualización | Renderizar solo lo visible de una lista. |
| Overscan | Filas extra por fuera de la vista para que el scroll sea suave. |
