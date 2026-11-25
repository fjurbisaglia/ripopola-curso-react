---
title: Patrones de componentes
sidebar_position: 4
description: Composición, slots, compound components, render props, componentes headless, controlados y no controlados, asChild y componentes polimórficos, HOCs y por qué los hooks los reemplazaron.
---

# Patrones de componentes

<Tech ids={['react', 'typescript', 'radixui']} />

<Estado tipo="construye">Un `Filters` compuesto (compound component) para el buscador y un `Disclosure` controlable para las secciones de la ficha del pueblo.</Estado>

## Concepto

### 1. Composición con slots

Props que reciben JSX para cada "hueco":

```tsx
<PageHeader title="Albarracín" actions={<FavoriteButton />} breadcrumb={<Breadcrumb />} />
```

Es el patrón base. Antes de inventar algo más complejo, probá con esto.

### 2. Compound components

Un componente "padre" comparte estado con sus partes por Context, y el usuario
las combina como quiere. Es lo que hacen `<select>` y `<option>`, y las
librerías como Radix (`Tabs.Root`, `Tabs.List`, `Tabs.Trigger`).

```tsx
<Filters onChange={setFilters}>
  <Filters.Group label="País">
    <Filters.Option value="ES">España</Filters.Option>
    <Filters.Option value="IT">Italia</Filters.Option>
  </Filters.Group>
</Filters>
```

### 3. Render props

Un componente recibe una **función** que devuelve JSX y le pasa datos:

```tsx
<TownsQuery country="ES">
  {({ towns, isLoading }) => (isLoading ? <Spinner /> : <TownGrid towns={towns} />)}
</TownsQuery>
```

Fue muy usado antes de los hooks; hoy casi siempre se reemplaza por un hook
(`useTownsQuery`). Sigue vivo en librerías de listas, formularios y tablas.

### 4. Higher-Order Components (HOC)

Una función que recibe un componente y devuelve otro con algo agregado
(`withAuth(Page)`). Patrón histórico (Redux `connect`). Hoy: hooks. Saber
reconocerlo sirve para código viejo.

### 5. Headless

Componentes o hooks que dan **comportamiento y accesibilidad sin estilos**:
Radix, React Aria, TanStack Table, Downshift. Vos ponés el markup y las
clases. shadcn/ui es Radix + tus estilos.

### 6. Controlado y no controlado (en tus componentes)

Un buen componente reutilizable soporta los dos modos, como un `<input>`:

```tsx
type DisclosureProps = {
  open?: boolean;                       // controlado
  defaultOpen?: boolean;                // no controlado
  onOpenChange?: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
};
```

### 7. Polimórficos y `asChild`

Cambiar el elemento que dibuja un componente: con `as="a"` (polimórfico) o con
`asChild` (Radix: le pasa props y comportamiento al hijo). `asChild` es más
fácil de tipar y es lo que usa shadcn.

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| Proyección múltiple con `ng-content select` | Props con JSX (slots) |
| Directivas estructurales con contexto (`*ngTemplateOutlet` + `let-x`) | Render props |
| Componentes padre/hijo que se comunican con DI (`inject(TabsComponent)`) | Compound components con Context |
| Angular CDK (headless) | Radix, React Aria |
| `ControlValueAccessor` (controlado por formularios) | `value`/`defaultValue` + `onChange` |
| Directivas de atributo para agregar comportamiento | Hooks, o `asChild` |

</Angular>

## En ripopola

### `Disclosure` controlable

```tsx title="apps/web/components/ui/disclosure.tsx"
'use client';

import { useId, useState } from 'react';

type DisclosureProps = {
  title: string;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Disclosure({ title, children, open, defaultOpen = false, onOpenChange }: DisclosureProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const panelId = useId(); // id estable y único, igual en servidor y cliente

  function toggle() {
    if (!isControlled) setInternalOpen(!isOpen);
    onOpenChange?.(!isOpen);
  }

  return (
    <section>
      <h3>
        <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={toggle}>
          {title}
        </button>
      </h3>
      <div id={panelId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
```

`useId` genera ids que coinciden entre servidor y cliente (no uses
`Math.random()` para ids: rompe la hidratación).

### `Filters` como compound component

```tsx title="apps/web/features/search/filters.tsx"
'use client';

import { createContext, use } from 'react';

type FiltersCtx = { selected: Set<string>; toggle: (v: string) => void };
const Ctx = createContext<FiltersCtx | null>(null);

function useFilters() {
  const ctx = use(Ctx);
  if (!ctx) throw new Error('Usá Filters.Option dentro de <Filters>');
  return ctx;
}

function Root({ value, onChange, children }: { value: string[]; onChange: (v: string[]) => void; children: React.ReactNode }) {
  const selected = new Set(value);
  const toggle = (v: string) => onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  return <Ctx value={{ selected, toggle }}><div role="group">{children}</div></Ctx>;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend>{label}</legend>{children}</fieldset>;
}

function Option({ value, children }: { value: string; children: React.ReactNode }) {
  const { selected, toggle } = useFilters();
  return (
    <label>
      <input type="checkbox" checked={selected.has(value)} onChange={() => toggle(value)} /> {children}
    </label>
  );
}

export const Filters = Object.assign(Root, { Group, Option });
```

:::info En Server Components
`Filters.Option` (acceso a propiedades de un import) no funciona bien a través
de la frontera servidor/cliente. Si lo usás desde un Server Component,
exportá las partes por separado (`FiltersRoot`, `FiltersOption`).
:::

## Errores comunes

- **Un componente con 25 props booleanas** (`showHeader`, `showFooter`...): señal de que faltan slots o composición.
- **Render props anidadas** ("callback hell" de JSX): convertilas en hooks.
- **Componente que mezcla controlado y no controlado** sin una regla clara.
- **Ids con `Math.random()`**: usá `useId`.

<Resumen>

- Primero composición y slots; después compound components o headless.
- Render props y HOCs son históricos: hoy son hooks, pero hay que reconocerlos.
- Un componente reutilizable acepta modo controlado y no controlado.
- `asChild` le pasa comportamiento al hijo; `useId` genera ids seguros.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué son los compound components?**
Un conjunto de componentes que comparten estado implícito por Context y se
combinan libremente, como `Tabs`, `Tabs.List` y `Tabs.Trigger`.

**2. ¿Qué reemplazó a las render props y a los HOCs?**
Los hooks propios: comparten lógica con estado sin anidar componentes ni
envolverlos.

**3. ¿Qué es un componente headless?**
Uno que da comportamiento, estado y accesibilidad sin markup ni estilos
propios, para que el equipo aplique su diseño.

**4. ¿Cómo diseñás un componente que pueda ser controlado y no controlado?**
Con `value` y `defaultValue` (o `open` y `defaultOpen`) más un `onChange`: si
llega `value` manda el padre; si no, se usa estado interno iniciado con el default.

**5. ¿Para qué sirve `useId`?**
Para generar ids únicos y estables que coinciden entre servidor y cliente, por
ejemplo para conectar `aria-controls` o `htmlFor`.

## Glosario

| Término | Qué es |
| --- | --- |
| Slot | Prop que recibe JSX para un lugar del componente. |
| Compound component | Familia de componentes que comparten estado implícito. |
| Render prop | Prop que es una función que devuelve JSX. |
| HOC | Función que envuelve un componente y devuelve otro. |
| Headless | Comportamiento sin estilos. |
