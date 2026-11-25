---
title: Navegación, Link y enlaces activos
sidebar_position: 4
description: Link y la navegación del lado del cliente, prefetch con Partial Prefetching, useRouter, usePathname para el enlace activo, redirect, y cómo Next conserva layouts y estado al navegar.
---

# Navegación, Link y enlaces activos

<Tech ids={['nextdotjs', 'react']} />

<Estado tipo="construye">La barra de navegación del sitio con el enlace activo y la sidebar del panel.</Estado>

## Concepto

### `<Link>`

```tsx
import Link from 'next/link';

<Link href="/pueblos/albarracin">Albarracín</Link>
```

- Dibuja un `<a href>` real (funciona sin JavaScript, se puede abrir en otra pestaña, SEO).
- Con JavaScript, navega **del lado del cliente**: pide solo lo que cambia (el
  RSC payload de los segmentos nuevos) y **conserva los layouts** y su estado.
- **Prefetch**: cuando el link entra en pantalla (solo en producción), Next
  pide por adelantado lo necesario para que la navegación sea instantánea. Con
  **Partial Prefetching** (activado en 1.2) se prefetchea el **shell** de la
  ruta (lo estático y cacheado); lo dinámico se pide al navegar.
- `prefetch={false}` lo desactiva (por ejemplo en listas de 500 enlaces).

### Navegar por código

En componentes de cliente:

```tsx
'use client';
import { useRouter } from 'next/navigation'; // ¡no 'next/router' (Pages Router)!

const router = useRouter();
router.push('/viviendas');          // agrega al historial
router.replace('/');                // reemplaza
router.back();
router.refresh();                   // vuelve a pedir los Server Components de la ruta actual
```

En el servidor (Server Components, Server Actions, Route Handlers):

```ts
import { redirect, permanentRedirect } from 'next/navigation';
redirect('/login');               // 307
permanentRedirect('/pueblos');    // 308
```

`redirect` **tira una excepción** especial: no lo pongas dentro de un
`try/catch` que la trague.

### Hooks de navegación (cliente)

| Hook | Devuelve |
| --- | --- |
| `usePathname()` | `/pueblos/albarracin` |
| `useSearchParams()` | Los query params (solo lectura) |
| `useParams()` | `{ slug: 'albarracin' }` |
| `useSelectedLayoutSegment()` | El segmento hijo activo de un layout |

### Enlace activo

```tsx title="components/nav-link.tsx"
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn('rounded px-3 py-2', isActive && 'bg-brand-50 font-semibold text-brand-700')}
    >
      {children}
    </Link>
  );
}
```

`aria-current="page"` le dice al lector de pantalla cuál es la página actual.
La barra sigue siendo de servidor; solo `NavLink` es de cliente.

### Estado de carga al navegar

`useLinkStatus()` (dentro de un `Link`) da `{ pending }` para mostrar un
indicador en el enlace mientras navega. Y `loading.tsx` (6.5) muestra un
esqueleto del segmento que cambia.

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `routerLink="/pueblos"` | `<Link href="/pueblos">` |
| `routerLinkActive="active"` | `usePathname()` + clase condicional |
| `router.navigate([...])` | `router.push()` |
| `router.navigate([], { replaceUrl: true })` | `router.replace()` |
| `ActivatedRoute.paramMap` | `useParams()` / `params` en la página |
| `PreloadAllModules` / `withPreloading` | Prefetch automático de `Link` |
| Guards que redirigen (`createUrlTree`) | `redirect()` en el servidor o el proxy (8.4) |

</Angular>

## En ripopola

```tsx title="app/(sitio)/layout.tsx"
import Link from 'next/link';
import { NavLink } from '@/components/nav-link';
import { TownSearch } from '@/features/search/town-search';

export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center gap-2 p-4">
          <Link href="/" className="mr-4 text-xl font-black">ripopola</Link>
          <NavLink href="/pueblos">Pueblos</NavLink>
          <NavLink href="/mapa">Mapa</NavLink>
          <div className="ml-auto"><TownSearch /></div>
        </nav>
      </header>
      {children}
    </>
  );
}
```

## Errores comunes

- **Importar `useRouter` de `next/router`**: es del Pages Router.
- **`<a href>` para rutas internas**: recarga la página entera y pierde estado.
- **`redirect` dentro de `try/catch`**: el catch se come la redirección.
- **Enlace activo con `===` solamente**: `/pueblos/albarracin` no marca "Pueblos".

<Resumen>

- `Link` = `<a>` real + navegación de cliente + prefetch.
- Al navegar, se conservan layouts y estado; se pide solo lo que cambia.
- `useRouter`, `usePathname`, `useParams` en cliente; `redirect` en servidor.
- Enlace activo con `usePathname` y `aria-current`.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué hace `Link` que no hace un `<a>`?**
Navegación del lado del cliente sin recargar, conservando layouts y estado, y
prefetch de la ruta cuando el enlace es visible.

**2. ¿Qué es el prefetch y cuándo ocurre?**
Pedir por adelantado los datos y el código de una ruta. En producción, cuando
el `Link` entra en el viewport; con Partial Prefetching se trae el shell estático.

**3. ¿Qué hace `router.refresh()`?**
Vuelve a pedir al servidor los Server Components de la ruta actual y los
combina sin perder el estado del cliente.

**4. ¿Cómo marcás el enlace activo en el App Router?**
Con un componente de cliente que compara `usePathname()` con su `href` y pone
una clase y `aria-current`.

## Glosario

| Término | Qué es |
| --- | --- |
| Navegación de cliente | Cambiar de página sin recargar el documento. |
| Prefetch | Cargar por adelantado lo que necesita una ruta. |
| `aria-current` | Atributo que marca el elemento actual en una navegación. |
