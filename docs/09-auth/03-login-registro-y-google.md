---
title: Login, registro y Google
sidebar_position: 3
description: Las páginas de autenticación del panel - login con correo y contraseña, volver a donde quería ir sin open redirect, registro con verificación de correo, Google, recuperar la contraseña y la experiencia de cada error.
---

# Login, registro y Google

<Tech ids={['betterauth', 'react', 'reacthookform', 'zod', 'nextdotjs']} />

<Estado tipo="construye">Las páginas `/login`, `/registro`, `/verificar-correo` y `/recuperar` del panel, con correo y contraseña y con Google.</Estado>

## Concepto

Los flujos que el panel necesita, y qué hace cada parte:

| Flujo | Navegador (panel) | Nest (Better Auth) |
| --- | --- | --- |
| Login | `signIn.email` | Verifica la contraseña, crea la sesión, `Set-Cookie` |
| Registro | `signUp.email` | Crea el usuario y manda el correo de verificación |
| Verificar correo | El usuario abre el enlace del correo | Marca el correo como verificado y redirige al panel |
| Google | `signIn.social` → redirección a Google | Recibe el callback, crea o vincula la cuenta, `Set-Cookie`, redirige |
| Recuperar | `requestPasswordReset`, después `resetPassword` | Manda el enlace con un token, cambia la contraseña y cierra las sesiones |

En el curso de Nest configuraste `requireEmailVerification: true`: sin correo
verificado no hay sesión, y el login responde `EMAIL_NOT_VERIFIED`.

### La redirección después del login

El proxy (8.4) manda a `/login?next=/viviendas/123`. Al terminar, el login
vuelve ahí. Pero `next` lo controla quien arma el enlace: si aceptás
cualquier valor, `https://panel.ripopola.com/login?next=https://phishing.com`
usa tu dominio para mandar a la víctima a otro sitio (*open redirect*).
Solo se aceptan rutas relativas propias.

## Si venís de Angular

<Angular>

El formulario es el mismo concepto que un Reactive Form con validadores. La
diferencia está en lo que pasa después: no guardás un token. La respuesta
trae un `Set-Cookie` que el navegador guarda solo, y lo único que hace el
front es navegar y pedirle a Next que vuelva a renderizar con la sesión
(`router.refresh()`).

</Angular>

## En ripopola

### 1. Validar el `next`

```ts title="libs/frontend/auth/src/safe-redirect.ts"
export function safeRedirect(next: string | null | undefined, fallback = '/') {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
```

`//phishing.com` es una URL absoluta para el navegador (*protocol-relative*):
por eso se rechaza también.

### 2. La página de login

```tsx title="apps/panel/app/(auth)/login/page.tsx"
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Ingresar' };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">Ingresar al panel</h1>
      <Suspense>
        <LoginForm />   {/* lee searchParams en el cliente */}
      </Suspense>
    </main>
  );
}
```

```tsx title="apps/panel/app/(auth)/login/login-form.tsx"
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient, authErrorMessage, safeRedirect } from '@ripopola/frontend-auth';

const schema = z.object({
  email: z.email('Revisá el correo'),
  password: z.string().min(1, 'Escribí tu contraseña'),
  rememberMe: z.boolean(),
});
type LoginInput = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get('next'));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    const { error } = await authClient.signIn.email(values);
    if (error) return setError(authErrorMessage(error));
    router.replace(next);
    router.refresh();
  }

  async function withGoogle() {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}${next}`,
      errorCallbackURL: `${window.location.origin}/login?error=google`,
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="email" label="Correo" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field id="password" label="Contraseña" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
        </Field>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('rememberMe')} /> Mantener la sesión
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <button type="button" onClick={withGoogle}>Continuar con Google</button>
      <p><Link href="/recuperar">¿Olvidaste tu contraseña?</Link> · <Link href="/registro">Crear cuenta</Link></p>
    </>
  );
}
```

`Field` es el componente de la 5.3 (etiqueta, campo y mensaje de error);
conviene moverlo a una librería de UI compartida (sección 13).

Qué mirar:

- **`autoComplete`** correcto: el gestor de contraseñas del navegador lo
  necesita (`current-password` en login, `new-password` en registro).
- **`rememberMe: false`** crea una cookie de sesión del navegador: se borra al
  cerrarlo.
- **`router.refresh()`** después de `replace`: el layout de `(privado)` se
  renderiza en el servidor y tiene que ver la cookie nueva.
- **Google**: `signIn.social` redirige el navegador a Google; al volver,
  Nest pone la cookie y redirige a `callbackURL`. Esa URL tiene que estar en
  los `trustedOrigins` de Better Auth (`CORS_ORIGINS`, curso de Nest), si no,
  Better Auth la rechaza.

### 3. Registro

```tsx title="apps/panel/app/(auth)/registro/register-form.tsx (lo importante)"
const schema = z.object({
  name: z.string().trim().min(2, 'Decinos tu nombre'),
  email: z.email('Revisá el correo'),
  password: z.string().min(10, 'Mínimo 10 caracteres'),
});

async function onSubmit(values: z.infer<typeof schema>) {
  const { error } = await authClient.signUp.email({
    ...values,
    callbackURL: `${window.location.origin}/`,    // a dónde lleva el enlace del correo
  });
  if (error) return setError(authErrorMessage(error));
  router.push(`/verificar-correo?email=${encodeURIComponent(values.email)}`);
}
```

La página `/verificar-correo` dice "te mandamos un enlace a ..." y ofrece
reenviarlo:

```tsx
await authClient.sendVerificationEmail({ email, callbackURL: `${window.location.origin}/` });
```

En desarrollo, el correo llega a **Mailpit** (curso de Nest): abrí
`http://localhost:8025` y hacé clic en el enlace.

:::info Quién se registra en el panel
Un registro crea una **persona** sin ayuntamiento. Para administrar un pueblo,
un superadmin (o el admin del ayuntamiento) le da una membresía. Hasta
entonces, el panel muestra "Todavía no administrás ningún pueblo" (9.5).
:::

### 4. Recuperar la contraseña

```tsx
// /recuperar: pide el correo
await authClient.requestPasswordReset({
  email,
  redirectTo: `${window.location.origin}/recuperar/nueva`,
});
// Siempre el mismo mensaje, exista o no la cuenta:
setInfo('Si hay una cuenta con ese correo, te llegó un enlace.');
```

```tsx
// /recuperar/nueva?token=...: elige la nueva
const token = useSearchParams().get('token');
const { error } = await authClient.resetPassword({ newPassword, token: token! });
if (!error) router.replace('/login?reset=ok');
```

Better Auth redirige a `redirectTo` con `?token=...` (o con
`?error=INVALID_TOKEN` si venció). Como configuraste
`revokeSessionsOnPasswordReset`, todas las sesiones abiertas se cierran.

### 5. Los errores, uno por uno

| Error | Qué ve el usuario |
| --- | --- |
| `INVALID_EMAIL_OR_PASSWORD` | Mensaje genérico, sin decir cuál de los dos |
| `EMAIL_NOT_VERIFIED` | El mensaje y un botón "reenviar el correo" |
| 429 | "Demasiados intentos" (rate limit de Nest) |
| `?error=google` al volver | "No pudimos ingresar con Google" |
| `?reset=ok` | "Listo, ya podés ingresar con tu nueva contraseña" |

<Ejercicio title="El login, de punta a punta">

Con la API corriendo, registrate, verificá el correo en Mailpit, ingresá y
salí. Después probá `localhost:4300/login?next=//google.com`.

<details>
<summary>Comprobación</summary>

Después del login, DevTools → *Application* → *Cookies* muestra
`better-auth.session_token` con `HttpOnly`. Con `next=//google.com`, el login
te deja en `/`, no en Google.

</details>

</Ejercicio>

## Errores comunes

- **Redirigir a `next` sin validar**: open redirect.
- **Olvidar `router.refresh()`**: el login "funciona" pero el layout sigue
  creyendo que no hay sesión hasta recargar.
- **`callbackURL` fuera de `trustedOrigins`**: Better Auth la rechaza.
- **Decir "ese correo no existe"** en el login o en recuperar.
- **`autoComplete` mal puesto**: el navegador no ofrece guardar la contraseña.
- **Hacer el login en una Server Action** (9.1).

<Resumen>

- Login, registro, Google y recuperar van desde el navegador con `authClient`.
- `next` solo acepta rutas relativas propias.
- Después de crear o cerrar la sesión: navegar y `router.refresh()`.
- Registro con verificación de correo obligatoria; en desarrollo, Mailpit.
- Mensajes que no revelan qué cuentas existen.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo evitás un open redirect en el parámetro `next` del login?**
Aceptando solo rutas que empiecen con una sola `/` (ni `//` ni URLs
absolutas) y usando una ruta por defecto en cualquier otro caso.

**2. ¿Qué pasa en el flujo de login con Google?**
El navegador va a Google, el usuario acepta, Google vuelve al callback de la
API con un código, la API lo canjea, crea o vincula la cuenta, pone la cookie y
redirige a la URL de vuelta del front.

**3. ¿Por qué el formulario de recuperar contraseña responde lo mismo exista o no la cuenta?**
Para no permitir la enumeración de usuarios.

**4. ¿Por qué hace falta `router.refresh()` después del login?**
Porque los Server Components (layouts y páginas) se renderizaron sin sesión;
refrescar los vuelve a pedir con la cookie nueva.

## Glosario

| Término | Qué es |
| --- | --- |
| Open redirect | Redirigir a una URL arbitraria que vino en la petición. |
| `callbackURL` | URL a la que vuelve el usuario después de un flujo externo (Google, el correo). |
| Verificación de correo | Confirmar que el usuario controla el correo con un enlace firmado. |
| Mailpit | Servidor de correo falso para desarrollo, con una bandeja web. |
