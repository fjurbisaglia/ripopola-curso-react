---
title: Metadata y SEO
sidebar_position: 6
description: metadata y generateMetadata, plantillas de título, canonical, Open Graph e imágenes generadas, sitemap.xml, robots.txt, datos estructurados JSON-LD y qué no indexar en ripopola.
---

# Metadata y SEO

<Tech ids={['nextdotjs', 'lighthouse']} />

<Estado tipo="construye">Título y descripción de cada pueblo, imagen para compartir generada, `sitemap.xml` con los pueblos publicados, `robots.txt` y JSON-LD.</Estado>

## Concepto

El SEO es la razón número uno por la que ripopola usa Next. Que una página
"tenga SEO" es: HTML con contenido, rápido, con metadatos correctos, URLs
limpias, sin duplicados y descubrible (sitemap).

### `metadata` estática

```tsx title="app/layout.tsx"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: { default: 'ripopola · Mudate a un pueblo', template: '%s · ripopola' },
  description: 'Encontrá pueblos de España e Italia con vivienda, empleo e incentivos para empezar una vida nueva.',
  openGraph: { siteName: 'ripopola', type: 'website' },
};
```

- `metadataBase` permite usar rutas relativas en imágenes y canonical.
- `title.template`: las páginas hijas ponen solo su parte (`Albarracín`) y queda `Albarracín · ripopola`.

### `generateMetadata` para páginas dinámicas

```tsx title="app/(sitio)/pueblos/[slug]/page.tsx"
export async function generateMetadata({ params }: PageProps<'/pueblos/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const town = await getTown(slug);
  return {
    title: town.name,
    description: town.summary,
    alternates: { canonical: `/pueblos/${town.slug}` },
    openGraph: { title: town.name, description: town.summary, images: town.coverUrl ? [town.coverUrl] : [] },
  };
}
```

La página y `generateMetadata` llaman a `getTown` dos veces: envolvelo en
**`cache` de React** para que se ejecute una sola vez por petición:

```ts title="features/towns/api.ts"
import { cache } from 'react';
export const getTown = cache(async (slug: string) => { /* ... */ });
```

Solo funciona en Server Components. En páginas dinámicas, Next **transmite**
la metadata sin bloquear el render (salvo para bots, que reciben el HTML con la metadata ya puesta).

### Archivos de metadata

| Archivo en `app/` | Genera |
| --- | --- |
| `favicon.ico`, `icon.png`, `apple-icon.png` | Íconos |
| `opengraph-image.tsx` | Imagen para compartir (generada con JSX) |
| `sitemap.ts` | `/sitemap.xml` |
| `robots.ts` | `/robots.txt` |
| `manifest.ts` | Manifiesto de PWA |

### Imagen para compartir generada

```tsx title="app/(sitio)/pueblos/[slug]/opengraph-image.tsx"
import { ImageResponse } from 'next/og';
import { getTown } from '@/features/towns/api';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const town = await getTown((await params).slug);
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%', height: '100%', padding: 60, background: '#0f766e', color: 'white' }}>
        <div style={{ fontSize: 80, fontWeight: 800 }}>{town.name}</div>
        <div style={{ fontSize: 36 }}>{town.region} · ripopola</div>
      </div>
    ),
    size,
  );
}
```

### Sitemap y robots

```ts title="app/sitemap.ts"
import type { MetadataRoute } from 'next';
import { listPublishedTownSlugs } from '@/features/towns/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const towns = await listPublishedTownSlugs();
  const base = process.env.NEXT_PUBLIC_SITE_URL!;
  return [
    { url: `${base}/`, changeFrequency: 'weekly' },
    ...towns.map((t) => ({ url: `${base}/pueblos/${t.slug}`, lastModified: t.updatedAt })),
  ];
}
```

```ts title="app/robots.ts"
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/internal'] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

Con más de 50.000 URLs, `generateSitemaps` parte el sitemap en varios.

### Datos estructurados (JSON-LD)

Le dicen a Google qué es la página (un lugar, una oferta de empleo):

```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Place',
  name: town.name,
  geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng },
};

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
/>
```

El `replace` evita que un texto con `</script>` rompa la página (XSS). Para
empleos existe `JobPosting`, que Google muestra en su buscador de empleos.

### Qué no indexar

Las reglas de ripopola: no indexar borradores ni combinaciones infinitas de
filtros. El panel es otra app en `panel.ripopola.com`: su layout raíz pone
`robots: { index: false, follow: false }` y su `robots.ts` devuelve
`disallow: '/'` para todo el subdominio. Para filtros: `robots: { index: false }` en
`generateMetadata` cuando hay más de un filtro, o canonical a la versión sin filtros.

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `Title` y `Meta` services | `metadata` / `generateMetadata` |
| `title` en la definición de la ruta | `metadata.title` en la página |
| Sitemap con un script aparte | `app/sitemap.ts` |
| Imágenes OG hechas a mano | `opengraph-image.tsx` generada con JSX |

En Angular SSR los servicios `Title`/`Meta` funcionan, pero son imperativos.
En Next la metadata es **declarativa** y se resuelve en el servidor antes de enviar el HTML.

</Angular>

## Errores comunes

- **Olvidar `metadataBase`**: las URLs de las imágenes OG quedan relativas y no funcionan al compartir.
- **Pedir dos veces lo mismo** en `generateMetadata` y la página sin `cache`.
- **Exportar `metadata` desde un componente de cliente**: solo funciona en servidor.
- **Indexar filtros y borradores.**
- **JSON-LD sin escapar `<`.**

<Resumen>

- `metadata` estática y `generateMetadata` dinámica, con plantillas de título y canonical.
- `cache` de React para no repetir la petición entre metadata y página.
- Archivos especiales para OG, sitemap, robots e íconos.
- JSON-LD para datos estructurados; escapar siempre.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo definís metadata dinámica en el App Router?**
Exportando `generateMetadata` desde la página o el layout; recibe `params` y
devuelve el objeto `Metadata`. Solo en Server Components.

**2. ¿Cómo evitás pedir dos veces los mismos datos en `generateMetadata` y en la página?**
Envolviendo la función de datos con `cache` de React, que memoiza por petición.

**3. ¿Qué es una URL canónica y para qué sirve?**
La URL "oficial" de un contenido. Evita contenido duplicado cuando la misma
página es accesible con varias URLs (filtros, parámetros, idiomas).

**4. ¿Qué es JSON-LD?**
Datos estructurados con el vocabulario de schema.org en un `script`, que los
buscadores usan para entender y mostrar resultados enriquecidos.

## Glosario

| Término | Qué es |
| --- | --- |
| Open Graph | Metadatos para las vistas previas al compartir. |
| Canonical | La URL oficial de un contenido. |
| Sitemap | Lista de URLs para que los buscadores las descubran. |
| JSON-LD | Formato de datos estructurados en JSON. |
| `cache` de React | Memoización de funciones por petición en el servidor. |
