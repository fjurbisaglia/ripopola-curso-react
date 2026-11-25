---
title: Rutas por idioma con next-intl
sidebar_position: 1
description: Internacionalizar la web de ripopola con next-intl 4 - el segmento [locale], defineRouting con rutas traducidas (/es/pueblos, /it/paesi), el proxy que detecta el idioma, la navegación con createNavigation y el selector de idioma.
---

# Rutas por idioma con next-intl

<Tech ids={['nextintl', 'nextdotjs', 'typescript']} />

<Estado tipo="construye">La web con `/es/...` e `/it/...`, rutas traducidas, detección del idioma en `proxy.ts` y un selector de idioma.</Estado>

## Concepto

Una web multilingüe que quiere posicionar en Google necesita **una URL por
idioma**: `ripopola.com/es/pueblos/albarracin` y
`ripopola.com/it/paesi/albarracin` son dos páginas, cada una indexable, con su
`<html lang>` y sus metadatos. Detectar el idioma solo por el navegador (y
servir todo en `/pueblos`) confunde a los buscadores y no se puede compartir.

**next-intl** resuelve las tres partes:

| Parte | Pieza de next-intl |
| --- | --- |
| Qué idiomas hay y cómo son las URLs | `defineRouting` |
| Elegir idioma al entrar a `/` y recordar la elección | `createMiddleware` dentro de `proxy.ts` |
| Links y redirects que respetan el idioma | `createNavigation` |
| Los textos | `useTranslations` / `getTranslations` (10.2) |

### Cómo se elige el idioma

Al entrar a `ripopola.com/` sin prefijo, el proxy decide en este orden:

1. La cookie `NEXT_LOCALE` (si el usuario eligió antes).
2. La cabecera `Accept-Language` del navegador.
3. El idioma por defecto (`es`).

Y redirige a `/es` o `/it`. Si la URL ya trae prefijo, manda la URL.

## Si venís de Angular

<Angular>

| Angular | next-intl |
| --- | --- |
| `@angular/localize`: un build por idioma | Un solo build; el idioma es un segmento `[locale]` |
| `ngx-translate` / Transloco en runtime | `useTranslations` (más cercano a Transloco) |
| `baseHref` por idioma (`/es/`, `/it/`) | Prefijo de idioma en las rutas |
| Rutas traducidas: a mano | `pathnames` en `defineRouting` |

</Angular>

## En ripopola

### 1. Instalar

```bash
pnpm add -E next-intl --filter web
```

```ts title="apps/web/next.config.ts"
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();   // busca ./i18n/request.ts

const nextConfig: NextConfig = { /* ... lo de antes ... */ };
export default withNextIntl(nextConfig);
```

### 2. El ruteo

```ts title="apps/web/i18n/routing.ts"
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'it'],
  defaultLocale: 'es',
  localePrefix: 'always',            // /es/... y /it/..., también para el idioma por defecto
  pathnames: {
    '/': '/',
    '/pueblos': { es: '/pueblos', it: '/paesi' },
    '/pueblos/[slug]': { es: '/pueblos/[slug]', it: '/paesi/[slug]' },
    '/pueblos/[slug]/viviendas': { es: '/pueblos/[slug]/viviendas', it: '/paesi/[slug]/alloggi' },
    '/mapa': { es: '/mapa', it: '/mappa' },
    '/privacidad': { es: '/privacidad', it: '/privacy' },
  },
});

export type Locale = (typeof routing.locales)[number];
```

- Las **carpetas** siguen en español (`app/[locale]/pueblos/[slug]`): las
  claves de `pathnames` son las rutas internas. next-intl reescribe
  `/it/paesi/...` a la carpeta `pueblos` por debajo.
- `localePrefix: 'always'`: todas las URLs tienen idioma. Más simple para
  SEO y para la caché.

### 3. La configuración por petición

```ts title="apps/web/i18n/request.ts"
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;                         // viene del segmento [locale]
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Madrid',
  };
});
```

### 4. El proxy

```ts title="apps/web/proxy.ts"
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Todo menos api, internal, archivos de Next y archivos con extensión
  matcher: ['/((?!api|internal|_next|_vercel|.*\\..*).*)'],
};
```

El nombre del archivo es `proxy.ts` (Next 16); lo que exporta next-intl se
sigue llamando `createMiddleware`. Exportarlo como `default` funciona igual
que una función `proxy`.

### 5. Mover todo bajo `[locale]`

```
apps/web/app/
  [locale]/
    layout.tsx          ← ahora es el layout raíz: <html lang={locale}>
    (sitio)/...
    (legal)/...
  internal/...          ← los Route Handlers quedan afuera
  robots.ts, sitemap.ts
```

```tsx title="apps/web/app/[locale]/layout.tsx"
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);            // permite prerenderizar sin leer cabeceras

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- `generateStaticParams` con los idiomas: cada página se prerenderiza una vez
  por idioma.
- **`setRequestLocale`** guarda el idioma para el resto del render. Sin esto,
  next-intl lo leería de las cabeceras y la página dejaría de ser estática.
  Llamalo también al principio de cada `page.tsx` (y de cada layout) que use
  traducciones, con el `locale` de sus `params`.
- `NextIntlClientProvider` sin props: en next-intl 4 hereda el idioma y los
  mensajes del servidor para los componentes de cliente.

:::info Next 16 y Cache Components
Dentro de una función o componente con `'use cache'`, pasá el idioma
**como argumento** (por ejemplo `getTown(slug, locale)` y
`getTranslations({ locale, namespace: 'Town' })`): así forma parte de la
clave de la caché y no depende del contexto de la petición. Revisá la guía de
next-intl para Cache Components de tu versión exacta: es una integración que
todavía se mueve.
:::

### 6. La navegación

```ts title="apps/web/i18n/navigation.ts"
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

A partir de acá, **los links se importan de `@/i18n/navigation`**, no de
`next/link`:

```tsx
import { Link } from '@/i18n/navigation';

<Link href={{ pathname: '/pueblos/[slug]', params: { slug: town.slug } }}>{town.name}</Link>
// en italiano renderiza /it/paesi/albarracin
```

Con `pathnames`, los `href` están tipados: una ruta que no existe no compila.

### 7. El selector de idioma

```tsx title="apps/web/components/locale-switcher.tsx"
'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const NAMES: Record<Locale, string> = { es: 'Español', it: 'Italiano' };

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();      // la ruta interna: '/pueblos/[slug]'
  const params = useParams();

  return (
    <label>
      <span className="sr-only">Idioma</span>
      <select
        value={locale}
        onChange={(e) =>
          // @ts-expect-error: params coincide con la ruta actual
          router.replace({ pathname, params }, { locale: e.target.value as Locale })
        }
      >
        {routing.locales.map((l) => <option key={l} value={l} lang={l}>{NAMES[l]}</option>)}
      </select>
    </label>
  );
}
```

Cambiar de idioma con el selector guarda la cookie `NEXT_LOCALE`: la próxima
vez que entre a `/`, va directo a su idioma.

### 8. El panel

El panel no necesita URLs por idioma (no se indexa). Usa next-intl **sin
ruteo**: el idioma sale de la preferencia del usuario (una cookie que se
escribe al elegirlo en su perfil) y `i18n/request.ts` la lee con `cookies()`.
Sin `[locale]`, sin proxy de idiomas.

## Errores comunes

- **Importar `Link` de `next/link`** en la web: pierde el prefijo del idioma.
- **Olvidar `setRequestLocale`** en una página: deja de ser estática.
- **Matcher del proxy que intercepta `/internal/*`** o archivos estáticos.
- **`<html lang>` fijo en `es`**: los lectores de pantalla leen el italiano
  con pronunciación española.
- **Traducir las carpetas** en vez de usar `pathnames`: duplicás páginas.
- **Usar el idioma del navegador sin URL propia**: no indexable.

<Resumen>

- Una URL por idioma: `/es/pueblos`, `/it/paesi`.
- `defineRouting` (idiomas y rutas traducidas), `createMiddleware` en `proxy.ts`, `createNavigation` para links.
- `[locale]` como layout raíz con `generateStaticParams`, `hasLocale`, `setRequestLocale` y `<html lang>`.
- Con `'use cache'`, el idioma va como argumento.
- El panel usa next-intl sin ruteo, con el idioma del usuario.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué una URL por idioma y no detectar el idioma del navegador?**
Porque cada idioma tiene que ser indexable y compartible por separado;
detectar solo por el navegador sirve contenido distinto en la misma URL.

**2. ¿Cómo decide el proxy el idioma al entrar a `/`?**
Primero la cookie con la elección previa, después `Accept-Language` y por
último el idioma por defecto; luego redirige a la URL con prefijo.

**3. ¿Qué hace `setRequestLocale` y por qué importa?**
Le dice a next-intl el idioma del render actual para que no tenga que leer
cabeceras; así las páginas se pueden prerenderizar.

**4. ¿Cómo traducís las URLs sin duplicar carpetas?**
Con `pathnames`: las carpetas usan un nombre interno y la librería mapea cada
URL traducida a esa ruta.

## Glosario

| Término | Qué es |
| --- | --- |
| Locale | Código de idioma (y región) como `es` o `it-IT`. |
| `localePrefix` | Si las URLs llevan el idioma y cuándo. |
| `pathnames` | Mapa de rutas internas a URLs traducidas. |
| `Accept-Language` | Cabecera con los idiomas preferidos del navegador. |
| `NEXT_LOCALE` | Cookie donde next-intl recuerda la elección. |
