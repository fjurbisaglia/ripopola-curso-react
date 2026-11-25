---
title: Traducir la interfaz
sidebar_position: 2
description: Mensajes en JSON, useTranslations y getTranslations, ICU para plurales y variantes, texto con formato, fechas, números y distancias con useFormatter, mensajes tipados y cómo organizar las traducciones.
---

# Traducir la interfaz

<Tech ids={['nextintl', 'react', 'typescript']} />

<Estado tipo="construye">Los textos fijos de la web en `messages/es.json` y `messages/it.json`, tipados, con plurales y formatos de número y fecha.</Estado>

## Concepto

Hay **dos tipos de texto** en ripopola (decisión del proyecto):

| Tipo | Ejemplo | Quién lo traduce |
| --- | --- | --- |
| Fijo, del código | "Buscar pueblos", "3 viviendas disponibles" | Los archivos de mensajes (esta lección) |
| Escrito por el ayuntamiento | La descripción de Albarracín | La IA al guardar, en Nest; la API lo devuelve en el idioma pedido (10.3) |

### Mensajes con ICU

Los mensajes usan **ICU MessageFormat**, el estándar para plurales y
variantes, que entienden también las herramientas de traducción:

```json title="messages/es.json"
{
  "Town": {
    "listings": "{count, plural, =0 {Sin viviendas} one {# vivienda} other {# viviendas}}",
    "population": "{count, number} habitantes",
    "distance": "A {km, number, ::precision-integer} km de {city}",
    "updated": "Actualizado el {date, date, long}"
  }
}
```

Los plurales **no son iguales en todos los idiomas** (el polaco tiene cuatro
formas, el japonés una). Escribir `count === 1 ? 'vivienda' : 'viviendas'` en
el código rompe en cuanto sumás un idioma.

## Si venís de Angular

<Angular>

| Angular | next-intl |
| --- | --- |
| `i18n` + `$localize` (en build) | Mensajes JSON leídos en runtime por idioma |
| Pipe `translate` de ngx-translate | `t('clave')` |
| `DatePipe`, `DecimalPipe` con `LOCALE_ID` | `useFormatter()` / `getFormatter()` |
| ICU en las plantillas (`{count, plural, ...}`) | El mismo ICU, en los JSON |

</Angular>

## En ripopola

### 1. Usar los mensajes

En un Server Component:

```tsx title="apps/web/app/[locale]/(sitio)/pueblos/[slug]/page.tsx (fragmento)"
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function TownPage({ params }: PageProps<'/[locale]/pueblos/[slug]'>) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Town');
  const town = await getTown(slug, locale);

  return (
    <>
      <h1>{town.name}</h1>
      <p>{t('population', { count: town.population })}</p>
      <p>{t('listings', { count: town.listingsCount })}</p>
    </>
  );
}
```

En un Client Component, el hook:

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function FavoriteButton({ isFavorite }: { isFavorite: boolean }) {
  const t = useTranslations('Favorites');
  return <button aria-pressed={isFavorite}>{isFavorite ? t('remove') : t('add')}</button>;
}
```

`useTranslations` también funciona en Server Components **no async**; en los
`async` se usa `await getTranslations()`.

### 2. Texto con formato

```json
{ "Contact": { "terms": "Al enviar aceptás la <link>política de privacidad</link>." } }
```

```tsx
t.rich('terms', {
  link: (chunks) => <Link href="/privacidad">{chunks}</Link>,
});
```

Nunca armes frases concatenando pedazos (`t('al_enviar') + <Link> + t('politica')`):
el orden de las palabras cambia entre idiomas.

### 3. Fechas, números y distancias

```tsx
import { useFormatter } from 'next-intl';

const format = useFormatter();
format.number(1490, { style: 'currency', currency: 'EUR' });   // "1490 €" / "1490,00 €"
format.dateTime(listing.publishedAt, { dateStyle: 'medium' });
format.relativeTime(listing.publishedAt);                       // "hace 3 días" / "3 giorni fa"
format.list(['Teruel', 'Cuenca', 'Soria'], { type: 'conjunction' });
```

Por debajo es `Intl` del navegador y de Node. La zona horaria la fija
`i18n/request.ts` (`Europe/Madrid`): sin eso, el servidor (en UTC) y el
navegador podrían mostrar fechas distintas y React avisaría de un error de
hidratación.

### 4. Mensajes tipados

```ts title="apps/web/global.d.ts"
import type { routing } from '@/i18n/routing';
import type messages from './messages/es.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
```

Con esto, `t('Town.listngs')` (mal escrito) no compila, y el editor
autocompleta las claves. El español es la fuente de verdad.

### 5. Organizar las traducciones

- **Un *namespace* por componente o pantalla** (`Town`, `Search`, `Contact`),
  no un archivo gigante sin estructura.
- **Claves por significado**, no por texto: `Search.submit`, no `Search.buscar`.
- **Un test** que compare las claves de `es.json` con las de `it.json` y
  falle si falta alguna (11.1).
- Si los mensajes crecen mucho, cada página puede pasar al cliente solo su
  parte: `<NextIntlClientProvider messages={pick(messages, ['Search'])}>`.

<Alternativa title="react-i18next y Lingui">
**react-i18next** (i18next) es la librería de i18n más usada en React en
general, con muchísimos plugins; con App Router necesita más configuración
para servidor y cliente. **Lingui** extrae los textos del código con macros
(`` t`Buscar pueblos` ``) y compila los catálogos. next-intl es la que mejor
encaja con App Router y Server Components.
</Alternativa>

## Errores comunes

- **Plurales con `if`** en el código.
- **Concatenar frases** en vez de usar `t.rich`.
- **Formatear fechas con `toLocaleDateString()`** sin zona horaria: diferencias
  entre servidor y cliente.
- **Mandar todos los mensajes al cliente** en una app grande.
- **Traducir textos del ayuntamiento** con archivos de mensajes: eso viene de la API.

<Resumen>

- Textos fijos en `messages/{locale}.json`; textos del ayuntamiento desde la API.
- `getTranslations` en Server Components async, `useTranslations` en el resto.
- ICU para plurales, números y fechas; `t.rich` para texto con componentes.
- `useFormatter` con zona horaria fija para no romper la hidratación.
- `AppConfig` para tipar idiomas y claves.

</Resumen>

## Preguntas de entrevista

**1. ¿Por qué usar ICU para los plurales?**
Porque cada idioma tiene reglas de plural distintas; ICU las conoce y el
traductor escribe todas las formas sin tocar código.

**2. ¿Por qué no concatenar pedazos traducidos?**
Porque el orden de las palabras cambia entre idiomas. Se traduce la frase
entera con marcadores para las partes con formato.

**3. ¿Qué problema de hidratación puede dar una fecha?**
Si el servidor y el navegador formatean con zonas horarias distintas, el
texto no coincide. Se fija la zona horaria en la configuración.

**4. ¿Cómo evitás claves de traducción inexistentes?**
Tipando los mensajes a partir del archivo del idioma base y con un test que
compare las claves de todos los idiomas.

## Glosario

| Término | Qué es |
| --- | --- |
| ICU MessageFormat | Sintaxis estándar para mensajes con plurales, selección y formatos. |
| Namespace | Grupo de mensajes (`Town`, `Search`). |
| `Intl` | API de JavaScript para formatear según el idioma. |
| `AppConfig` | Interfaz de next-intl para tipar idiomas y mensajes. |
