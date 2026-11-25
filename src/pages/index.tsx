import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import { TECHS, TechId } from '@site/src/data/tech';
import { TechLogo } from '@site/src/components/TechLogo';
import styles from './index.module.css';

const STACK: TechId[] = [
  'react', 'nextdotjs', 'typescript', 'tailwindcss', 'shadcnui', 'reactquery',
  'zustand', 'reacthookform', 'zod', 'maplibre', 'nextintl', 'betterauth',
  'nestjs', 'vitest', 'testinglibrary', 'playwright', 'docker', 'googlecloud',
];

const SECTIONS = [
  { n: 1, title: 'React desde Angular', text: 'El proyecto Next desde el día uno, JSX, componentes, props, estado, eventos, listas y estilos.', to: '/curso/react-basico' },
  { n: 2, title: 'Hooks a fondo', text: 'useEffect, useRef, useReducer, Context, hooks propios, Suspense, use y transiciones.', to: '/curso/hooks' },
  { n: 3, title: 'React por dentro', text: 'Render y reconciliación, React Compiler, perfilado, patrones, accesibilidad y TypeScript.', to: '/curso/react-senior' },
  { n: 4, title: 'Datos del servidor y estado', text: 'Cliente tipado de la API, TanStack Query, mutaciones, Zustand, Redux y estado en la URL.', to: '/curso/datos-y-estado' },
  { n: 5, title: 'Componentes de cliente', text: 'Buscador de pueblos, mapa con MapLibre, formularios con React Hook Form y Zod, subida de fotos.', to: '/curso/componentes-cliente' },
  { n: 6, title: 'Next.js: fundamentos', text: 'Estrategias de render, App Router, Server y Client Components, metadata y SEO.', to: '/curso/next' },
  { n: 7, title: 'Next.js: datos y caché', text: 'Datos en el servidor, streaming, Cache Components, revalidación y páginas estáticas.', to: '/curso/next-datos' },
  { n: 8, title: 'Next.js: mutaciones', text: 'Server Actions, formularios, Route Handlers, proxy, cookies y Next como backend.', to: '/curso/next-mutaciones' },
  { n: 9, title: 'Autenticación', text: 'Better Auth en Nest y su cliente en el panel: email, Google, sesión, roles y 2FA.', to: '/curso/auth' },
  { n: 10, title: 'Idiomas', text: 'next-intl, rutas por idioma y contenido traducido con SEO multidioma.', to: '/curso/i18n' },
  { n: 11, title: 'Pruebas, rendimiento y seguridad', text: 'Vitest, Testing Library, MSW, Playwright, Web Vitals, seguridad y observabilidad.', to: '/curso/calidad' },
  { n: 12, title: 'Producción', text: 'Build standalone, Docker, Cloud Run, alternativas y CI.', to: '/curso/produccion' },
  { n: 13, title: 'Arquitectura de frontend', text: 'Features, monorepo, contratos y cómo decidir el render de cada página.', to: '/curso/arquitectura' },
];

export default function Home() {
  return (
    <Layout title="Inicio" description="Curso de React y Next.js construyendo el frontend de ripopola">
      <header className={styles.hero}>
        <div className="container">
          <div className={styles.heroLogo}>
            <TechLogo id="react" size={72} />
          </div>
          <h1 className={styles.heroTitle}>React y Next con ripopola</h1>
          <p className={styles.heroSubtitle}>
            De senior de Angular a senior de React y Next, construyendo el frontend
            de un producto real: un marketplace para mudarse a un pueblo.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/curso/">
              Empezar el curso
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.section}>
          <div className="container">
            <h2>El stack que vas a usar</h2>
            <div className={styles.stack}>
              {STACK.map((id) => (
                <div key={id} className={styles.tech}>
                  <TechLogo id={id} size={40} />
                  <strong>{TECHS[id].title}</strong>
                  <span>{TECHS[id].role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.alt}`}>
          <div className="container">
            <h2>Cómo está armado cada tema</h2>
            <div className={styles.how}>
              <div><h3>🧠 Concepto</h3><p>Qué es y qué problema resuelve, siguiendo la documentación oficial.</p></div>
              <div><h3>🅰️ Desde Angular</h3><p>Lo comparamos con lo que ya sabés: signals, plantillas, servicios, router, RxJS.</p></div>
              <div><h3>🛠️ En ripopola</h3><p>Paso a paso con el código real del proyecto.</p></div>
              <div><h3>🎤 Entrevista</h3><p>Preguntas con respuestas cortas para decir en voz alta.</p></div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2>Temario</h2>
            <div className={styles.sections}>
              {SECTIONS.map((s) => (
                <Link key={s.n} to={s.to} className={styles.card}>
                  <span className={styles.num}>{s.n}</span>
                  <div>
                    <strong>{s.title}</strong>
                    <p>{s.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
