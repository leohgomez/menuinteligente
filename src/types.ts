export type Category = 'Espetinhos' | 'Acompanhamentos' | 'Bebidas';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  imageUrl?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Table {
  id: string;
  number: number;
  orders: OrderItem[]; // This will represent the "draft" in the UI
  sentItems?: Record<string, number>; // items already sent to kitchen
  serviceCharge: boolean;
  status: 'available' | 'occupied' | 'closing';
}

export type KitchenOrderStatus = 'pending' | 'ready';

export interface KitchenOrder {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  timestamp: number;
  status: KitchenOrderStatus;
}

export type Role = 'atendimento' | 'cozinha' | 'gerente' | null;

export interface AppState {
  products: Product[];
  tables: Table[];
  kitchenOrders: KitchenOrder[];
}
