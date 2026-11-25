---
title: TypeScript con React
sidebar_position: 6
description: Tipar props, children, eventos, refs, hooks, componentes genéricos, ComponentProps para extender elementos nativos, uniones discriminadas en props y satisfies.
---

# TypeScript con React

<Tech ids={['typescript', 'react']} />

<Estado tipo="construye">Los tipos de los componentes de ripopola: props que extienden elementos nativos, un `Select` genérico y props con uniones discriminadas.</Estado>

## Concepto

### Props

```tsx
type TownCardProps = {
  name: string;
  population?: number;           // opcional
  onSelect?: (slug: string) => void;
  children?: React.ReactNode;    // cualquier cosa dibujable
};

export function TownCard({ name, population = 0, onSelect, children }: TownCardProps) {}
```

- `type` o `interface`: los dos sirven. `type` combina mejor uniones.
- Evitá `React.FC`: agregaba `children` implícito y no aporta.
- Para lo que devuelve un componente no hace falta tipo: TypeScript lo infiere.

### Extender un elemento nativo

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}
```

`ComponentProps<'button'>` trae todos los atributos de un botón (incluido `ref`
en React 19). También existe `ComponentProps<typeof OtroComponente>`.

### Eventos y refs

```tsx
onChange={(e: React.ChangeEvent<HTMLInputElement>) => {}}
onSubmit={(e: React.FormEvent<HTMLFormElement>) => {}}
const ref = useRef<HTMLDivElement>(null);
```

Truco: escribí el manejador inline y pasá el mouse sobre `e`; copiá el tipo que
te muestra el editor.

### Hooks

```tsx
const [town, setTown] = useState<Town | null>(null);   // cuando el inicial no alcanza para inferir
const [ids, setIds] = useState<string[]>([]);           // array vacío: si no, es never[]
```

### Uniones discriminadas en props

Para props que dependen de otras:

```tsx
type PriceProps =
  | { kind: 'rent'; monthly: number }
  | { kind: 'sale'; total: number }
  | { kind: 'unknown' };

function Price(props: PriceProps) {
  switch (props.kind) {
    case 'rent': return <>{props.monthly} €/mes</>;
    case 'sale': return <>{props.total} €</>;
    case 'unknown': return <>Precio a consultar</>;
  }
}
```

Imposible pasar `kind="rent"` sin `monthly`. Esto también modela "precio
desconocido distinto de cero", una regla de datos de ripopola.

### Componentes genéricos

```tsx
type SelectProps<T> = {
  items: T[];
  value: T | null;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  onChange: (item: T) => void;
};

export function Select<T>({ items, value, getLabel, getKey, onChange }: SelectProps<T>) {
  return (
    <select
      value={value ? getKey(value) : ''}
      onChange={(e) => {
        const item = items.find((i) => getKey(i) === e.target.value);
        if (item) onChange(item);
      }}
    >
      {items.map((i) => <option key={getKey(i)} value={getKey(i)}>{getLabel(i)}</option>)}
    </select>
  );
}
```

En `.tsx`, para funciones flecha genéricas se escribe `<T,>` para que no se
confunda con JSX.

### `satisfies` para configuraciones

```ts
const SORTS = {
  population: { label: 'Población', param: 'population' },
  name: { label: 'Nombre', param: 'name' },
} satisfies Record<string, { label: string; param: string }>;

type SortKey = keyof typeof SORTS; // 'population' | 'name'
```

Valida la forma sin perder los tipos literales.

## Si venís de Angular

<Angular>

| Angular | React + TypeScript |
| --- | --- |
| `input.required<string>()` | `name: string` en el tipo de props |
| `input<number>()` (opcional) | `population?: number` |
| `output<string>()` | `onSelect: (slug: string) => void` |
| `ElementRef<HTMLInputElement>` | `RefObject<HTMLInputElement>` |
| Componentes genéricos limitados | Componentes genéricos nativos (`function Select<T>`) |
| Tipado de plantillas con `strictTemplates` | El JSX es TypeScript: siempre estricto |

</Angular>

## Errores comunes

- **`any` en props de eventos**: perdés autocompletado y errores.
- **`useState([])` sin tipo**: queda `never[]`.
- **Duplicar a mano los tipos de la API**: se generan del contrato (4.1).
- **Props booleanas que se excluyen entre sí** (`isRent`, `isSale`): unión discriminada.

<Resumen>

- Props tipadas con `type`; nada de `React.FC`.
- `ComponentProps<'button'>` para extender elementos nativos.
- Uniones discriminadas para props que dependen entre sí.
- Componentes genéricos para listas, selects y tablas.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué evitar `React.FC`?**
Porque históricamente agregaba `children` implícito, complica los genéricos y no
aporta: alcanza con tipar las props.

**2. ¿Cómo extendés las props de un elemento HTML?**
Con `React.ComponentProps<'button'>` (o `ComponentPropsWithoutRef`) combinado
con tus props, y pasás el resto con spread.

**3. ¿Para qué sirven las uniones discriminadas en props?**
Para que ciertas props existan solo con cierto valor de otra, y que TypeScript
lo verifique tanto al usar el componente como adentro.

**4. ¿Cómo escribís un componente genérico?**
Con un parámetro de tipo en la función: `function List<T>(props: ListProps<T>)`.
TypeScript lo infiere de los `items` que le pasás.

## Glosario

| Término | Qué es |
| --- | --- |
| `ReactNode` | Todo lo que React puede dibujar. |
| `ComponentProps` | Tipo de las props de un elemento o componente. |
| Unión discriminada | Unión de tipos distinguidos por un campo literal. |
| `satisfies` | Verifica un tipo sin cambiar el tipo inferido. |
