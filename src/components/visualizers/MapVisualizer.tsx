import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import worldAtlasGeo from '../../assets/maps/world-atlas-countries-110m.json';

export const MapVisualizer: React.FC<{ data: any }> = React.memo(({ data }) => {
  const overlays = data.overlays || [];
  const centerLat = data.center?.lat || 22.0;
  const centerLng = data.center?.lng || 78.0;
  const zoom = data.zoom || 5;
  const scale = zoom * 150;

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden bg-app-bg/60">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [centerLng, centerLat], scale }}
        className="w-full h-full"
      >
        <Geographies geography={worldAtlasGeo}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="var(--border-subtle)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "rgba(99, 102, 241, 0.3)", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {overlays.map((marker: any) => (
          <Marker key={marker.lng + ',' + marker.lat} coordinates={[marker.lng, marker.lat]}>
            <circle r={6} fill={marker.color || "#f43f5e"} stroke="var(--text-primary)" strokeWidth={2} />
            {marker.label && (
              <text
                textAnchor="middle"
                y={-12}
                className="font-sans fill-[var(--text-primary)] text-[14px] font-bold"
              >
                {marker.label}
              </text>
            )}
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
});