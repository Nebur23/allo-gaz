import { RouteOptimizer } from "@/utils/routeOptimization";
import { useEffect } from "react";

export function usePerformanceOptimization() {
  useEffect(() => {
    // Prefetch critical resources
    const prefetchResources = () => {
      // Prefetch map tiles for common zoom levels
      const commonTileUrls = [
        "https://a.tile.openstreetmap.org/13/4096/4096.png",
        "https://b.tile.openstreetmap.org/13/4096/4096.png",
        "https://c.tile.openstreetmap.org/13/4096/4096.png",
      ];

      commonTileUrls.forEach(url => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = url;
        document.head.appendChild(link);
      });
    };

    // Optimize images
    const optimizeImages = () => {
      const images = document.querySelectorAll("img");
      images.forEach(img => {
        if (!img.loading) {
          img.loading = "lazy";
        }
      });
    };

    // Enable passive listeners for better scrolling performance
    const enablePassiveListeners = () => {
      const options = { passive: true };
      document.addEventListener("touchstart", () => {}, options);
      document.addEventListener("touchmove", () => {}, options);
      document.addEventListener("wheel", () => {}, options);
    };

    prefetchResources();
    optimizeImages();
    enablePassiveListeners();

    // Cleanup
    return () => {
      RouteOptimizer.clearCache();
    };
  }, []);
}

// types/performance.ts
export interface PerformanceMetrics {
  locationLoadTime: number;
  mapLoadTime: number;
  routeCalculationTime: number;
  sellerFilterTime: number;
}

export interface OptimizationConfig {
  enableRouteCache: boolean;
  enableImageOptimization: boolean;
  enablePrefetching: boolean;
  debounceDelay: number;
  cacheTimeout: number;
}
