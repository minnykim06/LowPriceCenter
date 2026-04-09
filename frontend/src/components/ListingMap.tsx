import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

type ListingMapProps = {
  center: { lat: number; lng: number };
  markerTitle: string;
  label: string;
  className?: string;
};

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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

export default function ListingMap({
  center,
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
    />
  );
}

function LoadedListingMap({ center, markerTitle, label, className = "" }: ListingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: "listing-map-script",
  });

  if (loadError) {
    return (
      <MapFallback
        className={className}
        label={label}
        message="The map could not be loaded right now. The pickup area is currently set to UCSD Price Center."
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
        options={mapOptions}
        zoom={16}
      >
        <MarkerF position={center} title={markerTitle} />
      </GoogleMap>
    </div>
  );
}
