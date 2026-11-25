---
title: Qué es React (pensado desde Angular)
sidebar_position: 1
description: El modelo mental de React comparado con Angular - la UI como función del estado, render, componentes como funciones, React 19 y el lugar de Next.js.
---

# Qué es React (pensado desde Angular)

<Tech ids={['react', 'nextdotjs', 'angular']} />

<Estado tipo="concepto">El modelo mental que vas a usar en todo el curso.</Estado>

## Concepto

React es una **librería para construir interfaces con componentes**. No es un
framework: no trae router, ni cliente HTTP, ni formularios, ni inyección de
dependencias. Eso lo ponen otras librerías o un framework como **Next.js**.

La idea central entra en una línea:

```
UI = f(estado)
```

Un componente es una **función** que recibe datos (props y estado) y devuelve
una descripción de lo que se tiene que ver (JSX). Cuando el estado cambia,
React **vuelve a llamar a la función**, compara el resultado nuevo con el
anterior y aplica en el DOM solo las diferencias.

```tsx
function TownCard({ name, population }: { name: string; population: number }) {
  return (
    <article>
      <h3>{name}</h3>
      <p>{population.toLocaleString('es-ES')} habitantes</p>
    </article>
  );
}
```

No hay clase, ni decorador, ni plantilla separada: la función **es** el
componente, y el JSX es JavaScript.

### Las tres fases

| Fase | Qué pasa |
| --- | --- |
| **Trigger** | Algo pide un render: la primera carga o un cambio de estado. |
| **Render** | React llama a tus componentes para saber qué se tiene que ver. Tiene que ser **puro**: sin efectos. |
| **Commit** | React aplica los cambios mínimos en el DOM y después corre los efectos. |

"Render" en React **no** significa pintar la pantalla: significa *llamar a la
función del componente*. Un render que no cambia nada no toca el DOM.

### Por qué React domina el mercado

- Es la librería de UI más usada: hay más trabajo, más librerías y más
  respuestas.
- El modelo es chico: funciones, props, estado y hooks.
- Los frameworks grandes (Next.js, React Router, Expo para móvil) se apoyan en
  él, así que lo que aprendés acá sirve también para React Native.

### React 19 en una tabla

| Novedad | Para qué |
| --- | --- |
| **Server Components** | Componentes que corren solo en el servidor (los usa Next). |
| **Actions** y `useActionState` | Formularios y mutaciones con estado de carga y errores integrado. |
| `useOptimistic` | Mostrar el resultado antes de que responda el servidor. |
| `use` | Leer una promesa o un contexto dentro del render. |
| `ref` como prop | Ya no hace falta `forwardRef`. |
| **React Compiler** (1.0) | Memoiza solo; casi nunca escribís `useMemo` a mano. |
| `<Activity>` y `useEffectEvent` (19.2) | Ocultar partes de la UI conservando su estado; eventos dentro de efectos sin dependencias de más. |

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| Framework completo con opiniones (router, HTTP, forms, DI) | Librería de UI; el resto lo elegís o lo pone Next |
| Componente = clase + decorador + plantilla HTML | Componente = función que devuelve JSX |
| Plantilla con sintaxis propia (`@if`, `@for`, `[prop]`, `(evento)`) | JSX: JavaScript con etiquetas (`cond && ...`, `.map()`, `prop={}`, `onClick={}`) |
| Signals y detección de cambios: Angular actualiza lo que leyó cada signal | Re-render: React vuelve a llamar a la función y compara |
| `@Input()` / `input()` | props (parámetros de la función) |
| `@Output()` / `output()` | props que son funciones (`onSelect`) |
| `signal()` | `useState()` |
| `computed()` | una variable calculada en el render (o `useMemo`) |
| `effect()` | `useEffect()` (con mucho menos uso del que creés) |
| Servicios + inyección de dependencias | Hooks propios, Context y módulos de JS |
| RxJS para asincronía | Promesas, `async/await` y TanStack Query |
| `ng-content` | `children` |

La diferencia más grande no es de sintaxis: en Angular **mutás** estado y el
framework detecta qué cambió; en React **reemplazás** el estado por uno nuevo
(inmutable) y React vuelve a ejecutar el componente. Si mutás un objeto en
React, React no se entera.

</Angular>

## Dónde entra Next.js

React solo sabe dibujar componentes. Una app real necesita rutas, render en
servidor para SEO, imágenes optimizadas, caché, despliegue. **Next.js** es el
framework que agrega todo eso encima de React, y es lo que el equipo de React
recomienda para empezar un proyecto nuevo.

Para ripopola es clave: las páginas de pueblos tienen que salir completas en
el HTML para que Google las indexe, y eso lo da el render en servidor de Next.

<Alternativa title="Vite + React (SPA)">
Muchas empresas tienen apps React "puras" hechas con Vite: todo se dibuja en
el navegador (CSR) y el SEO es pobre. Sirven para paneles internos. En el curso
de referencia se usa Vite para las primeras apps; acá no hace falta porque
React se aprende igual dentro de Next. Lo vemos en la sección 13.
</Alternativa>

## Errores comunes

- **Pensar en "cuándo se actualiza el DOM"** en vez de "qué estado describe esta UI".
- **Mutar estado** (`town.name = 'x'`) y esperar que la pantalla cambie.
- **Meter efectos en el render** (llamar a la API en el cuerpo de la función):
  el render tiene que ser puro.
- **Buscar "el servicio de React"**: no hay DI; la lógica compartida va en
  hooks propios o en módulos.

<Resumen>

- React es una librería de UI: `UI = f(estado)`.
- Un componente es una función pura que devuelve JSX; render = llamar a esa función.
- Trigger, render y commit: solo el commit toca el DOM.
- El estado es inmutable: se reemplaza, no se muta.
- Next.js es el framework que agrega rutas, servidor, SEO y caché encima de React.

</Resumen>

## Preguntas de entrevista

**1. ¿React es una librería o un framework? ¿Qué implica?**
Una librería de UI. No trae router, HTTP, formularios ni DI: los elegís vos o
los pone un framework como Next. Da más libertad y más decisiones que tomar.

**2. ¿Qué significa que la UI es una función del estado?**
Que para un mismo estado y props, el componente devuelve siempre la misma UI.
No actualizás el DOM a mano: cambiás el estado y React recalcula y aplica las diferencias.

**3. ¿Qué es un render en React?**
Llamar a la función del componente para obtener el JSX. No es pintar: si el
resultado no cambia, React no toca el DOM.

**4. ¿Cuáles son las fases de una actualización?**
Trigger (algo pide el render), render (React llama a los componentes, debe ser
puro) y commit (aplica los cambios al DOM y luego corre los efectos).

**5. ¿Cuál es la diferencia de fondo entre la reactividad de Angular y la de React?**
Angular con signals sabe exactamente qué leyó cada vista y actualiza eso.
React vuelve a ejecutar el componente entero y compara el resultado; por eso el
estado debe ser inmutable y el render barato.

**6. ¿Qué aporta React 19?**
Server Components, Actions con `useActionState`, `useOptimistic`, `use`, `ref`
como prop y el React Compiler estable que memoiza automáticamente.

## Glosario

| Término | Qué es |
| --- | --- |
| Componente | Función que recibe props y devuelve JSX. |
| JSX | Sintaxis de etiquetas dentro de JavaScript que se compila a llamadas de React. |
| Render | Llamar al componente para calcular la UI. |
| Commit | Aplicar las diferencias al DOM real. |
| Props | Los datos que un componente recibe de su padre. |
| Estado | Datos propios del componente que, al cambiar, disparan un render. |
| Next.js | Framework de React con rutas, servidor, caché y optimizaciones. |
