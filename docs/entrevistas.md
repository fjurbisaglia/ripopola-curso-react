---
title: Repaso para entrevistas
sidebar_label: Repaso para entrevistas
sidebar_position: 99
slug: /entrevistas
description: Todas las preguntas de entrevista del curso en un solo lugar, por sección, con la respuesta escondida para practicar.
---

# Repaso para entrevistas

Todas las preguntas del curso, en orden. Leé la pregunta, respondé en voz
alta como si estuvieras en la entrevista y recién después abrí la
respuesta. El enlace de cada tema lleva a la explicación completa.

:::tip Cómo practicar
Respondé con un ejemplo de ripopola siempre que puedas: "en mi proyecto,
la búsqueda de pueblos cercanos usa…". Un ejemplo real vale más que una
definición de memoria.
:::

## 1. React desde Angular

### [Qué es React (pensado desde Angular)](./01-react-desde-angular/01-que-es-react.md)

<details>
<summary>¿React es una librería o un framework? ¿Qué implica?</summary>

Una librería de UI. No trae router, HTTP, formularios ni DI: los elegís vos o
los pone un framework como Next. Da más libertad y más decisiones que tomar.

</details>

<details>
<summary>¿Qué significa que la UI es una función del estado?</summary>

Que para un mismo estado y props, el componente devuelve siempre la misma UI.
No actualizás el DOM a mano: cambiás el estado y React recalcula y aplica las diferencias.

</details>

<details>
<summary>¿Qué es un render en React?</summary>

Llamar a la función del componente para obtener el JSX. No es pintar: si el
resultado no cambia, React no toca el DOM.

</details>

<details>
<summary>¿Cuáles son las fases de una actualización?</summary>

Trigger (algo pide el render), render (React llama a los componentes, debe ser
puro) y commit (aplica los cambios al DOM y luego corre los efectos).

</details>

<details>
<summary>¿Cuál es la diferencia de fondo entre la reactividad de Angular y la de React?</summary>

Angular con signals sabe exactamente qué leyó cada vista y actualiza eso.
React vuelve a ejecutar el componente entero y compara el resultado; por eso el
estado debe ser inmutable y el render barato.

</details>

<details>
<summary>¿Qué aporta React 19?</summary>

Server Components, Actions con `useActionState`, `useOptimistic`, `use`, `ref`
como prop y el React Compiler estable que memoiza automáticamente.

</details>

### [El proyecto Next de ripopola, desde el día uno](./01-react-desde-angular/02-proyecto-next-dia-uno.md)

<details>
<summary>¿Por qué aprender React dentro de Next y no con una app Vite aparte?</summary>

Porque React es el mismo: un componente de cliente en Next es React normal.
Así lo aprendido queda en el producto real y de paso se ve dónde está la
frontera entre servidor y cliente.

</details>

<details>
<summary>¿Por qué separar el sitio público y el panel en dos apps?</summary>

Porque tienen necesidades opuestas: uno es público, cacheado y con SEO; el
otro es privado, dinámico y con sesión. Separadas, cada una tiene su
configuración, su despliegue y su escala, y comparten código por librerías.

</details>

<details>
<summary>¿Qué hace `'use client'`?</summary>

Marca un archivo como punto de entrada al bundle del navegador. Ese componente
y lo que importa se envían al cliente y se hidratan; el resto sigue en el servidor.

</details>

<details>
<summary>¿Qué es la hidratación?</summary>

El paso en el que React, en el navegador, toma el HTML que vino del servidor y
le conecta el estado y los eventos sin volver a crearlo.

</details>

<details>
<summary>¿Qué activa `cacheComponents` en Next 16?</summary>

El modelo de caché explícito con `'use cache'` y el prerender parcial: todo es
dinámico salvo lo que marcás como cacheado, y lo dinámico se envuelve en Suspense.

</details>

### [JSX](./01-react-desde-angular/03-jsx.md)

<details>
<summary>¿Qué es JSX y en qué se convierte?</summary>

Sintaxis de etiquetas dentro de JavaScript. El compilador la transforma en
llamadas (`jsx()`) que devuelven elementos de React, objetos que describen la UI.

</details>

<details>
<summary>¿Por qué no se puede usar `if` dentro de JSX?</summary>

Porque las llaves esperan una expresión que produzca un valor. Se usa ternario,
`&&` o se calcula antes del `return`.

</details>

<details>
<summary>¿Qué problema tiene `{items.length && <List />}`?</summary>

Si `length` es 0 dibuja un "0". Hay que usar una condición booleana: `items.length > 0 &&`.

</details>

<details>
<summary>¿JSX protege de XSS?</summary>

Sí, escapa todo el texto que se interpola. El riesgo aparece con
`dangerouslySetInnerHTML`, URLs `javascript:` en `href` o al inyectar HTML sin sanitizar.

</details>

<details>
<summary>¿Qué es un fragmento y para qué sirve?</summary>

`<>...</>` agrupa varios elementos sin agregar un nodo al DOM. Con `key` se usa
la forma larga `<Fragment key={...}>`.

</details>

### [Componentes, props y composición](./01-react-desde-angular/04-componentes-y-props.md)

<details>
<summary>¿Qué diferencia hay entre props y estado?</summary>

Las props vienen del padre y son de solo lectura. El estado es del componente y
al cambiar dispara un render. Lo que es prop para un hijo suele ser estado del padre.

</details>

<details>
<summary>¿Cómo se comunica un hijo con su padre?</summary>

El padre le pasa una función por props y el hijo la llama con los datos. No hay eventos propios.

</details>

<details>
<summary>¿Por qué React prefiere composición a herencia?</summary>

Porque `children` y las props con JSX cubren los casos de reutilización sin
acoplar jerarquías. Es más flexible y explícito.

</details>

<details>
<summary>¿Qué es el prop drilling y cómo se evita?</summary>

Pasar props por componentes intermedios que no las usan. Se evita componiendo
(pasando el elemento ya armado), con Context o con un store.

</details>

<details>
<summary>¿Por qué no hay que declarar componentes dentro de otros?</summary>

Porque en cada render se crea una función nueva, React la ve como otro tipo de
componente, desmonta el anterior y se pierde el estado.

</details>

<details>
<summary>¿Qué es un componente puro y por qué StrictMode renderiza dos veces?</summary>

Uno que, con la misma entrada, devuelve lo mismo y no tiene efectos en el
render. StrictMode lo llama dos veces en desarrollo para destapar impurezas.

</details>

### [Estado con useState](./01-react-desde-angular/05-estado-con-usestate.md)

<details>
<summary>¿Por qué `console.log(count)` después de `setCount(count + 1)` muestra el valor viejo?</summary>

Porque el estado es una foto del render actual. `setCount` agenda un render
nuevo; el valor cambia recién en ese render.

</details>

<details>
<summary>¿Cuándo usar la forma funcional del setter?</summary>

Cuando el valor nuevo depende del anterior, sobre todo con varias
actualizaciones seguidas o dentro de callbacks asíncronos.

</details>

<details>
<summary>¿Qué es el batching?</summary>

React agrupa las actualizaciones de estado de un mismo tick en un solo render.
Desde React 18 aplica también a promesas, timeouts y eventos nativos.

</details>

<details>
<summary>¿Por qué el estado tiene que ser inmutable?</summary>

Porque React compara referencias para decidir si algo cambió. Si mutás, la
referencia es la misma y no hay render (y además rompés memoizaciones).

</details>

<details>
<summary>¿Qué significa "levantar el estado"?</summary>

Moverlo al ancestro común más cercano de los componentes que lo necesitan y
pasarlo por props, para tener una única fuente de verdad.

</details>

<details>
<summary>¿Qué es estado derivado y por qué evitarlo como estado?</summary>

Datos que se pueden calcular de otro estado o de props. Guardarlos aparte
obliga a sincronizarlos a mano y genera errores.

</details>

### [Eventos y formularios controlados](./01-react-desde-angular/06-eventos-y-formularios-controlados.md)

<details>
<summary>¿Qué es un SyntheticEvent?</summary>

Un envoltorio de React sobre el evento nativo con la misma interfaz y
comportamiento consistente entre navegadores. React usa delegación en la raíz.

</details>

<details>
<summary>¿Diferencia entre input controlado y no controlado?</summary>

En el controlado el valor vive en el estado de React y se actualiza en cada
`onChange`. En el no controlado vive en el DOM y se lee al enviar (o con una ref).

</details>

<details>
<summary>¿Cuándo preferís no controlados?</summary>

En formularios grandes para evitar renders por tecla, con Server Actions que
leen `FormData`, y con React Hook Form, que los usa por dentro.

</details>

<details>
<summary>¿Por qué el `onChange` de React se dispara en cada tecla?</summary>

Porque React lo mapea al evento `input` del DOM para que el estado refleje
siempre lo que hay escrito.

</details>

<details>
<summary>¿Dónde va la lógica que responde a una acción del usuario?</summary>

En el manejador del evento. Un efecto es para sincronizar con algo externo,
no para reaccionar a clics.

</details>

### [Listas, keys e identidad](./01-react-desde-angular/07-listas-y-keys.md)

<details>
<summary>¿Para qué sirve `key`?</summary>

Para que React identifique cada elemento de una lista entre renders y pueda
reutilizar, mover o eliminar los correctos conservando su estado.

</details>

<details>
<summary>¿Por qué no usar el índice como key?</summary>

Porque al insertar, borrar o reordenar, los índices pasan a otro elemento y
React reutiliza el estado y el DOM equivocados.

</details>

<details>
<summary>¿Cuándo React conserva el estado de un componente?</summary>

Mientras se renderice el mismo tipo en la misma posición del árbol con la misma key.

</details>

<details>
<summary>¿Cómo reseteás el estado de un componente cuando cambia una prop?</summary>

Dándole una `key` que dependa de esa prop: al cambiar, React lo monta de nuevo.

</details>

<details>
<summary>¿La key tiene que ser única en toda la app?</summary>

No, solo entre hermanos de la misma lista.

</details>

### [Estilos con Tailwind y shadcn/ui](./01-react-desde-angular/08-estilos-tailwind-y-shadcn.md)

<details>
<summary>¿Por qué Tailwind se volvió el estándar con React y Next?</summary>

Porque estiliza sin salir del componente, genera solo el CSS usado, no agrega
JavaScript en el navegador y funciona con Server Components.

</details>

<details>
<summary>¿Por qué el CSS-in-JS en runtime perdió terreno?</summary>

Porque inyecta estilos con JavaScript en el render, lo que no funciona en
Server Components y suma costo en el cliente.

</details>

<details>
<summary>¿Qué es shadcn/ui y en qué se diferencia de MUI?</summary>

Un generador que copia componentes (Radix + Tailwind) a tu código. MUI es una
dependencia con su sistema de estilos. Con shadcn el código es tuyo y lo modificás libremente.

</details>

<details>
<summary>¿Para qué sirve `tailwind-merge`?</summary>

Para resolver clases de Tailwind que chocan, quedándose con la última. Permite
que un componente acepte `className` y lo pise de forma predecible.

</details>

<details>
<summary>¿Por qué Tailwind no genera `bg-${color}-500`?</summary>

Porque detecta las clases leyendo el código como texto; una clase armada en
runtime no aparece completa en el fuente.

</details>

## 2. Hooks a fondo

### [useEffect y la sincronización](./02-hooks/01-useeffect.md)

<details>
<summary>¿Para qué sirve `useEffect`?</summary>

Para sincronizar un componente con un sistema externo después del commit:
suscripciones, APIs del navegador, widgets de terceros, conexiones.

</details>

<details>
<summary>¿Por qué en desarrollo los efectos corren dos veces?</summary>

Porque StrictMode monta, desmonta y remonta para verificar que la limpieza
sea correcta. En producción corre una vez.

</details>

<details>
<summary>¿Qué pasa si omitís una dependencia?</summary>

El efecto ve valores de un render viejo (closure obsoleta) y no se vuelve a
ejecutar cuando debería. Es un bug, aunque "funcione".

</details>

<details>
<summary>¿Cómo evitás condiciones de carrera al pedir datos en un efecto?</summary>

Con una bandera `ignore` en la limpieza o un `AbortController`. Mejor aún,
con una librería como TanStack Query que lo resuelve.

</details>

<details>
<summary>Nombrá tres casos donde se usa un efecto y no hacía falta.</summary>

Calcular datos derivados, reaccionar a un clic y resetear estado cuando cambia
una prop. Se resuelven en el render, en el evento y con `key`.

</details>

<details>
<summary>¿Diferencia entre `useEffect` y `useLayoutEffect`?</summary>

`useLayoutEffect` corre antes de pintar y bloquea; sirve para medir el DOM sin
parpadeo. `useEffect` corre después de pintar y es el que se usa casi siempre.

</details>

### [useRef y el DOM](./02-hooks/02-useref.md)

<details>
<summary>¿Diferencia entre `useRef` y `useState`?</summary>

Los dos persisten entre renders, pero cambiar el estado dispara un render y
cambiar una ref no. Lo que se muestra va en estado.

</details>

<details>
<summary>¿Por qué no hay que leer refs durante el render?</summary>

Porque el render debe ser puro y predecible; la ref puede cambiar sin que React
lo sepa y en el primer render el nodo todavía no existe.

</details>

<details>
<summary>¿Qué cambió con `forwardRef` en React 19?</summary>

`ref` pasó a ser una prop normal en componentes de función; `forwardRef` ya no hace falta.

</details>

<details>
<summary>¿Para qué sirve `useImperativeHandle`?</summary>

Para exponer al padre una API limitada (por ejemplo `focus`) en vez del nodo
entero. Es una vía de escape a lo imperativo.

</details>

### [useReducer](./02-hooks/03-usereducer.md)

<details>
<summary>¿Cuándo usás `useReducer` en vez de `useState`?</summary>

Cuando el estado tiene varias partes que cambian juntas o muchas transiciones
con reglas, y cuando quiero testear la lógica aparte del componente.

</details>

<details>
<summary>¿Por qué el reducer tiene que ser puro?</summary>

Porque React puede llamarlo más de una vez (StrictMode) y porque su valor está
en ser predecible y testeable: misma entrada, misma salida.

</details>

<details>
<summary>¿Qué ventaja da tipar las acciones con una unión discriminada?</summary>

TypeScript infiere el payload de cada `type` y, con `never`, obliga a manejar todas las acciones.

</details>

<details>
<summary>¿`useReducer` reemplaza a Redux?</summary>

Para estado local sí. Redux agrega un store global, middleware y DevTools;
`useReducer` + Context se acerca pero sin suscripciones selectivas.

</details>

### [Context](./02-hooks/04-context.md)

<details>
<summary>¿Qué problema resuelve Context?</summary>

El prop drilling: compartir un valor con muchos descendientes sin pasarlo por
cada nivel.

</details>

<details>
<summary>¿Context es un gestor de estado?</summary>

No, es un mecanismo de transporte. El estado lo tiene un `useState` o
`useReducer` arriba; Context solo lo hace llegar.

</details>

<details>
<summary>¿Por qué Context puede causar problemas de rendimiento?</summary>

Porque cada cambio del `value` re-renderiza a todos los consumidores. Se
mitiga separando contextos, memoizando el valor o usando un store con selectores.

</details>

<details>
<summary>¿Qué tiene de especial `use(Context)`?</summary>

Que se puede llamar dentro de condiciones y bucles, a diferencia de `useContext` y del resto de los hooks.

</details>

<details>
<summary>¿Se puede usar Context en Server Components?</summary>

No. Un Provider es de cliente; puede envolver Server Components pasados como
children, pero estos no pueden leer el contexto.

</details>

### [Hooks propios y reglas de los hooks](./02-hooks/05-hooks-propios.md)

<details>
<summary>¿Por qué no se pueden llamar hooks dentro de un `if`?</summary>

Porque React guarda el estado de los hooks en una lista y los identifica por
el orden de llamada. Saltearse uno desordena los siguientes.

</details>

<details>
<summary>¿Dos componentes que usan el mismo hook propio comparten estado?</summary>

No. Cada llamada crea su propio estado. Para compartir hace falta levantar el
estado, Context o un store.

</details>

<details>
<summary>¿Para qué existe `useSyncExternalStore`?</summary>

Para suscribirse a fuentes externas de forma segura con el render concurrente
(sin "tearing") y con un valor para el servidor que evita errores de hidratación.

</details>

<details>
<summary>¿Qué es el debounce y cómo lo implementás en React?</summary>

Esperar a que el valor deje de cambiar por un tiempo antes de usarlo. Con un
efecto que arma un `setTimeout` y lo cancela en la limpieza.

</details>

<details>
<summary>¿Cómo testeás un hook propio?</summary>

Con `renderHook` de Testing Library, `rerender` para cambiar las props y
`act` para avanzar timers o disparar actualizaciones.

</details>

### [Suspense, use y error boundaries](./02-hooks/06-suspense-use-y-error-boundaries.md)

<details>
<summary>¿Cómo funciona Suspense?</summary>

Cuando un componente lee algo que no está listo, suspende; React muestra el
fallback del Suspense más cercano y reintenta el render cuando se resuelve.

</details>

<details>
<summary>¿Qué hace `use` con una promesa y qué cuidado hay que tener?</summary>

Devuelve el valor resuelto o suspende mientras tanto. La promesa debe ser
estable (venir de afuera o de una caché); si se crea en cada render, nunca termina.

</details>

<details>
<summary>¿Qué capturan y qué no los error boundaries?</summary>

Capturan errores en el render, en métodos de ciclo de vida y en constructores
del subárbol. No capturan errores de eventos, de código asíncrono suelto ni del propio boundary.

</details>

<details>
<summary>¿Por qué los error boundaries todavía son clases?</summary>

Porque se basan en `getDerivedStateFromError` y `componentDidCatch`, que no
tienen equivalente en hooks. En la práctica se usa `react-error-boundary`.

</details>

<details>
<summary>¿Dónde ponés los límites de Suspense?</summary>

Alrededor de zonas que pueden cargar de forma independiente, con fallbacks del
mismo tamaño que el contenido, para mostrar algo útil rápido sin saltos.

</details>

### [Transiciones y render concurrente](./02-hooks/07-transiciones-y-concurrencia.md)

<details>
<summary>¿Qué es el render concurrente?</summary>

La capacidad de React de preparar varias versiones de la UI, pausar e
interrumpir renders y priorizar los urgentes sobre las transiciones.

</details>

<details>
<summary>¿Diferencia entre `useTransition` y `useDeferredValue`?</summary>

`useTransition` envuelve la actualización (necesitás el setter);
`useDeferredValue` te da una copia atrasada de un valor que ya tenés.

</details>

<details>
<summary>¿Debounce o `useDeferredValue`?</summary>

Debounce para no disparar peticiones de red; `useDeferredValue` para que un
render pesado no trabe el input, adaptándose al dispositivo.

</details>

<details>
<summary>¿Qué pasa si una transición hace que un componente suspenda?</summary>

React mantiene la UI anterior visible (con `isPending`) en vez de mostrar el
fallback del Suspense.

</details>

<details>
<summary>¿Qué resuelve `useEffectEvent`?</summary>

Leer valores actuales dentro de un efecto sin agregarlos a las dependencias,
para que el efecto no se reinicie cuando cambian.

</details>

### [Actions y los hooks de formularios de React 19](./02-hooks/08-actions-y-hooks-de-formularios.md)

<details>
<summary>¿Qué es una Action en React 19?</summary>

Una función, normalmente async, que se ejecuta dentro de una transición. Los
formularios la aceptan en `action` y React maneja el estado pendiente, los errores y el reset.

</details>

<details>
<summary>¿Para qué sirve `useActionState`?</summary>

Para guardar el resultado de una Action (errores, éxito) y obtener `isPending`
sin escribir el estado a mano.

</details>

<details>
<summary>¿Qué limitación tiene `useFormStatus`?</summary>

Solo lee el estado del `form` padre, así que tiene que usarse en un componente
hijo, no en el que declara el form.

</details>

<details>
<summary>¿Cómo funciona `useOptimistic` si el servidor falla?</summary>

El valor optimista vive solo durante la transición; al terminar, vuelve al
valor real que vino por props, así que el cambio "se deshace" solo.

</details>

<details>
<summary>¿Qué ventaja tienen las Actions sobre el clásico `onSubmit` con `preventDefault`?</summary>

Menos código de estado, integración con transiciones y Suspense, reset
automático y, con Server Actions, mejora progresiva sin JavaScript.

</details>

## 3. React por dentro (nivel senior)

### [Render y reconciliación](./03-react-por-dentro/01-render-y-reconciliacion.md)

<details>
<summary>¿Qué dispara el re-render de un componente?</summary>

Un cambio de su estado, el re-render de su padre o un cambio en un contexto que
consume. Las props no lo disparan por sí solas.

</details>

<details>
<summary>¿Re-render significa que se actualiza el DOM?</summary>

No. Render es llamar al componente; si el resultado no cambia, no hay cambios
en el DOM.

</details>

<details>
<summary>Explicá la reconciliación.</summary>

React compara el árbol nuevo con el anterior usando dos heurísticas: distinto
tipo implica reemplazar el subárbol y las keys identifican hijos en listas. Así el diff es lineal.

</details>

<details>
<summary>¿Qué es Fiber y qué permitió?</summary>

La arquitectura interna donde cada componente es una unidad de trabajo. Permite
pausar, priorizar y retomar el render: base del modo concurrente, Suspense y transiciones.

</details>

<details>
<summary>¿Qué causa un error de hidratación y cómo se evita?</summary>

Que el primer render del cliente no coincida con el HTML del servidor (fechas,
aleatorios, `window`). Se evita moviendo esa lógica a efectos o a componentes
solo de cliente, o con `suppressHydrationWarning` en casos puntuales.

</details>

<details>
<summary>¿Cómo evitás renders innecesarios sin usar `memo`?</summary>

Bajando el estado al componente que lo usa y pasando los componentes caros como
children, para que el padre que cambia no los vuelva a crear.

</details>

### [Memoización y React Compiler](./03-react-por-dentro/02-memoizacion-y-react-compiler.md)

<details>
<summary>¿Diferencia entre `memo`, `useMemo` y `useCallback`?</summary>

`memo` evita re-renderizar un componente si sus props no cambian; `useMemo`
cachea un valor; `useCallback` cachea una función. Los dos últimos sirven
sobre todo para que `memo` funcione.

</details>

<details>
<summary>¿Por qué `memo` a veces no evita renders?</summary>

Porque compara props por referencia y el padre le pasa objetos, arrays o
funciones nuevas en cada render.

</details>

<details>
<summary>¿Qué hace el React Compiler?</summary>

Analiza el código en el build y agrega memoización automática a componentes y
hooks, más fina que la manual. Requiere que el código cumpla las reglas de React.

</details>

<details>
<summary>¿Qué pasa si un componente rompe las reglas de React con el compiler activo?</summary>

El compiler lo detecta y no lo optimiza; el componente sigue funcionando como
antes. El linter lo avisa.

</details>

<details>
<summary>¿Memoizarías todo por defecto sin compiler?</summary>

No. Tiene costo de memoria y de comparación, y complica el código. Se memoiza
lo que el Profiler muestra como caro o lo que necesita una referencia estable.

</details>

### [Perfilar el rendimiento](./03-react-por-dentro/03-perfilar-rendimiento.md)

<details>
<summary>¿Cómo encontrás un problema de rendimiento en una app React?</summary>

Reproduzco la interacción lenta, grabo con el Profiler de React DevTools, miro
los componentes más caros y por qué se renderizaron, aplico un cambio y vuelvo a medir.

</details>

<details>
<summary>¿Qué es INP?</summary>

Interaction to Next Paint, la Core Web Vital de capacidad de respuesta: el
tiempo desde una interacción hasta el siguiente pintado. Bueno, menos de 200 ms.

</details>

<details>
<summary>¿Qué es la virtualización y cuándo la usás?</summary>

Renderizar solo los elementos visibles de una lista larga. Para miles de
filas en un panel; no para contenido que necesita SEO o búsqueda del navegador.

</details>

<details>
<summary>¿Por qué no medir el rendimiento en modo desarrollo?</summary>

Porque React agrega comprobaciones, StrictMode duplica renders y no hay
optimizaciones del build; los números no representan producción.

</details>

<details>
<summary>¿Para qué sirve el componente `<Profiler>`?</summary>

Para medir tiempos de render de un subárbol desde el código, por ejemplo para
reportar renders lentos a un sistema de monitoreo.

</details>

### [Patrones de componentes](./03-react-por-dentro/04-patrones-de-componentes.md)

<details>
<summary>¿Qué son los compound components?</summary>

Un conjunto de componentes que comparten estado implícito por Context y se
combinan libremente, como `Tabs`, `Tabs.List` y `Tabs.Trigger`.

</details>

<details>
<summary>¿Qué reemplazó a las render props y a los HOCs?</summary>

Los hooks propios: comparten lógica con estado sin anidar componentes ni
envolverlos.

</details>

<details>
<summary>¿Qué es un componente headless?</summary>

Uno que da comportamiento, estado y accesibilidad sin markup ni estilos
propios, para que el equipo aplique su diseño.

</details>

<details>
<summary>¿Cómo diseñás un componente que pueda ser controlado y no controlado?</summary>

Con `value` y `defaultValue` (o `open` y `defaultOpen`) más un `onChange`: si
llega `value` manda el padre; si no, se usa estado interno iniciado con el default.

</details>

<details>
<summary>¿Para qué sirve `useId`?</summary>

Para generar ids únicos y estables que coinciden entre servidor y cliente, por
ejemplo para conectar `aria-controls` o `htmlFor`.

</details>

### [Accesibilidad](./03-react-por-dentro/05-accesibilidad.md)

<details>
<summary>¿Por qué un `div` con `onClick` no es accesible?</summary>

No recibe foco, no responde a Enter ni Espacio y no tiene rol de botón, así que
un lector de pantalla no lo anuncia como acción.

</details>

<details>
<summary>¿Cuándo usar ARIA?</summary>

Cuando el HTML nativo no alcanza para expresar un rol, estado o relación. Mal
ARIA es peor que ninguno.

</details>

<details>
<summary>¿Qué hace `aria-live`?</summary>

Marca una región cuyos cambios se anuncian en el lector de pantalla; `polite`
espera a que termine lo que se está leyendo.

</details>

<details>
<summary>¿Cómo haces accesible un mapa?</summary>

Ofreciendo la misma información en un formato accesible (una lista sincronizada
con los filtros) y marcadores interactivos con nombre accesible.

</details>

<details>
<summary>¿Cómo probás la accesibilidad?</summary>

Lint con `jsx-a11y`, pruebas por rol con Testing Library, axe en e2e y una
pasada manual con teclado y lector de pantalla.

</details>

### [TypeScript con React](./03-react-por-dentro/06-typescript-con-react.md)

<details>
<summary>¿Por qué evitar `React.FC`?</summary>

Porque históricamente agregaba `children` implícito, complica los genéricos y no
aporta: alcanza con tipar las props.

</details>

<details>
<summary>¿Cómo extendés las props de un elemento HTML?</summary>

Con `React.ComponentProps<'button'>` (o `ComponentPropsWithoutRef`) combinado
con tus props, y pasás el resto con spread.

</details>

<details>
<summary>¿Para qué sirven las uniones discriminadas en props?</summary>

Para que ciertas props existan solo con cierto valor de otra, y que TypeScript
lo verifique tanto al usar el componente como adentro.

</details>

<details>
<summary>¿Cómo escribís un componente genérico?</summary>

Con un parámetro de tipo en la función: `function List<T>(props: ListProps<T>)`.
TypeScript lo infiere de los `items` que le pasás.

</details>

## 4. Datos del servidor y estado

### [El cliente tipado de la API de Nest](./04-datos-y-estado/01-cliente-de-la-api.md)

<details>
<summary>¿Para qué sirven los rewrites en desarrollo?</summary>

Para que el navegador hable con un solo origen: sin CORS y con la cookie de
sesión en el mismo origen que la app, como el proxy de Angular.

</details>

<details>
<summary>¿Cómo comparten la sesión la web, el panel y la API en producción?</summary>

Están bajo el mismo dominio (`ripopola.com`, `panel.` y `api.`): la API emite
la cookie para el dominio padre, el navegador la manda con
`credentials: 'include'` y, al ser el mismo sitio, `SameSite=Lax` alcanza.

</details>

<details>
<summary>¿Qué diferencia hay entre una variable con y sin `NEXT_PUBLIC_`?</summary>

Las `NEXT_PUBLIC_` se incrustan en el bundle del navegador al compilar; las
otras solo existen en el servidor.

</details>

<details>
<summary>¿Por qué separar un cliente público de uno que reenvía cookies?</summary>

Porque leer cookies vuelve dinámica la página y los datos de un usuario no se
pueden cachear para todos. Lo público usa un cliente sin cookies y se puede
cachear; lo privado reenvía la sesión.

</details>

<details>
<summary>¿Para qué sirve `server-only`?</summary>

Para que el build falle si un módulo pensado para el servidor (con URLs
internas o lectura de cookies) se importa desde código de cliente.

</details>

<details>
<summary>¿Cómo mantenés tipadas las llamadas a la API?</summary>

Generando tipos desde el OpenAPI del backend y usando un cliente que los
aplique a rutas, parámetros y respuestas, como openapi-fetch.

</details>

### [TanStack Query](./04-datos-y-estado/02-tanstack-query.md)

<details>
<summary>¿Por qué no pedir datos con `useEffect` y `useState`?</summary>

Porque hay que resolver a mano carga, error, cancelación, condiciones de
carrera, caché, deduplicación y refresco. TanStack Query lo resuelve.

</details>

<details>
<summary>¿Diferencia entre `staleTime` y `gcTime`?</summary>

`staleTime` dice cuánto tiempo el dato es fresco y no se vuelve a pedir;
`gcTime` cuánto se conserva en memoria un dato que ya nadie usa.

</details>

<details>
<summary>¿Diferencia entre `isPending` e `isFetching`?</summary>

`isPending` es que no hay datos todavía; `isFetching` es que hay una petición en
curso, aunque haya datos cacheados en pantalla.

</details>

<details>
<summary>¿Cómo diseñás las query keys?</summary>

Jerárquicas, de lo general a lo particular (`['towns', 'list', filtros]`), con
todos los parámetros que cambian el resultado. Así se invalida por prefijo.

</details>

<details>
<summary>¿Por qué el `QueryClient` no puede ser global en el servidor?</summary>

Porque el módulo vive entre peticiones y la caché de un usuario quedaría
visible para otro.

</details>

### [Mutaciones, invalidación y actualizaciones optimistas](./04-datos-y-estado/03-mutaciones.md)

<details>
<summary>¿Qué hace `invalidateQueries`?</summary>

Marca como viejas las queries que coinciden con la key y vuelve a pedir las que
están en uso, para que la UI refleje la escritura.

</details>

<details>
<summary>¿Cómo implementás una actualización optimista con rollback?</summary>

En `onMutate` cancelo las queries afectadas, guardo el valor anterior y aplico
el cambio; en `onError` restauro el anterior; en `onSettled` invalido para sincronizar.

</details>

<details>
<summary>¿Cuándo no conviene una actualización optimista?</summary>

Cuando la operación falla con frecuencia o tiene validaciones del servidor
que el usuario debe ver, porque la UI cambia y vuelve atrás.

</details>

<details>
<summary>¿Diferencia entre `mutate` y `mutateAsync`?</summary>

`mutate` no devuelve promesa y el error queda en el estado de la mutación;
`mutateAsync` devuelve una promesa que hay que manejar.

</details>

### [Estado de la interfaz con Zustand](./04-datos-y-estado/04-zustand.md)

<details>
<summary>¿Qué ventaja tiene Zustand sobre Context para estado global?</summary>

Las suscripciones con selectores: cada componente se re-renderiza solo si
cambia la parte que lee. Con Context, todos los consumidores se re-renderizan.

</details>

<details>
<summary>¿Cómo dividís el estado en una app React moderna?</summary>

Datos del servidor en TanStack Query (o Server Components), estado navegable en
la URL, estado local en `useState`, y lo poco global de UI en un store como Zustand.

</details>

<details>
<summary>¿Qué problema hay con `persist` y el render en servidor?</summary>

El servidor no tiene `localStorage`, así que el HTML no incluye esos datos; si
el cliente los usa en el primer render, hay mismatch de hidratación.

</details>

<details>
<summary>¿Por qué un store de módulo puede ser peligroso en Next?</summary>

Porque en el servidor el módulo se comparte entre peticiones, y el estado de un
usuario podría filtrarse a otro. Se usa un store por petición.

</details>

### [Redux Toolkit (concepto)](./04-datos-y-estado/05-redux-toolkit.md)

<details>
<summary>¿Cuáles son los principios de Redux?</summary>

Una sola fuente de verdad, el estado es de solo lectura y solo cambia con
acciones, y los cambios los hacen funciones puras (reducers).

</details>

<details>
<summary>¿Qué agrega Redux Toolkit al Redux clásico?</summary>

`createSlice` (acciones y reducer juntos), Immer para escribir actualizaciones
inmutables fácilmente, `configureStore` con DevTools y middleware, y RTK Query.

</details>

<details>
<summary>¿Redux o Zustand?</summary>

Zustand para estado global chico en proyectos nuevos; Redux Toolkit en apps
grandes que ya lo usan o donde se valora un flujo estricto y trazable.

</details>

<details>
<summary>¿Cómo se integra Redux con el App Router de Next?</summary>

Con un store creado por petición y un Provider de cliente; los Server
Components no acceden al store.

</details>

<details>
<summary>¿Qué es Immer?</summary>

Una librería que te deja escribir código "mutable" sobre un borrador y produce
un objeto nuevo inmutable con los cambios.

</details>

### [Estado en la URL](./04-datos-y-estado/06-estado-en-la-url.md)

<details>
<summary>¿Qué estado conviene guardar en la URL?</summary>

El que define lo que el usuario está viendo: filtros, búsqueda, orden, página,
pestaña. Así se comparte, sobrevive a recargas y lo puede renderizar el servidor.

</details>

<details>
<summary>¿Cómo leés los query params en el App Router?</summary>

En un Server Component, con la prop `searchParams` (asíncrona); en uno de
cliente, con `useSearchParams`.

</details>

<details>
<summary>¿Qué diferencia hay entre `router.push` y `router.replace`?</summary>

`push` agrega una entrada al historial; `replace` reemplaza la actual. Para
filtros que cambian seguido, `replace`.

</details>

<details>
<summary>¿Qué aporta nuqs?</summary>

Parsers y valores por defecto tipados, compartidos entre servidor y cliente, y
una API tipo `useState` que actualiza la URL con merge, debounce y opciones de historial.

</details>

## 5. Componentes de cliente en ripopola

### [El buscador de pueblos](./05-componentes-de-cliente/01-buscador-de-pueblos.md)

<details>
<summary>¿Cómo implementás un autocompletado en React sin saturar la API?</summary>

Debounce del texto, mínimo de caracteres con `enabled`, caché por query key y
cancelación de peticiones viejas con el `signal`.

</details>

<details>
<summary>¿Qué es el patrón combobox y por qué no escribirlo a mano?</summary>

El patrón ARIA para un input con lista de opciones: roles, opción activa,
teclado y anuncios. Es fácil de romper; conviene una librería probada.

</details>

<details>
<summary>¿Cómo resaltás texto sin `dangerouslySetInnerHTML`?</summary>

Partiendo el string en antes, coincidencia y después, y envolviendo la
coincidencia en un elemento con JSX.

</details>

### [El mapa con MapLibre](./05-componentes-de-cliente/02-mapa-con-maplibre.md)

<details>
<summary>¿Cómo integrás una librería imperativa (un mapa, un gráfico) en React?</summary>

Con un wrapper que la crea en un efecto o ref, sincroniza las props con sus
métodos y la destruye en la limpieza; o con un envoltorio existente como react-map-gl.

</details>

<details>
<summary>¿Por qué el mapa va con `ssr: false`?</summary>

Porque necesita `window` y WebGL, que no existen en el servidor, y porque es
pesado: conviene cargarlo diferido solo en el cliente.

</details>

<details>
<summary>¿Marcadores DOM o capas?</summary>

Marcadores DOM para pocos puntos con contenido rico; capas WebGL con
clustering para miles de puntos.

</details>

<details>
<summary>¿Cómo evitás pedir datos de más al mover el mapa?</summary>

Pidiendo en `moveend`, redondeando el bbox para la caché y manteniendo los
datos anteriores mientras llega lo nuevo.

</details>

### [Formularios con React Hook Form y Zod](./05-componentes-de-cliente/03-formularios-rhf-y-zod.md)

<details>
<summary>¿Por qué React Hook Form es más rápido que un formulario controlado?</summary>

Porque registra inputs no controlados con refs y no re-renderiza el formulario
en cada tecla; solo actualiza lo que se suscribe a cambios.

</details>

<details>
<summary>¿Qué ventaja tiene Zod frente a validar con funciones sueltas?</summary>

Un solo esquema declara la forma, valida en runtime e infiere el tipo de
TypeScript, y se puede reutilizar en cliente y servidor.

</details>

<details>
<summary>¿Cómo mostrás errores de validación que vienen del backend?</summary>

Mapeando la respuesta del servidor a cada campo con `setError`, y un error
general en `root` para lo que no es de un campo.

</details>

<details>
<summary>¿Cómo integrás un componente que no es un input nativo?</summary>

Con `Controller` o `useController`, que le pasa `value` y `onChange` y lo
registra en el formulario.

</details>

<details>
<summary>¿Alcanza con validar en el frontend?</summary>

No. El frontend valida para la experiencia; el backend tiene que validar
siempre porque cualquier cliente puede saltearse el formulario.

</details>

### [Subida de fotos](./05-componentes-de-cliente/04-subida-de-imagenes.md)

<details>
<summary>¿Por qué subir directo al almacenamiento con URL firmada?</summary>

Porque el archivo no pasa por la API: menos memoria, menos CPU y menos tiempo
de petición, y la API sigue controlando qué se puede subir.

</details>

<details>
<summary>¿Cómo mostrás una vista previa de una imagen antes de subirla?</summary>

Con `URL.createObjectURL(file)` en el `src` de un `img`, revocándola cuando ya no se usa.

</details>

<details>
<summary>¿Cómo mostrás el progreso de una subida?</summary>

Con `XMLHttpRequest` y el evento `upload.onprogress`, porque `fetch` no lo
expone de forma práctica para subidas.

</details>

## 6. Next.js: fundamentos

### [Qué es Next y las estrategias de render](./06-next-fundamentos/01-estrategias-de-render.md)

<details>
<summary>Explicá CSR, SSR, SSG e ISR.</summary>

CSR arma el HTML en el navegador. SSR lo genera en el servidor en cada
petición. SSG lo genera en el build. ISR lo genera estático y lo regenera cada
cierto tiempo o al invalidarlo.

</details>

<details>
<summary>¿Qué es Partial Prerendering?</summary>

Servir un shell estático prerenderizado al instante y completar las partes
dinámicas en streaming en la misma respuesta, usando límites de Suspense.

</details>

<details>
<summary>¿Por qué un sitio con SEO no debería ser una SPA pura?</summary>

Porque el HTML inicial está vacío y depende del JavaScript; los buscadores y
las vistas previas de redes sociales ven menos contenido y la carga es más lenta.

</details>

<details>
<summary>¿Qué cambió en Next 16 respecto del modelo de caché?</summary>

Con Cache Components todo es dinámico por defecto y se cachea de forma explícita
con `'use cache'`, `cacheLife` y `cacheTag`; lo dinámico va en Suspense.

</details>

<details>
<summary>¿App Router o Pages Router?</summary>

App Router para proyectos nuevos: Server Components, layouts anidados,
streaming y Server Actions. Pages Router en mantenimiento de código existente.

</details>

### [Rutas, layouts y páginas](./06-next-fundamentos/02-rutas-layouts-y-paginas.md)

<details>
<summary>¿Cómo se define una ruta en el App Router?</summary>

Con una carpeta por segmento y un `page.tsx` que exporta el componente de la
página. Sin `page.tsx`, la carpeta no es una ruta pública.

</details>

<details>
<summary>¿Diferencia entre `layout` y `template`?</summary>

El layout se conserva entre navegaciones de sus hijas (estado y DOM); el
template se vuelve a montar en cada navegación.

</details>

<details>
<summary>¿Para qué sirven los grupos de rutas?</summary>

Para organizar carpetas y dar layouts distintos a partes de la app sin
afectar la URL.

</details>

<details>
<summary>¿Por qué `params` es una promesa en Next 15+?</summary>

Para que Next pueda empezar a renderizar lo que no depende de los parámetros
antes de tenerlos, y prerenderizar más.

</details>

### [Server Components y Client Components](./06-next-fundamentos/03-server-y-client-components.md)

<details>
<summary>¿Qué es un React Server Component?</summary>

Un componente que se ejecuta solo en el servidor, puede acceder a datos
directamente y cuyo código no se envía al cliente; al navegador llega solo su
resultado serializado.

</details>

<details>
<summary>¿Diferencia entre SSR y Server Components?</summary>

SSR genera HTML en el servidor pero luego hidrata todo en el cliente. Los
Server Components no se hidratan nunca: su JavaScript no se envía. Se combinan:
Next hace SSR de Server y Client Components.

</details>

<details>
<summary>¿Qué no se puede hacer en un Server Component?</summary>

Usar estado, efectos, eventos, Context ni APIs del navegador.

</details>

<details>
<summary>¿Cómo usás un Server Component dentro de un Client Component?</summary>

No importándolo, sino pasándolo como `children` o prop desde un componente de servidor padre.

</details>

<details>
<summary>¿Qué es el RSC payload?</summary>

La representación serializada del árbol renderizado en el servidor, con
referencias a los Client Components, que React usa para armar y actualizar la UI.

</details>

<details>
<summary>¿Por qué bajar `'use client'` lo más posible?</summary>

Porque todo lo que esté por debajo de la frontera va al bundle del navegador;
cuanto más abajo, menos JavaScript y más contenido renderizado en el servidor.

</details>

### [Navegación, Link y enlaces activos](./06-next-fundamentos/04-navegacion.md)

<details>
<summary>¿Qué hace `Link` que no hace un `<a>`?</summary>

Navegación del lado del cliente sin recargar, conservando layouts y estado, y
prefetch de la ruta cuando el enlace es visible.

</details>

<details>
<summary>¿Qué es el prefetch y cuándo ocurre?</summary>

Pedir por adelantado los datos y el código de una ruta. En producción, cuando
el `Link` entra en el viewport; con Partial Prefetching se trae el shell estático.

</details>

<details>
<summary>¿Qué hace `router.refresh()`?</summary>

Vuelve a pedir al servidor los Server Components de la ruta actual y los
combina sin perder el estado del cliente.

</details>

<details>
<summary>¿Cómo marcás el enlace activo en el App Router?</summary>

Con un componente de cliente que compara `usePathname()` con su `href` y pone
una clase y `aria-current`.

</details>

### [loading, error y not-found](./06-next-fundamentos/05-loading-error-y-not-found.md)

<details>
<summary>¿Qué son `loading.tsx` y `error.tsx` por dentro?</summary>

`loading.tsx` envuelve la página en un `Suspense` con ese fallback; `error.tsx`
es un error boundary de React (por eso tiene que ser componente de cliente).

</details>

<details>
<summary>¿Por qué un `error.tsx` no captura errores de su propio layout?</summary>

Porque el boundary está dentro del layout del segmento; el error del layout lo
captura el `error.tsx` del segmento padre o `global-error.tsx`.

</details>

<details>
<summary>¿Cómo manejás errores esperados en Next?</summary>

Como valores de retorno (por ejemplo desde una Server Action con
`useActionState`) o con `notFound()`, no tirando excepciones.

</details>

<details>
<summary>¿Qué es un soft 404 y cómo lo evitás?</summary>

Una página de "no encontrado" que responde 200; los buscadores la indexan mal.
Se evita llamando a `notFound()`, que responde 404.

</details>

### [Metadata y SEO](./06-next-fundamentos/06-metadata-y-seo.md)

<details>
<summary>¿Cómo definís metadata dinámica en el App Router?</summary>

Exportando `generateMetadata` desde la página o el layout; recibe `params` y
devuelve el objeto `Metadata`. Solo en Server Components.

</details>

<details>
<summary>¿Cómo evitás pedir dos veces los mismos datos en `generateMetadata` y en la página?</summary>

Envolviendo la función de datos con `cache` de React, que memoiza por petición.

</details>

<details>
<summary>¿Qué es una URL canónica y para qué sirve?</summary>

La URL "oficial" de un contenido. Evita contenido duplicado cuando la misma
página es accesible con varias URLs (filtros, parámetros, idiomas).

</details>

<details>
<summary>¿Qué es JSON-LD?</summary>

Datos estructurados con el vocabulario de schema.org en un `script`, que los
buscadores usan para entender y mostrar resultados enriquecidos.

</details>

### [Imágenes, fuentes y scripts](./06-next-fundamentos/07-imagenes-fuentes-y-scripts.md)

<details>
<summary>¿Qué optimiza `next/image`?</summary>

Redimensiona y convierte a formatos modernos, genera `srcset`, reserva espacio
para evitar CLS y carga en diferido las imágenes fuera de pantalla.

</details>

<details>
<summary>¿Para qué sirve `sizes`?</summary>

Le dice al navegador qué ancho va a ocupar la imagen en cada breakpoint, para
que elija del `srcset` el archivo justo y no descargue de más.

</details>

<details>
<summary>¿Qué es LCP y cómo lo mejorás con imágenes?</summary>

Largest Contentful Paint, el tiempo hasta que se ve el elemento más grande.
Marcando la imagen principal con `preload`, sirviéndola en el tamaño y formato justo y desde CDN.

</details>

<details>
<summary>¿Qué ventajas tiene `next/font` sobre un `<link>` a Google Fonts?</summary>

La fuente se descarga en el build y se sirve desde el propio dominio, sin
peticiones a terceros, y con una fuente de respaldo ajustada que evita saltos.

</details>

### [Rutas paralelas e interceptadas](./06-next-fundamentos/08-rutas-avanzadas.md)

<details>
<summary>¿Qué son las rutas paralelas?</summary>

Slots (`@nombre`) que se renderizan al mismo tiempo en un layout, con
navegación, carga y errores independientes.

</details>

<details>
<summary>¿Qué es una ruta interceptada y para qué se usa?</summary>

Una ruta que, al navegar desde dentro de la app, se muestra en el contexto
actual (por ejemplo un modal), y al entrar directo muestra la página completa.

</details>

<details>
<summary>¿Para qué sirve `default.tsx`?</summary>

Para definir qué muestra un slot cuando la URL no tiene una página para él,
por ejemplo tras recargar. En Next 16 es obligatorio.

</details>

## 7. Next.js: datos, caché y render

### [Pedir datos en el servidor](./07-next-datos/01-pedir-datos-en-el-servidor.md)

<details>
<summary>¿Cómo se piden datos en un Server Component?</summary>

Haciendo el componente `async` y esperando la llamada directamente; el
resultado se renderiza en el servidor y no se repite en el cliente.

</details>

<details>
<summary>¿Qué es una cascada de peticiones y cómo la evitás?</summary>

Peticiones en serie que podrían ir en paralelo. Se evita con `Promise.all`,
iniciando las promesas antes de esperarlas, o separando en límites de Suspense.

</details>

<details>
<summary>¿Para qué sirve `cache` de React?</summary>

Para memoizar una función durante una petición del servidor, así varios
componentes pueden pedir el mismo dato sin repetir la llamada.

</details>

<details>
<summary>¿Cuándo pasarías una promesa a un Client Component?</summary>

Cuando el componente necesita interactividad con esos datos y querés empezar la
petición en el servidor sin bloquear el resto de la página.

</details>

### [Streaming y prerender parcial](./07-next-datos/02-streaming-y-prerender-parcial.md)

<details>
<summary>¿Qué es el streaming en Next?</summary>

Enviar el HTML en partes en una misma respuesta: primero el shell con los
fallbacks y después cada parte cuando está lista, que React coloca en su lugar.

</details>

<details>
<summary>¿Qué vuelve dinámica una parte de la página con Cache Components?</summary>

Leer APIs de la petición (`cookies`, `headers`, `searchParams`, `connection`) o
datos no cacheados. Esas partes tienen que ir dentro de un Suspense.

</details>

<details>
<summary>¿Qué es el error de "blocking route"?</summary>

Que hay contenido dinámico fuera de un límite de Suspense, así que Next no puede
armar un shell estático; se resuelve envolviéndolo en Suspense o cacheándolo.

</details>

<details>
<summary>¿Cómo decidís dónde poner los límites de Suspense?</summary>

Cerca de lo dinámico o lento, agrupando lo que debe aparecer junto y con
fallbacks del mismo tamaño que el contenido.

</details>

### [Cache Components y use cache](./07-next-datos/03-cache-components.md)

<details>
<summary>¿Qué hace `'use cache'`?</summary>

Cachea el resultado de una función o componente async, con una clave formada
por la función y sus argumentos, para incluirlo en el shell estático y
reutilizarlo entre peticiones.

</details>

<details>
<summary>¿Diferencia entre `cache` de React y `'use cache'`?</summary>

`cache` memoiza dentro de una petición; `'use cache'` guarda entre peticiones
con vida útil y etiquetas para invalidar.

</details>

<details>
<summary>¿Qué significan stale, revalidate y expire?</summary>

Stale es cuánto usa el cliente su copia sin preguntar; revalidate, cuándo el
servidor regenera de fondo; expire, cuándo se descarta y hay que esperar.

</details>

<details>
<summary>¿Por qué no se pueden leer cookies dentro de `'use cache'`?</summary>

Porque la caché es compartida y la clave no incluiría la cookie: se
mezclarían datos de usuarios. Se lee afuera y se pasa como argumento.

</details>

<details>
<summary>¿Qué problema tiene la caché de Next con varias réplicas fuera de Vercel?</summary>

Por defecto es en memoria por instancia: no se comparte ni se invalida en todas.
Se resuelve con un cache handler remoto, por ejemplo sobre Redis.

</details>

### [Revalidación a demanda](./07-next-datos/04-revalidacion.md)

<details>
<summary>¿Diferencia entre `revalidateTag` y `updateTag`?</summary>

`revalidateTag` sirve lo viejo y regenera de fondo; `updateTag` expira la
caché al instante para que quien escribió vea su cambio. `updateTag` solo
funciona en Server Actions.

</details>

<details>
<summary>¿Por qué preferir invalidar por etiqueta que por ruta?</summary>

Porque un mismo dato aparece en varias rutas; la etiqueta las cubre a todas sin
tener que conocerlas, y no invalida de más.

</details>

<details>
<summary>¿Cómo invalidás la caché de Next cuando el dato cambia en otro servicio?</summary>

Con un Route Handler protegido (firma HMAC o secreto) que el otro servicio
llama después de escribir, y que ejecuta `revalidateTag`.

</details>

<details>
<summary>¿Qué pasa si se pierde un aviso de invalidación?</summary>

El dato viejo se sirve hasta que venza su `cacheLife`; por eso la vida útil
tiene que ser razonable y el aviso se reintenta.

</details>

### [Páginas estáticas de pueblos (ISR)](./07-next-datos/05-paginas-estaticas-de-pueblos.md)

<details>
<summary>¿Qué es ISR?</summary>

Incremental Static Regeneration: páginas estáticas que se generan bajo demanda
la primera vez y se regeneran por tiempo o por invalidación, sin rehacer el build.

</details>

<details>
<summary>¿Para qué sirve `generateStaticParams`?</summary>

Para listar qué valores de una ruta dinámica se prerenderizan en el build.

</details>

<details>
<summary>¿Qué pasa con una ruta dinámica que no está en `generateStaticParams`?</summary>

Con Cache Components y Partial Prefetching se sirve el App Shell al instante,
se transmite el contenido y el resultado se guarda para las visitas siguientes.

</details>

<details>
<summary>¿Por qué no prerenderizar todas las páginas en el build?</summary>

Porque con miles de páginas el build tarda demasiado y la mayoría casi no se
visita; conviene generarlas bajo demanda.

</details>

### [Paginación y filtros en el servidor](./07-next-datos/06-paginacion-y-filtros-en-servidor.md)

<details>
<summary>¿Paginación offset o cursor?</summary>

Offset cuando hace falta saltar a una página y mostrar el total (listados
públicos indexables); cursor para listas enormes o scroll infinito, porque su
rendimiento no empeora al avanzar.

</details>

<details>
<summary>¿Por qué la paginación debería usar enlaces?</summary>

Porque funciona sin JavaScript, los buscadores la siguen y se puede abrir en
otra pestaña; con Link además se navega del lado del cliente.

</details>

<details>
<summary>¿Cómo hacés que el fallback de Suspense se vea al cambiar de página?</summary>

Dándole al Suspense una `key` que cambie con los parámetros; si no, Next
mantiene lo anterior durante la transición.

</details>

### [TanStack Query con Next](./07-next-datos/07-tanstack-query-con-next.md)

<details>
<summary>¿Cómo combinás TanStack Query con el render en servidor?</summary>

Haciendo `prefetchQuery` en el servidor, deshidratando el `QueryClient` y
envolviendo el componente de cliente en un `HydrationBoundary`, que llena la caché del cliente.

</details>

<details>
<summary>¿Por qué hace falta `staleTime` con SSR?</summary>

Porque con `staleTime: 0` el dato hidratado se considera viejo al montar y el
cliente lo vuelve a pedir enseguida.

</details>

<details>
<summary>Si ya tenés Server Components, ¿para qué TanStack Query?</summary>

Para pantallas con mucha interacción del lado del cliente: filtros sin navegar,
actualizaciones optimistas, polling, refresco al volver a la pestaña.

</details>

## 8. Next.js: mutaciones y servidor

### [Server Actions](./08-next-mutaciones/01-server-actions.md)

<details>
<summary>¿Qué es una Server Action y cómo funciona por debajo?</summary>

Una función con `'use server'` que el compilador expone como un endpoint POST
con un id cifrado; el cliente la llama con argumentos serializados y recibe el
resultado y la UI actualizada.

</details>

<details>
<summary>¿Qué cuidados de seguridad tiene?</summary>

Es pública: hay que validar los argumentos, verificar autenticación y
autorización adentro y devolver solo lo necesario. Next suma ids cifrados y
chequeo de origen contra CSRF.

</details>

<details>
<summary>¿Server Action o Route Handler?</summary>

Server Action para mutaciones desde tu propia UI; Route Handler para endpoints
consumidos por terceros (webhooks, apps móviles) o respuestas no React.

</details>

<details>
<summary>¿Por qué no usarlas para leer datos?</summary>

Porque usan POST, se encolan en serie desde el cliente y no se cachean; para
leer están los Server Components o TanStack Query.

</details>

### [Formularios con Server Actions](./08-next-mutaciones/02-formularios-con-server-actions.md)

<details>
<summary>¿Qué es progressive enhancement en un formulario de Next?</summary>

Que el `<form action={serverAction}>` funciona como un POST nativo antes de
que cargue el JavaScript; cuando React hidrata, intercepta el envío y lo hace
sin recargar la página.

</details>

<details>
<summary>¿Por qué validar en el servidor si ya validás en el cliente?</summary>

Porque la validación del cliente es experiencia de usuario: se puede saltear
llamando a la acción directamente. La del servidor es la que protege.

</details>

<details>
<summary>¿Cómo devolvés errores de validación desde una Server Action?</summary>

Con `safeParse` y devolviendo un objeto serializable con los errores por
campo (y los valores enviados), que `useActionState` entrega al componente.

</details>

<details>
<summary>¿Qué restricciones tiene un archivo con `'use server'`?</summary>

Solo puede exportar funciones async: cada export se convierte en una acción
llamable desde el cliente. Constantes, esquemas o tipos con valor van en otro archivo.

</details>

<details>
<summary>¿Para qué sirve `next/form`?</summary>

Para formularios que navegan: convierte los campos en `searchParams`, hace
navegación de cliente con prefetch y sigue funcionando como un GET sin JS.

</details>

<details>
<summary>¿Cuándo usarías React Hook Form en vez de una Server Action con `useActionState`?</summary>

En formularios largos o dinámicos, con validación mientras se escribe y
campos controlados; para formularios cortos y públicos, la acción es más simple.

</details>

### [Route Handlers](./08-next-mutaciones/03-route-handlers.md)

<details>
<summary>¿Qué es un Route Handler?</summary>

Un archivo `route.ts` que define un endpoint HTTP con una función por método,
usando `Request` y `Response` de la plataforma web.

</details>

<details>
<summary>¿Cuándo usás un Route Handler y cuándo una Server Action?</summary>

Route Handler cuando lo llama alguien externo o necesitás una URL estable y
otros métodos; Server Action para mutaciones desde tu propia interfaz.

</details>

<details>
<summary>Si tenés un backend aparte, ¿para qué querés Route Handlers?</summary>

Para lo que pertenece al frontend: webhooks que invalidan la caché de Next,
health checks, imágenes OG, sitemap. El negocio queda en el backend.

</details>

<details>
<summary>¿Se cachea un GET de un Route Handler?</summary>

No por defecto desde Next 15. Con Cache Components se cachea el trabajo
interno con `'use cache'`.

</details>

### [proxy.ts (el antiguo middleware)](./08-next-mutaciones/04-proxy.md)

<details>
<summary>¿Qué es `proxy.ts` y qué pasó con `middleware.ts`?</summary>

Es la función que corre antes de cada petición para redirigir, reescribir o
tocar cabeceras y cookies. En Next 16 `middleware.ts` pasó a llamarse
`proxy.ts` para no confundirlo con el middleware de Express, y corre en Node.js por defecto.

</details>

<details>
<summary>¿Alcanza con proteger rutas en el proxy?</summary>

No. Es optimista: solo ve si hay cookie, y las Server Actions pueden quedar
fuera del matcher. La autorización se hace cerca de los datos y en el backend.

</details>

<details>
<summary>¿Qué diferencia hay entre redirect y rewrite?</summary>

El redirect le dice al navegador que vaya a otra URL (cambia la barra de
direcciones); el rewrite sirve otro contenido en la misma URL.

</details>

<details>
<summary>¿Qué cuidás en el `matcher`?</summary>

Que excluya archivos estáticos, imágenes y rutas que no lo necesitan, y que no
genere bucles (por ejemplo, incluir el login en una regla que redirige al login).

</details>

<details>
<summary>¿Qué es un open redirect y cómo lo evitás en un login?</summary>

Redirigir a una URL que viene del usuario sin validarla: permite usar tu dominio
para mandar a un sitio malicioso. Se evita aceptando solo rutas relativas propias.

</details>

### [Cookies en el servidor y en el cliente](./08-next-mutaciones/05-cookies.md)

<details>
<summary>¿Qué diferencia hay entre una cookie y `localStorage`?</summary>

La cookie viaja al servidor en cada petición y puede ser `HttpOnly`;
`localStorage` queda solo en el navegador y cualquier script de la página lo lee.

</details>

<details>
<summary>¿Por qué no se puede escribir una cookie en un Server Component?</summary>

Porque las cookies van en las cabeceras de la respuesta y, cuando el
componente renderiza, el HTML ya se está transmitiendo. Se escriben en Server
Actions, Route Handlers o el proxy.

</details>

<details>
<summary>¿Para qué sirven `HttpOnly` y `SameSite`?</summary>

`HttpOnly` impide que JavaScript lea la cookie (protege la sesión de un XSS);
`SameSite` limita cuándo viaja desde otros sitios (defensa contra CSRF).

</details>

<details>
<summary>¿Qué pasa con el render si leés cookies?</summary>

Ese componente pasa a renderizarse por petición. Con Cache Components,
dentro de un `<Suspense>` solo ese pedazo es dinámico.

</details>

<details>
<summary>¿Cómo comparten sesión varios subdominios?</summary>

Con una cookie emitida para el dominio padre (`Domain=ripopola.com`): llega a
la web, al panel y a la API.

</details>

### [Next como backend (y por qué ripopola no lo hace)](./08-next-mutaciones/06-next-como-backend.md)

<details>
<summary>¿Usarías Next como backend completo?</summary>

Para un solo frontend, un equipo chico y sin procesos pesados en segundo
plano, sí. Con varios clientes, colas, WebSockets o un backend existente,
prefiero una API aparte y Next como BFF.

</details>

<details>
<summary>¿Qué es un Data Access Layer en Next?</summary>

Un módulo de servidor que es el único que accede a los datos, verifica sesión
y permisos, y devuelve DTOs con lo justo para la UI.

</details>

<details>
<summary>¿Qué es un BFF?</summary>

Una capa de servidor a medida de un frontend: agrega y adapta llamadas, maneja
la sesión y oculta servicios internos. Next cumple ese papel con sus Server
Components y Server Actions.

</details>

<details>
<summary>¿Cómo marcás una orden como pagada de forma segura?</summary>

Con el webhook firmado del proveedor de pagos, verificando la firma y siendo
idempotente; nunca por la redirección del navegador.

</details>

<details>
<summary>¿Por qué no pasar el objeto de Prisma directo a un componente?</summary>

Porque se serializa entero hacia el cliente, con campos sensibles. Se arma un
DTO con lo necesario.

</details>

## 9. Autenticación con Better Auth

### [Cómo funciona la sesión desde el frontend](./09-auth/01-la-sesion-desde-el-frontend.md)

<details>
<summary>¿Por qué una cookie `HttpOnly` y no un JWT en `localStorage`?</summary>

Porque un script inyectado (XSS) puede leer `localStorage` y robar el token;
una cookie `HttpOnly` no se puede leer desde JavaScript y viaja sola.

</details>

<details>
<summary>Si la cookie es `HttpOnly`, ¿cómo sabe el frontend si hay sesión?</summary>

En el servidor, reenviando la cookie a la API y preguntando quién es el
usuario; en el cliente, llamando a un endpoint de sesión (`useSession`).

</details>

<details>
<summary>¿Por qué no hacer el login con una Server Action?</summary>

Porque el `Set-Cookie` de la API le llegaría al servidor de Next y no al
navegador. El login va directo del navegador a la API.

</details>

<details>
<summary>¿Dónde se decide si un usuario puede hacer algo?</summary>

En el backend, en cada endpoint. El frontend usa los permisos solo para
mostrar u ocultar opciones.

</details>

### [El cliente de Better Auth](./09-auth/02-el-cliente-de-better-auth.md)

<details>
<summary>¿Qué te da el cliente de una librería de auth como Better Auth?</summary>

Funciones tipadas para cada flujo (login, registro, social, 2FA), manejo de
errores uniforme y un estado reactivo de la sesión, sin escribir los fetch a mano.

</details>

<details>
<summary>¿Por qué `router.refresh()` después de cerrar sesión?</summary>

Porque los Server Components de la ruta actual se renderizaron con la sesión
anterior; `refresh` los vuelve a pedir al servidor.

</details>

<details>
<summary>¿Por qué un mensaje genérico en el login fallido?</summary>

Para no revelar qué correos tienen cuenta (enumeración de usuarios).

</details>

### [Login, registro y Google](./09-auth/03-login-registro-y-google.md)

<details>
<summary>¿Cómo evitás un open redirect en el parámetro `next` del login?</summary>

Aceptando solo rutas que empiecen con una sola `/` (ni `//` ni URLs
absolutas) y usando una ruta por defecto en cualquier otro caso.

</details>

<details>
<summary>¿Qué pasa en el flujo de login con Google?</summary>

El navegador va a Google, el usuario acepta, Google vuelve al callback de la
API con un código, la API lo canjea, crea o vincula la cuenta, pone la cookie y
redirige a la URL de vuelta del front.

</details>

<details>
<summary>¿Por qué el formulario de recuperar contraseña responde lo mismo exista o no la cuenta?</summary>

Para no permitir la enumeración de usuarios.

</details>

<details>
<summary>¿Por qué hace falta `router.refresh()` después del login?</summary>

Porque los Server Components (layouts y páginas) se renderizaron sin sesión;
refrescar los vuelve a pedir con la cookie nueva.

</details>

### [La sesión en el servidor y las rutas protegidas](./09-auth/04-sesion-en-el-servidor-y-rutas-protegidas.md)

<details>
<summary>¿Cómo sabés quién es el usuario en un Server Component si la cookie es `HttpOnly`?</summary>

El servidor sí recibe la cookie: la reenvío a la API, que valida la sesión y
devuelve el usuario.

</details>

<details>
<summary>¿Para qué sirve `cache` de React en el servidor?</summary>

Para deduplicar llamadas dentro de un mismo render: varios componentes piden
al usuario y solo una llamada llega a la API.

</details>

<details>
<summary>¿Por qué no alcanza con verificar la sesión en el layout?</summary>

Porque los layouts no se vuelven a renderizar en cada navegación y las Server
Actions no pasan por ellos. Cada acceso a datos se autoriza por separado.

</details>

<details>
<summary>¿Qué diferencia hay entre `cache` de React y `'use cache'`?</summary>

`cache` dura una petición y sirve para deduplicar; `'use cache'` guarda
resultados entre peticiones y nunca debe tener datos de un usuario.

</details>

<details>
<summary>¿Por qué a veces conviene responder 404 en vez de 403?</summary>

Para no confirmar que un recurso existe a alguien que no tiene permiso.

</details>

### [Roles, ayuntamientos y permisos en la interfaz](./09-auth/05-roles-y-permisos-en-la-interfaz.md)

<details>
<summary>Si ocultás un botón según el rol, ¿la acción está protegida?</summary>

No. Ocultar es experiencia; la autorización la hace el backend en cada
endpoint. El front tiene que manejar el 403 igual.

</details>

<details>
<summary>¿Dónde guardás una selección que el servidor necesita para renderizar?</summary>

En una cookie (o en la URL), no en `localStorage`, porque el servidor no puede
leer `localStorage`.

</details>

<details>
<summary>¿Cómo evitás duplicar reglas de permisos entre front y back?</summary>

Haciendo que el backend devuelva las acciones permitidas y que el front solo
las lea; si se duplican, en un único módulo y sabiendo que el back manda.

</details>

<details>
<summary>¿Qué es RBAC y qué agrega un permiso por recurso?</summary>

RBAC asigna permisos por rol. Por recurso significa que el rol depende de la
relación con ese recurso (admin de *este* ayuntamiento, no de cualquiera).

</details>

### [Verificación en dos pasos y sesiones abiertas](./09-auth/06-dos-pasos-y-sesiones.md)

<details>
<summary>¿Cómo funciona TOTP?</summary>

El servidor y la app comparten un secreto; los dos calculan un código a partir
del secreto y la hora en ventanas de 30 segundos. El servidor acepta el código
si coincide.

</details>

<details>
<summary>¿Por qué pedir la contraseña para activar o desactivar el 2FA?</summary>

Para que una sesión robada no alcance para cambiar la seguridad de la cuenta
(re-autenticación para acciones sensibles).

</details>

<details>
<summary>¿Para qué son los códigos de respaldo?</summary>

Para entrar si se pierde el dispositivo con la app. Se muestran una vez y
cada uno sirve una sola vez.

</details>

<details>
<summary>¿Por qué el 2FA se activa recién después de verificar un código?</summary>

Para comprobar que la app quedó bien configurada; si no, el usuario podría
quedar bloqueado.

</details>

### [Las alternativas - Auth.js, Better Auth dentro de Next, Firebase Auth y Clerk](./09-auth/07-alternativas.md)

<details>
<summary>¿Dónde pondrías la autenticación en una app Next con un backend aparte?</summary>

En el backend, que es la autoridad para todos los clientes; Next reenvía la
sesión. Si Next fuera el único backend, adentro de Next.

</details>

<details>
<summary>¿Qué diferencia hay entre Auth.js y Better Auth?</summary>

Las dos manejan sesiones y proveedores; Better Auth es más reciente, con
plugins (2FA, organizaciones) y es la recomendada para proyectos nuevos; Auth.js
está en mantenimiento pero es muy común en código existente.

</details>

<details>
<summary>¿Qué cambia si usás un proveedor como Firebase Auth?</summary>

Los usuarios viven en el proveedor, el front obtiene un token y el backend lo
verifica en cada petición. Para usarlo en Server Components hace falta una
cookie de sesión propia.

</details>

<details>
<summary>¿Qué es `nextCookies()` en Better Auth?</summary>

Un plugin que hace que las cookies que pone Better Auth al ser llamado desde
el servidor de Next (Server Actions) lleguen al navegador.

</details>

## 10. Idiomas

### [Rutas por idioma con next-intl](./10-i18n/01-rutas-por-idioma.md)

<details>
<summary>¿Por qué una URL por idioma y no detectar el idioma del navegador?</summary>

Porque cada idioma tiene que ser indexable y compartible por separado;
detectar solo por el navegador sirve contenido distinto en la misma URL.

</details>

<details>
<summary>¿Cómo decide el proxy el idioma al entrar a `/`?</summary>

Primero la cookie con la elección previa, después `Accept-Language` y por
último el idioma por defecto; luego redirige a la URL con prefijo.

</details>

<details>
<summary>¿Qué hace `setRequestLocale` y por qué importa?</summary>

Le dice a next-intl el idioma del render actual para que no tenga que leer
cabeceras; así las páginas se pueden prerenderizar.

</details>

<details>
<summary>¿Cómo traducís las URLs sin duplicar carpetas?</summary>

Con `pathnames`: las carpetas usan un nombre interno y la librería mapea cada
URL traducida a esa ruta.

</details>

### [Traducir la interfaz](./10-i18n/02-traducir-la-interfaz.md)

<details>
<summary>¿Por qué usar ICU para los plurales?</summary>

Porque cada idioma tiene reglas de plural distintas; ICU las conoce y el
traductor escribe todas las formas sin tocar código.

</details>

<details>
<summary>¿Por qué no concatenar pedazos traducidos?</summary>

Porque el orden de las palabras cambia entre idiomas. Se traduce la frase
entera con marcadores para las partes con formato.

</details>

<details>
<summary>¿Qué problema de hidratación puede dar una fecha?</summary>

Si el servidor y el navegador formatean con zonas horarias distintas, el
texto no coincide. Se fija la zona horaria en la configuración.

</details>

<details>
<summary>¿Cómo evitás claves de traducción inexistentes?</summary>

Tipando los mensajes a partir del archivo del idioma base y con un test que
compare las claves de todos los idiomas.

</details>

### [Contenido traducido y SEO multilingüe](./10-i18n/03-contenido-traducido-y-seo.md)

<details>
<summary>¿Qué es hreflang y para qué sirve?</summary>

Una indicación a los buscadores de qué URL corresponde a cada idioma de una
misma página, para mostrar la versión correcta a cada usuario.

</details>

<details>
<summary>¿A dónde apunta el canonical de una página traducida?</summary>

A sí misma. Las versiones en otros idiomas no son duplicados.

</details>

<details>
<summary>¿Cómo cacheás contenido que cambia por idioma?</summary>

Incluyendo el idioma en la clave: en Next, como argumento de la función con
`'use cache'`, y con etiquetas comunes para invalidar todos los idiomas juntos.

</details>

<details>
<summary>¿Qué hacés si un contenido todavía no está traducido?</summary>

Mostrar el original marcado con su `lang`, avisar al usuario y no indexar esa
versión hasta que la traducción exista.

</details>

## 11. Pruebas, rendimiento y seguridad

### [Pruebas de componentes con Vitest y Testing Library](./11-calidad/01-vitest-y-testing-library.md)

<details>
<summary>¿Qué filosofía sigue Testing Library?</summary>

Probar como usa el usuario: buscar elementos por rol, etiqueta o texto e
interactuar con eventos reales, sin depender de la implementación.

</details>

<details>
<summary>¿Diferencia entre `getBy`, `queryBy` y `findBy`?</summary>

`getBy` tira si no encuentra; `queryBy` devuelve `null` (para comprobar
ausencia); `findBy` devuelve una promesa que espera a que aparezca.

</details>

<details>
<summary>¿Por qué `userEvent` en vez de `fireEvent`?</summary>

Porque simula la secuencia completa de eventos que genera una persona (foco,
puntero, teclado), no un evento suelto.

</details>

<details>
<summary>¿Cómo probás un Server Component async?</summary>

Separando la lógica en funciones que se prueban con Vitest y cubriendo el
render completo con pruebas end to end.

</details>

<details>
<summary>¿Qué es el testing trophy?</summary>

Una forma de repartir pruebas que prioriza las de integración (componentes con
sus dependencias reales o simuladas en la red) sobre las unitarias aisladas.

</details>

### [Simular la API con MSW - formularios, consultas y hooks](./11-calidad/02-msw-formularios-y-datos.md)

<details>
<summary>¿Por qué MSW en vez de mockear el cliente HTTP?</summary>

Porque intercepta a nivel de red: el código de la app (cliente, caché,
serialización, manejo de errores) corre igual que en producción.

</details>

<details>
<summary>¿Cómo probás el estado de error de una consulta?</summary>

Sobrescribiendo el handler en esa prueba para que responda un error y
esperando el mensaje con `findBy`, con los reintentos desactivados.

</details>

<details>
<summary>¿Cuándo probás un hook por separado?</summary>

Cuando tiene lógica propia (tiempos, cálculos). Si solo envuelve otra
librería, a través del componente.

</details>

### [Pruebas end to end con Playwright y axe](./11-calidad/03-playwright-y-accesibilidad.md)

<details>
<summary>¿Qué probás end to end y qué con pruebas de componentes?</summary>

End to end, los caminos críticos de punta a punta (login, compra, publicación);
las variantes y los detalles, en pruebas de componentes, que son más rápidas.

</details>

<details>
<summary>¿Cómo evitás pruebas frágiles en Playwright?</summary>

Locators por rol y texto, assertions que esperan estados en vez de tiempos
fijos, pruebas independientes y datos de prueba conocidos.

</details>

<details>
<summary>¿Cómo evitás hacer login en cada prueba?</summary>

Con un paso de setup que hace login una vez y guarda el estado del navegador
(`storageState`), que las demás pruebas reutilizan.

</details>

<details>
<summary>¿Alcanza con axe para la accesibilidad?</summary>

No. Detecta problemas automáticos como contraste o etiquetas; el resto requiere
pruebas manuales con teclado y lector de pantalla.

</details>

### [Rendimiento web - Core Web Vitals, bundle y carga diferida](./11-calidad/04-rendimiento-web.md)

<details>
<summary>¿Qué son los Core Web Vitals?</summary>

LCP (cuándo se ve el contenido principal), INP (cuánto tarda en responder a
una interacción) y CLS (cuánto se mueve el diseño), medidos en usuarios reales.

</details>

<details>
<summary>¿Cómo mejorarías el LCP de una página?</summary>

Haciendo que el elemento principal esté en el HTML inicial, precargando la
imagen con el tamaño correcto, sirviendo el HTML rápido (caché, CDN) y sin
bloquear con CSS o JS innecesarios.

</details>

<details>
<summary>¿Qué causa un mal INP y cómo se arregla?</summary>

Trabajo largo en el hilo principal durante una interacción (render pesado,
hidratación, cálculos). Se arregla con transiciones, virtualización, menos
JS y moviendo cálculos a un Worker.

</details>

<details>
<summary>¿Qué diferencia hay entre datos de laboratorio y de campo?</summary>

Los de laboratorio son simulados y repetibles, sirven para detectar
regresiones; los de campo son de usuarios reales y son los que cuentan.

</details>

<details>
<summary>¿Cuándo usás `next/dynamic` con `ssr: false`?</summary>

Para componentes que dependen del navegador (WebGL, `window`) o pesados que
no tienen que estar en el HTML inicial.

</details>

### [Seguridad en el frontend](./11-calidad/05-seguridad-en-el-frontend.md)

<details>
<summary>¿React previene el XSS?</summary>

Escapa todo lo que se interpola en JSX, así que cubre el caso común. No
protege con `dangerouslySetInnerHTML`, URLs `javascript:` ni código que toca
el DOM directamente.

</details>

<details>
<summary>¿Qué es una CSP y qué aporta un nonce?</summary>

Una cabecera que limita de dónde se cargan y ejecutan recursos. Con un nonce
por petición, solo se ejecutan los scripts que lo llevan, aunque se inyecte
uno inline.

</details>

<details>
<summary>¿Por qué un nonce es incompatible con páginas cacheadas?</summary>

Porque cambia en cada petición y tiene que estar en el HTML; una página
prerenderizada o cacheada tiene el mismo HTML para todos.

</details>

<details>
<summary>¿Cómo evitás filtrar secretos en Next?</summary>

No usando `NEXT_PUBLIC_` para nada sensible, marcando con `server-only` los
módulos de servidor y pasando a los Client Components solo DTOs.

</details>

<details>
<summary>¿Qué es clickjacking y cómo se evita?</summary>

Cargar tu página en un iframe invisible para que el usuario haga clic sin
saberlo. Se evita con `frame-ancestors 'none'` (o `X-Frame-Options: DENY`).

</details>

### [Errores y observabilidad](./11-calidad/06-errores-y-observabilidad.md)

<details>
<summary>¿Qué es el `digest` de un error en Next?</summary>

Un id que Next muestra en el cliente en lugar del mensaje real de un error del
servidor, para no filtrar detalles; sirve para encontrarlo en los logs.

</details>

<details>
<summary>¿Para qué sirve `instrumentation.ts`?</summary>

Para correr código al arrancar el servidor (inicializar monitoreo) y para
recibir cada error del servidor con `onRequestError`.

</details>

<details>
<summary>¿Qué errores no atrapa un error boundary?</summary>

Los de manejadores de eventos, código async fuera del render y errores del
servidor que no llegan a la UI. Se reportan por otros caminos.

</details>

<details>
<summary>¿Por qué subir los source maps a Sentry y no servirlos?</summary>

Para ver el stack con el código original sin exponer el código fuente a cualquiera.

</details>

<details>
<summary>¿Qué es un log estructurado?</summary>

Un log en un formato con campos (JSON) en vez de texto libre, que se puede
filtrar y agregar por nivel, ruta o cualquier otro campo.

</details>

## 12. Producción

### [El build de producción y las variables por entorno](./12-produccion/01-build-y-variables.md)

<details>
<summary>¿Qué significan los símbolos de la salida de `next build`?</summary>

Estático (prerenderizado completo), prerender parcial (shell estático con
partes dinámicas transmitidas) y dinámico (render en cada petición).

</details>

<details>
<summary>¿Por qué una variable `NEXT_PUBLIC_` no cambia al redeployar la misma imagen?</summary>

Porque se reemplaza por su valor en el JavaScript durante el build. Para
cambiarla hay que volver a construir.

</details>

<details>
<summary>¿Qué es `output: 'standalone'`?</summary>

Un modo de build que genera un servidor mínimo con solo las dependencias que
usa la app, pensado para contenedores.

</details>

<details>
<summary>¿Qué es el version skew y cómo lo manejás?</summary>

Clientes con una versión vieja hablando con un servidor nuevo durante un
deploy. Se mitiga identificando cada build (`deploymentId`) para forzar una
recarga cuando no coinciden.

</details>

### [Next en Docker](./12-produccion/02-docker.md)

<details>
<summary>¿Por qué un Dockerfile multi-etapa?</summary>

Para que la imagen final tenga solo lo necesario para ejecutar: más chica,
más rápida de arrancar y con menos superficie de ataque.

</details>

<details>
<summary>¿Cómo aprovechás la caché de capas con pnpm?</summary>

Copiando primero solo el lockfile e instalando (`pnpm fetch`), y después el
código. Un cambio de código no invalida la capa de dependencias.

</details>

<details>
<summary>¿Cómo pasás un secreto al build sin que quede en la imagen?</summary>

Con secretos de BuildKit (`--mount=type=secret`), que solo existen durante ese
`RUN`. Ni `ARG` ni `ENV`.

</details>

<details>
<summary>¿Qué tenés que copiar además de `.next/standalone`?</summary>

`.next/static` (JS y CSS) y `public/`, que standalone no incluye.

</details>

### [Desplegar en Cloud Run (y las alternativas)](./12-produccion/03-cloud-run-y-alternativas.md)

<details>
<summary>¿Qué cambia al correr Next en varias instancias?</summary>

La caché del servidor es por instancia: hay que compartirla (un cache handler
en Redis) para que las revalidaciones lleguen a todas y no se sirvan
versiones distintas.

</details>

<details>
<summary>¿Vercel o un contenedor propio?</summary>

Vercel resuelve caché, imágenes y previews sin configurar, a cambio de costo
y de estar fuera de tu nube. Un contenedor da control y todo en el mismo
lugar que el backend, a cambio de armar esas piezas.

</details>

<details>
<summary>¿Por qué importa la región?</summary>

Porque Next llama a la API durante el render: la latencia entre los dos suma
al tiempo de cada página.

</details>

<details>
<summary>¿Qué hace un CDN delante de Next?</summary>

Sirve los archivos estáticos con hash (cacheables para siempre) y las
imágenes optimizadas desde el borde, sin llegar al servidor.

</details>

### [CI y despliegue continuo con GitHub Actions](./12-produccion/04-ci-y-despliegue-continuo.md)

<details>
<summary>¿Qué es `nx affected` y por qué importa?</summary>

Calcula qué proyectos cambió un commit (y cuáles dependen de ellos) y corre
las tareas solo en esos. En un monorepo, mantiene el CI rápido.

</details>

<details>
<summary>¿Cómo hacés un rollback en Cloud Run?</summary>

Moviendo el tráfico a una revisión anterior, que sigue existiendo con su imagen.

</details>

<details>
<summary>¿Qué es un smoke test?</summary>

Una prueba mínima contra el entorno recién desplegado para confirmar que
responde lo básico.

</details>

<details>
<summary>¿Por qué Workload Identity Federation y no una llave de servicio?</summary>

Porque GitHub obtiene credenciales temporales en cada ejecución; no hay una
llave permanente que pueda filtrarse.

</details>

## 13. Arquitectura de frontend

### [Estructura de una app grande - por features](./13-arquitectura/01-estructura-por-features.md)

<details>
<summary>¿Cómo organizás una app React grande?</summary>

Por feature o dominio: cada carpeta tiene sus componentes, datos, esquemas y
pruebas; lo genérico aparte; y reglas de dependencias para que las features
no se acoplen.

</details>

<details>
<summary>¿Cómo decidís qué es Server y qué es Client Component?</summary>

Por defecto servidor. Client solo para lo que necesita estado, eventos o APIs
del navegador, lo más abajo posible en el árbol, recibiendo datos por props.

</details>

<details>
<summary>¿Qué ganás con páginas delgadas?</summary>

Las rutas quedan como composición; la lógica se prueba y se mueve sin tocar el
ruteo, y cambiar una librería no afecta a las páginas.

</details>

### [El monorepo - librerías compartidas, contratos y límites](./13-arquitectura/02-monorepo-nx-y-contratos.md)

<details>
<summary>¿Qué ventajas tiene un monorepo para front y back?</summary>

Cambios atómicos entre API y frontend, tipos compartidos, herramientas y CI
comunes, y ejecutar solo lo afectado. A cambio, necesita reglas de límites
y herramientas como Nx.

</details>

<details>
<summary>¿Cómo mantenés sincronizados los tipos del frontend con la API?</summary>

Generándolos del contrato OpenAPI y verificando en CI que estén al día; el
compilador marca lo que cambió.

</details>

<details>
<summary>¿Cómo evitás que un monorepo se vuelva una bola de barro?</summary>

Con etiquetas y reglas de dependencias forzadas por lint, y librerías con una
responsabilidad clara.

</details>

<details>
<summary>¿Cuándo usarías microfrontends?</summary>

Con varios equipos autónomos que necesitan desplegar partes de la misma
interfaz por separado. Para un equipo chico, el costo supera el beneficio.

</details>

### [Decisiones de render, página por página](./13-arquitectura/03-decisiones-de-render-por-pagina.md)

<details>
<summary>Diseñá el render de una página de producto que cambia cuando alguien la edita.</summary>

Cachearla con una etiqueta, prerenderizar las más visitadas, generar el resto
bajo demanda, y revalidar la etiqueta desde el backend al editar. Lo
personalizado, en un `<Suspense>` dinámico.

</details>

<details>
<summary>¿Dónde guardás cada tipo de estado en una app Next?</summary>

Datos del servidor: Server Components o TanStack Query. Lo compartible
(filtros, página): la URL. Estado global de interfaz: Zustand o Context.
Lo local: `useState`. La sesión: una cookie `HttpOnly`.

</details>

<details>
<summary>¿Cuándo usarías TanStack Query si ya tenés Server Components?</summary>

Cuando la pantalla es muy interactiva: paginación y filtros sin recargar,
mutaciones optimistas, sondeo o datos que cambian mientras el usuario mira.

</details>

<details>
<summary>¿Por qué no renderizar todo dinámico y listo?</summary>

Porque cada visita espera a la API y a renderizar; con caché la mayoría de
las visitas reciben HTML listo, más rápido y más barato.

</details>

### [El ecosistema - Vite, React Router, TanStack Start, Astro y el Pages Router](./13-arquitectura/04-el-ecosistema-react.md)

<details>
<summary>¿Cuándo usarías una SPA con Vite en vez de Next?</summary>

Para apps detrás de login sin necesidad de SEO, donde un despliegue estático
simple y barato alcanza, o cuando el equipo no quiere operar un servidor.

</details>

<details>
<summary>¿Qué equivale a `getServerSideProps` en el App Router?</summary>

Un Server Component async que pide los datos en el render; con Cache
Components es dinámico salvo que se cachee con `'use cache'`.

</details>

<details>
<summary>¿Qué pasó con Remix?</summary>

Se fusionó con React Router: React Router 7 en modo framework ofrece loaders,
actions y SSR, y es la continuación de Remix.

</details>

<details>
<summary>¿Qué es la arquitectura de islas?</summary>

Servir HTML estático e hidratar solo los componentes interactivos de forma
independiente, como hace Astro.

</details>

---

343 preguntas en total.
