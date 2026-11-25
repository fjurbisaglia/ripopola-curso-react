---
title: Contenido traducido y SEO multilingüe
sidebar_position: 3
description: Pedir a Nest el contenido en el idioma de la URL, qué mostrar si una traducción falta, cachear por idioma, hreflang y canonical por idioma, metadatos y sitemap traducidos.
---

# Contenido traducido y SEO multilingüe

<Tech ids={['nextintl', 'nextdotjs', 'nestjs']} />

<Estado tipo="construye">La ficha del pueblo en el idioma de la URL, con `hreflang`, metadatos traducidos y un sitemap con las alternativas de cada idioma.</Estado>

## Concepto

La descripción de un pueblo la escribe el ayuntamiento en un idioma y Nest
la traduce con IA al guardar (colas de BullMQ, curso de Nest). La web pide el
pueblo con el idioma de la URL y la API devuelve los campos ya traducidos.

```mermaid
flowchart LR
  U["/it/paesi/albarracin"] --> W[Web: getTown('albarracin', 'it')]
  W -- "GET /api/v1/towns/albarracin?lang=it" --> A[Nest]
  A --> T{¿Hay traducción al italiano?}
  T -- sí --> R1[campos en italiano]
  T -- "no (todavía en cola)" --> R2[campos en el original + translationPending]
```

### Para Google

Cada versión tiene que decir cuáles son sus hermanas:

```html
<link rel="canonical" href="https://ripopola.com/it/paesi/albarracin" />
<link rel="alternate" hreflang="es" href="https://ripopola.com/es/pueblos/albarracin" />
<link rel="alternate" hreflang="it" href="https://ripopola.com/it/paesi/albarracin" />
<link rel="alternate" hreflang="x-default" href="https://ripopola.com/es/pueblos/albarracin" />
```

- **canonical** apunta a sí misma (no a la versión en español): son páginas
  distintas, no duplicadas.
- **hreflang** conecta las versiones para que Google muestre la correcta a
  cada usuario.
- **x-default**: la que se muestra si ningún idioma coincide.

## Si venís de Angular

<Angular>

Con Angular SSR y un build por idioma, el `hreflang` lo agregabas a mano en
cada página con `Meta` y `DOCUMENT`. En Next sale de `generateMetadata`
(`alternates.languages`) y del sitemap.

</Angular>

## En ripopola

### 1. Pedir el pueblo en el idioma de la URL

```ts title="apps/web/features/towns/api.ts"
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { publicApi } from '@ripopola/frontend-api/server';
import { ApiError, unwrap } from '@ripopola/frontend-api';
import type { Locale } from '@/i18n/routing';

export async function getTown(slug: string, locale: Locale) {
  'use cache';
  cacheTag(`town:${slug}`, 'towns');
  cacheLife('hours');

  try {
    return unwrap(await publicApi.GET('/api/v1/towns/{slug}', {
      params: { path: { slug }, query: { lang: locale } },
    }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
```

El idioma es argumento, así que hay una entrada de caché por pueblo **y** por
idioma, y `revalidateTag('town:albarracin')` (7.4) invalida todas.

### 2. Si la traducción todavía no está

Cuando el ayuntamiento acaba de guardar, la traducción puede tardar unos
segundos. La API devuelve el texto original y un indicador:

```tsx
{town.translationPending && (
  <p lang={town.sourceLocale} className="text-sm text-muted-foreground">
    {t('translationPending')}
  </p>
)}
<div lang={town.translationPending ? town.sourceLocale : locale}>{town.description}</div>
```

- `lang` en el bloque: el lector de pantalla pronuncia bien el texto en otro idioma.
- Cuando el worker termina, Nest revalida `town:albarracin` (7.4) y la
  siguiente visita ya ve la traducción.
- Mientras tanto, la página puede llevar `robots: { index: false }` para no
  indexar una versión italiana con texto en español.

### 3. Metadatos traducidos y `hreflang`

```tsx title="apps/web/app/[locale]/(sitio)/pueblos/[slug]/page.tsx"
import { getTranslations } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/pueblos/[slug]'>) {
  const { locale, slug } = await params;
  const town = await getTown(slug, locale as Locale);
  if (!town) return {};
  const t = await getTranslations({ locale, namespace: 'Town' });

  const href = (l: Locale) => getPathname({ locale: l, href: { pathname: '/pueblos/[slug]', params: { slug } } });

  return {
    title: t('metaTitle', { name: town.name, region: town.region }),
    description: town.summary,
    alternates: {
      canonical: href(locale as Locale),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, href(l)])),
        'x-default': href(routing.defaultLocale),
      },
    },
    openGraph: { locale: locale === 'it' ? 'it_IT' : 'es_ES' },
  };
}
```

`metadataBase` en el layout raíz (6.6) convierte las rutas relativas en URLs
absolutas, como exige Google.

### 4. El sitemap con alternativas

```ts title="apps/web/app/sitemap.ts"
import type { MetadataRoute } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  const towns = await getPublishedTownSlugs();             // 'use cache' + cacheTag('towns')

  return towns.map((town) => {
    const url = (locale: (typeof routing.locales)[number]) =>
      base + getPathname({ locale, href: { pathname: '/pueblos/[slug]', params: { slug: town.slug } } });
    return {
      url: url(routing.defaultLocale),
      lastModified: town.updatedAt,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, url(l)])) },
    };
  });
}
```

### 5. Qué traducir y qué no

| Campo | ¿Se traduce? |
| --- | --- |
| Nombre del pueblo | No: "Albarracín" es Albarracín |
| Descripción, resumen, servicios | Sí (IA en Nest) |
| Slug | No en ripopola: el mismo slug en todos los idiomas (`/it/paesi/albarracin`) |
| Textos de la interfaz | Sí, mensajes (10.2) |
| Precios, fechas, distancias | Se **formatean** por idioma, no se traducen |

## Errores comunes

- **Canonical de todas las versiones a la española**: Google descarta las otras.
- **hreflang sin reciprocidad**: si `es` apunta a `it` pero `it` no a `es`, se ignora.
- **Cachear sin el idioma en la clave**: un visitante italiano ve la versión española.
- **Indexar páginas con la traducción pendiente.**
- **Texto en otro idioma sin atributo `lang`.**

<Resumen>

- La web pide el contenido con `?lang=` y la API devuelve lo traducido por IA.
- El idioma es argumento de las funciones con `'use cache'`.
- Si falta la traducción: original, `lang` correcto y sin indexar hasta que llegue.
- `alternates.canonical` + `alternates.languages` + `x-default` en cada página.
- Sitemap con las alternativas de cada idioma.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es hreflang y para qué sirve?**
Una indicación a los buscadores de qué URL corresponde a cada idioma de una
misma página, para mostrar la versión correcta a cada usuario.

**2. ¿A dónde apunta el canonical de una página traducida?**
A sí misma. Las versiones en otros idiomas no son duplicados.

**3. ¿Cómo cacheás contenido que cambia por idioma?**
Incluyendo el idioma en la clave: en Next, como argumento de la función con
`'use cache'`, y con etiquetas comunes para invalidar todos los idiomas juntos.

**4. ¿Qué hacés si un contenido todavía no está traducido?**
Mostrar el original marcado con su `lang`, avisar al usuario y no indexar esa
versión hasta que la traducción exista.

## Glosario

| Término | Qué es |
| --- | --- |
| hreflang | Atributo que relaciona versiones de una página en distintos idiomas. |
| x-default | Versión por defecto para usuarios de idiomas no contemplados. |
| Canonical | URL preferida de una página para los buscadores. |
| `getPathname` | Función de next-intl que arma la URL traducida de una ruta. |
