"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface GeolocationState {
  location: [number, number] | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackLocation?: [number, number];
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 300000,
    fallbackLocation = [3.848, 11.502],
  } = options;

  const geoOptions = useRef({
    enableHighAccuracy,
    timeout,
    maximumAge,
  });

  // Store fallbackLocation in a ref to avoid recreating callbacks
  const fallbackLocationRef = useRef(fallbackLocation);
  fallbackLocationRef.current = fallbackLocation;

  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
    accuracy: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const getCurrentLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        location: fallbackLocationRef.current,
        loading: false,
        error: "Geolocation not supported by this browser",
        accuracy: null,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        setState({
          location: [latitude, longitude],
          loading: false,
          error: null,
          accuracy,
        });
      },
      error => {
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setState({
          location: fallbackLocationRef.current,
          loading: false,
          error: errorMessage,
          accuracy: null,
        });
      },
      geoOptions.current
    );
  }, []); // No dependencies needed now

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        setState(prev => ({
          ...prev,
          location: [latitude, longitude],
          accuracy,
          error: null,
        }));
      },
      error => {
        console.warn("Watch position error:", error);
      },
      geoOptions.current
    );
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
    return () => clearWatch();
  }, [getCurrentLocation, clearWatch]); // Include all dependencies

  return {
    ...state,
    refetch: getCurrentLocation,
    watchLocation,
    clearWatch,
    setState: (newState: Partial<GeolocationState>) => {
      setState(prev => ({ ...prev, ...newState }));
    },
  };
}
