---
title: El mapa con MapLibre
sidebar_position: 2
description: Integrar un mapa con react-map-gl y MapLibre en Next - carga solo en el cliente, estilo de teselas, capas GeoJSON con clustering, pedir pueblos por el área visible y sincronizar el mapa con la lista y la URL.
---

# El mapa con MapLibre

<Tech ids={['maplibre', 'react', 'reactquery', 'nextdotjs']} />

<Estado tipo="construye">El mapa de pueblos: carga diferida, pueblos del área visible con clustering, popup con la tarjeta y selección sincronizada con la lista.</Estado>

## Concepto

**MapLibre GL JS** dibuja mapas vectoriales en un `canvas` con WebGL. Es una
librería **imperativa** (`map.addSource`, `map.flyTo`). **react-map-gl** la
envuelve en componentes declarativos:

```tsx
<Map initialViewState={{ longitude: -1.44, latitude: 40.41, zoom: 6 }} mapStyle={STYLE_URL}>
  <NavigationControl />
  <Source id="towns" type="geojson" data={geojson} cluster>
    <Layer {...clusterLayer} />
  </Source>
</Map>
```

### Por qué solo en el cliente

MapLibre necesita `window`, WebGL y el DOM. Además pesa (cientos de kB). Se
carga **solo en el cliente** y **solo cuando hace falta**, con `next/dynamic`:

```tsx
import dynamic from 'next/dynamic';

const TownsMap = dynamic(() => import('./towns-map'), {
  ssr: false,
  loading: () => <div className="h-[600px] animate-pulse rounded-xl bg-slate-100" />,
});
```

`ssr: false` solo se puede usar dentro de un componente de cliente.

### Marcadores DOM o capas

| `<Marker>` (DOM) | Capa `circle`/`symbol` sobre una fuente GeoJSON |
| --- | --- |
| Un elemento HTML por punto | Lo dibuja WebGL |
| Fácil de estilar con React | Rápido con miles de puntos |
| Hasta unos cientos | Miles, con clustering |

Ripopola usa **capas con clustering** para los pueblos y un `<Popup>` para el seleccionado.

### Pedir solo lo visible

Cuando el usuario mueve el mapa (`onMoveEnd`), tomamos los límites
(`bbox` = oeste, sur, este, norte) y pedimos `/api/v1/towns/map?bbox=...`, que
devuelve un `FeatureCollection` de GeoJSON (curso de Nest, 4.3). La query key
incluye el bbox redondeado para aprovechar la caché.

## Si venís de Angular

<Angular>

En Angular inicializarías MapLibre en `afterNextRender` con un `viewChild`, y
llamarías a `map.getSource('towns').setData(...)` dentro de un `effect`.
react-map-gl hace eso por vos: cambiás las props (`data`) y él llama a la API
imperativa. Cuando necesitás algo imperativo (`flyTo`), usás la ref (2.2).

</Angular>

## En ripopola

### 1. Instalar

```bash
pnpm add -E react-map-gl maplibre-gl
```

### 2. El estilo de teselas

El proveedor de teselas está pendiente de decidir (OpenFreeMap o MapTiler).
Ponelo en una variable pública para cambiarlo sin tocar código:

```bash title="apps/web/.env.local"
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

### 3. Las capas

```ts title="apps/web/features/map/layers.ts"
import type { LayerProps } from 'react-map-gl/maplibre';

export const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'towns',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#0f766e',
    'circle-radius': ['step', ['get', 'point_count'], 16, 20, 22, 100, 30],
  },
};

export const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'towns',
  filter: ['has', 'point_count'],
  layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 12 },
  paint: { 'text-color': '#ffffff' },
};

export const townLayer: LayerProps = {
  id: 'towns',
  type: 'circle',
  source: 'towns',
  filter: ['!', ['has', 'point_count']],
  paint: { 'circle-color': '#14b8a6', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
};
```

### 4. El componente

```tsx title="apps/web/features/map/towns-map.tsx"
'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useRef, useState } from 'react';
import { Map, Layer, NavigationControl, Popup, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { clusterCountLayer, clusterLayer, townLayer } from './layers';
import { townsInBboxQuery, type Bbox } from './queries';

export default function TownsMap() {
  const mapRef = useRef<MapRef>(null);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [selected, setSelected] = useState<{ slug: string; name: string; lng: number; lat: number } | null>(null);

  const { data } = useQuery({ ...townsInBboxQuery(bbox), placeholderData: keepPreviousData });

  function updateBbox() {
    const b = mapRef.current?.getBounds();
    if (b) setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
  }

  function handleClick(e: MapLayerMouseEvent) {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const [lng, lat] = feature.geometry.coordinates;
    if (feature.properties?.cluster) {
      mapRef.current?.easeTo({ center: [lng, lat], zoom: (mapRef.current.getZoom() ?? 6) + 2 });
      return;
    }
    setSelected({ slug: feature.properties!.slug, name: feature.properties!.name, lng, lat });
  }

  return (
    <div className="h-[600px] overflow-hidden rounded-xl">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -3.7, latitude: 40.4, zoom: 5 }}
        mapStyle={process.env.NEXT_PUBLIC_MAP_STYLE_URL}
        interactiveLayerIds={['clusters', 'towns']}
        onLoad={updateBbox}
        onMoveEnd={updateBbox}
        onClick={handleClick}
        cursor="pointer"
      >
        <NavigationControl position="top-right" />
        {data && (
          <Source id="towns" type="geojson" data={data} cluster clusterRadius={50} clusterMaxZoom={11}>
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...townLayer} />
          </Source>
        )}
        {selected && (
          <Popup longitude={selected.lng} latitude={selected.lat} onClose={() => setSelected(null)} closeOnClick={false}>
            <a href={`/pueblos/${selected.slug}`} className="font-semibold">{selected.name}</a>
          </Popup>
        )}
      </Map>
    </div>
  );
}
```

```ts title="apps/web/features/map/queries.ts"
import { queryOptions } from '@tanstack/react-query';
import { browserApi } from '@ripopola/frontend-api/browser';
import { unwrap } from '@ripopola/frontend-api';

export type Bbox = [west: number, south: number, east: number, north: number];

const round = (n: number) => Math.round(n * 100) / 100; // ~1 km: más aciertos de caché

export const townsInBboxQuery = (bbox: Bbox | null) =>
  queryOptions({
    queryKey: ['towns', 'map', bbox?.map(round)],
    queryFn: async ({ signal }) =>
      unwrap(await browserApi.GET('/api/v1/towns/map', { params: { query: { bbox: bbox!.map(round).join(',') } }, signal })),
    enabled: bbox !== null,
    staleTime: 5 * 60_000,
  });
```

### 5. Mapa y lista sincronizados

En escritorio, la lista de la izquierda y el mapa comparten el pueblo
seleccionado. Ese estado **va en la URL** (`?town=albarracin`, 4.6) para que se
pueda compartir; los dos componentes lo leen con nuqs. Al elegir en la lista,
el mapa hace `flyTo` en un efecto que depende del slug seleccionado.

### 6. Accesibilidad

El mapa es complementario: **la lista tiene los mismos pueblos** (3.5). El
`NavigationControl` tiene botones accesibles; el canvas no.

## Errores comunes

- **Importar el mapa en un Server Component** o sin `ssr: false`: `window is not defined`.
- **Olvidar el CSS** de MapLibre: controles y popups desarmados.
- **Pedir en `onMove`** (en cada frame) en vez de `onMoveEnd`.
- **Bbox sin redondear en la key**: cada píxel es una entrada nueva en la caché.
- **Confundir `[lat, lng]`**: GeoJSON y MapLibre usan `[lng, lat]`.

<Resumen>

- react-map-gl hace declarativo a MapLibre; la ref da acceso a la API imperativa.
- El mapa se carga solo en el cliente y de forma diferida (`next/dynamic`, `ssr: false`).
- Capas GeoJSON con clustering para miles de pueblos.
- Se piden los pueblos del área visible en `onMoveEnd`, con la key redondeada.

</Resumen>

## Preguntas de entrevista

**1. ¿Cómo integrás una librería imperativa (un mapa, un gráfico) en React?**
Con un wrapper que la crea en un efecto o ref, sincroniza las props con sus
métodos y la destruye en la limpieza; o con un envoltorio existente como react-map-gl.

**2. ¿Por qué el mapa va con `ssr: false`?**
Porque necesita `window` y WebGL, que no existen en el servidor, y porque es
pesado: conviene cargarlo diferido solo en el cliente.

**3. ¿Marcadores DOM o capas?**
Marcadores DOM para pocos puntos con contenido rico; capas WebGL con
clustering para miles de puntos.

**4. ¿Cómo evitás pedir datos de más al mover el mapa?**
Pidiendo en `moveend`, redondeando el bbox para la caché y manteniendo los
datos anteriores mientras llega lo nuevo.

## Glosario

| Término | Qué es |
| --- | --- |
| Teselas vectoriales | Datos del mapa en trozos que el navegador dibuja. |
| Estilo | JSON que define fuentes y capas del mapa base. |
| Bbox | Rectángulo de límites: oeste, sur, este, norte. |
| Clustering | Agrupar puntos cercanos en un círculo con contador. |
| `next/dynamic` | Importación diferida de componentes en Next. |
