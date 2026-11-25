---
title: JSX
sidebar_position: 3
description: Qué es JSX, cómo se compila, expresiones, atributos, fragmentos, condicionales y por qué no es HTML, con la tarjeta de pueblo de ripopola.
---

# JSX

<Tech ids={['react', 'typescript']} />

<Estado tipo="construye">El componente `TownCard` (tarjeta de pueblo) con datos de ejemplo.</Estado>

## Concepto

JSX es azúcar sintáctica: cada etiqueta se compila a una llamada de función
que crea un **elemento de React** (un objeto que describe qué dibujar).

```tsx
<h3 className="title">{town.name}</h3>
// se compila (más o menos) a:
jsx('h3', { className: 'title', children: town.name })
```

Por eso en JSX vale **cualquier expresión de JavaScript** entre llaves, pero
no sentencias (`if`, `for`): las llaves esperan un valor.

### Reglas que cambian respecto de HTML

| HTML | JSX | Por qué |
| --- | --- | --- |
| `class` | `className` | `class` es palabra reservada en JS. |
| `for` | `htmlFor` | Ídem. |
| `onclick="..."` | `onClick={fn}` | Los eventos reciben funciones, en camelCase. |
| `style="color: red"` | `style={{ color: 'red' }}` | `style` es un objeto (llaves dobles: expresión + objeto). |
| `<img>` | `<img />` | Toda etiqueta se cierra. |
| Varios elementos sueltos | Un solo padre o un **fragmento** `<>...</>` | Una función devuelve un solo valor. |
| `tabindex`, `aria-label` | `tabIndex`, `aria-label` | Atributos DOM en camelCase; `aria-*` y `data-*` quedan igual. |

### Qué se dibuja y qué no

- Strings y números se muestran.
- `null`, `undefined`, `true` y `false` **no dibujan nada**: por eso funciona `cond && <X />`.
- Ojo con `0`: `{count && <X />}` dibuja un `0` si `count` es 0. Usá `count > 0 && ...`.
- Los arrays de elementos se dibujan uno tras otro (cada uno con `key`, tema 1.7).

### Condicionales

```tsx
{town.isPremium && <Badge>Destacado</Badge>}
{town.population ? <p>{town.population} hab.</p> : <p>Población sin datos</p>}
```

Para lógica más larga, calculá una variable antes del `return` o extraé un
componente. Un ternario anidado dentro del JSX es difícil de leer.

### Seguridad: JSX escapa el texto

Todo lo que ponés entre llaves se **escapa**: si el municipio escribe
`<script>` en la descripción, se muestra como texto. La única forma de
insertar HTML crudo es `dangerouslySetInnerHTML` (tema 11.5).

## Si venís de Angular

<Angular>

| Plantilla de Angular | JSX |
| --- | --- |
| `{{ town.name }}` | `{town.name}` |
| `[src]="town.photo"` | `src={town.photo}` |
| `(click)="select()"` | `onClick={select}` o `onClick={() => select(town.id)}` |
| `@if (cond) { ... } @else { ... }` | `cond ? <A /> : <B />` |
| `@for (t of towns; track t.id)` | `towns.map(t => <TownCard key={t.id} ... />)` |
| `<ng-container>` | `<>...</>` (fragmento) |
| `[class.active]="isActive"` | `` className={`card ${isActive ? 'card--active' : ''}`} `` o `clsx` |
| Pipes (`| date`) | Funciones normales (`formatDate(d)`) o `Intl` |

En Angular la plantilla es un lenguaje aparte que el compilador entiende. En
React no hay plantilla: es TypeScript, así que tenés autocompletado, tipos y
refactors en todo el JSX.

</Angular>

## En ripopola: la tarjeta de pueblo

`apps/web/components/towns/town-card.tsx`:

```tsx
type TownCardProps = {
  name: string;
  region: string;
  population?: number;
  photoUrl?: string;
  isPremium?: boolean;
};

const numberFormat = new Intl.NumberFormat('es-ES');

export function TownCard({ name, region, population, photoUrl, isPremium = false }: TownCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {photoUrl ? (
        <img src={photoUrl} alt={`Vista de ${name}`} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-500">Sin foto</div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold">
          {name} {isPremium && <span className="ml-2 rounded bg-amber-100 px-2 text-xs">Destacado</span>}
        </h3>
        <p className="text-sm text-slate-600">{region}</p>
        {population !== undefined && <p className="mt-2 text-sm">{numberFormat.format(population)} habitantes</p>}
      </div>
    </article>
  );
}
```

Usalo en `/laboratorio`:

```tsx
<TownCard name="Albarracín" region="Teruel, Aragón" population={1012} isPremium />
```

:::info `img` o `next/image`
Por ahora usamos `<img>` para no mezclar temas. En el 6.7 lo cambiamos por
`next/image`, que optimiza tamaño y formato.
:::

Fijate que `TownCard` **no** tiene `'use client'`: no usa estado ni eventos,
así que puede ser un componente de servidor y no suma JavaScript al navegador.

## Errores comunes

- **`{count && ...}` muestra un 0** cuando `count` es 0.
- **Olvidar el fragmento** al devolver dos elementos hermanos.
- **`onClick={select(town.id)}`**: llama a la función en el render. Va `onClick={() => select(town.id)}`.
- **Usar `class`**: funciona con advertencia, pero es `className`.

<Resumen>

- JSX se compila a llamadas que crean elementos (objetos).
- Entre llaves van expresiones, no sentencias.
- `null`, `false` y `undefined` no dibujan nada; `0` sí.
- El texto se escapa siempre: JSX protege de XSS por defecto.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es JSX y en qué se convierte?**
Sintaxis de etiquetas dentro de JavaScript. El compilador la transforma en
llamadas (`jsx()`) que devuelven elementos de React, objetos que describen la UI.

**2. ¿Por qué no se puede usar `if` dentro de JSX?**
Porque las llaves esperan una expresión que produzca un valor. Se usa ternario,
`&&` o se calcula antes del `return`.

**3. ¿Qué problema tiene `{items.length && <List />}`?**
Si `length` es 0 dibuja un "0". Hay que usar una condición booleana: `items.length > 0 &&`.

**4. ¿JSX protege de XSS?**
Sí, escapa todo el texto que se interpola. El riesgo aparece con
`dangerouslySetInnerHTML`, URLs `javascript:` en `href` o al inyectar HTML sin sanitizar.

**5. ¿Qué es un fragmento y para qué sirve?**
`<>...</>` agrupa varios elementos sin agregar un nodo al DOM. Con `key` se usa
la forma larga `<Fragment key={...}>`.

## Glosario

| Término | Qué es |
| --- | --- |
| Elemento de React | Objeto inmutable que describe un nodo de UI. |
| Fragmento | Agrupador sin nodo en el DOM. |
| Expresión | Código que produce un valor (lo único válido entre llaves). |
| Escapar | Convertir caracteres especiales para que se muestren como texto. |
