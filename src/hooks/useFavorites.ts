import { useLocalStorage } from "@/hooks/useLocalStorage";

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "favorite-sellers",
    []
  );

  const toggleFavorite = (sellerId: string) => {
    setFavorites(prev =>
      prev.includes(sellerId)
        ? prev.filter(id => id !== sellerId)
        : [...prev, sellerId]
    );
  };

  const isFavorite = (sellerId: string) => {
    return favorites.includes(sellerId);
  };

  return { favorites, toggleFavorite, isFavorite };
}
