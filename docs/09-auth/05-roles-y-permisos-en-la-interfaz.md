---
title: Roles, ayuntamientos y permisos en la interfaz
sidebar_position: 5
description: Usar las membresías de /api/v1/me en el panel - el ayuntamiento activo en una cookie, getPanelContext, un helper can() que refleja la matriz de Nest, ocultar sin confiar, y qué hacer con un 403 o con el 2FA obligatorio.
---

# Roles, ayuntamientos y permisos en la interfaz

<Tech ids={['nextdotjs', 'react', 'nestjs']} />

<Estado tipo="construye">El selector de ayuntamiento activo, `getPanelContext()` y el helper `can()` que muestra u oculta acciones según el rol.</Estado>

## Concepto

En el curso de Nest armaste dos niveles de autorización:

- **Rol de plataforma**: `USER` o `SUPERADMIN`.
- **Membresía por ayuntamiento**: `ADMIN` (publica y gestiona miembros) o
  `EDITOR` (edita, no publica).

Y la matriz:

| Acción | Superadmin | Admin | Editor |
| --- | --- | --- | --- |
| Editar su pueblo y sus viviendas | ✅ | ✅ | ✅ |
| Publicar | ✅ | ✅ | ❌ |
| Gestionar miembros | ✅ | ✅ | ❌ |
| Crear o borrar pueblos | ✅ | ❌ | ❌ |

El panel recibe las membresías en `/api/v1/me` y las usa para **la
experiencia**: no mostrar un botón "Publicar" que va a dar 403. La decisión
real la sigue tomando `TownPolicy` en Nest.

### El ayuntamiento activo

Una persona puede ser miembro de varios ayuntamientos. El panel trabaja con
uno a la vez, elegido en un selector. ¿Dónde se guarda?

| Opción | Problema |
| --- | --- |
| Estado de React | Se pierde al recargar; el servidor no lo ve |
| `localStorage` | El servidor no lo ve: los Server Components no saben qué renderizar |
| En la URL (`/ayuntamientos/[id]/viviendas`) | Correcto y compartible, pero alarga todas las rutas |
| **Cookie** | El servidor la lee al renderizar; sobrevive a recargas |

Ripopola usa una cookie (`rp_org`) y **siempre la valida** contra las
membresías: si el valor no es de un ayuntamiento del usuario, se usa el
primero que sí lo es.

## Si venís de Angular

<Angular>

Lo que hacías con una directiva estructural tipo `*hasRole="'ADMIN'"` o un
pipe, acá es una función `can()` y un `&&` en el JSX. La lógica de quién
puede qué se escribe una vez y se usa en el servidor y en el cliente.

</Angular>

## En ripopola

### 1. Los permisos, en un solo archivo

```ts title="apps/panel/features/auth/permissions.ts"
import type { Me } from './me';

export type PanelAction = 'edit' | 'publish' | 'manageMembers' | 'createTown' | 'deleteTown';

const ALLOWED: Record<PanelAction, Array<'ADMIN' | 'EDITOR'>> = {
  edit: ['ADMIN', 'EDITOR'],
  publish: ['ADMIN'],
  manageMembers: ['ADMIN'],
  createTown: [],
  deleteTown: [],
};

/** Refleja TownPolicy de Nest. Solo para mostrar u ocultar: Nest decide. */
export function can(me: Me, action: PanelAction, organizationId: string): boolean {
  if (me.platformRole === 'SUPERADMIN') return true;
  const membership = me.memberships.find((m) => m.organizationId === organizationId);
  return !!membership && ALLOWED[action].includes(membership.role);
}
```

Sin `server-only`: lo usan Server y Client Components. Si la matriz cambia
en Nest y no acá, lo peor que pasa es un botón de más que recibe un 403
manejado, nunca un permiso de más.

:::tip Un paso más: que Nest mande los permisos
En vez de duplicar la matriz, `/api/v1/me` puede devolver las acciones
permitidas por ayuntamiento (`permissions: { [orgId]: ['edit', 'publish'] }`).
Así el front no conoce reglas, solo las lee. Es lo que conviene cuando la
matriz crece.
:::

### 2. El contexto del panel

```ts title="apps/panel/features/municipality/context.ts"
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverApi } from '@ripopola/frontend-api/server';
import { requireMe } from '@/features/auth/me';

export const ORG_COOKIE = 'rp_org';

export const getPanelContext = cache(async () => {
  const me = await requireMe();
  const wanted = (await cookies()).get(ORG_COOKIE)?.value;

  const membership =
    me.memberships.find((m) => m.organizationId === wanted) ?? me.memberships[0];
  if (!membership && me.platformRole !== 'SUPERADMIN') redirect('/sin-ayuntamiento');

  return {
    me,
    municipalityId: membership?.organizationId ?? wanted ?? '',
    role: membership?.role ?? null,
    api: await serverApi(),
  };
});
```

Es el `getPanelContext()` que ya usaste en el 7.7. El superadmin puede
entrar a cualquier ayuntamiento desde su propia pantalla; acá se simplifica.

### 3. Cambiar de ayuntamiento

```ts title="apps/panel/features/municipality/actions.ts"
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireMe } from '@/features/auth/me';
import { ORG_COOKIE } from './context';

export async function switchMunicipality(organizationId: string) {
  const id = z.uuid().parse(organizationId);
  const me = await requireMe();
  const isMember = me.memberships.some((m) => m.organizationId === id);
  if (!isMember && me.platformRole !== 'SUPERADMIN') return;

  (await cookies()).set(ORG_COOKIE, id, { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 90 });
  redirect('/');                     // vuelve al resumen con el ayuntamiento nuevo
}
```

Ojo: `context.ts` tiene `server-only` y exporta una constante; la acción la
importa (no al revés), así que no se rompe la regla de "un archivo
`'use server'` solo exporta funciones async".

### 4. Mostrar u ocultar

En un Server Component:

```tsx title="apps/panel/app/(privado)/viviendas/[id]/page.tsx (fragmento)"
const { me, municipalityId } = await getPanelContext();

return (
  <header className="flex justify-between">
    <h1>{listing.title}</h1>
    {can(me, 'publish', municipalityId) ? (
      <PublishButton id={listing.id} published={listing.published} />
    ) : (
      <p className="text-sm text-muted-foreground">Un administrador del ayuntamiento tiene que publicarla.</p>
    )}
  </header>
);
```

En un Client Component, con `useMe()` (9.4) y el `municipalityId` del
contexto del 2.4.

Accesibilidad: si una acción no está permitida, mejor **no mostrar el botón**
y explicar por qué, que un botón deshabilitado sin motivo (3.5).

### 5. Cuando Nest dice 403

Siempre puede pasar (cambió un rol mientras el usuario tenía la pestaña
abierta). El manejo:

- En una Server Action: devolver `{ ok: false, error: 'No tenés permiso...' }` (8.1).
- En una mutación de TanStack Query: el `onError` muestra el `problem.title` (4.3).
- **`type: 'two-factor-required'`**: el guard de Nest exige 2FA a los
  administradores. El panel lo detecta y lleva a activarlo:

```ts
if (error instanceof ApiError && error.problem.type === 'two-factor-required') {
  router.push('/seguridad/dos-pasos');   // 9.6
}
```

Mejor todavía: el layout privado mira `me.twoFactorEnabled` y, si el usuario
es admin y no lo tiene, muestra un aviso permanente antes de que choque con el 403.

## Errores comunes

- **Ocultar el botón y creer que está protegido.**
- **Confiar en la cookie `rp_org`** sin validarla contra las membresías.
- **Guardar el ayuntamiento activo en `localStorage`**: el servidor no lo ve.
- **Duplicar la matriz en muchos componentes**: un solo `can()` (o permisos que vienen de Nest).
- **Botones deshabilitados sin explicación.**

<Resumen>

- `/api/v1/me` trae rol de plataforma y membresías; el panel las usa para la UI.
- `can()` refleja la matriz de Nest; Nest sigue decidiendo.
- Ayuntamiento activo en una cookie validada contra las membresías.
- `getPanelContext()` junta usuario, ayuntamiento, rol y cliente con sesión.
- Todo 403 se maneja; `two-factor-required` lleva a activar el 2FA.

</Resumen>

## Preguntas de entrevista

**1. Si ocultás un botón según el rol, ¿la acción está protegida?**
No. Ocultar es experiencia; la autorización la hace el backend en cada
endpoint. El front tiene que manejar el 403 igual.

**2. ¿Dónde guardás una selección que el servidor necesita para renderizar?**
En una cookie (o en la URL), no en `localStorage`, porque el servidor no puede
leer `localStorage`.

**3. ¿Cómo evitás duplicar reglas de permisos entre front y back?**
Haciendo que el backend devuelva las acciones permitidas y que el front solo
las lea; si se duplican, en un único módulo y sabiendo que el back manda.

**4. ¿Qué es RBAC y qué agrega un permiso por recurso?**
RBAC asigna permisos por rol. Por recurso significa que el rol depende de la
relación con ese recurso (admin de *este* ayuntamiento, no de cualquiera).

## Glosario

| Término | Qué es |
| --- | --- |
| RBAC | Control de acceso basado en roles. |
| Membresía | Relación usuario-ayuntamiento con un rol. |
| Ayuntamiento activo | El que el panel está mostrando, guardado en `rp_org`. |
| `can()` | Helper que dice si la UI debe ofrecer una acción. |
