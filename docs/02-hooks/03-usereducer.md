---
title: useReducer
sidebar_position: 3
description: Estado con reducer y acciones tipadas, cuándo conviene sobre useState, uniones discriminadas y el asistente de publicación de un pueblo en el panel.
---

# useReducer

<Tech ids={['react', 'typescript']} />

<Estado tipo="construye">El estado del asistente de "publicar vivienda" en el panel, con pasos, datos y errores.</Estado>

## Concepto

Un **reducer** es una función pura `(estado, acción) => nuevoEstado`. En vez de
llamar a varios setters, el componente **despacha acciones** que describen qué
pasó, y el reducer decide cómo cambia el estado.

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'next' });
```

### Cuándo conviene

| `useState` | `useReducer` |
| --- | --- |
| Valores independientes y simples | Varios valores que cambian juntos |
| Pocas formas de cambiar | Muchas transiciones con reglas |
| | Querés testear la lógica sin el componente |
| | El siguiente estado depende de varias partes del actual |

Es el mismo patrón que Redux, pero local a un componente.

### Acciones tipadas con uniones discriminadas

TypeScript hace que cada `type` tenga su propio payload y que el `switch` sea exhaustivo:

```ts
type Action =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'update'; field: keyof Draft; value: string }
  | { type: 'submitFailed'; message: string };
```

## Si venís de Angular

<Angular>

Es lo que hacés con **NgRx** (acciones y reducers) o con **SignalStore**
(`withMethods` que llaman a `patchState`), pero a escala de un componente y sin
librería. Si alguna vez escribiste un reducer de NgRx, ya sabés escribir uno
para `useReducer`: misma pureza, misma inmutabilidad.

</Angular>

## En ripopola: asistente de publicación

`apps/panel/features/listings/publish-wizard-reducer.ts`:

```ts
export type Draft = { title: string; price: string; townId: string };

export type WizardState = {
  step: 1 | 2 | 3;
  draft: Draft;
  error: string | null;
};

export type WizardAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'update'; field: keyof Draft; value: string }
  | { type: 'submitFailed'; message: string };

export const initialWizard: WizardState = {
  step: 1,
  draft: { title: '', price: '', townId: '' },
  error: null,
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'next':
      return { ...state, step: state.step < 3 ? ((state.step + 1) as WizardState['step']) : 3, error: null };
    case 'back':
      return { ...state, step: state.step > 1 ? ((state.step - 1) as WizardState['step']) : 1 };
    case 'update':
      return { ...state, draft: { ...state.draft, [action.field]: action.value } };
    case 'submitFailed':
      return { ...state, error: action.message };
    default: {
      const exhaustive: never = action; // si agregás una acción y no la manejás, no compila
      return exhaustive;
    }
  }
}
```

En el componente:

```tsx
'use client';

import { useReducer } from 'react';
import { initialWizard, wizardReducer } from './publish-wizard-reducer';

export function PublishWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizard);

  return (
    <div>
      <p>Paso {state.step} de 3</p>
      {state.step === 1 && (
        <input
          value={state.draft.title}
          onChange={(e) => dispatch({ type: 'update', field: 'title', value: e.target.value })}
        />
      )}
      {state.error && <p role="alert">{state.error}</p>}
      <button onClick={() => dispatch({ type: 'back' })} disabled={state.step === 1}>Atrás</button>
      <button onClick={() => dispatch({ type: 'next' })}>Siguiente</button>
    </div>
  );
}
```

### Testearlo sin React

```ts
import { describe, expect, it } from 'vitest';
import { initialWizard, wizardReducer } from './publish-wizard-reducer';

describe('wizardReducer', () => {
  it('no pasa del paso 3', () => {
    const s = { ...initialWizard, step: 3 as const };
    expect(wizardReducer(s, { type: 'next' }).step).toBe(3);
  });
});
```

:::info ¿Y los formularios?
Para los campos con validación vas a usar React Hook Form (5.3). El reducer
maneja el **flujo** (pasos, errores globales); el formulario, los campos.
:::

## Errores comunes

- **Mutar el estado dentro del reducer**: tiene que devolver uno nuevo.
- **Efectos en el reducer** (llamar a la API, `localStorage`): el reducer es puro;
  los efectos van en el evento que despacha.
- **Un reducer gigante para toda la app**: para estado global usá Zustand (4.4).

<Resumen>

- `useReducer(reducer, inicial)` → `[estado, dispatch]`.
- El reducer es puro: `(estado, acción) => nuevo estado`.
- Conviene cuando hay varias transiciones o valores que cambian juntos.
- Uniones discriminadas + `never` = acciones exhaustivas.

</Resumen>

## Preguntas de entrevista

**1. ¿Cuándo usás `useReducer` en vez de `useState`?**
Cuando el estado tiene varias partes que cambian juntas o muchas transiciones
con reglas, y cuando quiero testear la lógica aparte del componente.

**2. ¿Por qué el reducer tiene que ser puro?**
Porque React puede llamarlo más de una vez (StrictMode) y porque su valor está
en ser predecible y testeable: misma entrada, misma salida.

**3. ¿Qué ventaja da tipar las acciones con una unión discriminada?**
TypeScript infiere el payload de cada `type` y, con `never`, obliga a manejar todas las acciones.

**4. ¿`useReducer` reemplaza a Redux?**
Para estado local sí. Redux agrega un store global, middleware y DevTools;
`useReducer` + Context se acerca pero sin suscripciones selectivas.

## Glosario

| Término | Qué es |
| --- | --- |
| Reducer | Función pura que calcula el estado siguiente. |
| Acción | Objeto que describe qué pasó (`{ type: 'next' }`). |
| `dispatch` | Función que envía una acción al reducer. |
| Unión discriminada | Unión de tipos que se distinguen por un campo literal. |
