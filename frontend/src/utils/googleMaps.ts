import type { Libraries } from "@react-google-maps/api";

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const hasGoogleMapsApiKey = Boolean(googleMapsApiKey);
export const googleMapsLibraries = ["places"] satisfies Libraries;
export const googleMapsScriptId = "low-price-center-google-maps";
