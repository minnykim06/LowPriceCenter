import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useId, useState } from "react";

import ListingMap from "src/components/ListingMap";
import {
  googleMapsApiKey,
  googleMapsLibraries,
  googleMapsScriptId,
  hasGoogleMapsApiKey,
} from "src/utils/googleMaps";
import type { PickupLocation } from "src/utils/pickupLocation";

type PickupLocationFieldProps = {
  value: PickupLocation | null;
  onChange: (nextValue: PickupLocation | null) => void;
  onSelectionStatusChange?: (hasPendingSelection: boolean) => void;
  error?: string | null;
};

const autocompleteOptions: google.maps.places.AutocompleteOptions = {
  fields: ["formatted_address", "geometry", "place_id"],
};

function PickupLocationFallback({
  value,
  message,
}: {
  value: PickupLocation | null;
  message: string;
}) {
  return (
    <div className="mb-5">
      <p className="block mb-2 font-medium font-inter text-black">Pickup Address</p>
      <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
        <p className="font-inter text-sm text-gray-700">{message}</p>
        {value && (
          <p className="mt-2 font-inter text-sm text-[#182B49]">
            Current pickup address: {value.address}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadedPickupLocationField({
  value,
  onChange,
  onSelectionStatusChange,
  error,
}: PickupLocationFieldProps) {
  const inputId = useId();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value?.address ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey ?? "",
    id: googleMapsScriptId,
    libraries: googleMapsLibraries,
  });

  useEffect(() => {
    setInputValue(value?.address ?? "");
  }, [value?.address]);

  useEffect(() => {
    onSelectionStatusChange?.(inputValue.trim().length > 0 && !value);
  }, [inputValue, onSelectionStatusChange, value]);

  const handlePlaceChanged = () => {
    const place = autocomplete?.getPlace();
    const formattedAddress = place?.formatted_address?.trim();
    const placeId = place?.place_id;
    const coordinates = place?.geometry?.location;

    if (!formattedAddress || !placeId || !coordinates) {
      onChange(null);
      setLocalError("Select an address from the Google suggestions.");
      return;
    }

    onChange({
      address: formattedAddress,
      placeId,
      lat: coordinates.lat(),
      lng: coordinates.lng(),
    });
    setInputValue(formattedAddress);
    setLocalError(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);

    if (value && nextValue !== value.address) {
      onChange(null);
    }

    if (!nextValue.trim()) {
      setLocalError(null);
      return;
    }

    setLocalError("Select an address from the Google suggestions.");
  };

  const handleInputBlur = () => {
    if (!inputValue.trim() || value) {
      return;
    }

    setLocalError("Select an address from the Google suggestions.");
  };

  if (loadError) {
    return (
      <PickupLocationFallback
        value={value}
        message="The Google Places picker could not be loaded right now. You can still submit without changing the pickup address."
      />
    );
  }

  return (
    <div className="mb-5">
      <label htmlFor={inputId} className="block mb-2 font-medium font-inter text-black">
        Pickup Address
      </label>
      <p className="mb-3 text-sm text-gray-600">
        Search for the exact pickup address and choose one of the Google suggestions.
      </p>

      {!isLoaded ? (
        <div className="h-11 animate-pulse rounded-md border border-gray-300 bg-gray-100" />
      ) : (
        <Autocomplete
          onLoad={setAutocomplete}
          onPlaceChanged={handlePlaceChanged}
          options={autocompleteOptions}
        >
          <input
            id={inputId}
            type="text"
            value={inputValue}
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            className="border border-gray-300 text-black text-sm rounded-md w-full p-2.5"
            placeholder="Search for a pickup address"
            autoComplete="off"
            aria-invalid={Boolean(error || localError)}
          />
        </Autocomplete>
      )}

      {(error || localError) && <p className="mt-2 text-sm text-red-800">{error ?? localError}</p>}

      {value && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-[#F5F0E6] p-4">
            <p className="font-inter text-sm font-semibold text-[#182B49]">Selected address</p>
            <p className="mt-1 font-inter text-sm text-black">{value.address}</p>
          </div>
          <ListingMap
            center={{ lat: value.lat, lng: value.lng }}
            className="mt-0"
            label="Pickup preview"
            markerTitle={value.address}
          />
        </div>
      )}
    </div>
  );
}

export default function PickupLocationField({
  value,
  onChange,
  onSelectionStatusChange,
  error,
}: PickupLocationFieldProps) {
  if (!hasGoogleMapsApiKey) {
    return (
      <PickupLocationFallback
        value={value}
        message="Google Maps is not configured right now, so pickup addresses cannot be selected. You can still submit without adding one."
      />
    );
  }

  return (
    <LoadedPickupLocationField
      error={error}
      onChange={onChange}
      onSelectionStatusChange={onSelectionStatusChange}
      value={value}
    />
  );
}
