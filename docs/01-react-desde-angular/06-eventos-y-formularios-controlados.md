---
title: Eventos y formularios controlados
sidebar_position: 6
description: Manejadores de eventos, eventos sintéticos, propagación, inputs controlados y no controlados, y un primer filtro de pueblos por nombre.
---

# Eventos y formularios controlados

<Tech ids={['react', 'typescript']} />

<Estado tipo="construye">Un filtro de pueblos por nombre y país, controlado por estado. Es la primera versión del buscador del 4.1.</Estado>

## Concepto

### Manejadores

```tsx
<button onClick={() => select(town.id)}>Ver</button>
<input onChange={(e) => setQuery(e.target.value)} />
<form onSubmit={(e) => { e.preventDefault(); buscar(); }}>
```

- Se pasa **una función**, no su resultado.
- El evento es un **SyntheticEvent**: un envoltorio de React con la misma
  interfaz que el nativo (`target`, `preventDefault`, `stopPropagation`).
- Los eventos burbujean igual que en el DOM. `e.stopPropagation()` corta.
- React escucha en la raíz de la app (delegación), no en cada nodo.

Tipos útiles en TypeScript:

```tsx
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {}
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {}
function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {}
```

### Inputs controlados y no controlados

| | Controlado | No controlado |
| --- | --- | --- |
| Quién tiene el valor | El estado de React (`value` + `onChange`) | El DOM (`defaultValue`, lo leés al enviar) |
| Re-render por tecla | Sí | No |
| Para qué | Filtros en vivo, validación al escribir, formatear | Formularios largos, Server Actions, React Hook Form |

```tsx
// Controlado
<input value={query} onChange={(e) => setQuery(e.target.value)} />

// No controlado: el valor se lee del FormData al enviar
<form action={buscar}>
  <input name="q" defaultValue="" />
</form>
```

:::warning value sin onChange
`<input value={x} />` sin `onChange` queda de solo lectura y React avisa. Si
querés un valor inicial editable sin controlar, es `defaultValue`.
:::

### Eventos vs efectos

La lógica que ocurre **porque el usuario hizo algo** (clic, enviar) va en el
manejador del evento, no en un `useEffect`. Es uno de los errores más comunes
en código React (lo vemos en el 2.1).

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| `(click)="fn()"` | `onClick={fn}` |
| `(input)="q.set($event.target.value)"` | `onChange={(e) => setQ(e.target.value)}` |
| `[(ngModel)]` / `[formField]` en Signal Forms | `value` + `onChange` (no hay two-way binding) |
| Reactive Forms (`FormGroup`, validadores) | React Hook Form + Zod (tema 5.3) |
| `(ngSubmit)` | `onSubmit` con `e.preventDefault()`, o `action` en el `form` |

En React el `onChange` de un input se dispara **en cada tecla** (como el
evento `input` del DOM), no al perder el foco.

</Angular>

## En ripopola: filtro de pueblos

```tsx
'use client';

import { useState } from 'react';

type Town = { id: string; name: string; country: 'ES' | 'IT' };

export function TownFilter({ towns }: { towns: Town[] }) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState<'ALL' | Town['country']>('ALL');

  // Estado derivado: se calcula en cada render
  const normalized = query.trim().toLocaleLowerCase('es');
  const visible = towns.filter(
    (t) =>
      (country === 'ALL' || t.country === country) &&
      t.name.toLocaleLowerCase('es').includes(normalized),
  );

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Nombre del pueblo</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">País</span>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as typeof country)}
          className="mt-1 rounded border px-3 py-2"
        >
          <option value="ALL">Todos</option>
          <option value="ES">España</option>
          <option value="IT">Italia</option>
        </select>
      </label>

      <p aria-live="polite">{visible.length} pueblos</p>
      <ul>{visible.map((t) => <li key={t.id}>{t.name}</li>)}</ul>
    </form>
  );
}
```

Esto filtra en el navegador una lista que ya tenés. En la sección 5 el filtro
pasa a pedir a la API (con *debounce*) y en el 4.6 el estado se mueve a la URL
para que la búsqueda se pueda compartir y la indexe Google.

## Errores comunes

- **`onClick={fn()}`**: se ejecuta en el render.
- **Olvidar `e.preventDefault()`** en `onSubmit`: el navegador recarga la página.
- **Cambiar de `undefined` a un string en `value`**: React avisa que pasaste de
  no controlado a controlado. Inicializá con `''`.
- **Guardar en estado la lista filtrada**: es derivada.

<Resumen>

- Los manejadores reciben funciones; el evento es sintético pero se usa como el nativo.
- Controlado: el estado manda (`value` + `onChange`). No controlado: manda el DOM (`defaultValue`).
- La lógica disparada por el usuario va en el manejador, no en un efecto.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es un SyntheticEvent?**
Un envoltorio de React sobre el evento nativo con la misma interfaz y
comportamiento consistente entre navegadores. React usa delegación en la raíz.

**2. ¿Diferencia entre input controlado y no controlado?**
En el controlado el valor vive en el estado de React y se actualiza en cada
`onChange`. En el no controlado vive en el DOM y se lee al enviar (o con una ref).

**3. ¿Cuándo preferís no controlados?**
En formularios grandes para evitar renders por tecla, con Server Actions que
leen `FormData`, y con React Hook Form, que los usa por dentro.

**4. ¿Por qué el `onChange` de React se dispara en cada tecla?**
Porque React lo mapea al evento `input` del DOM para que el estado refleje
siempre lo que hay escrito.

**5. ¿Dónde va la lógica que responde a una acción del usuario?**
En el manejador del evento. Un efecto es para sincronizar con algo externo,
no para reaccionar a clics.

## Glosario

| Término | Qué es |
| --- | --- |
| Manejador | Función que responde a un evento (`onClick`, `onSubmit`). |
| SyntheticEvent | Evento envuelto por React. |
| Controlado | Input cuyo valor viene del estado. |
| No controlado | Input cuyo valor vive en el DOM. |
| `aria-live` | Atributo que hace que los lectores de pantalla anuncien cambios. |
