---
title: Cookies en el servidor y en el cliente
sidebar_position: 5
description: Qué es una cookie y sus atributos, cookies() asíncrono en Next, dónde se puede leer y dónde escribir, cookies desde el cliente, la cookie de sesión de Better Auth y las preferencias de ripopola.
---

# Cookies en el servidor y en el cliente

<Tech ids={['nextdotjs', 'betterauth']} />

<Estado tipo="construye">La preferencia de unidad de distancia (km o millas) en una cookie que leen los Server Components, y entender la cookie de sesión de Better Auth.</Estado>

## Concepto

Una **cookie** es un par nombre-valor que el servidor le pide al navegador que
guarde (`Set-Cookie`) y que el navegador manda de vuelta en cada petición al
mismo sitio (`Cookie`). A diferencia de `localStorage`, **viaja al servidor**:
por eso sirve para la sesión y para todo lo que el servidor necesita saber al
renderizar.

### Los atributos que importan

| Atributo | Qué hace | En la sesión de ripopola |
| --- | --- | --- |
| `HttpOnly` | JavaScript no la puede leer (`document.cookie`) | Sí: un XSS no puede robarla |
| `Secure` | Solo viaja por HTTPS | Sí en producción |
| `SameSite=Lax` | No viaja en POST desde otros sitios (defensa CSRF) | Sí |
| `Domain` | Para qué dominios vale | `ripopola.com` en producción: web, panel y API |
| `Path` | Para qué rutas vale | `/` |
| `Max-Age` / `Expires` | Cuándo vence | La duración de la sesión |
| Prefijo `__Secure-` | El navegador exige `Secure` | Better Auth lo usa en HTTPS |

### Cookies en Next

`cookies()` de `next/headers` es **asíncrona** (desde Next 15):

| Dónde | Leer | Escribir / borrar |
| --- | --- | --- |
| Server Component | Sí | **No**: el HTML ya se está enviando, no se pueden agregar cabeceras |
| Server Action | Sí | Sí |
| Route Handler | Sí | Sí |
| `proxy.ts` | Sí (`request.cookies`) | Sí (`response.cookies`) |
| Client Component | Solo las que no son `HttpOnly` (`document.cookie`) | Sí, las que no son `HttpOnly` |

Y con Cache Components: **leer `cookies()` vuelve dinámico** a ese
componente. Si lo hacés dentro de un `<Suspense>`, solo ese pedazo se
renderiza por petición; el resto se prerenderiza.

### Cookie, `localStorage` o URL

| Dato | Dónde |
| --- | --- |
| Sesión | Cookie `HttpOnly` (la pone Nest) |
| Preferencia que el servidor necesita al renderizar | Cookie normal |
| Preferencia solo del navegador (favoritos sin cuenta, 4.4) | `localStorage` |
| Algo que se comparte o se marca como favorito | URL (`searchParams`, 4.6) |

## Si venís de Angular

<Angular>

En Angular con SSR leías cookies inyectando `REQUEST` (o un servicio como
`ngx-cookie-service`) y tenías que cuidar que el código corriera distinto en
servidor y navegador. En Next la división es explícita: `cookies()` en el
servidor, `document.cookie` (o una librería) en el cliente.

</Angular>

## En ripopola

### 1. La cookie de sesión (la pone Nest)

Better Auth, dentro de Nest, crea la cookie `better-auth.session_token`
(con prefijo `__Secure-` en HTTPS) al hacer login. Next **no la crea ni la
toca**: solo la reenvía a Nest con `serverApi()` (4.1) y mira si existe en el
proxy (8.4). Detalles en la sección 9.

### 2. Una preferencia: km o millas

Los visitantes del Reino Unido prefieren millas. La web guarda la elección en
una cookie para que los Server Components rendericen "a 12 km de Teruel" o
"7 mi" sin parpadeo.

```ts title="apps/web/features/preferences/units.ts"
import 'server-only';
import { cookies } from 'next/headers';

export type DistanceUnit = 'km' | 'mi';
export const UNIT_COOKIE = 'rp_unit';

export async function getDistanceUnit(): Promise<DistanceUnit> {
  const value = (await cookies()).get(UNIT_COOKIE)?.value;
  return value === 'mi' ? 'mi' : 'km';                    // nunca confíes en el valor
}
```

```ts title="apps/web/features/preferences/actions.ts"
'use server';

import { cookies } from 'next/headers';
import { UNIT_COOKIE } from './units';

export async function setDistanceUnit(unit: 'km' | 'mi') {
  if (unit !== 'km' && unit !== 'mi') return;
  (await cookies()).set(UNIT_COOKIE, unit, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,                                       // el cliente no necesita leerla
  });
}
```

`units.ts` importa `server-only` y la acción exporta solo funciones async
(8.2), por eso la constante vive en `units.ts`.

```tsx title="apps/web/features/preferences/unit-toggle.tsx"
'use client';

import { useTransition } from 'react';
import { setDistanceUnit } from './actions';

export function UnitToggle({ current }: { current: 'km' | 'mi' }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setDistanceUnit(current === 'km' ? 'mi' : 'km'))}
    >
      Ver en {current === 'km' ? 'millas' : 'kilómetros'}
    </button>
  );
}
```

Al cambiar una cookie en una Server Action, Next vuelve a renderizar la ruta
y devuelve la UI nueva en la misma respuesta: las distancias cambian sin
`router.refresh()`.

### 3. Dónde leerla sin perder la caché

La ficha del pueblo está cacheada (7.3). Si `getDistanceUnit()` se llamara en
la página, la página entera pasaría a ser dinámica. En cambio:

```tsx
<Suspense fallback={<DistanceSkeleton />}>
  <NearbyTowns slug={slug} />   {/* adentro: await getDistanceUnit() */}
</Suspense>
```

Solo el bloque de "pueblos cercanos" es dinámico; el resto sale del prerender.

:::info Consentimiento
Una cookie de preferencia o de sesión es **estrictamente necesaria** o
funcional, y no necesita el banner de consentimiento de la UE. Las de
analítica o publicidad sí. Si algún día ripopola agrega analítica con
cookies, el consentimiento se guarda en otra cookie y los scripts se cargan
solo después (6.7).
:::

<Alternativa title="El carrito en cookies (curso de referencia)">
En el curso de referencia el carrito de la tienda vive en una cookie que se
lee en el servidor y se escribe desde el cliente con `cookies-next`. Sirve
para datos chicos (una cookie tiene ~4 KB). En ripopola no hay carrito; el
patrón equivalente es la preferencia de unidades.
</Alternativa>

## Errores comunes

- **`cookies().set` en un Server Component**: tira error; solo en Server
  Actions, Route Handlers o el proxy.
- **Olvidar el `await`**: `cookies()` devuelve una promesa.
- **Leer cookies en un layout cacheado**: vuelve dinámico todo lo que está abajo.
- **Guardar datos sensibles o grandes** en una cookie no `HttpOnly`.
- **Confiar en el valor**: una cookie la puede editar el usuario. Validala.
- **Esperar que una cookie que Nest manda a una Server Action llegue al
  navegador**: llega al servidor de Next (8.1).

<Resumen>

- Una cookie viaja en cada petición: sirve para lo que el servidor necesita al renderizar.
- `HttpOnly`, `Secure`, `SameSite` y `Domain` deciden quién la ve y cuándo viaja.
- `cookies()` es asíncrona; se lee en el servidor y se escribe en Server Actions, Route Handlers y el proxy.
- Leer cookies vuelve dinámico: dentro de `<Suspense>` para no perder el prerender.
- La sesión la pone Nest; Next solo la reenvía.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué diferencia hay entre una cookie y `localStorage`?**
La cookie viaja al servidor en cada petición y puede ser `HttpOnly`;
`localStorage` queda solo en el navegador y cualquier script de la página lo lee.

**2. ¿Por qué no se puede escribir una cookie en un Server Component?**
Porque las cookies van en las cabeceras de la respuesta y, cuando el
componente renderiza, el HTML ya se está transmitiendo. Se escriben en Server
Actions, Route Handlers o el proxy.

**3. ¿Para qué sirven `HttpOnly` y `SameSite`?**
`HttpOnly` impide que JavaScript lea la cookie (protege la sesión de un XSS);
`SameSite` limita cuándo viaja desde otros sitios (defensa contra CSRF).

**4. ¿Qué pasa con el render si leés cookies?**
Ese componente pasa a renderizarse por petición. Con Cache Components,
dentro de un `<Suspense>` solo ese pedazo es dinámico.

**5. ¿Cómo comparten sesión varios subdominios?**
Con una cookie emitida para el dominio padre (`Domain=ripopola.com`): llega a
la web, al panel y a la API.

## Glosario

| Término | Qué es |
| --- | --- |
| `Set-Cookie` | Cabecera con la que el servidor pide guardar una cookie. |
| `HttpOnly` | Atributo que oculta la cookie a JavaScript. |
| `SameSite` | Atributo que limita el envío de la cookie desde otros sitios. |
| CSRF | Ataque que usa la sesión del usuario desde otro sitio. |
| `cookies()` | Función asíncrona de Next para leer y escribir cookies en el servidor. |
