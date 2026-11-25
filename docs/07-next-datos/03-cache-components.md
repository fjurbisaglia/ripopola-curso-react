---
title: Cache Components y use cache
sidebar_position: 3
description: La directiva use cache a nivel de datos y de componente, cacheLife y sus perfiles, cacheTag, claves de caché, qué no se puede hacer adentro, use cache private y remote, y dónde vive la caché cuando ripopola corre en Cloud Run.
---

# Cache Components y `use cache`

<Tech ids={['nextdotjs', 'googlecloud']} />

<Estado tipo="construye">Los datos públicos de pueblos cacheados con `'use cache'`, `cacheLife` y etiquetas por pueblo.</Estado>

## Concepto

Con `cacheComponents: true`, **nada se cachea si no lo pedís**. Lo pedís con
la directiva `'use cache'` en una función o componente async:

```ts
import { cacheLife, cacheTag } from 'next/cache';

export async function getTown(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('towns', `town:${slug}`);
  return unwrap(await publicApi.GET('/api/v1/towns/{slug}', { params: { path: { slug } } }));
}
```

### Dos niveles

| Nivel | Dónde | Para |
| --- | --- | --- |
| **Datos** | En la función que pide | Reutilizar el dato en varias páginas |
| **UI** | En un componente o página | Cachear el resultado renderizado (HTML/RSC) |

`'use cache'` al principio de un archivo cachea **todas** sus funciones exportadas.

### La clave de la caché

Se arma sola con: el id de la función (dónde está en el código), los
**argumentos** y los valores que **captura** del entorno. `getTown('albarracin')`
y `getTown('teruel')` son dos entradas distintas. Los argumentos tienen que ser
**serializables**; lo no serializable (como `children`) se puede pasar "de paso"
sin entrar en la clave.

### `cacheLife`: cuánto dura

| Perfil | `stale` (cliente) | `revalidate` (servidor) | `expire` |
| --- | --- | --- | --- |
| `seconds` | 30 s | 1 s | 1 min |
| `minutes` | 5 min | 1 min | 1 h |
| `hours` | 5 min | 1 h | 1 día |
| `days` | 5 min | 1 día | 1 semana |
| `weeks` | 5 min | 1 semana | 30 días |
| `max` | 5 min | 30 días | 1 año |

- **stale**: cuánto puede usar el router del navegador su copia sin preguntar.
- **revalidate**: pasado ese tiempo, la próxima petición recibe lo cacheado y
  dispara una regeneración de fondo (*stale-while-revalidate*).
- **expire**: pasado ese tiempo sin visitas, se descarta y la próxima espera.

Se pueden definir perfiles propios en `next.config.ts` (`cacheLife: { towns: {...} }`).
Las cachés muy cortas (`seconds`) no entran en el prerender: se vuelven dinámicas.

### `cacheTag`: para invalidar a demanda

Etiquetás lo cacheado y después lo invalidás por etiqueta (7.4). Convención en
ripopola: `towns` (todo lo de pueblos), `town:<slug>`, `listings:<townId>`.

### Qué no se puede hacer adentro

- Leer `cookies()`, `headers()` o `searchParams` (ni en funciones que llame).
  Si necesitás un valor de ahí, leelo **afuera** y pasalo como argumento.
- Tampoco tiene sentido cachear datos privados de un usuario en una caché compartida.

### Las variantes

| Directiva | Para |
| --- | --- |
| `'use cache'` | Datos compartidos por todos. En memoria del servidor (LRU). |
| `'use cache: private'` | Datos de un usuario que pueden leer cookies; se guardan solo en el navegador de ese usuario. Caso raro. |
| `'use cache: remote'` | Igual que `use cache`, pero en un almacenamiento remoto que provee la plataforma (o tu `cacheHandlers`). Útil con muchas instancias. |

### Dónde vive la caché en ripopola

Ripopola corre en **Cloud Run** (12.3), que para Next cuenta como
*self-hosted*: cada instancia guarda su caché **en memoria**. Con varias
instancias, cada una tiene la suya y una invalidación solo llega a la que la
recibe. Opciones:

1. Una sola instancia mínima al principio (suficiente para el piloto).
2. Configurar **`cacheHandlers`** con un handler sobre **Redis** (ripopola ya
   tiene Redis para BullMQ): todas las instancias comparten caché e invalidaciones.

Es un tema clásico de entrevista: *"¿qué pasa con la caché de Next si lo
desplegás fuera de Vercel con varias réplicas?"*.

## Si venís de Angular

<Angular>

Angular no tiene una caché de servidor integrada: con SSR, la caché la ponías
vos (un CDN, Redis en el servidor Express, `TransferState` para no repetir en
el cliente). `'use cache'` es esa capa, declarativa y por función, integrada
con el prerender.

</Angular>

## En ripopola

```ts title="apps/web/features/towns/api.ts"
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { publicApi } from '@ripopola/frontend-api/server';
import { ApiError, unwrap } from '@ripopola/frontend-api';

export async function getTown(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('towns', `town:${slug}`);
  try {
    return unwrap(await publicApi.GET('/api/v1/towns/{slug}', { params: { path: { slug } } }));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getTownListings(townId: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(`listings:${townId}`);
  return unwrap(await publicApi.GET('/api/v1/towns/{id}/listings', { params: { path: { id: townId } } }));
}
```

`'use cache'` deduplica entre peticiones, así que `cache()` de React ya no hace
falta en estas funciones.

:::warning El 404 también se cachea
Si un pueblo no existe, `null` queda cacheado una hora. Cuando el municipio lo
publique, hay que invalidar `town:<slug>` (7.4). Por eso las etiquetas.
:::

Para ver qué pasa: `NEXT_PRIVATE_DEBUG_CACHE=1 pnpm exec nx dev web` muestra en
la consola cada acierto y fallo de caché.

## Errores comunes

- **Leer cookies dentro de una función con `'use cache'`**: error. Leé afuera y pasá el valor.
- **Cachear algo personal** (favoritos de un usuario) en `'use cache'` compartido.
- **No etiquetar**: después no hay forma precisa de invalidar.
- **Argumentos enormes** (objetos completos) que hacen claves distintas por detalles irrelevantes: pasá ids.
- **Asumir que la caché es compartida** entre réplicas sin un handler remoto.

<Resumen>

- Con Cache Components nada se cachea sin `'use cache'`.
- La clave = función + argumentos + valores capturados.
- `cacheLife` define stale/revalidate/expire; `cacheTag` permite invalidar.
- No se leen APIs de la petición adentro; se pasan como argumentos.
- En Cloud Run con varias instancias: `cacheHandlers` compartido (Redis).

</Resumen>

## Preguntas de entrevista

**1. ¿Qué hace `'use cache'`?**
Cachea el resultado de una función o componente async, con una clave formada
por la función y sus argumentos, para incluirlo en el shell estático y
reutilizarlo entre peticiones.

**2. ¿Diferencia entre `cache` de React y `'use cache'`?**
`cache` memoiza dentro de una petición; `'use cache'` guarda entre peticiones
con vida útil y etiquetas para invalidar.

**3. ¿Qué significan stale, revalidate y expire?**
Stale es cuánto usa el cliente su copia sin preguntar; revalidate, cuándo el
servidor regenera de fondo; expire, cuándo se descarta y hay que esperar.

**4. ¿Por qué no se pueden leer cookies dentro de `'use cache'`?**
Porque la caché es compartida y la clave no incluiría la cookie: se
mezclarían datos de usuarios. Se lee afuera y se pasa como argumento.

**5. ¿Qué problema tiene la caché de Next con varias réplicas fuera de Vercel?**
Por defecto es en memoria por instancia: no se comparte ni se invalida en todas.
Se resuelve con un cache handler remoto, por ejemplo sobre Redis.

## Glosario

| Término | Qué es |
| --- | --- |
| Cache Components | Modelo de caché explícito de Next 16. |
| `cacheLife` | Define la vida útil de lo cacheado. |
| `cacheTag` | Etiqueta para invalidar a demanda. |
| Cache handler | Implementación del almacenamiento de la caché. |
| LRU | Estrategia que descarta lo menos usado recientemente. |
