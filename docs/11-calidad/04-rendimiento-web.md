---
title: Rendimiento web - Core Web Vitals, bundle y carga diferida
sidebar_position: 4
description: LCP, INP y CLS, datos de laboratorio y de campo, useReportWebVitals, Lighthouse, analizar el bundle, carga diferida con next/dynamic y lazy, optimizar el mapa y presupuestos de rendimiento en CI.
---

# Rendimiento web

<Tech ids={['nextdotjs', 'lighthouse', 'react', 'maplibre']} />

<Estado tipo="construye">Medición de Web Vitals reales de la web, análisis del bundle, el mapa cargado de forma diferida y un presupuesto de Lighthouse en CI.</Estado>

## Concepto

### Core Web Vitals

Las tres métricas con las que Google mide la experiencia (y que influyen en
el posicionamiento):

| Métrica | Mide | Bueno | Qué la empeora en ripopola |
| --- | --- | --- | --- |
| **LCP** (*Largest Contentful Paint*) | Cuándo aparece el elemento más grande | ≤ 2,5 s | La foto principal del pueblo, una API lenta en el render |
| **INP** (*Interaction to Next Paint*) | Cuánto tarda la página en responder a una interacción | ≤ 200 ms | Filtrar mil pueblos en el hilo principal, hidratar demasiado JS |
| **CLS** (*Cumulative Layout Shift*) | Cuánto se mueve el contenido mientras carga | ≤ 0,1 | Imágenes sin tamaño, fuentes que cambian, banners que empujan |

Se miden en el **percentil 75** de visitas reales: no alcanza con que ande
bien en tu computadora.

### Laboratorio y campo

| | Laboratorio | Campo (RUM) |
| --- | --- | --- |
| Herramienta | Lighthouse, DevTools *Performance* | `useReportWebVitals`, CrUX, Search Console |
| Condiciones | Simuladas y repetibles | Las de tus usuarios reales |
| INP | No lo mide (no hay usuario); usa TBT como aproximación | Sí |
| Para | Detectar regresiones en CI, depurar | Saber cómo está de verdad |

### Las palancas que da Next

- **Server Components**: el código que solo renderiza no viaja al navegador.
- **Prerender parcial** (7.2): el *shell* sale del caché, lo dinámico se transmite.
- **`next/image`** (6.7): tamaños, formatos modernos, `preload` para el LCP.
- **`next/font`**: fuentes alojadas y sin salto de diseño.
- **Code splitting por ruta**: cada página carga solo su JS.
- **`next/dynamic`** y `React.lazy`: cargar componentes pesados cuando hacen falta.

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `@defer (on viewport)` | `next/dynamic` + un contenedor que se monta al verse |
| Budgets en `angular.json` | Lighthouse CI con presupuestos, o un límite de tamaño por ruta |
| `source-map-explorer` | `next analyze` (Turbopack) o `@next/bundle-analyzer` (Webpack) |
| Hidratación incremental | Server Components: lo que no es interactivo no se hidrata |

</Angular>

## En ripopola

### 1. Medir en campo

```tsx title="apps/web/components/web-vitals.tsx"
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // LCP, INP, CLS, FCP, TTFB
    const body = JSON.stringify({ name: metric.name, value: metric.value, rating: metric.rating, path: location.pathname });
    navigator.sendBeacon?.('/internal/vitals', body);
  });
  return null;
}
```

Se monta una vez en el layout raíz. `/internal/vitals` es un Route Handler
que lo manda a tu herramienta de observabilidad (11.6), o directo a Sentry,
que mide Web Vitals por su cuenta.

### 2. El LCP de la ficha

El elemento más grande de `/es/pueblos/albarracin` es la foto principal:

```tsx
<Image src={town.coverUrl} alt={town.coverAlt} width={1600} height={900} sizes="100vw" preload />
```

- `preload` (antes `priority`): el navegador la pide en cuanto llega el HTML.
- Que **no dependa de JavaScript**: está en el HTML del Server Component.
- Que el HTML llegue rápido: la ficha está cacheada (7.3); si la API tardara,
  el LCP tardaría igual.

### 3. Analizar el bundle

```bash
pnpm exec next analyze     # analizador de Turbopack (Next 16.1+): informe por ruta
```

Mirá qué hay en el JS de cada ruta y preguntate si cada paquete tiene que estar
ahí. Los sospechosos habituales: una librería de fechas entera, iconos
importados todos juntos, un componente de cliente que podría ser de servidor.

### 4. El mapa, diferido

MapLibre pesa cientos de kB y necesita WebGL. En la ficha del pueblo está
abajo de todo: no tiene que cargar con la página.

```tsx title="apps/web/features/map/lazy-town-map.tsx"
'use client';

import dynamic from 'next/dynamic';
import { useInView } from '@/hooks/use-in-view';

const TownMap = dynamic(() => import('./towns-map').then((m) => m.TownsMap), {
  ssr: false,                                    // usa window y WebGL
  loading: () => <div className="aspect-video animate-pulse rounded bg-muted" />,
});

export function LazyTownMap(props: React.ComponentProps<typeof TownMap>) {
  const { ref, inView } = useInView({ rootMargin: '200px' });   // IntersectionObserver
  return (
    <div ref={ref} className="aspect-video">
      {inView ? <TownMap {...props} /> : null}
    </div>
  );
}
```

- `ssr: false` solo se puede usar desde un componente de cliente.
- El contenedor con `aspect-video` reserva el lugar: **CLS 0** cuando aparece el mapa.
- `useInView` es un hook propio de pocas líneas con `IntersectionObserver` (2.5).

### 5. INP: no bloquear el hilo principal

- Filtrar o ordenar listas grandes dentro de `startTransition` o con
  `useDeferredValue` (2.7): la escritura no se traba.
- Listas de cientos de elementos: virtualizarlas (`@tanstack/react-virtual`).
- Nada de trabajo pesado en el `onClick`: si hace falta, un Web Worker.
- Menos componentes de cliente = menos hidratación = el primer clic responde antes.

### 6. Presupuesto en CI

```json title="apps/web-e2e/lighthouserc.json"
{
  "ci": {
    "collect": { "url": ["http://localhost:4200/es", "http://localhost:4200/es/pueblos/albarracin"], "numberOfRuns": 3 },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 200 }]
      }
    }
  }
}
```

`pnpm dlx @lhci/cli autorun` en el pipeline (12.4): si un cambio empeora la
página, el PR falla.

## Errores comunes

- **Optimizar sin medir**, o medir solo en una computadora rápida.
- **`'use client'` arriba de todo**: todo el árbol se hidrata.
- **Imágenes sin `width`/`height`** o sin `sizes`: CLS y descargas de más.
- **Cargar el mapa, el editor o los gráficos con la página** aunque estén abajo.
- **Fuentes de Google por `<link>`** en vez de `next/font`.
- **Importar una librería entera** por una función.

<Resumen>

- LCP, INP y CLS al percentil 75 de usuarios reales.
- Laboratorio (Lighthouse) para regresiones; campo (`useReportWebVitals`) para la verdad.
- LCP: imagen con `preload` en el HTML y página cacheada.
- `next/dynamic` con `ssr: false` + carga al verse para el mapa, con lugar reservado.
- INP: transiciones, virtualización y menos JavaScript de cliente.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué son los Core Web Vitals?**
LCP (cuándo se ve el contenido principal), INP (cuánto tarda en responder a
una interacción) y CLS (cuánto se mueve el diseño), medidos en usuarios reales.

**2. ¿Cómo mejorarías el LCP de una página?**
Haciendo que el elemento principal esté en el HTML inicial, precargando la
imagen con el tamaño correcto, sirviendo el HTML rápido (caché, CDN) y sin
bloquear con CSS o JS innecesarios.

**3. ¿Qué causa un mal INP y cómo se arregla?**
Trabajo largo en el hilo principal durante una interacción (render pesado,
hidratación, cálculos). Se arregla con transiciones, virtualización, menos
JS y moviendo cálculos a un Worker.

**4. ¿Qué diferencia hay entre datos de laboratorio y de campo?**
Los de laboratorio son simulados y repetibles, sirven para detectar
regresiones; los de campo son de usuarios reales y son los que cuentan.

**5. ¿Cuándo usás `next/dynamic` con `ssr: false`?**
Para componentes que dependen del navegador (WebGL, `window`) o pesados que
no tienen que estar en el HTML inicial.

## Glosario

| Término | Qué es |
| --- | --- |
| LCP | Tiempo hasta que se pinta el elemento más grande visible. |
| INP | Latencia de las interacciones durante la visita. |
| CLS | Suma de los desplazamientos inesperados del diseño. |
| RUM | Real User Monitoring: métricas de usuarios reales. |
| TBT | Tiempo total de bloqueo del hilo principal (laboratorio). |
| Code splitting | Partir el JS en pedazos que se cargan cuando hacen falta. |
