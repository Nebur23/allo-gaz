export type Seller = {
  id: string;
  shopName: string;
  latitude: number;
  longitude: number;
  bottleType: string;
  price: number;
  phone: string;
  rating: number;
  reviewCount: number;
};

export const mockSellers: Seller[] = [
  {
    id: "1",
    shopName: "GazPlus Yaoundé",
    latitude: 3.848,
    longitude: 11.502,
    bottleType: "6kg",
    price: 2500,
    phone: "+237656421799",
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "2",
    shopName: "SafeGaz Douala",
    latitude: 4.051,
    longitude: 9.768,
    bottleType: "6kg",
    price: 2700,
    phone: "+237656421799",
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: "3",
    shopName: "QuickGaz Bonapriso",
    latitude: 4.09,
    longitude: 9.714,
    bottleType: "12kg",
    price: 5000,
    phone: "+237656421799",
    rating: 4.9,
    reviewCount: 67,
  },
];
