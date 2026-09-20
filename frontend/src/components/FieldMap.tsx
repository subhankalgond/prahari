import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

interface LatLng {
  lat: number;
  lng: number;
}

interface FieldMapProps {
  value: LatLng[] | null;
  onChange: (points: LatLng[] | null) => void;
}

const DEFAULT_CENTER: [number, number] = [14.0, 76.2]; // Karnataka plateau
const MAX_POINTS = 24;

// Click to add vertices; close the shape after 3+ points.
function ClickCapture({ onPoint, disabled }: { onPoint: (p: LatLng) => void; disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) onPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function FieldMap({ value, onChange }: FieldMapProps) {
  const { t } = useTranslation();
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef<LatLng[]>(value ?? []);

  useEffect(() => {
    pointsRef.current = value ?? [];
  }, [value]);

  const addPoint = (p: LatLng) => {
    const next = [...pointsRef.current, p].slice(-MAX_POINTS);
    pointsRef.current = next;
    onChange(next.length >= 3 ? next : next);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-stone-300" style={{ height: 300 }}>
        <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri"
            maxZoom={18}
          />
          {value && value.length >= 3 && (
            <Polygon positions={value.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: '#047857', fillOpacity: 0.15 }} />
          )}
          <ClickCapture onPoint={addPoint} disabled={!drawing} />
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        {!drawing ? (
          <Button variant="secondary" onClick={() => setDrawing(true)}>
            {t('fieldMap.draw')}
          </Button>
        ) : (
          <Button onClick={() => setDrawing(false)}>{t('fieldMap.done')}</Button>
        )}
        <Button variant="secondary" onClick={() => { pointsRef.current = []; onChange(null); setDrawing(false); }}>
          {t('fieldMap.clear')}
        </Button>
        <span className="text-sm text-ink-600 self-center">
          {value && value.length >= 3
            ? t('fieldMap.pointsSet', { count: value.length })
            : t('fieldMap.hint')}
        </span>
      </div>
    </div>
  );
}
