---
title: Seguridad en el frontend
sidebar_position: 5
description: XSS y cómo lo evita React (y cuándo no), dangerouslySetInnerHTML y sanitizar, CSP con y sin nonce según la app, cabeceras de seguridad, secretos y server-only, taint, Server Actions como endpoints públicos y dependencias.
---

# Seguridad en el frontend

<Tech ids={['nextdotjs', 'react']} />

<Estado tipo="construye">Cabeceras de seguridad en las dos apps, CSP con nonce en el panel y sin nonce en la web cacheada, y la descripción del pueblo sanitizada.</Estado>

## Concepto

El frontend no es la línea de defensa principal (esa es Nest), pero puede
abrir agujeros que el backend no puede cerrar. Los que importan:

| Riesgo | Qué es | Defensa |
| --- | --- | --- |
| **XSS** | Ejecutar JavaScript del atacante en tu página | Escape de React, sanitizar HTML, CSP |
| **Filtrar secretos** | Que una clave termine en el bundle | Solo servidor, `server-only`, nada en `NEXT_PUBLIC_` |
| **Filtrar datos** | Pasar a un Client Component más de lo necesario | DTOs, `taint` |
| **Acciones sin control** | Server Actions sin validar ni autorizar | Validar y que Nest autorice (8.1) |
| **Clickjacking** | Tu panel dentro de un iframe ajeno | `frame-ancestors 'none'` |
| **Open redirect** | Redirigir a cualquier URL | Solo rutas relativas (9.3) |
| **Dependencias** | Un paquete comprometido | Auditoría, versiones fijas, menos paquetes |

### XSS y React

React **escapa** todo lo que ponés entre llaves: `<p>{town.description}</p>`
con `<script>` adentro muestra el texto, no lo ejecuta. Los huecos:

- **`dangerouslySetInnerHTML`**: inserta HTML tal cual.
- **`href` con `javascript:`**: `<a href={userUrl}>` con `javascript:alert(1)`.
  React 19 lo bloquea en desarrollo con un aviso, pero validá las URLs que
  vienen de usuarios (`new URL()` y protocolo `https:`).
- **JSON en un `<script>`** (JSON-LD, 6.6): escapar `<` para que un
  `</script>` no cierre la etiqueta.
- Librerías que manipulan el DOM a mano (un mapa, un editor) con datos del usuario.

### CSP (Content Security Policy)

Una cabecera que le dice al navegador **de dónde** puede cargar scripts,
estilos, imágenes y conexiones. Si un XSS logra inyectar un `<script>`, la CSP
impide que se ejecute.

La versión fuerte usa un **nonce** por petición (`script-src 'nonce-abc'
'strict-dynamic'`). Pero un nonce por petición obliga a **renderizar cada
página de forma dinámica**: es incompatible con páginas cacheadas. De ahí la
decisión en ripopola:

| App | CSP | Por qué |
| --- | --- | --- |
| panel | Con nonce, generado en `proxy.ts` | Ya es dinámico (sesión en cada página) |
| web | Sin nonce: orígenes permitidos | Las fichas están cacheadas; un nonce rompería el prerender |

(La alternativa experimental para páginas estáticas es **SRI**: Next calcula
hashes de los scripts en el build, `experimental.sri`.)

## Si venís de Angular

<Angular>

Angular sanitiza por defecto el HTML que pasás a `[innerHTML]` y te obliga a
`bypassSecurityTrustHtml` para saltearlo. React no sanitiza: con
`dangerouslySetInnerHTML` el HTML entra tal cual. El nombre "dangerously" es
el aviso; la sanitización la ponés vos.

</Angular>

## En ripopola

### 1. La descripción del pueblo

El ayuntamiento escribe la descripción con un editor que permite negritas,
listas y enlaces. Nest la guarda como HTML **ya sanitizado** (curso de Nest).
En la web se sanitiza **otra vez** al mostrar, por si algo cambia en el camino:

```bash
pnpm add -E isomorphic-dompurify --filter web
```

```tsx title="apps/web/components/rich-text.tsx"
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED = { ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h3', 'br'], ALLOWED_ATTR: ['href'] };

export function RichText({ html, lang }: { html: string; lang?: string }) {
  const clean = DOMPurify.sanitize(html, ALLOWED);
  return <div lang={lang} className="prose" dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

Es un Server Component: DOMPurify corre en el servidor y al navegador llega
el HTML limpio, sin la librería.

### 2. Cabeceras para las dos apps

```ts title="apps/web/next.config.ts (fragmento)"
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",              // web: sin nonce (páginas cacheadas)
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://storage.googleapis.com https://tiles.openfreemap.org",
      "connect-src 'self' https://api.ripopola.com https://tiles.openfreemap.org",
      "worker-src 'self' blob:",                       // MapLibre usa workers
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  // ...
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

- `'unsafe-inline'` en `script-src` es el precio de no usar nonce: Next
  inyecta scripts inline para la hidratación. La CSP de la web igual limita
  **de dónde** se carga y **a dónde** se conecta.
- `geolocation=(self)`: el "pueblos cerca de mí" (2.1) la necesita.
- Empezá con `Content-Security-Policy-Report-Only` y mirá la consola: las
  violaciones aparecen sin romper nada.

### 3. CSP con nonce en el panel

```ts title="apps/panel/proxy.ts (agregado al de la 8.4)"
export function proxy(request: NextRequest) {
  // ... la comprobación de sesión de antes ...

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https://storage.googleapis.com",
    "connect-src 'self' https://api.ripopola.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

Next lee el nonce de la cabecera de la petición y lo aplica solo a sus
scripts. Si cargás un `<Script>` de terceros, pasale el nonce leyendo
`(await headers()).get('x-nonce')`.

### 4. Secretos y datos

- **Variables**: solo `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` y
  `NEXT_PUBLIC_MAP_STYLE_URL` son públicas. `REVALIDATE_SECRET`,
  `API_INTERNAL_URL` y claves de terceros: solo servidor.
- **`server-only`** en todo módulo que lea cookies, secretos o la URL interna.
- **DTOs al cliente**: el layout del panel pasa a `MeProvider` el usuario de
  `/api/v1/me`, que Nest ya arma sin campos internos. Si alguna vez pasás un
  objeto grande, armá uno chico.
- **`taint`** (experimental, `experimental.taint: true`): marca un objeto o un
  valor para que React tire error si llega a un Client Component.

```ts
import { experimental_taintUniqueValue } from 'react';
experimental_taintUniqueValue('No mandes el secreto al cliente', process, process.env.REVALIDATE_SECRET!);
```

### 5. Dependencias

- `pnpm audit` en CI y Dependabot o Renovate para actualizar.
- Versiones exactas (`-E`) y el *lockfile* versionado.
- Antes de agregar un paquete: ¿lo necesito?, ¿quién lo mantiene?, ¿cuánto pesa?
- pnpm no ejecuta scripts `postinstall` de dependencias salvo los que apruebes
  (`pnpm approve-builds`): mantenelo así.

## Errores comunes

- **`dangerouslySetInnerHTML` sin sanitizar**, aunque "venga de nuestra API".
- **Una clave en `NEXT_PUBLIC_`.**
- **CSP con nonce en páginas que querés cachear**: rompe el prerender.
- **Validar solo en el cliente.**
- **`href` con URLs de usuarios sin validar el protocolo.**
- **Copiar una CSP de internet sin probar**: el mapa deja de cargar tiles.

<Resumen>

- React escapa por defecto; los huecos son `dangerouslySetInnerHTML`, URLs y DOM manual.
- HTML de usuarios: sanitizar con DOMPurify en el servidor.
- CSP: con nonce en el panel (dinámico), por orígenes en la web (cacheada).
- Cabeceras de seguridad en `next.config.ts`; `frame-ancestors 'none'`.
- Secretos solo en el servidor, `server-only`, DTOs y `taint`.
- Dependencias auditadas y pocas.

</Resumen>

## Preguntas de entrevista

**1. ¿React previene el XSS?**
Escapa todo lo que se interpola en JSX, así que cubre el caso común. No
protege con `dangerouslySetInnerHTML`, URLs `javascript:` ni código que toca
el DOM directamente.

**2. ¿Qué es una CSP y qué aporta un nonce?**
Una cabecera que limita de dónde se cargan y ejecutan recursos. Con un nonce
por petición, solo se ejecutan los scripts que lo llevan, aunque se inyecte
uno inline.

**3. ¿Por qué un nonce es incompatible con páginas cacheadas?**
Porque cambia en cada petición y tiene que estar en el HTML; una página
prerenderizada o cacheada tiene el mismo HTML para todos.

**4. ¿Cómo evitás filtrar secretos en Next?**
No usando `NEXT_PUBLIC_` para nada sensible, marcando con `server-only` los
módulos de servidor y pasando a los Client Components solo DTOs.

**5. ¿Qué es clickjacking y cómo se evita?**
Cargar tu página en un iframe invisible para que el usuario haga clic sin
saberlo. Se evita con `frame-ancestors 'none'` (o `X-Frame-Options: DENY`).

## Glosario

| Término | Qué es |
| --- | --- |
| XSS | Inyección de scripts en una página para que se ejecuten en el navegador de otros. |
| CSP | Content Security Policy: cabecera que restringe los orígenes de recursos. |
| Nonce | Valor aleatorio de un solo uso que autoriza scripts concretos. |
| Sanitizar | Quitar de un HTML todo lo que no esté permitido. |
| Taint | Marcar datos para que React impida enviarlos al cliente. |
| HSTS | Cabecera que obliga a usar HTTPS. |
