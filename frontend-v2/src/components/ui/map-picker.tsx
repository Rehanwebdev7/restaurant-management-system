import * as React from 'react'
import {
  GoogleMap,
  Marker,
  Polygon,
  useJsApiLoader,
  type Libraries,
} from '@react-google-maps/api'
import { MapPin, Crosshair, Trash2, AlertTriangle } from 'lucide-react'
import { env } from '@/config/env'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * UI-F-5 — Google Maps picker primitive.
 * Two modes:
 *  - 'pin'     → single draggable marker, emits {lat,lng}
 *  - 'polygon' → click to add vertices, emits LatLng[] (delivery zone)
 *
 * If VITE_GOOGLE_MAPS_KEY is missing, renders a graceful stub instead of
 * loading the script — keeps dev builds running without billing setup.
 *
 * Migrated from legacy `frontend/src/components/common/LocationPickerMap.jsx`
 * (pin-only + geocoding). Polygon mode is new for delivery zones.
 */

export type LatLng = { lat: number; lng: number }

type PinProps = {
  mode: 'pin'
  value?: LatLng
  onChange: (value: LatLng) => void
}

type PolygonProps = {
  mode: 'polygon'
  value?: LatLng[]
  onChange: (value: LatLng[]) => void
}

type CommonProps = {
  defaultCenter?: LatLng
  defaultZoom?: number
  height?: number | string
  className?: string
}

export type MapPickerProps = CommonProps & (PinProps | PolygonProps)

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 } // India centroid

// `libraries` array reference must be stable — re-creating it triggers a script reload.
const MAP_LIBRARIES: Libraries = ['places']

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
}

export function MapPicker(props: MapPickerProps) {
  const {
    defaultCenter = DEFAULT_CENTER,
    defaultZoom = 13,
    height = 380,
    className,
  } = props

  const apiKey = env.VITE_GOOGLE_MAPS_KEY

  if (!apiKey) {
    return <MapPickerStub height={height} className={className} />
  }

  return (
    <MapPickerInner
      apiKey={apiKey}
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      height={height}
      className={className}
      pickerProps={props}
    />
  )
}

interface InnerProps {
  apiKey: string
  defaultCenter: LatLng
  defaultZoom: number
  height: number | string
  className?: string
  pickerProps: MapPickerProps
}

function MapPickerInner({
  apiKey,
  defaultCenter,
  defaultZoom,
  height,
  className,
  pickerProps,
}: InnerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'rms-google-maps',
    googleMapsApiKey: apiKey,
    libraries: MAP_LIBRARIES,
  })

  const mapRef = React.useRef<google.maps.Map | null>(null)
  const [geoError, setGeoError] = React.useState<string | null>(null)

  const handleLocate = React.useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser')
      return
    }
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: LatLng = { lat: coords.latitude, lng: coords.longitude }
        if (mapRef.current) {
          mapRef.current.panTo(next)
          mapRef.current.setZoom(16)
        }
        if (pickerProps.mode === 'pin') {
          pickerProps.onChange(next)
        }
      },
      (e) => setGeoError(e.message || 'Unable to fetch your location'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [pickerProps])

  if (loadError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center',
          className
        )}
        style={{ height }}
      >
        <AlertTriangle className="size-6 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive">Google Maps failed to load</p>
        <p className="text-xs text-muted-foreground mt-1">
          Check the API key, billing, and that the Maps JavaScript API is enabled.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-muted/30',
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    )
  }

  const center =
    pickerProps.mode === 'pin' && pickerProps.value
      ? pickerProps.value
      : pickerProps.mode === 'polygon' && pickerProps.value?.[0]
        ? pickerProps.value[0]
        : defaultCenter

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleLocate}>
          <Crosshair className="size-4" />
          Use my location
        </Button>
        {pickerProps.mode === 'polygon' && pickerProps.value && pickerProps.value.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => pickerProps.onChange([])}
            aria-label="Clear polygon"
          >
            <Trash2 className="size-4" /> Clear
          </Button>
        ) : null}
        {pickerProps.mode === 'polygon' ? (
          <span className="text-xs text-muted-foreground ml-auto">
            Click the map to add vertices ({pickerProps.value?.length ?? 0} points)
          </span>
        ) : null}
      </div>

      <div className="rounded-lg overflow-hidden border border-border" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={MAP_OPTIONS}
          center={center}
          zoom={defaultZoom}
          onLoad={(map) => {
            mapRef.current = map
          }}
          onClick={(e) => {
            if (!e.latLng) return
            const next: LatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            if (pickerProps.mode === 'pin') {
              pickerProps.onChange(next)
            } else {
              pickerProps.onChange([...(pickerProps.value ?? []), next])
            }
          }}
        >
          {pickerProps.mode === 'pin' ? (
            <Marker
              position={pickerProps.value ?? defaultCenter}
              draggable
              onDragEnd={(e) => {
                if (!e.latLng) return
                pickerProps.onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
              }}
            />
          ) : null}

          {pickerProps.mode === 'polygon' && pickerProps.value && pickerProps.value.length > 0 ? (
            <>
              <Polygon
                path={pickerProps.value}
                options={{
                  fillColor: '#2563eb',
                  fillOpacity: 0.15,
                  strokeColor: '#2563eb',
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  clickable: false,
                }}
              />
              {pickerProps.value.map((point, i) => (
                <Marker
                  key={`${point.lat}-${point.lng}-${i}`}
                  position={point}
                  draggable
                  label={{ text: `${i + 1}`, color: '#fff', fontSize: '11px' }}
                  onDragEnd={(e) => {
                    if (!e.latLng || pickerProps.mode !== 'polygon') return
                    const next = [...(pickerProps.value ?? [])]
                    next[i] = { lat: e.latLng.lat(), lng: e.latLng.lng() }
                    pickerProps.onChange(next)
                  }}
                />
              ))}
            </>
          ) : null}
        </GoogleMap>
      </div>

      {geoError ? (
        <p role="alert" className="text-xs text-destructive">
          {geoError}
        </p>
      ) : null}
    </div>
  )
}

function MapPickerStub({
  height,
  className,
}: {
  height: number | string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center',
        className
      )}
      style={{ height }}
    >
      <MapPin className="size-6 text-muted-foreground mb-2" />
      <p className="text-sm font-medium">Google Maps API key not configured</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        Set <code className="font-mono">VITE_GOOGLE_MAPS_KEY</code> in your .env file to
        enable the location picker.
      </p>
    </div>
  )
}
