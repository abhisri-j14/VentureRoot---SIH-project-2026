"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues in Next.js
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to smoothly pan the map when center coordinate changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface RadiusMapProps {
  center: [number, number]; // [lat, lng]
  radiusInKm: number;
  apiKey?: string;
  tileUrl?: string;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    type?: string;
  }>;
}

export const RadiusMap: React.FC<RadiusMapProps> = ({
  center,
  radiusInKm,
  apiKey,
  tileUrl,
  markers = []
}) => {
  // Determine tile provider & API key
  // Carto requires an API key to avoid "API KEY REQUIRED" watermark.
  // If no key is provided, we default to clean, free OpenStreetMap tiles with zero watermark.
  const activeKey = apiKey || process.env.NEXT_PUBLIC_CARTO_API_KEY || process.env.NEXT_PUBLIC_MAP_API_KEY;
  const customUrl = tileUrl || process.env.NEXT_PUBLIC_MAP_TILE_URL;

  let resolvedTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  let resolvedAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  if (customUrl) {
    resolvedTileUrl = customUrl;
  } else if (activeKey) {
    resolvedTileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${activeKey}`;
    resolvedAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  }

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      className="rounded-xl overflow-hidden"
    >
      <ChangeView center={center} zoom={11} />

      <TileLayer
        attribution={resolvedAttribution}
        url={resolvedTileUrl}
      />
      
      {/* Visual Radius Overlay */}
      <Circle
        center={center}
        radius={radiusInKm * 1000} // Leaflet uses meters
        pathOptions={{ color: "#1b4332", fillColor: "#2d6a4f", fillOpacity: 0.12, weight: 2 }}
      />

      {/* Main Center Marker */}
      <Marker position={center} icon={customIcon}>
        <Popup>
          <strong>Proposed Business Location</strong>
          <br />
          Radius: {radiusInKm} km
        </Popup>
      </Marker>

      {/* Additional Map Markers (Competitors, Markets, etc.) */}
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position} icon={customIcon}>
          <Popup>{marker.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default RadiusMap;
