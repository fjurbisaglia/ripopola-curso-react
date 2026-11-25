# Plan del curso de React y Next

Índice generado a partir de los temas. **Construye**: se escribe en ripopola. **Concepto**: para entender y para entrevistas.

## 1. React desde Angular

- [Concepto] Qué es React (pensado desde Angular) (`01-react-desde-angular/01-que-es-react.md`)
- [Construye] El proyecto Next de ripopola, desde el día uno (`01-react-desde-angular/02-proyecto-next-dia-uno.md`)
- [Construye] JSX (`01-react-desde-angular/03-jsx.md`)
- [Construye] Componentes, props y composición (`01-react-desde-angular/04-componentes-y-props.md`)
- [Construye] Estado con useState (`01-react-desde-angular/05-estado-con-usestate.md`)
- [Construye] Eventos y formularios controlados (`01-react-desde-angular/06-eventos-y-formularios-controlados.md`)
- [Construye] Listas, keys e identidad (`01-react-desde-angular/07-listas-y-keys.md`)
- [Construye] Estilos con Tailwind y shadcn/ui (`01-react-desde-angular/08-estilos-tailwind-y-shadcn.md`)

## 2. Hooks a fondo

- [Construye] useEffect y la sincronización (`02-hooks/01-useeffect.md`)
- [Construye] useRef y el DOM (`02-hooks/02-useref.md`)
- [Construye] useReducer (`02-hooks/03-usereducer.md`)
- [Construye] Context (`02-hooks/04-context.md`)
- [Construye] Hooks propios y reglas de los hooks (`02-hooks/05-hooks-propios.md`)
- [Construye] Suspense, use y error boundaries (`02-hooks/06-suspense-use-y-error-boundaries.md`)
- [Construye] Transiciones y render concurrente (`02-hooks/07-transiciones-y-concurrencia.md`)
- [Construye] Actions y los hooks de formularios de React 19 (`02-hooks/08-actions-y-hooks-de-formularios.md`)

## 3. React por dentro (nivel senior)

- [Concepto] Render y reconciliación (`03-react-por-dentro/01-render-y-reconciliacion.md`)
- [Construye] Memoización y React Compiler (`03-react-por-dentro/02-memoizacion-y-react-compiler.md`)
- [Construye] Perfilar el rendimiento (`03-react-por-dentro/03-perfilar-rendimiento.md`)
- [Construye] Patrones de componentes (`03-react-por-dentro/04-patrones-de-componentes.md`)
- [Construye] Accesibilidad (`03-react-por-dentro/05-accesibilidad.md`)
- [Construye] TypeScript con React (`03-react-por-dentro/06-typescript-con-react.md`)

## 4. Datos del servidor y estado

- [Construye] El cliente tipado de la API de Nest (`04-datos-y-estado/01-cliente-de-la-api.md`)
- [Construye] TanStack Query (`04-datos-y-estado/02-tanstack-query.md`)
- [Construye] Mutaciones, invalidación y actualizaciones optimistas (`04-datos-y-estado/03-mutaciones.md`)
- [Construye] Estado de la interfaz con Zustand (`04-datos-y-estado/04-zustand.md`)
- [Concepto] Redux Toolkit (concepto) (`04-datos-y-estado/05-redux-toolkit.md`)
- [Construye] Estado en la URL (`04-datos-y-estado/06-estado-en-la-url.md`)

## 5. Componentes de cliente en ripopola

- [Construye] El buscador de pueblos (`05-componentes-de-cliente/01-buscador-de-pueblos.md`)
- [Construye] El mapa con MapLibre (`05-componentes-de-cliente/02-mapa-con-maplibre.md`)
- [Construye] Formularios con React Hook Form y Zod (`05-componentes-de-cliente/03-formularios-rhf-y-zod.md`)
- [Construye] Subida de fotos (`05-componentes-de-cliente/04-subida-de-imagenes.md`)

## 6. Next.js: fundamentos

- [Concepto] Qué es Next y las estrategias de render (`06-next-fundamentos/01-estrategias-de-render.md`)
- [Construye] Rutas, layouts y páginas (`06-next-fundamentos/02-rutas-layouts-y-paginas.md`)
- [Construye] Server Components y Client Components (`06-next-fundamentos/03-server-y-client-components.md`)
- [Construye] Navegación, Link y enlaces activos (`06-next-fundamentos/04-navegacion.md`)
- [Construye] loading, error y not-found (`06-next-fundamentos/05-loading-error-y-not-found.md`)
- [Construye] Metadata y SEO (`06-next-fundamentos/06-metadata-y-seo.md`)
- [Construye] Imágenes, fuentes y scripts (`06-next-fundamentos/07-imagenes-fuentes-y-scripts.md`)
- [Construye] Rutas paralelas e interceptadas (`06-next-fundamentos/08-rutas-avanzadas.md`)

## 7. Next.js: datos, caché y render

- [Construye] Pedir datos en el servidor (`07-next-datos/01-pedir-datos-en-el-servidor.md`)
- [Construye] Streaming y prerender parcial (`07-next-datos/02-streaming-y-prerender-parcial.md`)
- [Construye] Cache Components y use cache (`07-next-datos/03-cache-components.md`)
- [Construye] Revalidación a demanda (`07-next-datos/04-revalidacion.md`)
- [Construye] Páginas estáticas de pueblos (ISR) (`07-next-datos/05-paginas-estaticas-de-pueblos.md`)
- [Construye] Paginación y filtros en el servidor (`07-next-datos/06-paginacion-y-filtros-en-servidor.md`)
- [Construye] TanStack Query con Next (`07-next-datos/07-tanstack-query-con-next.md`)

## 8. Next.js: mutaciones y servidor

- [Construye] Server Actions (`08-next-mutaciones/01-server-actions.md`)
- [Construye] Formularios con Server Actions (`08-next-mutaciones/02-formularios-con-server-actions.md`)
- [Construye] Route Handlers (`08-next-mutaciones/03-route-handlers.md`)
- [Construye] proxy.ts (el antiguo middleware) (`08-next-mutaciones/04-proxy.md`)
- [Construye] Cookies en el servidor y en el cliente (`08-next-mutaciones/05-cookies.md`)
- [Concepto] Next como backend (y por qué ripopola no lo hace) (`08-next-mutaciones/06-next-como-backend.md`)

## 9. Autenticación con Better Auth

- [Concepto] Cómo funciona la sesión desde el frontend (`09-auth/01-la-sesion-desde-el-frontend.md`)
- [Construye] El cliente de Better Auth (`09-auth/02-el-cliente-de-better-auth.md`)
- [Construye] Login, registro y Google (`09-auth/03-login-registro-y-google.md`)
- [Construye] La sesión en el servidor y las rutas protegidas (`09-auth/04-sesion-en-el-servidor-y-rutas-protegidas.md`)
- [Construye] Roles, ayuntamientos y permisos en la interfaz (`09-auth/05-roles-y-permisos-en-la-interfaz.md`)
- [Construye] Verificación en dos pasos y sesiones abiertas (`09-auth/06-dos-pasos-y-sesiones.md`)
- [Concepto] Las alternativas - Auth.js, Better Auth dentro de Next, Firebase Auth y Clerk (`09-auth/07-alternativas.md`)

## 10. Idiomas

- [Construye] Rutas por idioma con next-intl (`10-i18n/01-rutas-por-idioma.md`)
- [Construye] Traducir la interfaz (`10-i18n/02-traducir-la-interfaz.md`)
- [Construye] Contenido traducido y SEO multilingüe (`10-i18n/03-contenido-traducido-y-seo.md`)

## 11. Pruebas, rendimiento y seguridad

- [Construye] Pruebas de componentes con Vitest y Testing Library (`11-calidad/01-vitest-y-testing-library.md`)
- [Construye] Simular la API con MSW - formularios, consultas y hooks (`11-calidad/02-msw-formularios-y-datos.md`)
- [Construye] Pruebas end to end con Playwright y axe (`11-calidad/03-playwright-y-accesibilidad.md`)
- [Construye] Rendimiento web - Core Web Vitals, bundle y carga diferida (`11-calidad/04-rendimiento-web.md`)
- [Construye] Seguridad en el frontend (`11-calidad/05-seguridad-en-el-frontend.md`)
- [Construye] Errores y observabilidad (`11-calidad/06-errores-y-observabilidad.md`)

## 12. Producción

- [Construye] El build de producción y las variables por entorno (`12-produccion/01-build-y-variables.md`)
- [Construye] Next en Docker (`12-produccion/02-docker.md`)
- [Construye] Desplegar en Cloud Run (y las alternativas) (`12-produccion/03-cloud-run-y-alternativas.md`)
- [Construye] CI y despliegue continuo con GitHub Actions (`12-produccion/04-ci-y-despliegue-continuo.md`)

## 13. Arquitectura de frontend

- [Construye] Estructura de una app grande - por features (`13-arquitectura/01-estructura-por-features.md`)
- [Construye] El monorepo - librerías compartidas, contratos y límites (`13-arquitectura/02-monorepo-nx-y-contratos.md`)
- [Concepto] Decisiones de render, página por página (`13-arquitectura/03-decisiones-de-render-por-pagina.md`)
- [Concepto] El ecosistema - Vite, React Router, TanStack Start, Astro y el Pages Router (`13-arquitectura/04-el-ecosistema-react.md`)
