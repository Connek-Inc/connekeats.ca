// Tipos espejo del backend (database/models.py).
export type BusinessMode = "bar" | "restaurant";
export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning"
  | "bill_requested";
export type OrderStatus =
  | "open"
  | "sent"
  | "preparing"
  | "ready"
  | "served"
  | "paid"
  | "cancelled";
export type OrderItemStatus = "queued" | "preparing" | "ready" | "served";
export type ServiceRequestType = "call_waiter" | "request_item" | "request_bill";
export type ServiceRequestStatus = "open" | "ack" | "done";
export type StaffRole = "owner" | "manager" | "waiter" | "kitchen";

export type Employee = {
  id: number;
  business_id: number;
  email: string;
  name: string | null;
  phone: string | null;
  position: string | null;
  hire_date: string | null;
  wage: number | null;
  status: "active" | "inactive";
  notes: string | null;
};

export type Business = {
  id: number;
  name: string;
  mode: BusinessMode;
  currency: string;
  features?: string[];
  tax_rate?: number;
  tax_id?: string | null;
  legal_name?: string | null;
  fiscal_address?: string | null;
  // Marca / white-label
  logo_url?: string | null;
  brand_primary?: string | null;
  brand_bg?: string | null;
  brand_fg?: string | null;
  brand_base?: "light" | "dark" | null;
  brand_font?: string | null;
};

export type InvoiceItem = { name_snapshot: string; qty: number; price_snapshot: number };
export type Invoice = {
  invoice_no: string;
  issued_at?: string | null;
  payment_method?: string | null;
  business: {
    name: string | null;
    legal_name: string | null;
    tax_id: string | null;
    address: string | null;
    tax_rate: number;
    currency: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
};

export type OcrResult = { text: string; amounts: number[]; total: number | null };
export type Floor = { id: number; business_id: number; name: string };

export type Table = {
  id: number;
  business_id: number;
  floor_id: number | null;
  label: string;
  capacity: number;
  pos_x: number;
  pos_y: number;
  status: TableStatus;
  qr_token: string;
};

export type MenuCategory = { id: number; business_id: number; name: string; sort_order: number };

export type MenuItem = {
  id: number;
  business_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  available_in: "both" | "bar" | "restaurant";
  image_url?: string | null;
  video_url?: string | null;
  station?: "kitchen" | "bar";
  featured?: boolean; // platillo del día / destacado
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name_snapshot: string;
  price_snapshot: number;
  qty: number;
  notes: string | null;
  status: OrderItemStatus;
};

export type Order = {
  id: number;
  business_id: number;
  table_id: number;
  status: OrderStatus;
  channel: "qr" | "waiter";
  total: number;
  items?: OrderItem[];
};

export type ServiceRequest = {
  id: number;
  business_id: number;
  table_id: number;
  type: ServiceRequestType;
  payload: Record<string, unknown> | null;
  status: ServiceRequestStatus;
};

export type Bill = {
  id: number;
  business_id: number;
  table_id: number;
  order_id: number | null;
  subtotal?: number;
  discount?: number;
  tip?: number;
  total: number;
  status: "pending" | "paid" | "cancelled";
  requested_by: "waiter" | "diner";
  payment_method?: string | null;
};

export type BillPayment = {
  id: number;
  bill_id: number;
  amount: number;
  method: string | null;
  note: string | null;
  created_at?: string | null;
};

export type BillDetail = {
  bill: Bill;
  payments: BillPayment[];
  paid: number;
  remaining: number;
};

export type StaffRoleRow = {
  id: number;
  business_id: number;
  user_id: string;
  role: StaffRole;
  floor_id: number | null;
  email?: string | null;
};

export type StaffInvite = {
  id: number;
  business_id: number;
  email: string;
  role: "waiter" | "kitchen";
};

// ── POS / Caja / Reportes ────────────────────────────────────────
export type SalesSummary = {
  range: string;
  revenue: number;
  count: number;
  avg_ticket: number;
  by_method: Record<string, number>;
  top_products: { name: string; qty: number }[];
  by_waiter: { waiter: string; total: number }[];
};

export type CashSession = {
  id: number;
  business_id: number;
  opened_by: string | null;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  closing_cash: number | null;
  closed_by: string | null;
  note: string | null;
  status: "open" | "closed";
};

export type CashCurrent = { session: CashSession | null; cash_sales: number; expected_cash: number };
export type CashCloseResult = {
  session: CashSession;
  cash_sales: number;
  expected_cash: number;
  difference: number;
};

export type ParkingTicket = {
  id: number;
  business_id: number;
  created_at?: string | null;
  plate: string;
  customer: string | null;
  spot: string | null;
  note: string | null;
  status: "parked" | "retrieved";
  retrieved_at: string | null;
};

export type BuffetStation = {
  id: number;
  business_id: number;
  created_at?: string | null;
  name: string;
  status: "ok" | "low" | "empty";
  updated_at?: string | null;
};

export type DeliveryItem = { name: string; price: number; qty: number };
export type DeliveryStatus = "received" | "preparing" | "ready" | "out" | "delivered" | "cancelled";
export type DeliveryOrder = {
  id: number;
  business_id: number;
  created_at?: string | null;
  customer: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  items: DeliveryItem[];
  total: number;
  status: DeliveryStatus;
};

export type Customer = {
  id: number;
  business_id: number;
  created_at?: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  address: string | null;
  notes: string | null;
  tags?: string[];
  // stats embebidos que agrega el listado (para segmentos)
  orders?: number;
  total_spent?: number;
  last_order?: string | null;
};
export type Review = {
  id: number;
  business_id: number;
  table_id: number | null;
  rating: number;
  comment: string | null;
  created_at?: string | null;
};

export type CustomerStats = { orders: number; total_spent: number; avg_ticket: number; last_order: string | null };
export type CustomerDetail = { customer: Customer; orders: DeliveryOrder[]; stats: CustomerStats };

export type DinerSession = {
  token: string;
  business_id: number;
  table_id: number;
  table_label: string;
  mode: BusinessMode;
  expires_at: number;
  // Marca del negocio (para personalizar la cara al cliente)
  logo_url?: string | null;
  brand_primary?: string | null;
  brand_bg?: string | null;
  brand_fg?: string | null;
  brand_base?: "light" | "dark" | null;
  brand_font?: string | null;
};

// ── Seed / onboarding (espejo de database/models.py SeedRequest) ──
export type SeedItemInput = {
  name: string;
  price: number;
  description?: string | null;
  available_in?: "both" | "bar" | "restaurant";
};
export type SeedCategoryInput = {
  name: string;
  sort_order?: number;
  items: SeedItemInput[];
};
export type SeedTablesInput = {
  count: number;
  label_prefix: string;
  capacity: number;
};
export type SeedRequestInput = {
  categories: SeedCategoryInput[];
  tables?: SeedTablesInput | null;
};
export type SeedResult = { categories: number; items: number; tables: Table[] };
