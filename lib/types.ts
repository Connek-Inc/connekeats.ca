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
  is_tipped?: boolean; // empleado à pourboire (QC) → salario mínimo con propina
  // Formación de higiene MAPAQ
  training_level?: string | null; // gestionnaire_12h | manipulateur_6h | sensibilisation_3h30 | none
  training_date?: string | null;
  training_expiry?: string | null;
  training_cert_url?: string | null;
};

export type TaxComponent = { name: string; rate: number; number?: string | null };

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
  // Motor de impuestos canadiense (GST/HST/QST/PST por componentes)
  province?: string | null;
  tax_components?: TaxComponent[] | null;
  prices_include_tax?: boolean | null;
  // Alcohol (Québec RACJ)
  liquor_permit?: string | null;
  liquor_category?: "bar" | "restaurant" | null;
  alcohol_start?: string | null; // 'HH:MM'
  alcohol_end?: string | null; // 'HH:MM' (puede cruzar medianoche)
  // Marca / white-label
  logo_url?: string | null;
  brand_primary?: string | null;
  brand_bg?: string | null;
  brand_fg?: string | null;
  brand_base?: "light" | "dark" | null;
  brand_font?: string | null;
  // Cumplimiento (MAPAQ) + identidad regulatoria
  business_type?: string | null; // restaurant|bar|retail|traiteur|food_truck|home_kitchen
  mapaq_permit_no?: string | null;
  mapaq_permit_type?: string | null;
  mapaq_permit_issued?: string | null;
  mapaq_permit_expiry?: string | null;
  mapaq_permit_posted?: boolean | null;
  activity_code?: string | null;
  neq?: string | null;
  cnesst_number?: string | null;
  tps_number?: string | null;
  tvq_number?: string | null;
  liquor_permit_expiry?: string | null;
};

export type PrivacyRequest = { id: number; business_id: number | null; contact: string; kind: string; status: string; note?: string | null; created_at: string; resolved_at?: string | null };
export type PrivacyIncident = { id: number; business_id: number; occurred_at?: string | null; description: string; data_affected?: string | null; risk_level: string; actions?: string | null; cai_notified: boolean; status: string; created_at: string };

export type ChecklistItem = { key: string; label: string; status: "ok" | "warn" | "missing" | "na"; detail?: string };
export type ComplianceStatus = { business_type?: string | null; score: number; items: ChecklistItem[] };
export type TemperatureLog = { id: number; business_id: number; unit_label: string; temp_c: number; note?: string | null; recorded_by?: string | null; recorded_at: string };

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
    province?: string | null;
    tax_components?: TaxComponent[];
    currency: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  tax_breakdown?: { name: string; rate: number; number?: string | null; amount: number }[];
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

// ── Modificadores / ingredientes (configurables por ítem) ──
export type ModifierOption = {
  id: number;
  group_id?: number;
  name: string;
  price_delta: number; // +extra / -descuento
  is_default: boolean; // preseleccionada (ingrediente incluido)
  available: boolean;
  sort?: number;
};

export type ModifierGroup = {
  id: number;
  menu_item_id?: number;
  name: string;
  selection: "single" | "multi"; // una opción (radio) | varias (checkbox)
  min_select: number; // >=1 → obligatorio
  max_select: number | null; // tope (solo multi); null = sin tope
  sort?: number;
  options: ModifierOption[];
};

// Modificador ya elegido en una línea del pedido (snapshot).
export type OrderItemModifier = {
  id?: number;
  option_id?: number | null;
  group_name: string;
  option_name: string;
  price_delta: number;
  kind: "add" | "remove"; // add = extra/elección · remove = "sin X"
};

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
  is_alcohol?: boolean; // exige verificación 18+/sobriedad al servir (RACJ)
  course?: string | null; // curso de cocina (starter/main/dessert/drink)
  prep_minutes?: number; // tiempo de preparación estimado (min)
  allergens?: string[]; // alérgenos declarados (gluten, nueces, lácteos…)
  modifier_groups?: ModifierGroup[]; // grupos de modificadores configurados
};

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name_snapshot: string;
  price_snapshot: number; // ya incluye los deltas de modificadores
  qty: number;
  notes: string | null;
  status: OrderItemStatus;
  round?: number; // tanda: 1 = primer pedido, 2 = segunda tanda, etc.
  modifiers?: OrderItemModifier[]; // modificadores elegidos (snapshot)
  course?: string | null; // curso de cocina (snapshot)
  prep_minutes?: number; // tiempo de prep estimado (snapshot)
  fired?: boolean; // false = retenido (coursing) hasta dispararse
  fired_at?: string | null;
};

export type Order = {
  id: number;
  business_id: number;
  table_id: number;
  status: OrderStatus;
  channel: "qr" | "waiter";
  total: number;
  created_at?: string | null; // para el temporizador del KDS
  waiter_id?: string | null; // mesero asignado
  priority?: boolean; // rush / urgente
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
  // Alcohol: si el negocio vende + ventana horaria de venta
  sells_alcohol?: boolean;
  alcohol_start?: string | null;
  alcohol_end?: string | null;
  liquor_permit?: string | null; // nº permiso RACJ (mostrar en el menú si vende)
};

// ── Contabilidad: libro (ingresos/egresos manuales) + reporte por periodo ──
export type LedgerEntry = {
  id: number;
  business_id: number;
  created_at: string;
  occurred_at: string;
  kind: "income" | "expense";
  amount: number;
  category: string | null;
  note: string | null;
  method: string | null;
};
export type TimeseriesBucket = {
  key: string;
  sales: number;
  income: number;
  expense: number;
  net: number;
  count: number;
};
export type TimeseriesReport = {
  granularity: string;
  since: string;
  buckets: TimeseriesBucket[];
  totals: { sales: number; income: number; expense: number; net: number; count: number };
};

// ── Stock / inventario de cocina ──
export type StockItem = {
  id: number;
  business_id: number;
  name: string;
  qty: number;
  unit: string | null;
  low_threshold: number;
  note: string | null;
};

// ── Motor fiscal (SEV/MEV-WEB) ──
export type FiscalDocType =
  | "facture"
  | "note_credit"
  | "annulation"
  | "duplicata"
  | "correction"
  | "addition"
  | "fermeture";

export type FiscalItem = {
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  taxes_applicable?: string[];
  tax_codes?: string[]; // F / P / S
  modifiers?: string[];
  line_total?: number;
};

export type FiscalTransaction = {
  id: number;
  business_id: number;
  bill_id: number | null;
  transaction_no: string;
  doc_type: FiscalDocType;
  status: string;
  order_type: string | null;
  table_label: string | null;
  establishment_name: string | null;
  establishment_address: string | null;
  tps_number: string | null;
  tvq_number: string | null;
  items: FiscalItem[];
  subtotal: number;
  discount: number;
  tps: number;
  tvq: number;
  tip: number;
  total: number;
  payment_method: string | null;
  mev_transaction_no: string | null;
  transmitted_at: string | null;
  environment: string;
  retry_count: number;
  last_error: string | null;
  created_at: string;
};

export type FiscalInvoice = {
  establishment_name: string | null;
  establishment_address: string | null;
  tps_number: string | null;
  tvq_number: string | null;
  transaction_no: string;
  doc_type: string;
  table_label: string | null;
  order_type: string | null;
  moment_transmission: string;
  numero_transaction: string;
  items: FiscalItem[];
  subtotal: number;
  discount: number;
  tps: number;
  tvq: number;
  tip: number;
  service_charge?: number;
  total: number;
  payment_method: string | null;
  payments?: { method: string | null; amount: number }[];
  currency: string;
  mev_transaction_no: string | null;
  mev_qr_payload: string | null;
  mention: string;
  certified: boolean;
};

export type FiscalAuditEntry = {
  id: number;
  created_at: string;
  action: string;
  prev_value: unknown;
  new_value: unknown;
  fiscal_status: string | null;
  user_id: string | null;
};

// ── Estado de la cuenta Square del negocio (sin tokens) ──
export type PaymentAccount = {
  connected: boolean;
  status: string; // pending | active | change_requested | suspended
  locked: boolean;
  provider: string;
  square_merchant_id: string | null;
  square_location_id: string | null;
  app_fee_bps: number;
  connected_at: string | null;
};

// ── Config pública del cobro con tarjeta (Square) por negocio ──
// La entrega GET /businesses/{id}/payments/config. environment = 'sandbox'
// (demo, dinero falso) | 'production'. enabled=false → cae al cobro manual.
export type PaymentConfig = {
  enabled: boolean;
  environment: "sandbox" | "production" | string;
  application_id: string;
  location_id: string;
  currency: string;
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
