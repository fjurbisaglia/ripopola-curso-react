---
title: Imágenes, fuentes y scripts
sidebar_position: 7
description: next/image para fotos optimizadas sin saltos de layout, priority y sizes, imágenes remotas de Cloud Storage, next/font para fuentes sin parpadeo y next/script para terceros.
---

# Imágenes, fuentes y scripts

<Tech ids={['nextdotjs', 'googlecloud', 'lighthouse']} />

<Estado tipo="construye">Las fotos de pueblos con `next/image` desde Cloud Storage, la fuente Inter con `next/font` y el script de analítica con `next/script`.</Estado>

## Concepto

Las fotos son la mayor parte del peso de ripopola y lo primero que mira
Google en **LCP** (Largest Contentful Paint: cuánto tarda en verse lo más
grande). Next trae tres componentes para no arruinar las Core Web Vitals.

### `next/image`

```tsx
import Image from 'next/image';

<Image
  src={town.coverUrl}
  alt={`Vista de ${town.name}`}
  width={1200}
  height={630}
  sizes="(min-width: 1024px) 960px, 100vw"
  preload            // la foto principal: la imagen LCP
  className="rounded-xl object-cover"
/>
```

Qué hace:
- **Redimensiona** y sirve el formato más liviano (WebP/AVIF) según el dispositivo.
- Genera `srcset`: el navegador elige el tamaño según `sizes`.
- **Reserva el espacio** con `width`/`height` (o `fill`): no hay salto de layout (CLS).
- **Lazy loading** por defecto: las fotos fuera de pantalla se cargan al acercarse.
- `preload` (antes `priority`) para la imagen principal: se pide antes y sin lazy.

`fill` para que ocupe el contenedor (que tiene que tener `position: relative`
y tamaño):

```tsx
<div className="relative aspect-[4/3]">
  <Image src={src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
</div>
```

### Imágenes remotas

Hay que autorizar los orígenes en `next.config.ts` (seguridad: si no, tu
servidor optimizaría imágenes de cualquiera):

```ts
images: {
  remotePatterns: [new URL('https://storage.googleapis.com/ripopola-media/**')],
},
```

:::info ¿Quién optimiza?
En Vercel la optimización es un servicio incluido (con costo por uso). En
Cloud Run la hace tu propio servidor Next (usa `sharp`, CPU). Otra opción es
un **loader** que delegue en un CDN de imágenes. Lo decidimos en el 12.3.
:::

### `next/font`

```ts title="app/fonts.ts"
import { Inter } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
```

```tsx title="app/layout.tsx"
<html lang="es" className={inter.variable}>
```

- Descarga la fuente **en el build** y la sirve desde tu dominio: sin pedir a
  Google en runtime (privacidad, RGPD) y sin parpadeo.
- Calcula una fuente de respaldo con métricas ajustadas: el texto no "salta" al cargar la fuente.
- `variable` la expone como variable CSS para Tailwind (`--font-sans` en `@theme`, 1.8).

### `next/script`

Para scripts de terceros (analítica, chat):

```tsx
import Script from 'next/script';

<Script src="https://plausible.io/js/script.js" data-domain="ripopola.com" strategy="afterInteractive" />
```

| `strategy` | Cuándo carga |
| --- | --- |
| `beforeInteractive` | Antes de hidratar (casi nunca: bloquea) |
| `afterInteractive` (por defecto) | Después de hidratar |
| `lazyOnload` | Cuando el navegador está libre |

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `NgOptimizedImage` (`ngSrc`, `priority`, `fill`, loaders) | `next/image` (`src`, `preload`, `fill`, `loader`) |
| Fuentes en `angular.json` con inlining | `next/font` |
| Scripts en `index.html` o cargados a mano | `next/script` con estrategias |

`NgOptimizedImage` está inspirado en `next/image`: misma filosofía, mismas advertencias.

</Angular>

## Errores comunes

- **No poner `sizes` con `fill`** o imágenes responsivas: descarga la imagen más grande.
- **`preload` en todas las fotos**: si todo es prioritario, nada lo es.
- **`alt` vacío en fotos con contenido** (o descriptivo en decorativas).
- **Contenedor sin tamaño con `fill`**: la imagen ocupa 0 px.
- **Cargar Google Fonts con un `<link>`**: parpadeo y petición a terceros.

<Resumen>

- `next/image`: tamaños, formatos, lazy, sin CLS; `preload` solo en la imagen LCP.
- Orígenes remotos autorizados en `remotePatterns`.
- `next/font`: fuentes servidas desde tu dominio, sin parpadeo.
- `next/script` con la estrategia adecuada para terceros.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué optimiza `next/image`?**
Redimensiona y convierte a formatos modernos, genera `srcset`, reserva espacio
para evitar CLS y carga en diferido las imágenes fuera de pantalla.

**2. ¿Para qué sirve `sizes`?**
Le dice al navegador qué ancho va a ocupar la imagen en cada breakpoint, para
que elija del `srcset` el archivo justo y no descargue de más.

**3. ¿Qué es LCP y cómo lo mejorás con imágenes?**
Largest Contentful Paint, el tiempo hasta que se ve el elemento más grande.
Marcando la imagen principal con `preload`, sirviéndola en el tamaño y formato justo y desde CDN.

**4. ¿Qué ventajas tiene `next/font` sobre un `<link>` a Google Fonts?**
La fuente se descarga en el build y se sirve desde el propio dominio, sin
peticiones a terceros, y con una fuente de respaldo ajustada que evita saltos.

## Glosario

| Término | Qué es |
| --- | --- |
| LCP | Largest Contentful Paint. |
| CLS | Cumulative Layout Shift. |
| `srcset` | Lista de versiones de una imagen para distintos tamaños. |
| Loader | Función que arma la URL de una imagen optimizada. |
