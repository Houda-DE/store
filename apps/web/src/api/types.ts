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
  countryId?: number;
}

export interface Conversation {
  id: number;
  customerId: string;
  sellerId: string;
  itemId: number;
  createdAt: string;
  itemName: string;
  otherEmail: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
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
