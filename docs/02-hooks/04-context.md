---
title: Context
sidebar_position: 4
description: createContext, Provider, useContext y use, para qué sirve y para qué no, el costo de re-render y cómo separar contextos, con el contexto de la unidad de medida y el panel del municipio.
---

# Context

<Tech ids={['react', 'nextdotjs']} />

<Estado tipo="construye">Un `MunicipalityContext` en el panel con el municipio activo, y un `UnitsProvider` para km o millas.</Estado>

## Concepto

Context permite que un componente **pase un valor a todo su subárbol** sin
props intermedias.

```tsx
import { createContext, use } from 'react';

type Units = 'km' | 'mi';
const UnitsContext = createContext<Units>('km'); // valor por defecto si no hay Provider

export function UnitsProvider({ units, children }: { units: Units; children: React.ReactNode }) {
  return <UnitsContext value={units}>{children}</UnitsContext>; // React 19: el contexto es el Provider
}

export function useUnits() {
  return use(UnitsContext); // o useContext(UnitsContext)
}
```

- En React 19 se escribe `<UnitsContext value={...}>`; `<UnitsContext.Provider>` sigue funcionando.
- `use(Context)` hace lo mismo que `useContext`, pero se puede llamar dentro de
  un `if` (es el único "hook" que se puede llamar condicionalmente).

### Para qué sirve y para qué no

| Sí | No |
| --- | --- |
| Valores que cambian poco y usa medio árbol: tema, idioma, usuario, municipio activo | Estado que cambia seguido (texto de un input, posición del mapa) |
| Inyectar dependencias (un cliente, una configuración) | Datos del servidor (eso es TanStack Query) |
| Evitar prop drilling de 3+ niveles | Reemplazar un store global con muchos consumidores |

### El costo

Cuando cambia el `value`, **todos** los componentes que leen ese contexto se
re-renderizan, aunque solo usen una parte. Por eso:

1. **Separá contextos** por frecuencia de cambio (estado y acciones en contextos distintos).
2. **Memoizá el `value`** si es un objeto (con React Compiler se hace solo).
3. Si el estado cambia mucho y lo leen muchos, usá **Zustand**, que permite
   suscribirse a una parte con un selector.

### Context y Server Components

Los Server Components **no pueden** leer contextos. Un Provider es un
componente de cliente (`'use client'`), pero puede envolver Server Components
que llegan como `children`.

## Si venís de Angular

<Angular>

Context es lo más parecido a la **inyección de dependencias jerárquica** de
Angular: un `providers: [...]` en un componente hace que sus descendientes
reciban esa instancia. Diferencias:

- En Angular inyectás **servicios** (objetos con métodos y estado propio). En
  React pasás **valores**; la lógica va en hooks.
- Angular no re-renderiza a todos los que inyectan un servicio cuando cambia
  algo adentro; React sí re-renderiza a todos los consumidores del contexto.
- No hay `providedIn: 'root'`: un módulo de JS ya es un singleton.

</Angular>

## En ripopola: el municipio activo en el panel

Un usuario puede administrar más de un municipio. El layout del panel sabe
cuál está activo y lo comparte:

`apps/panel/features/municipality/municipality-context.tsx`:

```tsx
'use client';

import { createContext, use } from 'react';

export type ActiveMunicipality = { id: string; name: string; plan: 'free' | 'premium' };

const MunicipalityContext = createContext<ActiveMunicipality | null>(null);

export function MunicipalityProvider({
  municipality,
  children,
}: {
  municipality: ActiveMunicipality;
  children: React.ReactNode;
}) {
  return <MunicipalityContext value={municipality}>{children}</MunicipalityContext>;
}

export function useActiveMunicipality() {
  const ctx = use(MunicipalityContext);
  if (!ctx) throw new Error('useActiveMunicipality se usa dentro de MunicipalityProvider');
  return ctx;
}
```

En el layout del panel (un Server Component que ya buscó el municipio, sección 9):

```tsx
<MunicipalityProvider municipality={municipality}>{children}</MunicipalityProvider>
```

Y en cualquier componente de cliente del panel:

```tsx
const { name, plan } = useActiveMunicipality();
```

:::tip El patrón "hook con error"
Exportar un hook que tira error si falta el Provider evita el `null` en todos
los consumidores y da un mensaje claro cuando te olvidás de envolver.
:::

## Errores comunes

- **Meter todo el estado de la app en un contexto**: todo se re-renderiza a cada cambio.
- **Pasar un objeto literal nuevo en cada render como `value`** sin compiler ni `useMemo`.
- **Usar `useContext` en un Server Component**: no funciona; pasá el dato por props.
- **Provider en el layout raíz por las dudas**: convierte en cliente lo que no hacía falta. Ponelo lo más abajo posible.

<Resumen>

- Context pasa un valor a un subárbol sin prop drilling.
- React 19: `<Ctx value>` y `use(Ctx)`.
- Ideal para valores que cambian poco; no para estado de alta frecuencia.
- Todos los consumidores se re-renderizan cuando cambia el `value`.

</Resumen>

## Preguntas de entrevista

**1. ¿Qué problema resuelve Context?**
El prop drilling: compartir un valor con muchos descendientes sin pasarlo por
cada nivel.

**2. ¿Context es un gestor de estado?**
No, es un mecanismo de transporte. El estado lo tiene un `useState` o
`useReducer` arriba; Context solo lo hace llegar.

**3. ¿Por qué Context puede causar problemas de rendimiento?**
Porque cada cambio del `value` re-renderiza a todos los consumidores. Se
mitiga separando contextos, memoizando el valor o usando un store con selectores.

**4. ¿Qué tiene de especial `use(Context)`?**
Que se puede llamar dentro de condiciones y bucles, a diferencia de `useContext` y del resto de los hooks.

**5. ¿Se puede usar Context en Server Components?**
No. Un Provider es de cliente; puede envolver Server Components pasados como
children, pero estos no pueden leer el contexto.

## Glosario

| Término | Qué es |
| --- | --- |
| Context | Canal para pasar un valor a un subárbol. |
| Provider | Componente que define el valor del contexto. |
| Consumidor | Componente que lee el contexto. |
| `use` | API de React 19 para leer contextos y promesas. |
