---
title: Las alternativas - Auth.js, Better Auth dentro de Next, Firebase Auth y Clerk
sidebar_position: 7
description: Concepto - cómo se ve la autenticación cuando vive dentro de Next (Better Auth o Auth.js, la sección archivada del curso de referencia), con Firebase Auth o con Clerk, y cuándo elegir cada una frente a la sesión en Nest.
---

# Las alternativas

<Tech ids={['authjs', 'betterauth', 'firebase', 'clerk', 'nextdotjs']} />

<Estado tipo="concepto">Lo que vas a encontrar en otros proyectos y en entrevistas. Ripopola usa Better Auth en Nest.</Estado>

## Concepto

La pregunta de fondo es **dónde vive la sesión**:

| Modelo | Dónde vive | Ejemplos |
| --- | --- | --- |
| En la API (ripopola) | Backend aparte; el front usa un cliente | Better Auth en Nest, Passport + sesiones |
| En Next | Route Handler `/api/auth/[...all]` dentro de la app Next | Better Auth en Next, Auth.js |
| En un proveedor | Servicio externo; tu backend verifica tokens | Firebase Auth, Clerk, Auth0, Cognito |

### Better Auth dentro de Next (el curso de referencia)

Es la misma librería, montada en Next en vez de en Nest:

```ts title="app/api/auth/[...all]/route.ts (proyecto de ejemplo)"
import { auth } from '@/lib/auth';           // betterAuth({ database: prismaAdapter(...), plugins: [nextCookies()] })
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

```ts
// En un Server Component, sin llamar a ninguna API:
const session = await auth.api.getSession({ headers: await headers() });
```

- El plugin **`nextCookies()`** hace que, si llamás a `auth.api.signInEmail`
  desde una Server Action, la cookie se ponga en la respuesta de Next. Es
  justo el problema que en ripopola evitamos haciendo el login desde el
  navegador (9.1).
- El **proxy** de Next usa `getSessionCookie` igual que en ripopola.
- Ventaja: un solo despliegue. Desventaja: si mañana hay una app móvil o
  workers que necesitan la identidad, la auth está atada a Next.

### Auth.js (NextAuth)

La librería clásica de auth para Next, con la que se grabó la sección
**archivada** del curso de referencia:

```ts title="auth.ts (proyecto de ejemplo)"
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({ providers: [Google] });
```

- Muy usada en código existente: la vas a encontrar en proyectos que tengas
  que mantener.
- Su equipo se sumó a Better Auth y Auth.js quedó en modo mantenimiento; para
  proyectos nuevos se recomienda Better Auth. Por eso el curso de referencia
  la archivó.
- Sesiones con JWT en cookie por defecto, o en base de datos con un *adapter*.

### Firebase Auth

Lo que ripopola usaba antes de esta decisión:

- El SDK de Firebase hace el login en el navegador y guarda un **ID token**
  (JWT, una hora) que se renueva solo.
- El backend verifica el token con `firebase-admin` en cada petición
  (`Authorization: Bearer`).
- Para que Next lo vea en el servidor, hay que crear una **session cookie**
  propia con `createSessionCookie` y un Route Handler. Más piezas.
- Gratis hasta un volumen alto, con muchos proveedores. A cambio, los usuarios
  viven fuera de tu base y dependés de Google.

### Clerk

Un servicio pago con componentes listos (`<SignIn />`, `<UserButton />`),
organizaciones, 2FA y panel de administración. Integración muy rápida con
Next (`clerkMiddleware` en el proxy). Ideal para un MVP; cuesta dinero por
usuario activo y los datos están en su plataforma.

### Cómo elegir

| Si... | Elegí |
| --- | --- |
| Hay una API aparte con varios clientes (web, panel, móvil, workers) | La sesión en la API (ripopola) |
| Solo hay una app Next y una base | Better Auth dentro de Next |
| Mantenés un proyecto que ya la usa | Auth.js |
| Querés no pensar en auth y podés pagar | Clerk |
| Ya estás en Firebase o necesitás auth anónima y móvil sin backend | Firebase Auth |

## Si venís de Angular

<Angular>

En Angular lo común es JWT del backend o Firebase Auth con `@angular/fire`.
Next suma una opción que Angular no tiene: que la auth viva **en el mismo
servidor del frontend**. Es cómodo, pero acopla la identidad a una app.

</Angular>

<Resumen>

- La decisión es dónde vive la sesión: en la API, en Next o en un proveedor.
- Better Auth en Next: `toNextJsHandler`, `auth.api.getSession`, `nextCookies()`.
- Auth.js: muy presente en código existente, en mantenimiento.
- Firebase Auth y Clerk: proveedores externos, más rápidos de empezar, datos fuera de tu base.
- Ripopola la pone en Nest porque la comparten la web, el panel, los workers y la futura app.

</Resumen>

## Preguntas de entrevista

**1. ¿Dónde pondrías la autenticación en una app Next con un backend aparte?**
En el backend, que es la autoridad para todos los clientes; Next reenvía la
sesión. Si Next fuera el único backend, adentro de Next.

**2. ¿Qué diferencia hay entre Auth.js y Better Auth?**
Las dos manejan sesiones y proveedores; Better Auth es más reciente, con
plugins (2FA, organizaciones) y es la recomendada para proyectos nuevos; Auth.js
está en mantenimiento pero es muy común en código existente.

**3. ¿Qué cambia si usás un proveedor como Firebase Auth?**
Los usuarios viven en el proveedor, el front obtiene un token y el backend lo
verifica en cada petición. Para usarlo en Server Components hace falta una
cookie de sesión propia.

**4. ¿Qué es `nextCookies()` en Better Auth?**
Un plugin que hace que las cookies que pone Better Auth al ser llamado desde
el servidor de Next (Server Actions) lleguen al navegador.

## Glosario

| Término | Qué es |
| --- | --- |
| Auth.js | Librería de autenticación para Next (antes NextAuth). |
| ID token | JWT que identifica al usuario (Firebase, OpenID Connect). |
| Clerk | Servicio pago de autenticación con componentes listos. |
| `toNextJsHandler` | Adaptador de Better Auth para montarse en un Route Handler. |
