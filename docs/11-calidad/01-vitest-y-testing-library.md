---
title: Pruebas de componentes con Vitest y Testing Library
sidebar_position: 1
description: La pirámide de pruebas del frontend, Vitest en el monorepo Nx, Testing Library y su filosofía (probar como usa el usuario), consultas por rol, user-event, qué probar y qué no, y qué hacer con los Server Components async.
---

# Pruebas de componentes con Vitest y Testing Library

<Tech ids={['vitest', 'testinglibrary', 'react', 'nx']} />

<Estado tipo="construye">Vitest configurado en `web` y `panel`, y las primeras pruebas: la tarjeta del pueblo, el botón de favoritos y las funciones puras.</Estado>

## Concepto

### Qué probar en cada nivel

| Nivel | Herramienta | Qué cubre en ripopola | Cuántas |
| --- | --- | --- | --- |
| Unitarias | Vitest | Funciones puras: `safeRedirect`, `can()`, esquemas de Zod, reducers | Muchas, milisegundos |
| Componentes | Vitest + Testing Library | Un componente o un formulario con la API simulada (11.2) | Bastantes |
| End to end | Playwright | Flujos completos en el navegador real (11.3) | Pocas, los caminos críticos |
| Tipos | TypeScript | Contrato con la API (OpenAPI) | Siempre |

Kent C. Dodds lo resumió como el **testing trophy**: lo que más rinde son las
pruebas de integración de componentes, porque se parecen a cómo se usa la app
y no se rompen con cada refactor.

### La filosofía de Testing Library

> Cuanto más se parezcan tus pruebas a la forma en que se usa el software,
> más confianza te dan.

- Buscás elementos **como los encuentra un usuario**: por rol y nombre
  accesible, por etiqueta, por texto. No por clase CSS ni por estructura.
- No probás detalles de implementación (estado interno, cuántas veces se
  renderizó, nombres de funciones).
- Si no podés encontrar algo por rol, probablemente tampoco lo encuentra un
  lector de pantalla (3.5): las pruebas empujan la accesibilidad.

Prioridad de consultas, de mejor a peor: `getByRole`, `getByLabelText`,
`getByPlaceholderText`, `getByText`, `getByDisplayValue`, `getByAltText`,
`getByTitle` y, como último recurso, `getByTestId`.

| Variante | Si no está | Para |
| --- | --- | --- |
| `getBy...` | Tira error | Lo que tiene que estar |
| `queryBy...` | Devuelve `null` | Comprobar que **no** está |
| `findBy...` | Espera (promesa) | Lo que aparece después de algo asíncrono |

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| Karma/Jasmine (o Jest), ahora Vitest también en Angular | Vitest |
| `TestBed.configureTestingModule` | `render(<Componente />)`, sin módulo |
| `fixture.detectChanges()` | No hace falta: React actualiza solo; esperás con `findBy` |
| `By.css('.boton')` | `screen.getByRole('button', { name: 'Publicar' })` |
| Angular Testing Library | Es la misma familia: si la usaste, ya la sabés |
| `HttpTestingController` | MSW (11.2) |

</Angular>

## En ripopola

### 1. Instalar y configurar

```bash
pnpm add -D -E vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vite-tsconfig-paths
```

```ts title="apps/web/vitest.config.mts"
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
```

```ts title="apps/web/vitest.setup.ts"
import '@testing-library/jest-dom/vitest';   // toBeInTheDocument, toHaveAccessibleName...
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

En el `project.json` de cada app, un target `test` con `vitest run`
(el plugin `@nx/vite` lo puede inferir solo). Lo mismo para el panel y para
las librerías de `libs/frontend`.

`vite-tsconfig-paths` hace que `@/` y `@ripopola/*` funcionen igual que en Next.

### 2. Una función pura

```ts title="libs/frontend/auth/src/safe-redirect.test.ts"
import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it.each([
    ['/viviendas', '/viviendas'],
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['/\\evil.com', '/'],
    [null, '/'],
  ])('%s → %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });
});
```

### 3. Un componente

```tsx title="apps/web/components/towns/town-card.test.tsx"
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TownCard } from './town-card';

describe('TownCard', () => {
  it('muestra el nombre como encabezado y el enlace a la ficha', () => {
    render(<TownCard town={{ slug: 'albarracin', name: 'Albarracín', population: 1018, region: 'Aragón' }} />);

    expect(screen.getByRole('heading', { name: 'Albarracín' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /albarracín/i })).toHaveAttribute('href', '/pueblos/albarracin');
  });
});
```

### 4. Interacción con user-event

```tsx title="apps/web/components/towns/favorite-button.test.tsx"
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { FavoriteButton } from './favorite-button';

it('alterna el favorito y lo anuncia con aria-pressed', async () => {
  const user = userEvent.setup();
  render(<FavoriteButton townSlug="albarracin" />);

  const button = screen.getByRole('button', { name: /favorito/i });
  expect(button).toHaveAttribute('aria-pressed', 'false');

  await user.click(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
});
```

- **`userEvent` y no `fireEvent`**: simula la secuencia real (foco, `pointerdown`,
  `mouseup`, `click`, teclado) como un usuario.
- Si el componente usa Zustand con persistencia (4.4), reseteá el store en
  un `beforeEach` para que las pruebas no se contaminen.

### 5. Componentes con contexto o proveedores

Un helper que envuelve con lo que la app pone en el layout:

```tsx title="apps/web/test/render.tsx"
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/es.json';

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="es" messages={messages} timeZone="Europe/Madrid">
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
    options,
  );
}
```

`retry: false`: si no, una consulta que falla a propósito tarda segundos en
reintentar.

### 6. Lo que Vitest no prueba bien

- **Server Components `async`**: React Testing Library todavía no los
  renderiza. Probá la lógica (las funciones que piden datos) por separado, y
  la página entera con Playwright.
- **`next/navigation`** (`useRouter`, `useSearchParams`): mockealo con
  `vi.mock('next/navigation', ...)` o, mejor, sacá la lógica a una función y
  probá esa.
- **El mapa de MapLibre**: usa WebGL, que jsdom no tiene. Probá las funciones
  que arman las capas (`layers.ts`) y dejá el mapa para Playwright.

### 7. Un test de traducciones

```ts title="apps/web/messages/messages.test.ts"
import { expect, it } from 'vitest';
import es from './es.json';
import it_ from './it.json';

const keys = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

it('italiano tiene las mismas claves que español', () => {
  expect(keys(it_).sort()).toEqual(keys(es).sort());
});
```

## Errores comunes

- **Buscar por clase o `data-testid`** cuando hay un rol y un nombre.
- **Probar el estado interno** (`useState`) en vez de lo que se ve.
- **`getBy` para comprobar que algo no está**: usá `queryBy` + `not.toBeInTheDocument()`.
- **No esperar lo asíncrono**: `findBy` o `waitFor`, nunca `setTimeout`.
- **Snapshots enormes**: se aprueban sin mirar y no prueban nada.
- **Querer renderizar un Server Component async** con Testing Library.

<Resumen>

- Vitest + Testing Library + user-event + jest-dom, configurado por app en Nx.
- Consultas por rol y nombre accesible; `getBy`, `queryBy` y `findBy` según el caso.
- Probar lo que el usuario ve y hace, no la implementación.
- Un helper con los proveedores de la app.
- Server Components async, navegación y WebGL: lógica aparte y Playwright.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué filosofía sigue Testing Library?**
Probar como usa el usuario: buscar elementos por rol, etiqueta o texto e
interactuar con eventos reales, sin depender de la implementación.

**2. ¿Diferencia entre `getBy`, `queryBy` y `findBy`?**
`getBy` tira si no encuentra; `queryBy` devuelve `null` (para comprobar
ausencia); `findBy` devuelve una promesa que espera a que aparezca.

**3. ¿Por qué `userEvent` en vez de `fireEvent`?**
Porque simula la secuencia completa de eventos que genera una persona (foco,
puntero, teclado), no un evento suelto.

**4. ¿Cómo probás un Server Component async?**
Separando la lógica en funciones que se prueban con Vitest y cubriendo el
render completo con pruebas end to end.

**5. ¿Qué es el testing trophy?**
Una forma de repartir pruebas que prioriza las de integración (componentes con
sus dependencias reales o simuladas en la red) sobre las unitarias aisladas.

## Glosario

| Término | Qué es |
| --- | --- |
| Vitest | Runner de pruebas compatible con Vite, rápido y con API tipo Jest. |
| jsdom | Implementación del DOM en Node para pruebas. |
| Testing Library | Utilidades para probar componentes como los usa una persona. |
| user-event | Librería que simula interacciones reales. |
| jest-dom | Matchers para el DOM (`toBeInTheDocument`, `toHaveAttribute`). |
