---
title: Accesibilidad
sidebar_position: 5
description: HTML semántico, foco, teclado, ARIA cuando hace falta, formularios accesibles, mapas accesibles, anuncios en vivo y cómo probarlo con eslint, Testing Library y axe.
---

# Accesibilidad

<Tech ids={['react', 'html5', 'radixui', 'testinglibrary']} />

<Estado tipo="construye">Revisión de accesibilidad de la ficha del pueblo, el buscador y el mapa, con `eslint-plugin-jsx-a11y` y axe en Playwright.</Estado>

## Concepto

Accesibilidad (a11y) es que la app la pueda usar cualquiera: con teclado, con
lector de pantalla, con zoom, con poco contraste o en un móvil viejo. En la UE
además es obligatorio para muchos servicios desde la **Ley Europea de
Accesibilidad** (EAA, junio de 2025), y los municipios son sector público:
para ripopola no es opcional.

### Las reglas que más pesan

1. **HTML semántico primero**: `button` para acciones, `a` para navegar, `h1`
   a `h6` en orden, `nav`, `main`, `ul/li`, `label` asociado. Un `div` con
   `onClick` no es un botón: no tiene foco, ni Enter, ni rol.
2. **Todo se puede hacer con teclado**: Tab, Shift+Tab, Enter, Espacio, Escape
   y flechas en menús. El foco se ve (`focus-visible:`).
3. **Gestión del foco**: al abrir un diálogo, el foco entra; al cerrarlo,
   vuelve al botón que lo abrió. Al navegar entre páginas, Next mueve el foco y
   anuncia la ruta (route announcer).
4. **Texto alternativo**: `alt` describe la foto; las decorativas llevan `alt=""`.
5. **Contraste**: 4.5:1 para texto normal (WCAG AA).
6. **ARIA solo cuando el HTML no alcanza**: "No ARIA es mejor que mal ARIA".
   Lo usás para estado (`aria-expanded`, `aria-pressed`, `aria-invalid`),
   relaciones (`aria-controls`, `aria-describedby`) y anuncios (`aria-live`).

### Formularios

```tsx
<label htmlFor={id}>Precio máximo</label>
<input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
{error && <p id={`${id}-error`}>{error}</p>}
```

- Cada campo con su `label` (no solo `placeholder`).
- Errores conectados con `aria-describedby` y foco en el primer campo con error al enviar.

### Componentes complejos

Diálogos, menús, combobox, pestañas: **no los escribas desde cero**. Los
patrones de WAI-ARIA son largos y fáciles de romper. Usá Radix (vía shadcn) o
React Aria.

### El mapa

Un mapa es casi inaccesible por naturaleza. La solución no es "hacer accesible
el canvas" sino **ofrecer la misma información de otra forma**: la lista de
pueblos al lado del mapa, con los mismos filtros. Los marcadores clicables
deben ser botones con nombre (`aria-label="Albarracín, 1.012 habitantes"`).

## Si venís de Angular

<Angular>

Lo mismo que en Angular: el HTML es el mismo. Las diferencias son de herramientas:

| Angular | React |
| --- | --- |
| `@angular/cdk/a11y` (`FocusTrap`, `LiveAnnouncer`) | Radix / React Aria (foco en diálogos), `aria-live` |
| Reglas a11y de `angular-eslint` para plantillas | `eslint-plugin-jsx-a11y` (incluido en `eslint-config-next`) |
| `@if` que destruye el nodo | condicional en JSX (mismo efecto: el lector deja de verlo) |

</Angular>

## En ripopola

### 1. Lint

`eslint-config-next` ya incluye reglas de `jsx-a11y`. Corré:

```bash
pnpm exec nx lint web
```

### 2. Un anuncio al filtrar

```tsx
<p aria-live="polite" className="sr-only">
  {count === 0 ? 'No hay pueblos con estos filtros' : `${count} pueblos encontrados`}
</p>
```

`sr-only` (Tailwind) lo oculta visualmente pero lo deja para el lector.

### 3. Probar con Testing Library

Las consultas de Testing Library **obligan** a ser accesible: si
`getByRole('button', { name: 'Guardar Albarracín en favoritos' })` no
encuentra el botón, un lector de pantalla tampoco.

### 4. axe en Playwright (11.3)

```ts
import AxeBuilder from '@axe-core/playwright';

test('la ficha del pueblo no tiene errores de accesibilidad', async ({ page }) => {
  await page.goto('/es/pueblos/albarracin');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### 5. La prueba manual (5 minutos por pantalla)

1. Desenchufá el mouse: ¿llegás a todo con Tab? ¿se ve el foco?
2. Zoom al 200 %: ¿se rompe el layout?
3. VoiceOver (Cmd+F5 en macOS): ¿se entiende la página por sus títulos?

## Errores comunes

- **`div onClick`** en vez de `button`.
- **Quitar el outline** (`outline-none`) sin reemplazo visible.
- **Placeholder como label.**
- **`aria-label` en todo**, pisando el texto visible.
- **Diálogos hechos a mano** sin trampa de foco ni Escape.

<Resumen>

- HTML semántico primero; ARIA solo para lo que el HTML no expresa.
- Todo con teclado, foco visible y gestionado.
- Componentes complejos: Radix o React Aria.
- Para el mapa: una alternativa equivalente en lista.
- Lint + Testing Library por roles + axe + prueba manual.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué un `div` con `onClick` no es accesible?**
No recibe foco, no responde a Enter ni Espacio y no tiene rol de botón, así que
un lector de pantalla no lo anuncia como acción.

**2. ¿Cuándo usar ARIA?**
Cuando el HTML nativo no alcanza para expresar un rol, estado o relación. Mal
ARIA es peor que ninguno.

**3. ¿Qué hace `aria-live`?**
Marca una región cuyos cambios se anuncian en el lector de pantalla; `polite`
espera a que termine lo que se está leyendo.

**4. ¿Cómo haces accesible un mapa?**
Ofreciendo la misma información en un formato accesible (una lista sincronizada
con los filtros) y marcadores interactivos con nombre accesible.

**5. ¿Cómo probás la accesibilidad?**
Lint con `jsx-a11y`, pruebas por rol con Testing Library, axe en e2e y una
pasada manual con teclado y lector de pantalla.

## Glosario

| Término | Qué es |
| --- | --- |
| WCAG | Pautas de accesibilidad web (niveles A, AA, AAA). |
| EAA | Ley Europea de Accesibilidad. |
| ARIA | Atributos para describir roles, estados y relaciones. |
| Trampa de foco | Mantener el foco dentro de un diálogo abierto. |
| `sr-only` | Clase que oculta visualmente pero no al lector de pantalla. |
