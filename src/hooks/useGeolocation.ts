"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationState {
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
    maximumAge = 300000, // 5 minutes
    fallbackLocation = [3.848, 11.502], // Yaoundé, Cameroon
  } = options;

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
        location: fallbackLocation,
        loading: false,
        error: "Geolocation not supported",
        accuracy: null,
      });
      return;
    }

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

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
        let errorMessage = "Failed to get location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setState({
          location: fallbackLocation,
          loading: false,
          error: errorMessage,
          accuracy: null,
        });
      },
      geoOptions
    );
  }, [enableHighAccuracy, timeout, maximumAge, fallbackLocation]);

  const watchLocation = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

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
      geoOptions
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
    return () => clearWatch();
  }, [getCurrentLocation, clearWatch]);

  return {
    ...state,
    refetch: getCurrentLocation,
    watchLocation,
    clearWatch,
  };
}

