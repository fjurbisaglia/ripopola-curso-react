---
title: Rutas, layouts y páginas
sidebar_position: 2
description: El App Router por dentro - carpetas como rutas, page y layout, layouts anidados, grupos de rutas, segmentos dinámicos, params asíncronos y los helpers PageProps y LayoutProps.
---

# Rutas, layouts y páginas

<Tech ids={['nextdotjs', 'typescript']} />

<Estado tipo="construye">La estructura de rutas de las dos apps de ripopola: la web pública con la ficha `/pueblos/[slug]` y el panel con su zona privada.</Estado>

## Concepto

### Carpetas = segmentos

```
app/
  layout.tsx                → layout raíz (obligatorio: <html> y <body>)
  page.tsx                  → /
  pueblos/
    page.tsx                → /pueblos
    [slug]/
      page.tsx              → /pueblos/albarracin, /pueblos/civita-di-bagnoregio
  (legal)/                  → grupo: NO aparece en la URL
    layout.tsx              → layout de las páginas legales
    privacidad/page.tsx     → /privacidad
```

- Una carpeta es un **segmento** de la URL. Solo es una ruta pública si tiene
  `page.tsx` (o `route.ts`).
- Podés poner otros archivos (componentes, tests) dentro de `app/`: no son rutas.
- `[slug]` es un **segmento dinámico**. `[...slug]` captura varios
  (`/a/b/c`), `[[...slug]]` los hace opcionales.
- `(nombre)` es un **grupo de rutas**: organiza y permite layouts distintos sin
  cambiar la URL.
- `_carpeta` es **privada**: nunca es ruta.

### Layouts

Un `layout.tsx` envuelve a todas las páginas de su segmento y de los de abajo.
**Se conserva entre navegaciones**: en el panel, al ir de `/viviendas` a
`/empleos`, el layout con la sidebar no se vuelve a montar (mantiene su estado
y no se vuelve a pedir).

```tsx title="apps/panel/app/(privado)/layout.tsx"
export default function PanelLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <PanelSidebar />
      <main>{children}</main>
    </div>
  );
}
```

`template.tsx` es como un layout pero **se vuelve a montar** en cada
navegación (para animaciones de entrada o resetear estado).

### Páginas, `params` y `searchParams`

En Next 15+ `params` y `searchParams` son **promesas**:

```tsx title="app/pueblos/[slug]/page.tsx"
export default async function TownPage({ params }: PageProps<'/pueblos/[slug]'>) {
  const { slug } = await params;
  const town = await getTown(slug);
  return <h1>{town.name}</h1>;
}
```

`PageProps<'/ruta'>` y `LayoutProps<'/ruta'>` son **helpers globales** (no se
importan) que Next genera con los tipos exactos de cada ruta. Se generan al
correr `next dev`, `next build` o `next typegen`.

Si querés que los `href` también estén tipados, activá `typedRoutes: true` en
`next.config.ts`: un link a una ruta que no existe no compila.

## Si venís de Angular

<Angular>

| Angular Router | App Router |
| --- | --- |
| `Routes` en `app.routes.ts` | Carpetas en `app/` |
| `path: 'pueblos/:slug'` | `app/pueblos/[slug]/page.tsx` |
| `children: [...]` + `<router-outlet>` | Layouts anidados + `{children}` |
| `loadComponent` / `loadChildren` (lazy) | Automático: cada ruta es su propio paquete |
| `input()` con `withComponentInputBinding` | `params` y `searchParams` como props |
| `path: '**'` | `not-found.tsx` (6.5) |
| Rutas sin componente para agrupar | Grupos `(nombre)` |

</Angular>

## En ripopola

La web pública (`ripopola.com`; en el 10.1 se agrega `[locale]` arriba de todo):

```
apps/web/app/
  layout.tsx                    html, body, fuentes, Providers
  (sitio)/
    layout.tsx                  header público y footer
    page.tsx                    home
    pueblos/
      page.tsx                  listado con filtros
      [slug]/
        page.tsx                ficha del pueblo
        viviendas/page.tsx      viviendas del pueblo
    mapa/page.tsx
  (legal)/
    layout.tsx                  layout simple, sin buscador
    privacidad/page.tsx
```

El panel del municipio (`panel.ripopola.com`), otra app con su propio layout raíz:

```
apps/panel/app/
  layout.tsx                    html, body, fuentes, Providers
  (privado)/
    layout.tsx                  sidebar, sesión obligatoria (9.4)
    page.tsx                    resumen
    viviendas/
      page.tsx                  listado
      nueva/page.tsx            formulario (5.3)
      [id]/page.tsx             editar
  (auth)/
    layout.tsx                  layout centrado, sin sidebar
    login/page.tsx
    registro/page.tsx
```

Cada grupo tiene **su propio layout**: en el panel, `/login` no hereda la
sidebar de `(privado)`. Y como el panel es otra app, nada de su código ni de
sus dependencias (formularios, subida de fotos) pesa en la web pública.

<Ejercicio title="La estructura vacía">

Creá todas las carpetas con un `page.tsx` que devuelva solo un `h1` con el
nombre de la página, y los tres layouts de grupo. Navegá a mano por todas las
URLs.

<details>
<summary>Comprobación</summary>

En el panel, `localhost:4300/viviendas` tiene que mostrar la sidebar y
`localhost:4300/login` no. En la web, `/privacidad` no muestra el buscador del
header público.

</details>
</Ejercicio>

## Errores comunes

- **Dos páginas que resuelven la misma URL** desde grupos distintos (`(a)/x` y `(b)/x`): error de build.
- **Usar `params.slug` sin `await`**: en Next 16 es una promesa.
- **Lógica que debería reiniciarse en un layout**: los layouts no se re-montan; usá `template` o una key.
- **Poner `'use client'` en un layout** "para un botón": convertís todo en cliente. El botón va en su propio componente.

<Resumen>

- Carpeta = segmento; `page.tsx` = ruta pública.
- Layouts anidados que se conservan entre navegaciones.
- `[slug]` dinámico, `(grupo)` sin URL, `_privada` nunca ruta.
- `params` y `searchParams` son promesas; `PageProps` y `LayoutProps` las tipan.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo se define una ruta en el App Router?**
Con una carpeta por segmento y un `page.tsx` que exporta el componente de la
página. Sin `page.tsx`, la carpeta no es una ruta pública.

**2. ¿Diferencia entre `layout` y `template`?**
El layout se conserva entre navegaciones de sus hijas (estado y DOM); el
template se vuelve a montar en cada navegación.

**3. ¿Para qué sirven los grupos de rutas?**
Para organizar carpetas y dar layouts distintos a partes de la app sin
afectar la URL.

**4. ¿Por qué `params` es una promesa en Next 15+?**
Para que Next pueda empezar a renderizar lo que no depende de los parámetros
antes de tenerlos, y prerenderizar más.

## Glosario

| Término | Qué es |
| --- | --- |
| Segmento | Cada parte de la URL, que corresponde a una carpeta. |
| Segmento dinámico | Carpeta `[x]` cuyo valor viene de la URL. |
| Grupo de rutas | Carpeta `(x)` que no afecta la URL. |
| Layout | UI compartida que envuelve a sus páginas hijas. |
| `typedRoutes` | Opción que tipa los `href` con las rutas existentes. |
