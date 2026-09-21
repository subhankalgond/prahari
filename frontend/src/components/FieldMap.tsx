import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
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
  readOnly?: boolean;
}

const DEFAULT_CENTER: [number, number] = [14.0, 76.2]; // Karnataka plateau
const DEFAULT_ZOOM = 12;
const MAX_POINTS = 24;

function boundsOf(points: LatLng[]): [[number, number], [number, number]] | null {
  if (points.length === 0) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

// Click to add vertices.
function ClickCapture({ onPoint }: { onPoint: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Fit the view to the boundary whenever a new set of points arrives from
// outside a drawing session. This is what makes a saved field open centred
// on the polygon instead of a hardcoded default location.
function FitBoundary({ points, drawing }: { points: LatLng[]; drawing: boolean }) {
  const map = useMap();
  const lastFittedRef = useRef<LatLng[] | null>(null);

  useEffect(() => {
    // Never yank the view while the farmer is placing points.
    if (drawing) return;
    if (points.length === 0) return;
    if (lastFittedRef.current === points) return;
    lastFittedRef.current = points;
    const bounds = boundsOf(points);
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
  }, [map, points, drawing]);

  return null;
}

export default function FieldMap({ value, onChange, readOnly = false }: FieldMapProps) {
  const { t } = useTranslation();
  const [drawing, setDrawing] = useState(false);
  const pointsRef = useRef<LatLng[]>(value ?? []);

  useEffect(() => {
    pointsRef.current = value ?? [];
  }, [value]);

  const points = value ?? [];

  const addPoint = (p: LatLng) => {
    const next = [...pointsRef.current, p].slice(-MAX_POINTS);
    pointsRef.current = next;
    onChange(next);
  };

  const undoPoint = () => {
    const next = pointsRef.current.slice(0, -1);
    pointsRef.current = next;
    onChange(next.length > 0 ? next : null);
  };

  const clearPoints = () => {
    pointsRef.current = [];
    onChange(null);
    setDrawing(false);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-stone-300" style={{ height: 300 }}>
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri"
            maxZoom={18}
          />
          {/* Closed polygon once 3+ points exist */}
          {points.length >= 3 && (
            <Polygon
              positions={points.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: '#047857', fillOpacity: 0.15 }}
            />
          )}
          {/* Connect the dots while the shape is not closed yet */}
          {points.length >= 2 && points.length < 3 && (
            <Polyline
              positions={points.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: '#047857' }}
            />
          )}
          {/* One visible marker per tapped vertex */}
          {points.map((p, i) => (
            <CircleMarker
              key={`${p.lat.toFixed(6)},${p.lng.toFixed(6)},${i}`}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{ color: '#065f46', fillColor: '#047857', fillOpacity: 1, weight: 2 }}
            />
          ))}
          {!readOnly && <ClickCapture onPoint={addPoint} />}
          <FitBoundary points={points} drawing={drawing} />
        </MapContainer>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {!drawing ? (
            <Button variant="secondary" onClick={() => setDrawing(true)}>
              {t('fieldMap.draw')}
            </Button>
          ) : (
            <Button onClick={() => setDrawing(false)}>{t('fieldMap.done')}</Button>
          )}
          {drawing && points.length > 0 && (
            <Button variant="secondary" onClick={undoPoint}>
              {t('fieldMap.undo')}
            </Button>
          )}
          <Button variant="secondary" onClick={clearPoints} disabled={points.length === 0}>
            {t('fieldMap.clear')}
          </Button>
          <span className="text-sm text-ink-600 self-center">
            {points.length >= 3 && !drawing
              ? t('fieldMap.pointsSet', { count: points.length })
              : t('fieldMap.hint')}
          </span>
        </div>
      )}
      {readOnly && points.length >= 3 && (
        <p className="text-sm text-ink-600">{t('fieldMap.pointsSet', { count: points.length })}</p>
      )}
    </div>
  );
}
