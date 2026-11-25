---
title: El cliente de Better Auth
sidebar_position: 2
description: La librería libs/frontend/auth con createAuthClient de better-auth/react, baseURL en desarrollo y producción, plugins de cliente, campos propios tipados, useSession y cómo se manejan los errores.
---

# El cliente de Better Auth

<Tech ids={['betterauth', 'react', 'nx', 'typescript']} />

<Estado tipo="construye">La librería `libs/frontend/auth` (`@ripopola/frontend-auth`) con el `authClient` que usan el panel y, más adelante, la web.</Estado>

## Concepto

Better Auth trae un **cliente** que conoce todas sus rutas
(`/api/auth/sign-in/email`, `/api/auth/get-session`...) y las expone como
funciones tipadas y hooks de React:

```ts
authClient.signIn.email({ email, password });
authClient.signUp.email({ name, email, password });
authClient.signIn.social({ provider: 'google' });
authClient.signOut();
authClient.useSession();   // hook reactivo
```

Cada función devuelve `{ data, error }` (no tira excepción), igual que
openapi-fetch. Los plugins del servidor (2FA, por ejemplo) tienen su
**plugin de cliente** que agrega las funciones correspondientes.

## Si venís de Angular

<Angular>

Es tu `AuthService` ya escrito: métodos para login y registro y un estado
observable de la sesión. La diferencia es que no lo inyectás: lo importás
como un módulo y usás el hook `useSession()` donde lo necesites.

</Angular>

## En ripopola

### 1. La librería

```bash
pnpm exec nx g @nx/js:lib libs/frontend/auth --importPath=@ripopola/frontend-auth --bundler=none --dry-run
pnpm add -E better-auth          # la misma versión que usa la API
```

Usar **la misma versión** que en `apps/api` no es un detalle: el cliente y el
servidor se hablan con un protocolo que cambia entre versiones.

### 2. El cliente

```ts title="libs/frontend/auth/src/auth-client.ts"
'use client';

import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  // '' en desarrollo (rewrites al mismo origen), 'https://api.ripopola.com' en producción
  baseURL: process.env.NEXT_PUBLIC_API_URL || undefined,
  basePath: '/api/auth',
  fetchOptions: { credentials: 'include' },
  plugins: [
    // Campos propios del usuario (curso de Nest: platformRole, input: false)
    inferAdditionalFields({
      user: { platformRole: { type: 'string', input: false } },
    }),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = '/login/codigo';  // 9.6
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
```

```ts title="libs/frontend/auth/src/index.ts"
export { authClient, type Session } from './auth-client';
export { authErrorMessage } from './errors';
export { safeRedirect } from './safe-redirect';   // 9.3
```

Qué mirar:

- **`baseURL`** vacío (`undefined`) hace que el cliente use el origen actual:
  en desarrollo, `localhost:4300/api/auth/...` y el rewrite lo lleva a Nest.
- **`credentials: 'include'`**: en producción, el panel llama a
  `api.ripopola.com` y tiene que mandar y recibir la cookie.
- **`inferAdditionalFields`** tipa `session.user.platformRole`. Si el monorepo
  pudiera importar el tipo de la instancia de Nest
  (`inferAdditionalFields<typeof auth>()`), se infiere solo; acá lo declaramos
  a mano para que el frontend no dependa del código de la API.
- **`'use client'`**: el cliente usa hooks y `window`. Para el servidor está
  `serverApi()` (9.4).

### 3. Mensajes de error en español

Better Auth devuelve códigos (`INVALID_EMAIL_OR_PASSWORD`, `USER_ALREADY_EXISTS`,
`EMAIL_NOT_VERIFIED`...). Un mapa los traduce:

```ts title="libs/frontend/auth/src/errors.ts"
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'El correo o la contraseña no son correctos.',
  USER_ALREADY_EXISTS: 'Ya hay una cuenta con ese correo.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya hay una cuenta con ese correo.',
  EMAIL_NOT_VERIFIED: 'Confirmá tu correo: te mandamos un enlace.',
  PASSWORD_TOO_SHORT: 'La contraseña tiene que tener al menos 10 caracteres.',
  INVALID_CODE: 'El código no es válido o ya venció.',
  INVALID_BACKUP_CODE: 'Ese código de respaldo no es válido o ya se usó.',
};

export function authErrorMessage(error: { code?: string; status: number } | null | undefined) {
  if (!error) return null;
  if (error.status === 429) return 'Demasiados intentos. Esperá un minuto.';
  return (error.code && MESSAGES[error.code]) ?? 'No pudimos completar la operación.';
}
```

Ojo con no dar más información de la necesaria: "correo o contraseña
incorrectos" (y no "ese correo no existe") evita que alguien descubra qué
correos tienen cuenta.

### 4. `useSession` en un componente de cliente

```tsx title="apps/panel/components/user-menu.tsx"
'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@ripopola/frontend-auth';

export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="h-8 w-24 animate-pulse rounded bg-muted" />;
  if (!session) return null;

  async function signOut() {
    await authClient.signOut();
    router.replace('/login');
    router.refresh();                 // que los Server Components olviden al usuario
  }

  return (
    <details>
      <summary>{session.user.name}</summary>
      <button type="button" onClick={signOut}>Cerrar sesión</button>
    </details>
  );
}
```

- `useSession` pide `/api/auth/get-session` y comparte el resultado entre
  todos los componentes que lo usan (es un *store* reactivo, no un
  `useEffect` por componente).
- En el panel, el layout ya sabe quién es el usuario desde el servidor (9.4):
  podés pasarle el nombre por props y no mostrar el *skeleton*. `useSession`
  es útil donde el servidor no lo sabe, como en la web pública.

<Alternativa title="El cliente sin React">
`better-auth/client` exporta el mismo cliente sin hooks (vanilla). Con
Angular se usaría ese, envuelto en un servicio con signals.
</Alternativa>

## Errores comunes

- **Versiones distintas** de `better-auth` en la API y en el front.
- **`baseURL` con `/api/auth` dos veces** (en `baseURL` y en `basePath`).
- **Olvidar `credentials: 'include'`** en producción: el login "anda" pero la
  cookie no se guarda o no viaja.
- **Importar `authClient` en un Server Component**: es de cliente.
- **Mostrar el error crudo** de la API al usuario.

<Resumen>

- `createAuthClient` de `better-auth/react` en `libs/frontend/auth`, compartido por las apps.
- `baseURL` vacío en desarrollo (rewrites) y `api.ripopola.com` en producción, con `credentials: 'include'`.
- Plugins de cliente: `inferAdditionalFields` y `twoFactorClient`.
- Todas las funciones devuelven `{ data, error }`; los códigos se traducen.
- `useSession()` para la sesión en el cliente; después de `signOut`, `router.refresh()`.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué te da el cliente de una librería de auth como Better Auth?**
Funciones tipadas para cada flujo (login, registro, social, 2FA), manejo de
errores uniforme y un estado reactivo de la sesión, sin escribir los fetch a mano.

**2. ¿Por qué `router.refresh()` después de cerrar sesión?**
Porque los Server Components de la ruta actual se renderizaron con la sesión
anterior; `refresh` los vuelve a pedir al servidor.

**3. ¿Por qué un mensaje genérico en el login fallido?**
Para no revelar qué correos tienen cuenta (enumeración de usuarios).

## Glosario

| Término | Qué es |
| --- | --- |
| `createAuthClient` | Función de Better Auth que crea el cliente para el navegador. |
| Plugin de cliente | Extensión del cliente que agrega las funciones de un plugin del servidor. |
| `useSession` | Hook que devuelve la sesión actual y se actualiza solo. |
| Enumeración de usuarios | Descubrir qué cuentas existen a partir de los mensajes de error. |
