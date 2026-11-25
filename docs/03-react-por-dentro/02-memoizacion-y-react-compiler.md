---
title: Memoización y React Compiler
sidebar_position: 2
description: memo, useMemo y useCallback, igualdad referencial, cuándo sirven de verdad, y cómo el React Compiler memoiza automáticamente (y qué reglas tenés que respetar).
---

# Memoización y React Compiler

<Tech ids={['react', 'nextdotjs']} />

<Estado tipo="construye">React Compiler activado en `apps/web` (desde el 1.2) y la regla de lint del compiler.</Estado>

## Concepto

### Las tres herramientas manuales

| API | Memoiza | Para |
| --- | --- | --- |
| `memo(Componente)` | El render de un componente | Saltear el render si las props son iguales (`Object.is` por prop) |
| `useMemo(() => calc, deps)` | Un valor | Cálculos caros o mantener la misma referencia de un objeto |
| `useCallback(fn, deps)` | Una función | Mantener la misma referencia de un callback |

### El problema: igualdad referencial

```tsx
function Page() {
  const [q, setQ] = useState('');
  const filters = { country: 'ES' };          // objeto nuevo en cada render
  const onSelect = (id: string) => {/*...*/}; // función nueva en cada render
  return <MemoTownGrid filters={filters} onSelect={onSelect} />; // memo no sirve: props "distintas"
}
```

`memo` compara por referencia. Si le pasás objetos o funciones creados en el
render, siempre son nuevos y `memo` no hace nada. Por eso aparecían juntos
`memo` + `useMemo` + `useCallback`... y por eso tanta gente los usaba mal.

### React Compiler

El compiler (estable desde la 1.0) analiza tu código en el build y **memoiza
automáticamente** componentes, valores y funciones, con más precisión que a
mano (puede memoizar partes del JSX, incluso después de un `return` temprano).

Con el compiler:
- No escribís `useMemo`, `useCallback` ni `memo` en código nuevo (salvo casos
  puntuales como dependencias de efectos que tenés que controlar).
- El código queda más simple y el rendimiento mejora en general.

**Requisito:** que tu código cumpla las reglas de React (componentes puros,
no mutar props ni estado, hooks en orden). Si un componente las rompe, el
compiler lo **saltea** (no lo optimiza) en vez de romperlo. La regla de ESLint
`react-hooks` (incluida en `eslint-config-next`) te marca esos casos.

```ts title="apps/web/next.config.ts"
const nextConfig: NextConfig = {
  reactCompiler: true,
};
```

Para optar por componente, en vez de toda la app: `reactCompiler: { compilationMode: 'annotation' }`
y `'use memo'` arriba de cada función.

### Cuándo la memoización manual todavía importa

- Sin compiler (código existente en muchas empresas).
- Para **estabilizar una dependencia** de `useEffect` a propósito.
- Librerías de terceros que comparan referencias.

### Cuándo NO sirve

- Cálculos baratos (filtrar 20 pueblos): la memoización cuesta más.
- Componentes que igual reciben props nuevas siempre.
- Como "arreglo" de un estado mal ubicado: primero bajá el estado (3.1).

## Si venís de Angular

<Angular>

| Angular | React |
| --- | --- |
| `computed()` memoiza solo y sabe sus dependencias | `useMemo` con dependencias manuales (o el compiler) |
| `OnPush` | `memo` |
| Pipes puros (cachean por entrada) | `useMemo` / el compiler |
| El compilador de Angular optimiza plantillas | El React Compiler optimiza componentes y hooks |

Angular con signals te da la memoización "gratis"; el React Compiler acerca
React a esa experiencia.

</Angular>

## En ripopola

1. Ya activaste `reactCompiler: true` y instalaste `babel-plugin-react-compiler` (1.2).
2. Verificá que el lint corra las reglas del compiler:

```bash
pnpm exec nx lint web
```

3. En React DevTools, los componentes optimizados muestran la insignia
   **"Memo ✨"**. Si uno no la tiene, mirá qué regla rompe.

<Ejercicio title="Ver al compiler trabajar">

En `/laboratorio`, armá un padre con un contador y un hijo que haga
`console.log('render hijo')` y reciba un objeto `{ country: 'ES' }` creado en
el padre. Con `reactCompiler: false`, contá los logs al apretar el contador.
Activá el compiler y repetí.

<details>
<summary>Qué tenés que ver</summary>

Sin compiler, el hijo se renderiza en cada clic. Con compiler, el objeto y el
hijo quedan memoizados: el log aparece solo la primera vez.

</details>
</Ejercicio>

## Errores comunes

- **`useCallback` en todo** "por rendimiento" sin `memo` en el hijo: no sirve.
- **Dependencias mal puestas en `useMemo`**: valores viejos.
- **Mutar un objeto memoizado**: el compiler asume que no mutás.
- **Pelearse con la regla de lint del compiler** en vez de arreglar la impureza.

<Resumen>

- `memo`, `useMemo` y `useCallback` evitan trabajo comparando por referencia.
- Sirven juntos o no sirven: un objeto nuevo rompe a `memo`.
- React Compiler memoiza automáticamente si el código respeta las reglas de React.
- Antes de memoizar: medir y ubicar bien el estado.

</Resumen>

## Preguntas de entrevista

**1. ¿Diferencia entre `memo`, `useMemo` y `useCallback`?**
`memo` evita re-renderizar un componente si sus props no cambian; `useMemo`
cachea un valor; `useCallback` cachea una función. Los dos últimos sirven
sobre todo para que `memo` funcione.

**2. ¿Por qué `memo` a veces no evita renders?**
Porque compara props por referencia y el padre le pasa objetos, arrays o
funciones nuevas en cada render.

**3. ¿Qué hace el React Compiler?**
Analiza el código en el build y agrega memoización automática a componentes y
hooks, más fina que la manual. Requiere que el código cumpla las reglas de React.

**4. ¿Qué pasa si un componente rompe las reglas de React con el compiler activo?**
El compiler lo detecta y no lo optimiza; el componente sigue funcionando como
antes. El linter lo avisa.

**5. ¿Memoizarías todo por defecto sin compiler?**
No. Tiene costo de memoria y de comparación, y complica el código. Se memoiza
lo que el Profiler muestra como caro o lo que necesita una referencia estable.

## Glosario

| Término | Qué es |
| --- | --- |
| Memoización | Guardar un resultado para no recalcularlo con la misma entrada. |
| Igualdad referencial | Dos objetos son iguales solo si son el mismo objeto. |
| React Compiler | Compilador que memoiza automáticamente. |
| `'use memo'` | Directiva para optar por el compiler en un componente. |
