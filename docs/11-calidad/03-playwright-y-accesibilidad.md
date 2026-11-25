---
title: Pruebas end to end con Playwright y axe
sidebar_position: 3
description: Playwright en el monorepo, levantar web, panel y API para las pruebas, locators por rol, el login una sola vez con storageState, los caminos críticos de ripopola, accesibilidad automática con axe y trazas para depurar.
---

# Pruebas end to end con Playwright y axe

<Tech ids={['playwright', 'nextdotjs', 'githubactions']} />

<Estado tipo="construye">Las pruebas de los caminos críticos: buscar y abrir un pueblo en la web (en los dos idiomas), y entrar al panel y publicar una vivienda. Con axe en cada página.</Estado>

## Concepto

Una prueba **end to end** abre un navegador real (Chromium, Firefox, WebKit)
contra la app compilada y hace lo que haría una persona. Es la única que
prueba de verdad los Server Components, el proxy, las cookies, los rewrites y
la hidratación juntos.

Son lentas y frágiles comparadas con las de Vitest: se escriben **pocas**, para
los caminos que, si se rompen, rompen el negocio.

| Camino crítico | App |
| --- | --- |
| Entrar a `/`, ir a `/es`, buscar, abrir una ficha | web |
| La ficha en italiano con su URL traducida | web |
| Login → ver viviendas → publicar una | panel |
| Sin sesión, `/viviendas` manda al login con `next` | panel |

### Lo que hace a Playwright robusto

- **Auto-waiting**: antes de hacer clic espera a que el elemento sea visible,
  estable y esté habilitado. Casi nunca hace falta esperar a mano.
- **Assertions que reintentan**: `await expect(locator).toBeVisible()` reintenta
  hasta el timeout.
- **Locators por rol**, como en Testing Library.
- **Aislamiento**: cada prueba tiene su contexto de navegador (cookies propias).

## Si venís de Angular

<Angular>

Protractor murió; en Angular se usa Cypress o Playwright. Si usaste
Cypress: Playwright corre fuera del navegador (no dentro de él), soporta
varias pestañas y dominios, y es `async/await` normal en vez de comandos
encadenados.

</Angular>

## En ripopola

### 1. Instalar

```bash
pnpm add -D -E @playwright/test @axe-core/playwright
pnpm exec playwright install --with-deps chromium
```

Con Nx, `pnpm exec nx g @nx/playwright:configuration --project=web-e2e` arma
un proyecto `apps/web-e2e`. La configuración importante:

```ts title="apps/web-e2e/playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',          // trazas solo cuando algo falla y se reintenta
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm nx start web',     // el build de producción, no `dev`
    url: 'http://localhost:4200/internal/health',
    reuseExistingServer: !process.env.CI,
  },
});
```

- **Contra el build** (`next start`): en `dev` todo compila a pedido y las
  pruebas son lentas y distintas a producción.
- La **API de Nest** también tiene que estar arriba, con una base de datos
  de prueba con datos conocidos (*seed*). En CI se levanta con Docker Compose
  antes de las pruebas (12.4).

### 2. La web: buscar y abrir un pueblo

```ts title="apps/web-e2e/src/buscar-pueblo.spec.ts"
import { expect, test } from '@playwright/test';

test('buscar un pueblo y abrir su ficha', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/es$/);                  // el proxy eligió español

  await page.getByRole('searchbox', { name: /buscar/i }).fill('albarr');
  await page.getByRole('link', { name: /albarracín/i }).click();

  await expect(page).toHaveURL('/es/pueblos/albarracin');
  await expect(page.getByRole('heading', { level: 1, name: 'Albarracín' })).toBeVisible();
  await expect(page).toHaveTitle(/Albarracín/);
});

test('la ficha en italiano', async ({ page }) => {
  await page.goto('/it/paesi/albarracin');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('link[hreflang="es"]')).toHaveAttribute('href', /\/es\/pueblos\/albarracin$/);
});
```

### 3. El panel: login una sola vez

Hacer login en cada prueba es lento. Un proyecto de *setup* lo hace una vez y
guarda las cookies:

```ts title="apps/panel-e2e/src/auth.setup.ts"
import { expect, test as setup } from '@playwright/test';

setup('login del editor de pruebas', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill('editor@test.ripopola.com');
  await page.getByLabel('Contraseña').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('navigation', { name: /panel/i })).toBeVisible();
  await page.context().storageState({ path: '.auth/editor.json' });
});
```

```ts title="apps/panel-e2e/playwright.config.ts (projects)"
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'panel', use: { ...devices['Desktop Chrome'], storageState: '.auth/editor.json' }, dependencies: ['setup'] },
],
```

`.auth/` va al `.gitignore`: tiene una cookie de sesión válida. El usuario de
pruebas lo crea el *seed* de la base, con el correo ya verificado y sin 2FA.

```ts title="apps/panel-e2e/src/proteccion.spec.ts"
test.use({ storageState: { cookies: [], origins: [] } });   // esta prueba, sin sesión

test('sin sesión, el panel manda al login y vuelve', async ({ page }) => {
  await page.goto('/viviendas');
  await expect(page).toHaveURL('/login?next=%2Fviviendas');
});
```

### 4. Accesibilidad automática con axe

```ts title="apps/web-e2e/src/a11y.spec.ts"
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/es', '/es/pueblos', '/es/pueblos/albarracin', '/it/paesi/albarracin']) {
  test(`sin violaciones de accesibilidad en ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .exclude('.maplibregl-canvas')                  // el mapa tiene su alternativa en lista (5.2)
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

axe detecta cerca de un tercio de los problemas (contraste, etiquetas,
roles, `lang`). El resto, como el orden del foco o que un texto tenga sentido,
requiere probar con teclado y lector de pantalla (3.5).

### 5. Depurar

- `pnpm exec playwright test --ui`: modo interactivo, paso a paso.
- `pnpm exec playwright codegen localhost:4200`: graba lo que hacés y escribe los locators.
- **Trazas**: con `trace: 'on-first-retry'`, la prueba fallida en CI deja un
  `trace.zip`; `pnpm exec playwright show-trace trace.zip` muestra cada paso
  con capturas, red y consola.

## Errores comunes

- **`page.waitForTimeout(2000)`**: frágil y lento. Esperá un estado con `expect`.
- **Selectores CSS** (`.btn-primary`): se rompen con cada cambio de estilos.
- **Pruebas que dependen de otras** (una crea la vivienda que la siguiente publica).
- **Probarlo todo end to end**: suite lenta y frágil. Los detalles, en Vitest.
- **Correr contra `next dev`.**
- **Subir `.auth/` a git.**

<Resumen>

- Playwright contra el build de producción, con la API y una base de prueba.
- Pocas pruebas, para los caminos críticos de la web y del panel.
- Locators por rol, auto-waiting y assertions que reintentan.
- Login una vez con un proyecto de setup y `storageState`.
- axe en cada página importante; trazas para depurar en CI.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué probás end to end y qué con pruebas de componentes?**
End to end, los caminos críticos de punta a punta (login, compra, publicación);
las variantes y los detalles, en pruebas de componentes, que son más rápidas.

**2. ¿Cómo evitás pruebas frágiles en Playwright?**
Locators por rol y texto, assertions que esperan estados en vez de tiempos
fijos, pruebas independientes y datos de prueba conocidos.

**3. ¿Cómo evitás hacer login en cada prueba?**
Con un paso de setup que hace login una vez y guarda el estado del navegador
(`storageState`), que las demás pruebas reutilizan.

**4. ¿Alcanza con axe para la accesibilidad?**
No. Detecta problemas automáticos como contraste o etiquetas; el resto requiere
pruebas manuales con teclado y lector de pantalla.

## Glosario

| Término | Qué es |
| --- | --- |
| End to end | Prueba de la app completa en un navegador real. |
| Locator | Forma de Playwright de encontrar elementos, que se reevalúa al usarse. |
| Auto-waiting | Espera automática a que un elemento sea accionable. |
| `storageState` | Cookies y almacenamiento guardados para reutilizar una sesión. |
| Trace | Registro paso a paso de una prueba con capturas y red. |
| axe | Motor de reglas de accesibilidad automáticas. |
