"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface GeolocationState {
  location: [number, number] | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  permissionState: "granted" | "denied" | "prompt" | "unknown";
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackLocation?: [number, number];
  requestPermissionOnMount?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 30000, // Increased timeout for mobile
    maximumAge = 300000,
    fallbackLocation = [3.848, 11.502],
    requestPermissionOnMount = true,
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
    loading: false, // Don't start loading immediately
    error: null,
    accuracy: null,
    permissionState: "unknown",
  });

  const watchIdRef = useRef<number | null>(null);
  const hasRequestedPermission = useRef(false);

  // Check if we're in a secure context (required for geolocation)
  const isSecureContext = useCallback(() => {
    if (typeof window === "undefined") return false; // SSR safety
    return (
      window.isSecureContext ||
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost"
    );
  }, []);

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.permissions) {
      return "unknown";
    }

    try {
      const result = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      setState(prev => ({ ...prev, permissionState: result.state as PermissionState }));
      return result.state;
    } catch (error) {
      console.warn("Permission API not supported:", error);
      return "unknown";
    }
  }, []);

  // Request permission explicitly (important for mobile)
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation not supported by this browser",
        permissionState: "denied",
      }));
      return false;
    }

    if (!isSecureContext()) {
      setState(prev => ({
        ...prev,
        error: "Geolocation requires HTTPS or localhost",
        permissionState: "denied",
      }));
      return false;
    }

    return new Promise<boolean>(resolve => {
      // Use a quick position request to trigger permission dialog
      navigator.geolocation.getCurrentPosition(
        () => {
          setState(prev => ({ ...prev, permissionState: "granted" }));
          resolve(true);
        },
        error => {
          if (error.code === error.PERMISSION_DENIED) {
            setState(prev => ({ ...prev, permissionState: "denied" }));
            resolve(false);
          } else {
            // Other errors don't necessarily mean permission denied
            setState(prev => ({ ...prev, permissionState: "granted" }));
            resolve(true);
          }
        },
        {
          enableHighAccuracy: false, // Use low accuracy for permission check
          timeout: 5000,
          maximumAge: Infinity,
        }
      );
    });
  }, [isSecureContext]);

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (typeof window === "undefined" || !navigator.geolocation) {
      setState({
        location: fallbackLocationRef.current,
        loading: false,
        error: "Geolocation not supported by this browser",
        accuracy: null,
        permissionState: "denied",
      });
      return;
    }

    if (!isSecureContext()) {
      setState({
        location: fallbackLocationRef.current,
        loading: false,
        error: "Geolocation requires HTTPS or localhost",
        accuracy: null,
        permissionState: "denied",
      });
      return;
    }

    // Check permission first
    const permissionState = await checkPermissionStatus();
    if (permissionState === "denied") {
      setState({
        location: fallbackLocationRef.current,
        loading: false,
        error:
          "Location access denied. Please enable location services in your browser settings.",
        accuracy: null,
        permissionState: "denied",
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
          permissionState: "granted",
        });
      },
      error => {
        let errorMessage = "Failed to get your location";
        let permissionState: "granted" | "denied" | "prompt" | "unknown" =
          "unknown";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location services and refresh the page.";
            permissionState = "denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information unavailable. Please check your GPS and internet connection.";
            permissionState = "granted"; // Permission was granted but location unavailable
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            permissionState = "granted"; // Permission was granted but timed out
            break;
        }

        setState({
          location: fallbackLocationRef.current,
          loading: false,
          error: errorMessage,
          accuracy: null,
          permissionState,
        });
      },
      geoOptions.current
    );
  }, [isSecureContext, checkPermissionStatus]);

  const watchLocation = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !navigator.geolocation ||
      watchIdRef.current !== null
    )
      return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        setState(prev => ({
          ...prev,
          location: [latitude, longitude],
          accuracy,
          error: null,
          permissionState: "granted",
        }));
      },
      error => {
        console.warn("Watch position error:", error);
        // Don't update state on watch errors to avoid disrupting user experience
      },
      geoOptions.current
    );
  }, []);

  const clearWatch = useCallback(() => {
    if (typeof window === "undefined" || watchIdRef.current === null) return;

    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  // Initialize geolocation on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const initializeGeolocation = async () => {
      if (!hasRequestedPermission.current && requestPermissionOnMount) {
        hasRequestedPermission.current = true;

        // Check permission status first
        const permissionState = await checkPermissionStatus();

        if (permissionState === "granted") {
          getCurrentLocation();
        } else if (permissionState === "prompt") {
          // Request permission and then get location
          const granted = await requestPermission();
          if (granted) {
            getCurrentLocation();
          }
        }
        // If denied, we don't automatically request location
      }
    };

    initializeGeolocation();
    return () => clearWatch();
  }, [
    getCurrentLocation,
    clearWatch,
    checkPermissionStatus,
    requestPermission,
    requestPermissionOnMount,
  ]);

  return {
    ...state,
    refetch: getCurrentLocation,
    watchLocation,
    clearWatch,
    requestPermission,
    checkPermissionStatus,
    isSecureContext: isSecureContext(),
    setState: (newState: Partial<GeolocationState>) => {
      setState(prev => ({ ...prev, ...newState }));
    },
  };
}
