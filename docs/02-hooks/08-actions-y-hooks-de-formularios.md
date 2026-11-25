---
title: Actions y los hooks de formularios de React 19
sidebar_position: 8
description: Actions, useActionState, useFormStatus y useOptimistic - formularios con estado de envío, errores y actualizaciones optimistas, con el formulario de contacto a un municipio.
---

# Actions y los hooks de formularios de React 19

<Tech ids={['react', 'nextdotjs']} />

<Estado tipo="construye">El formulario "Contactar al municipio" con estado de envío y errores, y el favorito optimista.</Estado>

## Concepto

Una **Action** es una función (normalmente async) que se usa dentro de una
transición. React 19 le dio soporte nativo en los formularios:

```tsx
<form action={enviar}>
  <input name="mensaje" />
  <button>Enviar</button>
</form>
```

- `action` recibe una **función** (no una URL). React la llama con el `FormData`.
- Mientras corre, el formulario está en una transición (`isPending`).
- Al terminar bien, React **resetea** los campos no controlados.
- En Next, esa función puede ser una **Server Action** (se ejecuta en el
  servidor, sección 8). Acá la vemos del lado de React.

### `useActionState`

Estado que se actualiza con el resultado de una Action:

```tsx
const [state, formAction, isPending] = useActionState(accion, estadoInicial);
```

- `accion(estadoAnterior, formData)` devuelve el estado nuevo (por ejemplo,
  errores de validación o "enviado").
- `formAction` va en el `action` del form.
- `isPending` indica que se está enviando.

### `useFormStatus`

Un componente **dentro** del form puede saber si se está enviando, sin props:

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Enviando…' : 'Enviar'}</button>;
}
```

### `useOptimistic`

Muestra el resultado esperado **antes** de que responda el servidor; si falla,
vuelve solo al valor real cuando termina la transición:

```tsx
const [optimisticFav, setOptimisticFav] = useOptimistic(isFavorite);

async function toggle() {
  startTransition(async () => {
    setOptimisticFav(!optimisticFav);
    await saveFavorite(townId, !optimisticFav);
  });
}
```

## Si venís de Angular

<Angular>

| Angular | React 19 |
| --- | --- |
| `(ngSubmit)` + un signal `submitting` + `try/finally` | `useActionState` (te da `isPending`) |
| `form.reset()` después de guardar | Reset automático de campos no controlados |
| Pasar `submitting` por input al botón | `useFormStatus()` en el botón |
| Actualizar el signal antes del `http.post` y revertir en `catchError` | `useOptimistic` (revierte solo) |

</Angular>

## En ripopola: contactar al municipio

```tsx title="apps/web/features/contact/contact-form.tsx"
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

type ContactState = { status: 'idle' | 'sent' | 'error'; message?: string; fieldErrors?: Record<string, string> };

async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const message = String(formData.get('message') ?? '').trim();
  if (message.length < 20) {
    return { status: 'error', fieldErrors: { message: 'Contale un poco más al municipio (mínimo 20 caracteres).' } };
  }
  const api = process.env.NEXT_PUBLIC_API_URL ?? ''; // '' en desarrollo: pasa por el rewrite (4.1)
  const res = await fetch(`${api}/api/v1/municipalities/${formData.get('municipalityId')}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) return { status: 'error', message: 'No pudimos enviar el mensaje. Probá de nuevo.' };
  return { status: 'sent' };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded bg-brand-600 px-4 py-2 text-white">
      {pending ? 'Enviando…' : 'Enviar mensaje'}
    </button>
  );
}

export function ContactForm({ municipalityId }: { municipalityId: string }) {
  const [state, formAction] = useActionState(sendContact, { status: 'idle' });

  if (state.status === 'sent') return <p role="status">¡Listo! El municipio te va a responder por correo.</p>;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="municipalityId" value={municipalityId} />
      <label className="block">
        <span>Tu mensaje</span>
        <textarea name="message" rows={5} aria-invalid={!!state.fieldErrors?.message} aria-describedby="message-error" />
      </label>
      {state.fieldErrors?.message && <p id="message-error" className="text-sm text-red-700">{state.fieldErrors.message}</p>}
      {state.message && <p role="alert">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
```

`useFormStatus` se importa de **`react-dom`**, no de `react`.

:::info Lo que sigue
En desarrollo, `/api/...` funciona porque Next reenvía `/api/*` a Nest; en
producción `NEXT_PUBLIC_API_URL` apunta a `api.ripopola.com` (4.1). En el 8.2 este mismo formulario pasa a una **Server
Action**, que valida con Zod en el servidor y funciona incluso sin JavaScript.
:::

## Errores comunes

- **Importar `useFormStatus` de `react`**: es de `react-dom`.
- **Usar `useFormStatus` en el mismo componente que tiene el `<form>`**: solo
  funciona en un hijo del form.
- **Esperar que `useOptimistic` se mantenga fuera de una transición**: se usa
  dentro de `startTransition` o de una Action.
- **Controlar todos los campos** con estado cuando la Action ya lee el `FormData`.

<Resumen>

- `<form action={fn}>` llama a la función con el `FormData` dentro de una transición.
- `useActionState` = resultado de la Action + `isPending`.
- `useFormStatus` (de `react-dom`) da el estado del form padre.
- `useOptimistic` muestra el resultado esperado y se revierte solo.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es una Action en React 19?**
Una función, normalmente async, que se ejecuta dentro de una transición. Los
formularios la aceptan en `action` y React maneja el estado pendiente, los errores y el reset.

**2. ¿Para qué sirve `useActionState`?**
Para guardar el resultado de una Action (errores, éxito) y obtener `isPending`
sin escribir el estado a mano.

**3. ¿Qué limitación tiene `useFormStatus`?**
Solo lee el estado del `form` padre, así que tiene que usarse en un componente
hijo, no en el que declara el form.

**4. ¿Cómo funciona `useOptimistic` si el servidor falla?**
El valor optimista vive solo durante la transición; al terminar, vuelve al
valor real que vino por props, así que el cambio "se deshace" solo.

**5. ¿Qué ventaja tienen las Actions sobre el clásico `onSubmit` con `preventDefault`?**
Menos código de estado, integración con transiciones y Suspense, reset
automático y, con Server Actions, mejora progresiva sin JavaScript.

## Glosario

| Término | Qué es |
| --- | --- |
| Action | Función usada en una transición, por ejemplo en `form action`. |
| `FormData` | API del navegador con los campos de un formulario. |
| Actualización optimista | Mostrar el resultado antes de confirmarlo. |
| Mejora progresiva | Que funcione sin JavaScript y mejore cuando carga. |
