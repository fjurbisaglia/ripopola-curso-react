---
title: Estilos con Tailwind y shadcn/ui
sidebar_position: 8
description: Cómo se estiliza en React y Next - Tailwind CSS 4, clases condicionales con clsx y tailwind-merge, CSS Modules y shadcn/ui sobre Radix para componentes accesibles.
---

# Estilos con Tailwind y shadcn/ui

<Tech ids={['tailwindcss', 'shadcnui', 'radixui', 'nextdotjs']} />

<Estado tipo="construye">Tailwind con los colores de ripopola, la utilidad `cn()` y los primeros componentes de shadcn/ui (Button, Card, Input).</Estado>

## Concepto

React no trae una forma de estilar. Las opciones del mercado:

| Opción | Cómo es | Cuándo |
| --- | --- | --- |
| **Tailwind CSS** | Clases utilitarias en el JSX (`p-4 rounded-xl`) | La más usada hoy con React y Next. |
| **CSS Modules** | `.module.css` con clases locales al componente | Equipos que prefieren CSS clásico; viene con Next. |
| Sass | `.module.scss` | Si ya hay un sistema en SCSS. Next lo soporta instalando `sass`. |
| CSS-in-JS en runtime (styled-components, Emotion) | Estilos en JS | En retirada: no se llevan bien con Server Components. |
| Librerías de componentes (MUI, Chakra) | Componentes ya estilados | Paneles rápidos; más difíciles de personalizar. |

Para ripopola elegimos **Tailwind + shadcn/ui**: es el estándar actual en
Next, no agrega JavaScript al navegador (Tailwind genera CSS en el build) y
shadcn da componentes accesibles cuyo código es tuyo.

### Tailwind 4 en dos minutos

- Se configura en CSS, no en un `tailwind.config.js`: `@import "tailwindcss";`
  y un bloque `@theme` con tus colores y fuentes.
- Solo genera las clases que usás (escanea tu código).
- Variantes: `hover:`, `focus-visible:`, `md:` (responsive), `dark:`, `aria-pressed:`.

```css title="apps/web/app/globals.css"
@import 'tailwindcss';

@theme {
  --color-brand-50: oklch(0.97 0.02 150);
  --color-brand-600: oklch(0.52 0.13 150);
  --color-brand-700: oklch(0.45 0.12 150);
  --font-sans: var(--font-inter), system-ui, sans-serif;
}
```

Con eso existen `bg-brand-600`, `text-brand-700`, etc.

### Clases condicionales: `cn()`

```ts title="apps/web/lib/utils.ts"
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- `clsx` arma el string con condiciones: `cn('p-4', isActive && 'bg-brand-50')`.
- `tailwind-merge` resuelve conflictos: `cn('p-4', 'p-2')` → `'p-2'`. Así un
  componente acepta un `className` que pisa sus estilos por defecto.

### shadcn/ui

No es una librería que instalás como dependencia: es un **CLI que copia el
código** de cada componente a tu proyecto (`components/ui/button.tsx`). Por
debajo usa **Radix UI** (comportamiento accesible: foco, teclado, ARIA) y
Tailwind (estilo). Lo editás como cualquier componente tuyo.

```bash
cd apps/web
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label
```

## Si venís de Angular

<Angular>

| Angular | React / Next |
| --- | --- |
| Estilos encapsulados por componente (`styleUrl`, emulación con atributos) | No hay encapsulación: Tailwind (clases utilitarias) o CSS Modules (clases con hash) |
| `[class.x]="cond"` / `[ngClass]` | `cn('base', cond && 'x')` |
| `:host` | El elemento raíz del componente, estilado con sus clases |
| Angular Material / CDK | shadcn/ui sobre Radix (o MUI) |
| SCSS + BEM | Tailwind; o CSS Modules si querés seguir con SCSS |

Si extrañás SCSS y BEM, `town-card.module.scss` funciona igual en Next; lo
que no vas a tener es la encapsulación automática de Angular.

</Angular>

## En ripopola

### 1. Un botón con variantes

shadcn genera `components/ui/button.tsx` con `class-variance-authority`
(`cva`), que define variantes tipadas:

```tsx
const buttonVariants = cva('inline-flex items-center rounded-md text-sm font-medium focus-visible:outline-2', {
  variants: {
    variant: {
      default: 'bg-brand-600 text-white hover:bg-brand-700',
      outline: 'border bg-white hover:bg-slate-50',
      ghost: 'hover:bg-slate-100',
    },
    size: { default: 'h-9 px-4', sm: 'h-8 px-3', lg: 'h-10 px-6' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
```

Uso: `<Button variant="outline" size="sm">Ver en el mapa</Button>`.

### 2. La tarjeta con `Card`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card className="overflow-hidden">
  <CardHeader>
    <CardTitle>{name}</CardTitle>
  </CardHeader>
  <CardContent className="text-sm text-slate-600">{region}</CardContent>
</Card>
```

### 3. El patrón `asChild`

Los componentes de Radix aceptan `asChild`: en vez de dibujar su propio
`button`, le pasan comportamiento y estilos a su hijo. Sirve para que un
enlace se vea como botón sin anidar `<button><a>` (HTML inválido):

```tsx
<Button asChild>
  <Link href="/pueblos/albarracin">Ver pueblo</Link>
</Button>
```

## Errores comunes

- **Armar clases dinámicas con strings** (`` `bg-${color}-600` ``): Tailwind no
  las ve al escanear y no las genera. Usá un mapa con las clases completas.
- **Pisar estilos sin `tailwind-merge`**: `p-4 p-2` depende del orden del CSS, no del orden en el string.
- **Instalar shadcn y no leer el código**: es tuyo, adaptalo (colores, tamaños, textos).
- **Clases de 200 caracteres en todos lados**: extraé componentes, no `@apply`.

<Resumen>

- Ripopola usa Tailwind 4 (configurado en CSS con `@theme`) y shadcn/ui.
- `cn()` = `clsx` para condiciones + `tailwind-merge` para conflictos.
- shadcn copia componentes a tu proyecto; Radix pone la accesibilidad.
- Nada de clases construidas con interpolación.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué Tailwind se volvió el estándar con React y Next?**
Porque estiliza sin salir del componente, genera solo el CSS usado, no agrega
JavaScript en el navegador y funciona con Server Components.

**2. ¿Por qué el CSS-in-JS en runtime perdió terreno?**
Porque inyecta estilos con JavaScript en el render, lo que no funciona en
Server Components y suma costo en el cliente.

**3. ¿Qué es shadcn/ui y en qué se diferencia de MUI?**
Un generador que copia componentes (Radix + Tailwind) a tu código. MUI es una
dependencia con su sistema de estilos. Con shadcn el código es tuyo y lo modificás libremente.

**4. ¿Para qué sirve `tailwind-merge`?**
Para resolver clases de Tailwind que chocan, quedándose con la última. Permite
que un componente acepte `className` y lo pise de forma predecible.

**5. ¿Por qué Tailwind no genera `bg-${color}-500`?**
Porque detecta las clases leyendo el código como texto; una clase armada en
runtime no aparece completa en el fuente.

## Glosario

| Término | Qué es |
| --- | --- |
| Clase utilitaria | Clase que aplica una sola propiedad (`p-4`). |
| `@theme` | Bloque de Tailwind 4 para definir tokens de diseño. |
| `cva` | Librería para definir variantes de estilos tipadas. |
| Radix UI | Primitivas accesibles sin estilos. |
| `asChild` | Patrón de Radix para pasarle comportamiento al hijo. |
