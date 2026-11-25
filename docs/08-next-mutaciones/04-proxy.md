---
title: proxy.ts (el antiguo middleware)
sidebar_position: 4
description: Qué es proxy.ts en Next 16, cuándo corre, matcher, redirect, rewrite y cabeceras, por qué no es seguridad, y para qué lo usa ripopola - proteger el panel y, en la web, el idioma.
---

# `proxy.ts` (el antiguo middleware)

<Tech ids={['nextdotjs', 'betterauth']} />

<Estado tipo="construye">El `proxy.ts` del panel que manda al login a quien no tiene cookie de sesión. En la web, el de idiomas llega en el 10.1.</Estado>

## Concepto

`proxy.ts` (en la raíz de la app, al lado de `app/`) es una función que corre
**en el servidor antes de cada petición**, antes de buscar la página. Puede:

- **Redirigir** (`NextResponse.redirect`): cambia la URL del navegador.
- **Reescribir** (`NextResponse.rewrite`): sirve otra ruta sin cambiar la URL.
- **Agregar cabeceras** a la petición o a la respuesta.
- **Leer y escribir cookies**.
- **Responder directamente** (por ejemplo un 401).

```ts title="proxy.ts"
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/viejo') {
    return NextResponse.redirect(new URL('/nuevo', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Next 16: de `middleware.ts` a `proxy.ts`

Es el mismo mecanismo con otro nombre. El nombre "middleware" confundía con
el middleware de Express (que corre dentro de la app); "proxy" deja claro que
es una capa **delante** de la app. Además, en Next 16 corre por defecto en
**Node.js** (antes, en el runtime Edge, con APIs limitadas). Hay un codemod:

```bash
pnpm dlx @next/codemod@latest middleware-to-proxy .
```

### El orden

1. `headers` y `redirects` de `next.config.ts`
2. **`proxy.ts`**
3. `rewrites` (`beforeFiles`), archivos y rutas de `app/`, `rewrites` (`afterFiles`)...

Sin `matcher`, el proxy corre en **todas** las peticiones, incluidos el CSS,
el JS y las imágenes. Un `matcher` mal escrito es la causa número uno de "se
rompieron los estilos".

### No es seguridad

Las Server Actions **no** son rutas aparte: son POST a la página donde se
usan. Si el `matcher` excluye esa página, o si alguien mueve la acción, el
proxy deja de cubrirla sin avisar. Por eso la documentación de Next es
explícita: el proxy es una **comprobación optimista**. La autorización real va
cerca de los datos: en el layout o la página, en cada Server Action y, en
ripopola, en Nest.

| Capa | Qué hace | ¿Es seguridad? |
| --- | --- | --- |
| `proxy.ts` | ¿Hay cookie de sesión? Si no, al login | No: experiencia (evita renderizar para nada) |
| Layout de `(privado)` | Pregunta a Nest quién es (`/api/v1/me`) | Parcial: protege la UI |
| Nest (`AuthGuard`, políticas) | Valida la sesión y los permisos en cada endpoint | **Sí**: la autoridad |

### Qué no hacer en el proxy

- Consultar la base o llamar a la API en cada petición: suma latencia a
  **todo**, incluso a lo que no lo necesita.
- Lógica de negocio.
- Validar la sesión "de verdad": para eso está Nest.

## Si venís de Angular

<Angular>

| Angular | Next |
| --- | --- |
| `CanActivateFn` (corre en el navegador, después de cargar la app) | `proxy.ts` (corre en el servidor, antes de mandar nada) |
| Interceptor HTTP | No hay equivalente directo: el proxy ve peticiones a **tus páginas**, no las que tu app hace a la API |
| Middleware de Express en `server.ts` (SSR) | Es lo más parecido |

Igual que un guard, no reemplaza la autorización del backend.

</Angular>

## En ripopola

### 1. El proxy del panel

```ts title="apps/panel/proxy.ts"
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const PUBLIC_PATHS = ['/login', '/registro', '/recuperar'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(getSessionCookie(request));

  if (!isPublic && !hasSession) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname + search);
    return NextResponse.redirect(login);
  }
  if (isPublic && hasSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));   // ya tiene sesión
  }
  return NextResponse.next();
}

export const config = {
  // Todo menos lo estático, los rewrites a Nest y los endpoints internos
  matcher: ['/((?!api|internal|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)'],
};
```

Qué mirar:

- **`getSessionCookie`** (de `better-auth/cookies`) solo mira que la cookie
  **exista**, con el nombre y prefijo que usa Better Auth. No la valida: una
  cookie vencida o inventada pasa. Por eso es optimista.
- **`next`** guarda a dónde quería ir el usuario; el login lo usa al terminar
  (9.3). Validá que sea una ruta relativa antes de redirigir (*open redirect*).
- **`api` fuera del matcher**: en desarrollo `/api/*` se reenvía a Nest, y
  Nest responde 401 por su cuenta.

### 2. La capa real

El layout de `(privado)` le pregunta a Nest quién es el usuario y redirige si
la sesión no es válida. Lo escribís en el 9.4, junto con los roles.

### 3. La web

La web pública no tiene zonas privadas, así que su `proxy.ts` hace otra cosa:
detectar el idioma y redirigir `/` a `/es` o `/it` con `next-intl` (10.1).

<Alternativa title="Proteger rutas sin proxy">
Se puede proteger solo con el layout (y es lo que cuenta como seguridad). El
proxy agrega que el usuario sin sesión **ni siquiera** espera el render: el
redirect sale en milisegundos. En una app con pocas rutas privadas, el layout
alcanza.
</Alternativa>

## Errores comunes

- **Matcher sin excluir `_next/static`**: la página de login carga sin CSS
  porque el CSS también "necesita sesión".
- **Bucle de redirecciones**: `/login` dentro del matcher y sin estar en las
  rutas públicas.
- **Confiar en el proxy como única protección** de una Server Action o de un dato.
- **Llamar a la API en el proxy** para validar la sesión en cada petición.
- **Seguir buscando `middleware.ts`**: en Next 16 sigue funcionando pero está
  deprecado; el nombre nuevo es `proxy.ts`.
- **Redirigir a `next` sin validar**: un atacante arma
  `/login?next=https://otro-sitio.com`.

<Resumen>

- `proxy.ts` corre en el servidor antes de cada petición: redirect, rewrite, cabeceras, cookies.
- En Next 16 reemplaza a `middleware.ts` y corre en Node.js.
- `matcher` siempre, excluyendo lo estático.
- Es una comprobación optimista: la seguridad está en el layout, en cada acción y en Nest.
- Panel: sin cookie de sesión → `/login?next=...`. Web: idioma (10.1).

</Resumen>

## Preguntas de entrevista

**1. ¿Qué es `proxy.ts` y qué pasó con `middleware.ts`?**
Es la función que corre antes de cada petición para redirigir, reescribir o
tocar cabeceras y cookies. En Next 16 `middleware.ts` pasó a llamarse
`proxy.ts` para no confundirlo con el middleware de Express, y corre en Node.js por defecto.

**2. ¿Alcanza con proteger rutas en el proxy?**
No. Es optimista: solo ve si hay cookie, y las Server Actions pueden quedar
fuera del matcher. La autorización se hace cerca de los datos y en el backend.

**3. ¿Qué diferencia hay entre redirect y rewrite?**
El redirect le dice al navegador que vaya a otra URL (cambia la barra de
direcciones); el rewrite sirve otro contenido en la misma URL.

**4. ¿Qué cuidás en el `matcher`?**
Que excluya archivos estáticos, imágenes y rutas que no lo necesitan, y que no
genere bucles (por ejemplo, incluir el login en una regla que redirige al login).

**5. ¿Qué es un open redirect y cómo lo evitás en un login?**
Redirigir a una URL que viene del usuario sin validarla: permite usar tu dominio
para mandar a un sitio malicioso. Se evita aceptando solo rutas relativas propias.

## Glosario

| Término | Qué es |
| --- | --- |
| `proxy.ts` | Función de Next que corre antes de cada petición (antes `middleware.ts`). |
| `matcher` | Patrones de las rutas en las que corre el proxy. |
| Comprobación optimista | Una verificación rápida que mejora la experiencia pero no garantiza seguridad. |
| Open redirect | Vulnerabilidad de redirigir a una URL arbitraria que vino en la petición. |
