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
