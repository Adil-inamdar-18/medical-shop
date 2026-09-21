export interface Customer {
  _id: string;
  store_name: string;
  customer_name: string;
  mobile: string;
  address: string;
  city: string;
  gst_number?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}