---
title: Listas, keys e identidad
sidebar_position: 7
description: Renderizar listas con map, para qué sirve key, por qué no usar el índice, cómo React decide si un componente conserva su estado y el truco de resetear con key.
---

# Listas, keys e identidad

<Tech ids={['react']} />

<Estado tipo="construye">El listado de pueblos con keys estables y el reseteo del formulario de un pueblo con `key`.</Estado>

## Concepto

```tsx
<ul>
  {towns.map((town) => (
    <li key={town.id}>{town.name}</li>
  ))}
</ul>
```

`key` le dice a React **qué elemento es cuál** entre un render y el
siguiente. Con eso, si la lista se reordena, se filtra o se le agrega algo al
principio, React mueve los nodos existentes en vez de destruirlos y crearlos.

### Qué usar como key

| Opción | ¿Sirve? |
| --- | --- |
| `town.id` de la base | ✅ La mejor: estable y única. |
| `town.slug` | ✅ Si es único y no cambia mientras se ve la lista. |
| Índice del array | ⚠️ Solo si la lista nunca se reordena, filtra ni inserta. |
| `Math.random()` o `crypto.randomUUID()` en el render | ❌ Cambia en cada render: todo se recrea y se pierde el estado. |

La `key` tiene que ser única **entre hermanos**, no global.

### El bug del índice

Si usás el índice y borrás el primer pueblo, el que antes era el segundo pasa
a tener `key=0`. React cree que es "el mismo" que el viejo primero y le deja
**su estado** (un input con texto, un checkbox marcado, una foto cargando).
Resultado: el estado queda pegado al pueblo equivocado.

### Identidad: cuándo React conserva el estado

React asocia el estado a la **posición en el árbol** y al **tipo** de
componente (y a la `key` si la hay):

- Mismo tipo en la misma posición → conserva el estado.
- Otro tipo en esa posición → desmonta el viejo (pierde estado) y monta el nuevo.
- Misma posición pero **otra key** → lo trata como otro componente: estado nuevo.

Ese último punto es una herramienta: **cambiar la `key` resetea el estado**.

```tsx
// Al cambiar de pueblo, el formulario arranca de cero con los datos nuevos
<TownEditForm key={town.id} town={town} />
```

Es la forma correcta de "resetear cuando cambia una prop", en vez de un
`useEffect` que copia props a estado.

## Si venís de Angular

<Angular>

`key` es el `track` de `@for` (antes `trackBy` en `*ngFor`). Misma idea:
identificar cada elemento para reutilizar su vista. La diferencia es que en
Angular el `track` es obligatorio y en React la `key` también (si falta,
React avisa en consola y usa el índice).

No existe un equivalente directo al "reset por key" en Angular: allí lo harías
destruyendo el componente con un `@if` o reaccionando al cambio del input.

</Angular>

## En ripopola

### El listado

```tsx
<ul className="grid gap-4 sm:grid-cols-2">
  {towns.map((town) => (
    <li key={town.id}>
      <TownCard {...town} />
    </li>
  ))}
</ul>
```

La `key` va en el elemento que devuelve el `map` (el `li`), no adentro de
`TownCard`.

### Varias cosas por elemento

Si cada pueblo produce dos nodos hermanos, usá `Fragment` con key:

```tsx
import { Fragment } from 'react';

{towns.map((t) => (
  <Fragment key={t.id}>
    <dt>{t.name}</dt>
    <dd>{t.region}</dd>
  </Fragment>
))}
```

### Resetear el editor del panel

En el panel del municipio, la lista de pueblos está a la izquierda y el
formulario a la derecha. Al elegir otro pueblo, el formulario tiene que
olvidar lo que se estaba escribiendo:

```tsx
<TownEditForm key={selected.id} town={selected} />
```

<Ejercicio title="Ver el bug del índice">

En `/laboratorio`, armá una lista de pueblos donde cada fila tenga un
`<input placeholder="nota" />`. Usá el índice como `key`, escribí algo en la
primera fila y agregá un botón que borre el primer pueblo. ¿A qué pueblo quedó
pegada la nota? Cambiá a `key={town.id}` y repetí.

<details>
<summary>Qué tenés que ver</summary>

Con el índice, la nota queda en la fila que pasó a ser la primera (otro
pueblo). Con el id, la fila con la nota desaparece junto con su pueblo.

</details>
</Ejercicio>

## Errores comunes

- **Key en el componente de adentro** en vez del elemento que devuelve el `map`.
- **Keys generadas en el render** (`Math.random()`): se pierde todo el estado en cada render.
- **Índice como key en listas filtrables**: estado pegado al elemento equivocado.
- **Sincronizar props a estado con `useEffect`** cuando alcanzaba con una `key`.

<Resumen>

- `key` identifica a cada elemento de una lista entre renders.
- Usá ids estables; el índice solo en listas estáticas.
- React conserva el estado por tipo, posición y key.
- Cambiar la key de un componente lo resetea.

</Resumen>

## Preguntas de entrevista

**1. ¿Para qué sirve `key`?**
Para que React identifique cada elemento de una lista entre renders y pueda
reutilizar, mover o eliminar los correctos conservando su estado.

**2. ¿Por qué no usar el índice como key?**
Porque al insertar, borrar o reordenar, los índices pasan a otro elemento y
React reutiliza el estado y el DOM equivocados.

**3. ¿Cuándo React conserva el estado de un componente?**
Mientras se renderice el mismo tipo en la misma posición del árbol con la misma key.

**4. ¿Cómo reseteás el estado de un componente cuando cambia una prop?**
Dándole una `key` que dependa de esa prop: al cambiar, React lo monta de nuevo.

**5. ¿La key tiene que ser única en toda la app?**
No, solo entre hermanos de la misma lista.

## Glosario

| Término | Qué es |
| --- | --- |
| `key` | Identificador de un elemento entre sus hermanos. |
| Identidad | Lo que React usa para saber si un componente es "el mismo": tipo, posición y key. |
| Montar / desmontar | Crear o destruir un componente con su estado. |
