export interface Medicine {
  _id: string;
  medicine_name: string;
  price: number;
  stock: number;
  manufacturer?: string;
  category?: string;
  expiry_date?: string | null;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineInput {
  medicine_name: string;
  price: number;
  stock: number;
  manufacturer?: string;
  category?: string;
  expiry_date?: string | null;
  description?: string;
}
