import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { googleMapsApiKey, googleMapsLibraries, googleMapsScriptId } from "src/utils/googleMaps";

type ListingMapProps = {
  center: { lat: number; lng: number };
  placeId?: string;
  markerTitle: string;
  label: string;
  className?: string;
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};
const mapOptions = {
  disableDefaultUI: true,
  fullscreenControl: false,
  mapTypeControl: false,
  scrollwheel: false,
  streetViewControl: false,
  zoomControl: true,
};
const fallbackZoom = 16;
const maxViewportZoom = 17;
const viewportPadding = 48;
const placeViewportCache = new Map<string, google.maps.LatLngBoundsLiteral>();

function applyFallbackView(map: google.maps.Map, center: google.maps.LatLngLiteral) {
  map.panTo(center);
  map.setZoom(fallbackZoom);
}

function clampViewportZoom(map: google.maps.Map) {
  google.maps.event.addListenerOnce(map, "idle", () => {
    const currentZoom = map.getZoom();

    if (typeof currentZoom === "number" && currentZoom > maxViewportZoom) {
      map.setZoom(maxViewportZoom);
    }
  });
}

function applyViewport(
  map: google.maps.Map,
  viewport: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral,
) {
  map.fitBounds(viewport, viewportPadding);
  clampViewportZoom(map);
}

function MapFallback({
  className = "",
  label,
  message,
}: {
  className?: string;
  label: string;
  message: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-[#F8F8F8] p-5 shadow-sm ${className}`.trim()}
    >
      <p className="font-inter text-sm font-semibold text-[#182B49]">{label}</p>
      <p className="mt-2 font-inter text-sm leading-6 text-[#4B5563]">{message}</p>
    </div>
  );
}

function LoadedListingMap({
  center,
  placeId,
  markerTitle,
  label,
  className = "",
}: ListingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: googleMapsScriptId,
    libraries: googleMapsLibraries,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (!placeId) {
      applyFallbackView(map, center);
      return;
    }

    const cachedViewport = placeViewportCache.get(placeId);
    if (cachedViewport) {
      applyViewport(map, cachedViewport);
      return;
    }

    let isCancelled = false;
    const placesService = new google.maps.places.PlacesService(map);

    placesService.getDetails(
      {
        placeId,
        fields: ["geometry.viewport"],
      },
      (place, status) => {
        if (isCancelled) {
          return;
        }

        const viewport = place?.geometry?.viewport;
        if (status === google.maps.places.PlacesServiceStatus.OK && viewport) {
          const viewportLiteral = viewport.toJSON();
          placeViewportCache.set(placeId, viewportLiteral);
          applyViewport(map, viewportLiteral);
          return;
        }

        applyFallbackView(map, center);
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [center.lat, center.lng, map, placeId]);

  if (loadError) {
    return (
      <MapFallback
        className={className}
        label={label}
        message={`The map could not be loaded right now. The pickup area is currently set to ${label}.`}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`h-64 animate-pulse rounded-2xl border border-gray-200 bg-[#F8F8F8] ${className}`.trim()}
        aria-label="Loading pickup map"
      />
    );
  }

  return (
    <div
      className={`h-64 overflow-hidden rounded-2xl border border-gray-200 shadow-sm ${className}`.trim()}
    >
      <GoogleMap
        center={center}
        mapContainerStyle={mapContainerStyle}
        onLoad={setMap}
        onUnmount={() => setMap(null)}
        options={mapOptions}
        zoom={fallbackZoom}
      >
        <MarkerF position={center} title={markerTitle} />
      </GoogleMap>
    </div>
  );
}

export default function ListingMap({
  center,
  placeId,
  markerTitle,
  label,
  className = "",
}: ListingMapProps) {
  if (!googleMapsApiKey) {
    return (
      <MapFallback
        className={className}
        label={label}
        message="Add VITE_GOOGLE_MAPS_API_KEY to view the interactive map for this pickup area."
      />
    );
  }

  return (
    <LoadedListingMap
      center={center}
      className={className}
      label={label}
      markerTitle={markerTitle}
      placeId={placeId}
    />
  );
}
