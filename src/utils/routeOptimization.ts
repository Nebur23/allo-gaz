/* eslint-disable @typescript-eslint/no-explicit-any */

export class RouteOptimizer {
  private static readonly CACHE_KEY = "allogas_route_cache";
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>();

  static getCacheKey(
    origin: [number, number],
    destination: [number, number]
  ): string {
    return `${origin[0].toFixed(6)},${origin[1].toFixed(
      6
    )}-${destination[0].toFixed(6)},${destination[1].toFixed(6)}`;
  }

  static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey as string);
    }
  }

  static getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static calculateDistance(
    point1: [number, number],
    point2: [number, number]
  ): number {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;

    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
