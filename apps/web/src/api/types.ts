export interface User {
  id: string;
  email: string;
  role: 'seller' | 'customer';
  cityId: number;
  isVerified: boolean;
  createdAt: string;
}

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Item {
  id: number;
  sellerId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  createdAt: string;
  sellerDeliveryCities?: City[];
}
