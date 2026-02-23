'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  lat: number | null;
  lng: number | null;
  onMarkerMove: (lat: number, lng: number) => void;
}

function MapFlyTo({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.flyTo([lat, lng], map.getZoom() < 10 ? 14 : map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMarkerMove }: { onMarkerMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMarkerMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;

export default function LeafletMap({ lat, lng, onMarkerMove }: LeafletMapProps) {
  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;
  const zoom = lat !== null && lng !== null ? 14 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '400px', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMarkerMove={onMarkerMove} />
      <MapFlyTo lat={lat} lng={lng} />
      {lat !== null && lng !== null && (
        <Marker
          position={[lat, lng]}
          draggable
          eventHandlers={{
            dragend(e) {
              const pos = e.target.getLatLng();
              onMarkerMove(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
