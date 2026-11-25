---
title: Estructura de una app grande - por features
sidebar_position: 1
description: Cómo organizar el código de una app Next que crece - app/ solo para rutas, carpetas por feature, reglas de dependencias, la frontera servidor-cliente como decisión de arquitectura, componentes de UI compartidos y convenciones de nombres.
---

# Estructura de una app grande: por features

<Tech ids={['nextdotjs', 'react', 'typescript']} />

<Estado tipo="construye">La estructura de carpetas final de `apps/web` y `apps/panel`, y las reglas de qué puede importar qué.</Estado>

## Concepto

### El problema de agrupar por tipo

```
components/   hooks/   utils/   services/   types/
```

Funciona con 20 archivos. Con 300, para cambiar "viviendas" tocás cinco
carpetas, nadie sabe qué hook usa quién y borrar una feature es arqueología.

### Agrupar por feature

```
apps/panel/
  app/                       ← SOLO rutas: page, layout, loading, error, route
    (privado)/viviendas/page.tsx
  features/                  ← el código, por dominio
    listings/
      api.ts                 ← funciones de servidor (server-only)
      queries.ts             ← queryOptions de TanStack Query
      actions.ts             ← Server Actions
      listing-schema.ts      ← Zod
      listing-form.tsx       ← componentes
      listings-table.tsx
      listing-form.test.tsx
      index.ts               ← lo que la feature expone (opcional)
    municipality/
    auth/
    media/
  components/                ← UI genérica de esta app (layout, sidebar)
  hooks/                     ← hooks genéricos (useDebouncedValue, useInView)
  lib/                       ← utilidades sin dominio
```

Reglas:

1. **`app/` es delgado**: una página importa de `features/` y compone. Nada
   de lógica de negocio ni de fetch inline en `page.tsx`.
2. **Una feature no importa el interior de otra.** Si `listings` necesita
   algo de `municipality`, lo toma de lo que esta expone (su `index.ts`) o
   lo recibe como prop desde la página.
3. **Lo genérico no conoce el dominio**: `components/ui/button.tsx` no sabe
   qué es una vivienda.
4. **Lo que comparten las dos apps** sube a `libs/frontend/` (13.2).
5. **Las pruebas viven junto al código** que prueban.

### La frontera servidor-cliente es arquitectura

En Next, decidir qué es Server y qué es Client Component define **qué
JavaScript se manda, dónde están los datos y qué es seguro**. Patrones:

| Patrón | Qué es |
| --- | --- |
| **Hojas interactivas** | El árbol es de servidor; solo los botones, formularios y el mapa son de cliente |
| **Server pasa datos, cliente interactúa** | La página trae los datos y los pasa como props (serializables) al componente de cliente |
| **Composición con `children`** | Un componente de cliente (un modal, un acordeón) recibe Server Components como `children` |
| **Archivos que dicen dónde corren** | `api.ts` con `server-only`, `actions.ts` con `'use server'`, componentes interactivos con `'use client'` |

Convención útil: en cada feature, lo que tiene `'use client'` se reconoce por
el nombre o por estar en archivos chicos y hoja. Si un `'use client'` aparece
arriba de un archivo que importa media feature, algo está mal.

### Nombres

| Qué | Convención en ripopola |
| --- | --- |
| Archivos | `kebab-case.tsx` (como los genera shadcn y Next) |
| Componentes | `PascalCase` |
| Hooks | `useAlgo` en `use-algo.ts` |
| Server Actions | Verbo + entidad: `publishListing`, `switchMunicipality` |
| Query keys | Fábricas en `queries.ts`: `listingQueries.list(...)` (4.2) |
| Código | En inglés; textos de la interfaz, en mensajes traducidos (10.2) |

## Si venís de Angular

<Angular>

Es la misma idea que las *feature folders* de Angular (o las librerías de
dominio de Nx: `feature`, `ui`, `data-access`, `util`). La diferencia es que
en Next las rutas están obligadas a vivir en `app/`: por eso `app/` queda
como capa de ruteo y el código real va en `features/`.

</Angular>

## En ripopola

### 1. Forzar las reglas con ESLint

```js title="apps/panel/eslint.config.mjs (fragmento)"
export default [
  // ...
  {
    files: ['features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/features/*/*', '!@/features/*/index'],
          message: 'Importá de la feature por su index, no de sus archivos internos.',
        }],
      }],
    },
  },
];
```

Dentro de la misma feature se usan imports relativos (`./listing-schema`), así
que la regla solo afecta a imports entre features.

### 2. Una página delgada

```tsx title="apps/panel/app/(privado)/viviendas/page.tsx"
import { Suspense } from 'react';
import { ListingsPage, ListingsSkeleton } from '@/features/listings';

export const metadata = { title: 'Viviendas' };

export default function Page() {
  return (
    <Suspense fallback={<ListingsSkeleton />}>
      <ListingsPage />
    </Suspense>
  );
}
```

La página no sabe de TanStack Query, de la API ni de permisos: eso está en la
feature. Cambiar de librería de datos no toca las rutas.

### 3. Cuándo crear una feature nueva

Cuando hay un **concepto de dominio** con sus datos y sus pantallas
(viviendas, empleos, mensajes). No por cada componente. Una feature chica
puede ser un solo archivo; crece cuando lo necesita.

## Errores comunes

- **`page.tsx` de 400 líneas** con fetch, lógica y JSX.
- **Carpetas `utils/` y `helpers/` sin dueño** donde va todo.
- **Features que se importan en círculo.**
- **`'use client'` en un componente "contenedor"** que arrastra todo al bundle.
- **Abstraer antes de tiempo**: una "feature genérica" para un solo uso.
- **Un `index.ts` que mezcla servidor y cliente**: si reexporta `api.ts`
  (`server-only`) y un Client Component importa del index, el build falla.
  Separá los puntos de entrada: `index.ts` para componentes y `server.ts` para
  lo de servidor, igual que en `@ripopola/frontend-api` (4.1).

<Resumen>

- `app/` solo para rutas; el código en `features/` por dominio.
- Las features exponen una API (`index.ts`) y no se meten en el interior de otras.
- Lo genérico en `components/`, `hooks/`, `lib/`; lo compartido entre apps en `libs/frontend/`.
- La frontera servidor-cliente es una decisión de arquitectura: hojas interactivas y composición.
- Reglas forzadas con ESLint, no solo con buena voluntad.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo organizás una app React grande?**
Por feature o dominio: cada carpeta tiene sus componentes, datos, esquemas y
pruebas; lo genérico aparte; y reglas de dependencias para que las features
no se acoplen.

**2. ¿Cómo decidís qué es Server y qué es Client Component?**
Por defecto servidor. Client solo para lo que necesita estado, eventos o APIs
del navegador, lo más abajo posible en el árbol, recibiendo datos por props.

**3. ¿Qué ganás con páginas delgadas?**
Las rutas quedan como composición; la lógica se prueba y se mueve sin tocar el
ruteo, y cambiar una librería no afecta a las páginas.

## Glosario

| Término | Qué es |
| --- | --- |
| Feature folder | Carpeta que agrupa todo lo de un dominio. |
| API pública de un módulo | Lo que un módulo exporta para que otros usen (`index.ts`). |
| Hoja interactiva | Componente de cliente al final del árbol, rodeado de componentes de servidor. |
