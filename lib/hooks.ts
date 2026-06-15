"use client";
// Hooks de datos (react-query) contra la API del staff.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type {
  Bill,
  BillDetail,
  BuffetStation,
  Business,
  CashCloseResult,
  CashCurrent,
  CashSession,
  Customer,
  CustomerDetail,
  DeliveryOrder,
  DeliveryStatus,
  Employee,
  FiscalAuditEntry,
  FiscalInvoice,
  FiscalTransaction,
  Floor,
  Invoice,
  LedgerEntry,
  MenuCategory,
  MenuItem,
  ModifierGroup,
  OcrResult,
  Order,
  ParkingTicket,
  PaymentAccount,
  PaymentConfig,
  Review,
  SalesSummary,
  SeedRequestInput,
  SeedResult,
  SeedTablesInput,
  ServiceRequest,
  StaffInvite,
  StaffRoleRow,
  StockItem,
  Table,
  TimeseriesReport,
} from "./types";

type StaffRoleKind = "manager" | "waiter" | "kitchen";

export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: () => api.get<{ businesses: Business[] }>("/businesses").then((r) => r.businesses),
  });
}

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; mode: "bar" | "restaurant" }) =>
      api.post<Business>("/businesses", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

// Actualiza el negocio (nombre, modo, características/módulos activos).
export function useUpdateBusiness(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name?: string;
      mode?: "bar" | "restaurant";
      currency?: string;
      features?: string[];
      tax_rate?: number;
      tax_id?: string;
      legal_name?: string;
      fiscal_address?: string;
      // Motor de impuestos (GST/HST/QST/PST)
      province?: string;
      tax_components?: { name: string; rate: number; number?: string | null }[];
      prices_include_tax?: boolean;
      // Alcohol (RACJ)
      liquor_permit?: string;
      liquor_category?: string;
      alcohol_start?: string;
      alcohol_end?: string;
      // Marca / white-label ("" = restablecer)
      logo_url?: string;
      brand_primary?: string;
      brand_bg?: string;
      brand_fg?: string;
      brand_base?: string;
      brand_font?: string;
      // Cumplimiento (MAPAQ) + identidad regulatoria
      business_type?: string;
      mapaq_permit_no?: string;
      mapaq_permit_type?: string;
      mapaq_permit_issued?: string;
      mapaq_permit_expiry?: string;
      mapaq_permit_posted?: boolean;
      activity_code?: string;
      neq?: string;
      cnesst_number?: string;
      tps_number?: string;
      tvq_number?: string;
      liquor_permit_expiry?: string;
    }) => api.patch<Business>(`/businesses/${businessId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
      qc.invalidateQueries({ queryKey: ["compliance", businessId] });
    },
  });
}

// Checklist de cumplimiento (semáforo) — la lógica la arma el backend.
export function useCompliance(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["compliance", businessId],
    queryFn: () => api.get<import("./types").ComplianceStatus>(`/businesses/${businessId}/compliance`),
  });
}

// Bitácora de temperaturas (cadena de frío).
export function useTemperatureLogs(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["temperature-logs", businessId],
    queryFn: () =>
      api.get<{ logs: import("./types").TemperatureLog[] }>(`/businesses/${businessId}/compliance/temperature-logs`).then((r) => r.logs),
  });
}

export function useAddTemperature(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { unit_label: string; temp_c: number; note?: string | null }) =>
      api.post(`/businesses/${businessId}/compliance/temperature-logs`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temperature-logs", businessId] }),
  });
}

// Sube el logo del negocio (multipart). El backend lo guarda en Storage y
// devuelve el negocio con logo_url ya seteada.
export function useUploadLogo(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.upload<Business>(`/businesses/${businessId}/logo`, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

// Siembra menú + mesas de una plantilla, en una sola llamada (onboarding).
// Parameterless: se usa justo tras crear el negocio, cuando el id recién existe.
export function useSeedBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId, payload }: { businessId: number; payload: SeedRequestInput }) =>
      api.post<SeedResult>(`/businesses/${businessId}/seed`, payload),
    onSuccess: (_data, { businessId }) => {
      qc.invalidateQueries({ queryKey: ["businesses"] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["menu", businessId] });
    },
  });
}

// ── Zonas (floors) ──────────────────────────────────────────────────
export function useFloors(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["floors", businessId],
    queryFn: () => api.get<{ floors: Floor[] }>(`/businesses/${businessId}/floors`).then((r) => r.floors),
  });
}

export function useCreateFloor(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Floor>(`/businesses/${businessId}/floors`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["floors", businessId] }),
  });
}

// Asigna (o cambia) la zona de un miembro del staff (upsert sobre staff_role).
export function useAssignZone(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, floorId }: { userId: string; role: string; floorId: number | null }) =>
      api.post(`/businesses/${businessId}/staff`, { user_id: userId, role, floor_id: floorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

export function useTables(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["tables", businessId],
    queryFn: () => api.get<{ tables: Table[] }>(`/businesses/${businessId}/tables`).then((r) => r.tables),
  });
}

export function useCreateTable(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { label: string; capacity?: number }) =>
      api.post<Table>(`/businesses/${businessId}/tables`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables", businessId] }),
  });
}

// Crear varias mesas de golpe (POST .../tables/bulk).
export function useBulkCreateTables(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SeedTablesInput) =>
      api.post<{ tables: Table[] }>(`/businesses/${businessId}/tables/bulk`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables", businessId] }),
  });
}

export function useDeleteTable(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: number) => api.del(`/businesses/${businessId}/tables/${tableId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables", businessId] }),
  });
}

type TablePatch = Partial<Pick<Table, "pos_x" | "pos_y" | "label" | "capacity" | "status" | "floor_id">>;

// Mover/editar una mesa (posición en el mapa, etc.).
export function useUpdateTable(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: number; data: TablePatch }) =>
      api.patch(`/businesses/${businessId}/tables/${tableId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables", businessId] }),
  });
}

export function useMenu(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["menu", businessId],
    queryFn: () =>
      api.get<{ categories: MenuCategory[]; items: MenuItem[] }>(`/businesses/${businessId}/menu`),
  });
}

// Sube la foto de un ítem del menú (multipart). El backend la guarda en Storage
// y devuelve el ítem con image_url ya seteada.
export function useUploadMenuImage(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, file }: { itemId: number; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api.upload<MenuItem>(`/businesses/${businessId}/menu/items/${itemId}/image`, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

// Sube un video corto del ítem (multipart) → backend lo guarda y setea video_url.
export function useUploadMenuVideo(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, file }: { itemId: number; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api.upload<MenuItem>(`/businesses/${businessId}/menu/items/${itemId}/video`, form);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

export function useCreateMenuItem(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      price: number;
      available_in?: "both" | "bar" | "restaurant";
      category_id?: number | null;
    }) => api.post<MenuItem>(`/businesses/${businessId}/menu/items`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

type MenuItemPatch = Partial<
  Pick<MenuItem, "name" | "price" | "available" | "description" | "available_in" | "category_id" | "station" | "featured" | "is_alcohol" | "course" | "prep_minutes" | "allergens">
>;

export function useUpdateMenuItem(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: MenuItemPatch }) =>
      api.patch<MenuItem>(`/businesses/${businessId}/menu/items/${itemId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

export function useDeleteMenuItem(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.del(`/businesses/${businessId}/menu/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

// ── Modificadores / ingredientes (config del owner) ─────────────────
// La lógica de validación y precio vive en el backend; aquí solo CRUD de config.
export function useItemModifiers(businessId: number, itemId: number | null) {
  return useQuery({
    enabled: !!businessId && !!itemId,
    queryKey: ["modifier-groups", businessId, itemId],
    queryFn: () =>
      api
        .get<{ groups: ModifierGroup[] }>(
          `/businesses/${businessId}/menu/items/${itemId}/modifier-groups`,
        )
        .then((r) => r.groups),
  });
}

// Invalida tanto la config del ítem como el menú (que ya trae los grupos).
function useModifierMutation<TVars>(
  businessId: number,
  itemId: number | null,
  fn: (vars: TVars) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modifier-groups", businessId, itemId] });
      qc.invalidateQueries({ queryKey: ["menu", businessId] });
    },
  });
}

type GroupBody = {
  name: string;
  selection: "single" | "multi";
  min_select: number;
  max_select: number | null;
};

export function useCreateModifierGroup(businessId: number, itemId: number) {
  return useModifierMutation<GroupBody>(businessId, itemId, (body) =>
    api.post(`/businesses/${businessId}/menu/items/${itemId}/modifier-groups`, body),
  );
}

export function useUpdateModifierGroup(businessId: number, itemId: number) {
  return useModifierMutation<{ groupId: number; data: Partial<GroupBody> }>(
    businessId,
    itemId,
    ({ groupId, data }) => api.patch(`/businesses/${businessId}/menu/modifier-groups/${groupId}`, data),
  );
}

export function useDeleteModifierGroup(businessId: number, itemId: number) {
  return useModifierMutation<number>(businessId, itemId, (groupId) =>
    api.del(`/businesses/${businessId}/menu/modifier-groups/${groupId}`),
  );
}

type OptionBody = {
  name: string;
  price_delta: number;
  is_default: boolean;
  available: boolean;
};

export function useCreateModifierOption(businessId: number, itemId: number) {
  return useModifierMutation<{ groupId: number; data: OptionBody }>(
    businessId,
    itemId,
    ({ groupId, data }) =>
      api.post(`/businesses/${businessId}/menu/modifier-groups/${groupId}/options`, data),
  );
}

export function useUpdateModifierOption(businessId: number, itemId: number) {
  return useModifierMutation<{ optionId: number; data: Partial<OptionBody> }>(
    businessId,
    itemId,
    ({ optionId, data }) =>
      api.patch(`/businesses/${businessId}/menu/modifier-options/${optionId}`, data),
  );
}

export function useDeleteModifierOption(businessId: number, itemId: number) {
  return useModifierMutation<number>(businessId, itemId, (optionId) =>
    api.del(`/businesses/${businessId}/menu/modifier-options/${optionId}`),
  );
}

// ── Categorías del menú (las crea el dueño) ─────────────────────────
export function useCreateCategory(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; sort_order?: number }) =>
      api.post(`/businesses/${businessId}/menu/categories`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

export function useUpdateCategory(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name?: string; sort_order?: number }) =>
      api.patch(`/businesses/${businessId}/menu/categories/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

export function useDeleteCategory(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/menu/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu", businessId] }),
  });
}

// ── Parking / Valet ─────────────────────────────────────────────────
export function useParkingTickets(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["parking", businessId],
    queryFn: () =>
      api.get<{ tickets: ParkingTicket[] }>(`/businesses/${businessId}/parking`).then((r) => r.tickets),
  });
}

export function useCreateParkingTicket(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { plate: string; customer?: string | null; spot?: string | null; note?: string | null }) =>
      api.post<ParkingTicket>(`/businesses/${businessId}/parking`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parking", businessId] }),
  });
}

export function useUpdateParkingTicket(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      status?: "parked" | "retrieved";
      spot?: string | null;
      note?: string | null;
      plate?: string;
      customer?: string | null;
    }) => api.patch<ParkingTicket>(`/businesses/${businessId}/parking/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parking", businessId] }),
  });
}

export function useDeleteParkingTicket(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/parking/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parking", businessId] }),
  });
}

// ── Buffet (estaciones) ─────────────────────────────────────────────
export function useBuffetStations(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["buffet", businessId],
    queryFn: () =>
      api.get<{ stations: BuffetStation[] }>(`/businesses/${businessId}/buffet`).then((r) => r.stations),
  });
}

export function useCreateBuffetStation(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; status?: string }) => api.post(`/businesses/${businessId}/buffet`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buffet", businessId] }),
  });
}

export function useUpdateBuffetStation(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name?: string; status?: string }) =>
      api.patch(`/businesses/${businessId}/buffet/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buffet", businessId] }),
  });
}

export function useDeleteBuffetStation(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/buffet/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buffet", businessId] }),
  });
}

// ── Delivery / para llevar ──────────────────────────────────────────
export function useDeliveryOrders(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["delivery", businessId],
    queryFn: () =>
      api.get<{ orders: DeliveryOrder[] }>(`/businesses/${businessId}/delivery`).then((r) => r.orders),
  });
}

export function useCreateDeliveryOrder(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      customer: string;
      phone?: string | null;
      address?: string | null;
      note?: string | null;
      items: { name: string; price: number; qty: number }[];
    }) => api.post<DeliveryOrder>(`/businesses/${businessId}/delivery`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery", businessId] }),
  });
}

export function useUpdateDeliveryOrder(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      status?: DeliveryStatus;
      customer?: string;
      phone?: string | null;
      address?: string | null;
      note?: string | null;
    }) => api.patch(`/businesses/${businessId}/delivery/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery", businessId] }),
  });
}

export function useDeleteDeliveryOrder(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/delivery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery", businessId] }),
  });
}

// ── CRM / Clientes ──────────────────────────────────────────────────
export function useCustomers(businessId: number | null, q?: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["customers", businessId, q ?? ""],
    queryFn: () =>
      api
        .get<{ customers: Customer[] }>(
          `/businesses/${businessId}/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        )
        .then((r) => r.customers),
  });
}

export function useCustomer(businessId: number | null, customerId: number | null) {
  return useQuery({
    enabled: !!businessId && !!customerId,
    queryKey: ["customer", businessId, customerId],
    queryFn: () => api.get<CustomerDetail>(`/businesses/${businessId}/customers/${customerId}`),
  });
}

type CustomerInput = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  birthday?: string | null;
  notes?: string | null;
  tags?: string[];
};

export function useCreateCustomer(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CustomerInput & { name: string }) =>
      api.post<Customer>(`/businesses/${businessId}/customers`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers", businessId] }),
  });
}

export function useUpdateCustomer(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: CustomerInput & { id: number }) =>
      api.patch<Customer>(`/businesses/${businessId}/customers/${id}`, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["customers", businessId] });
      qc.invalidateQueries({ queryKey: ["customer", businessId, v.id] });
    },
  });
}

export function useDeleteCustomer(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers", businessId] }),
  });
}

// Reseñas del comensal (lectura para el dueño): promedio + recientes.
export function useReviews(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["reviews", businessId],
    queryFn: () =>
      api.get<{ reviews: Review[]; avg: number; count: number }>(`/businesses/${businessId}/reviews`),
  });
}

export function useOrders(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["orders", businessId],
    queryFn: () => api.get<{ orders: Order[] }>(`/businesses/${businessId}/orders`).then((r) => r.orders),
    // Fallback de tiempo real: refresca cada 12s aunque el realtime (websockets)
    // no esté configurado, para que las notificaciones cocina→mesero funcionen.
    refetchInterval: 12000,
  });
}

export function useOrderWithItems(businessId: number, orderId: number | null) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ["order", businessId, orderId],
    queryFn: () => api.get<Order>(`/businesses/${businessId}/orders/${orderId}`),
  });
}

// Tablero KDS: órdenes activas con items+modificadores+curso/ronda en UNA lectura.
export function useKds(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["kds", businessId],
    queryFn: () => api.get<{ orders: Order[] }>(`/businesses/${businessId}/orders/kds`).then((r) => r.orders),
    refetchInterval: 10000, // fallback de tiempo real
  });
}

// Acción del KDS (la lógica vive en el backend): disparar curso, listo/servido de
// una ronda o ticket completo, recall.
export function useKdsAction(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, action, scope, value }: { orderId: number; action: string; scope?: string; value?: string | number | null }) =>
      api.post(`/businesses/${businessId}/orders/${orderId}/kds-action`, { action, scope: scope ?? "order", value: value ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
    },
  });
}

// Marca/quita 'rush' (urgente) de un ticket.
export function useSetOrderPriority(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, priority }: { orderId: number; priority: boolean }) =>
      api.patch(`/businesses/${businessId}/orders/${orderId}/priority`, { priority }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
    },
  });
}

// Registro RACJ: el mesero confirma 18+/sobriedad al servir alcohol (queda rastro).
export function useAlcoholVerify(businessId: number) {
  return useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note?: string }) =>
      api.post(`/businesses/${businessId}/orders/${orderId}/alcohol-verify`, { note: note ?? "ok" }),
  });
}

// 86/agotado: la cocina oculta/reactiva un ítem del menú del comensal.
export function useToggleItemAvailability(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, available }: { itemId: number; available: boolean }) =>
      api.patch(`/businesses/${businessId}/menu/items/${itemId}/availability`, { available }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu", businessId] });
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
    },
  });
}

export function useSetOrderStatus(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.patch(`/businesses/${businessId}/orders/${orderId}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", businessId] }),
  });
}

export function useSetItemStatus(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId, status }: { orderId: number; itemId: number; status: string }) =>
      api.patch(`/businesses/${businessId}/orders/${orderId}/items/${itemId}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", businessId] }),
  });
}

// El mesero quita un ítem del pedido (recalcula total en el backend).
export function useDeleteOrderItem(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number; itemId: number }) =>
      api.del(`/businesses/${businessId}/orders/${orderId}/items/${itemId}`),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["order", businessId, v.orderId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
    },
  });
}

// El mesero AGREGA ítems (con modificadores) a una orden ya abierta.
export function useAddItemsToOrder(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }: { orderId: number; items: { menu_item_id: number; qty: number; modifiers: number[] }[] }) =>
      api.post(`/businesses/${businessId}/orders/${orderId}/items`, items),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["order", businessId, v.orderId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
    },
  });
}

// El mesero ajusta la cantidad de un ítem (0 = lo elimina).
export function useUpdateOrderItemQty(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId, qty }: { orderId: number; itemId: number; qty: number }) =>
      api.patch(`/businesses/${businessId}/orders/${orderId}/items/${itemId}`, { qty }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["order", businessId, v.orderId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
    },
  });
}

export function useServiceRequests(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["service-requests", businessId],
    queryFn: () =>
      api.get<{ requests: ServiceRequest[] }>(`/businesses/${businessId}/service-requests`).then((r) => r.requests),
  });
}

export function useAckRequest(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: "ack" | "done" }) =>
      api.patch(`/businesses/${businessId}/service-requests/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["service-requests", businessId] }),
  });
}

export function useBills(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["bills", businessId],
    queryFn: () => api.get<{ bills: Bill[] }>(`/businesses/${businessId}/bills`).then((r) => r.bills),
  });
}

export function useMarkBillPaid(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      billId,
      paymentMethod,
      discount = 0,
      tip = 0,
    }: {
      billId: number;
      paymentMethod?: string;
      discount?: number;
      tip?: number;
    }) => {
      const q = new URLSearchParams();
      if (paymentMethod) q.set("payment_method", paymentMethod);
      if (discount) q.set("discount", String(discount));
      if (tip) q.set("tip", String(tip));
      const qs = q.toString();
      return api.patch(`/businesses/${businessId}/bills/${billId}/paid${qs ? `?${qs}` : ""}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
    },
  });
}

// El mesero toma un pedido en una mesa (canal 'waiter') → va a cocina.
export function useCreateStaffOrder(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { table_id: number; items: { menu_item_id: number; qty: number; modifiers?: number[] }[] }) =>
      api.post(`/businesses/${businessId}/orders`, { ...body, channel: "waiter" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["kds", businessId] });
    },
  });
}

// Cobrar una mesa de una vez (crea/paga la cuenta, cierra orden, libera mesa).
export function useCheckoutTable(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      paymentMethod,
      discount = 0,
      tip = 0,
      serviceCharge = 0,
    }: {
      tableId: number;
      paymentMethod?: string;
      discount?: number;
      tip?: number;
      serviceCharge?: number;
    }) =>
      api.post<{ ok: boolean; bill_id: number }>(`/businesses/${businessId}/bills/checkout`, {
        table_id: tableId,
        payment_method: paymentMethod ?? null,
        discount,
        tip,
        service_charge: serviceCharge,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["sales-summary", businessId] });
      qc.invalidateQueries({ queryKey: ["cash-current", businessId] });
    },
  });
}

// ── POS Fase 3: dividir cuenta (pagos parciales) + pagar varias mesas ──
export function useOpenBill(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: number) =>
      api.post<BillDetail>(`/businesses/${businessId}/bills/open`, { table_id: tableId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills", businessId] }),
  });
}

export function useBillDetail(businessId: number, billId: number | null) {
  return useQuery({
    enabled: !!billId,
    queryKey: ["bill", businessId, billId],
    queryFn: () => api.get<BillDetail>(`/businesses/${businessId}/bills/${billId}`),
  });
}

// ── Config del cobro con tarjeta (Square) por negocio ──
// Entorno (sandbox=demo | producción) + app id + location id para el SDK.
// Sin secretos. El front la usa para decidir si muestra el formulario de tarjeta.
export function usePaymentConfig(businessId: number | null | undefined) {
  return useQuery({
    queryKey: ["payment-config", businessId],
    queryFn: () => api.get<PaymentConfig>(`/businesses/${businessId}/payments/config`),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });
}

// Variante para el comensal (QR): usa el token efímero de mesa.
export function useDinerPaymentConfig(businessId: number | null | undefined, token: string | null) {
  return useQuery({
    queryKey: ["payment-config-diner", businessId],
    queryFn: () => api.get<PaymentConfig>(`/businesses/${businessId}/payments/config`, token ?? undefined),
    enabled: !!businessId && !!token,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Cuenta Square del negocio (Setup): estado + conectar (OAuth) + cambio ──
export function usePaymentAccount(businessId: number | null | undefined) {
  return useQuery({
    queryKey: ["payment-account", businessId],
    queryFn: () => api.get<PaymentAccount>(`/businesses/${businessId}/payments/account`),
    enabled: !!businessId,
  });
}

// Devuelve la URL de OAuth (autenticada); el componente redirige a ella.
export function useConnectSquare(businessId: number) {
  return useMutation({
    mutationFn: () => api.get<{ url: string }>(`/businesses/${businessId}/payments/connect/square`),
  });
}

export function useRequestAccountChange(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      api.post<{ ok: boolean; message?: string }>(
        `/businesses/${businessId}/payments/account/change-request`,
        { reason },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-account", businessId] }),
  });
}

// ── Cobro con tarjeta (Square) ──
export type ChargeResult = {
  ok: boolean;
  status: string;
  payment_id?: string;
  receipt_url?: string;
  paid: number;
  remaining: number;
  done: boolean;
  error?: string;
};

// Mesero (CobroPanel): usa el JWT del staff.
export function useChargeCard(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      billId,
      amount,
      sourceId,
      tip,
      note,
      idempotencyKey,
    }: {
      billId: number;
      amount: number;
      sourceId: string;
      tip?: number;
      note?: string;
      idempotencyKey?: string;
    }) =>
      api.post<ChargeResult>(`/businesses/${businessId}/payments/charge`, {
        bill_id: billId,
        amount,
        source_id: sourceId,
        tip: tip ?? 0,
        note: note ?? null,
        idempotency_key: idempotencyKey ?? null,
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bill", businessId, v.billId] });
      qc.invalidateQueries({ queryKey: ["bills", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
    },
  });
}

// Comensal (QR): usa el token efímero de mesa (3er arg de api.post).
export function useDinerChargeCard() {
  return useMutation({
    mutationFn: ({
      token,
      businessId,
      billId,
      amount,
      sourceId,
      tip,
      idempotencyKey,
    }: {
      token: string;
      businessId: number;
      billId: number;
      amount: number;
      sourceId: string;
      tip?: number;
      idempotencyKey?: string;
    }) =>
      api.post<ChargeResult>(
        `/businesses/${businessId}/payments/charge`,
        {
          bill_id: billId,
          amount,
          source_id: sourceId,
          tip: tip ?? 0,
          idempotency_key: idempotencyKey ?? null,
        },
        token,
      ),
  });
}

// ── Conciliación de pagos Square (historial detallado + totales + payouts) ──
export type PaymentTxn = {
  id: number;
  square_payment_id: string;
  status: string | null;
  gross: number;
  tip: number;
  processing_fee: number;
  app_fee: number;
  net: number;
  card_brand: string | null;
  card_last4: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  currency: string;
  square_payout_id: string | null;
};

export type PaymentSummary = {
  count: number;
  completed: number;
  currency: string;
  gross: number;
  tip: number;
  processing_fee: number;
  app_fee: number;
  net: number;
  by_status: Record<string, number>;
};

export type Payout = {
  id: number;
  square_payout_id: string;
  status: string | null;
  amount: number;
  currency: string;
  arrival_date: string | null;
  destination_type: string | null;
  destination_last4: string | null;
};

function payQs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v) as [string, string][];
  return entries.length ? "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&") : "";
}

export function usePaymentSummary(businessId: number, begin?: string, end?: string) {
  return useQuery({
    queryKey: ["pay-summary", businessId, begin, end],
    queryFn: () =>
      api.get<PaymentSummary>(`/businesses/${businessId}/payments/summary${payQs({ begin, end })}`),
  });
}

export function usePaymentTransactions(businessId: number, begin?: string, end?: string) {
  return useQuery({
    queryKey: ["pay-transactions", businessId, begin, end],
    queryFn: () =>
      api
        .get<{ transactions: PaymentTxn[] }>(
          `/businesses/${businessId}/payments/transactions${payQs({ begin, end })}`,
        )
        .then((r) => r.transactions),
  });
}

export function usePayouts(businessId: number) {
  return useQuery({
    queryKey: ["payouts", businessId],
    queryFn: () =>
      api.get<{ payouts: Payout[] }>(`/businesses/${businessId}/payments/payouts`).then((r) => r.payouts),
  });
}

export function useSyncPayments(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ begin, end }: { begin?: string; end?: string } = {}) =>
      api.post<{ ok: boolean }>(`/businesses/${businessId}/payments/sync${payQs({ begin, end })}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pay-summary", businessId] });
      qc.invalidateQueries({ queryKey: ["pay-transactions", businessId] });
      qc.invalidateQueries({ queryKey: ["payouts", businessId] });
    },
  });
}

export function useAddPayment(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      billId,
      amount,
      method,
      note,
    }: {
      billId: number;
      amount: number;
      method?: string;
      note?: string;
    }) =>
      api.post<{ ok: boolean; paid: number; remaining: number; done: boolean }>(
        `/businesses/${businessId}/bills/${billId}/payments`,
        { amount, method: method ?? null, note: note ?? null },
      ),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["bill", businessId, v.billId] });
      qc.invalidateQueries({ queryKey: ["bills", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
    },
  });
}

export function useCheckoutMulti(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableIds, paymentMethod }: { tableIds: number[]; paymentMethod?: string }) =>
      api.post<{ ok: boolean; bill_ids: number[]; total: number }>(
        `/businesses/${businessId}/bills/checkout-multi`,
        { table_ids: tableIds, payment_method: paymentMethod ?? null },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["sales-summary", businessId] });
    },
  });
}

// ── POS Fase 4: factura fiscal + OCR ─────────────────────────────────
export function useInvoice(businessId: number, billId: number | null) {
  return useQuery({
    enabled: !!billId,
    queryKey: ["invoice", businessId, billId],
    queryFn: () => api.get<Invoice>(`/businesses/${businessId}/bills/${billId}/invoice`),
  });
}

export function useOcr(businessId: number) {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.upload<OcrResult>(`/businesses/${businessId}/ocr`, fd);
    },
  });
}

// ── POS / Caja / Reportes ────────────────────────────────────────
export function useSalesSummary(businessId: number | null, range: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["sales-summary", businessId, range],
    queryFn: () => api.get<SalesSummary>(`/businesses/${businessId}/reports/summary?range=${range}`),
  });
}

export function useCashCurrent(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["cash-current", businessId],
    queryFn: () => api.get<CashCurrent>(`/businesses/${businessId}/cash/current`),
  });
}

export function useCashSessions(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["cash-sessions", businessId],
    queryFn: () =>
      api.get<{ sessions: CashSession[] }>(`/businesses/${businessId}/cash/sessions`).then((r) => r.sessions),
  });
}

export function useOpenCash(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (openingCash: number) =>
      api.post<CashSession>(`/businesses/${businessId}/cash/open`, { opening_cash: openingCash }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cash-current", businessId] }),
  });
}

export function useCloseCash(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { closing_cash: number; note?: string }) =>
      api.post<CashCloseResult>(`/businesses/${businessId}/cash/close`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-current", businessId] });
      qc.invalidateQueries({ queryKey: ["cash-sessions", businessId] });
    },
  });
}

// ── Contabilidad: libro (ingresos/egresos manuales) + reporte por periodo ──
export function useLedger(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["ledger", businessId],
    queryFn: () => api.get<{ entries: LedgerEntry[] }>(`/businesses/${businessId}/ledger`).then((r) => r.entries),
  });
}

export function useCreateLedger(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      kind: "income" | "expense";
      amount: number;
      category?: string;
      note?: string;
      method?: string;
      occurred_at?: string;
    }) => api.post<LedgerEntry>(`/businesses/${businessId}/ledger`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", businessId] });
      qc.invalidateQueries({ queryKey: ["timeseries", businessId] });
    },
  });
}

export function useDeleteLedger(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/ledger/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", businessId] });
      qc.invalidateQueries({ queryKey: ["timeseries", businessId] });
    },
  });
}

export function useTimeseries(businessId: number | null, granularity: string) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["timeseries", businessId, granularity],
    queryFn: () => api.get<TimeseriesReport>(`/businesses/${businessId}/reports/timeseries?granularity=${granularity}`),
  });
}

// ── Stock / inventario de cocina ──
export function useStock(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["stock", businessId],
    queryFn: () => api.get<{ items: StockItem[] }>(`/businesses/${businessId}/stock`).then((r) => r.items),
  });
}

export function useCreateStock(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; qty?: number; unit?: string; low_threshold?: number; note?: string }) =>
      api.post<StockItem>(`/businesses/${businessId}/stock`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock", businessId] }),
  });
}

export function usePatchStock(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<StockItem, "name" | "qty" | "unit" | "low_threshold" | "note">> }) =>
      api.patch(`/businesses/${businessId}/stock/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock", businessId] }),
  });
}

export function useAdjustStock(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) =>
      api.post(`/businesses/${businessId}/stock/${id}/adjust`, { delta }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock", businessId] }),
  });
}

export function useDeleteStock(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/businesses/${businessId}/stock/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock", businessId] }),
  });
}

// ── Motor fiscal (SEV/MEV-WEB) ──
export function useFiscalList(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["fiscal", businessId],
    queryFn: () => api.get<{ transactions: FiscalTransaction[] }>(`/businesses/${businessId}/fiscal`).then((r) => r.transactions),
  });
}

export function useFiscalPending(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["fiscal-pending", businessId],
    queryFn: () => api.get<{ transactions: FiscalTransaction[] }>(`/businesses/${businessId}/fiscal/pending`).then((r) => r.transactions),
  });
}

export function useFiscalInvoice(businessId: number | null, txnId: number | null) {
  return useQuery({
    enabled: !!businessId && !!txnId,
    queryKey: ["fiscal-invoice", businessId, txnId],
    queryFn: () => api.get<FiscalInvoice>(`/businesses/${businessId}/fiscal/${txnId}/invoice`),
  });
}

export function useFiscalAudit(businessId: number | null, txnId: number | null) {
  return useQuery({
    enabled: !!businessId && !!txnId,
    queryKey: ["fiscal-audit", businessId, txnId],
    queryFn: () => api.get<{ log: FiscalAuditEntry[] }>(`/businesses/${businessId}/fiscal/${txnId}/audit`).then((r) => r.log),
  });
}

export function useFiscalFromBill(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (billId: number) => api.post<FiscalTransaction>(`/businesses/${businessId}/fiscal/from-bill/${billId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal", businessId] });
      qc.invalidateQueries({ queryKey: ["fiscal-pending", businessId] });
    },
  });
}

export function useTransmitFiscal(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txnId: number) => api.post<{ ok: boolean; error?: string }>(`/businesses/${businessId}/fiscal/${txnId}/transmit`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal", businessId] });
      qc.invalidateQueries({ queryKey: ["fiscal-pending", businessId] });
    },
  });
}

export function useFiscalCreditNote(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ txnId, reason }: { txnId: number; reason?: string }) =>
      api.post(`/businesses/${businessId}/fiscal/${txnId}/credit-note`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiscal", businessId] }),
  });
}

export function useCancelFiscal(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ txnId, reason }: { txnId: number; reason?: string }) =>
      api.post(`/businesses/${businessId}/fiscal/${txnId}/cancel`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiscal", businessId] }),
  });
}

export function useFiscalDuplicate(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txnId: number) => api.post(`/businesses/${businessId}/fiscal/${txnId}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiscal", businessId] }),
  });
}

export function useRetryPending(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ attempted: number }>(`/businesses/${businessId}/fiscal/retry-pending`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiscal", businessId] });
      qc.invalidateQueries({ queryKey: ["fiscal-pending", businessId] });
    },
  });
}

// ── Equipo / staff ──────────────────────────────────────────────────
// Cambia el rol de un miembro (mesero ↔ cocina). El backend conserva la zona.
export function useChangeStaffRole(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { user_id: string; from_role: string; to_role: string }) =>
      api.patch(`/businesses/${businessId}/staff/role`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

// ── RH / Empleados (perfil por email) ───────────────────────────────
export function useEmployees(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["employees", businessId],
    queryFn: () =>
      api.get<{ employees: Employee[] }>(`/businesses/${businessId}/employees`).then((r) => r.employees),
  });
}

export function useUpsertEmployee(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      email: string;
      name?: string | null;
      phone?: string | null;
      position?: string | null;
      hire_date?: string | null;
      wage?: number | null;
      status?: "active" | "inactive";
      notes?: string | null;
      is_tipped?: boolean;
      training_level?: string | null;
      training_date?: string | null;
      training_expiry?: string | null;
      training_cert_url?: string | null;
    }) => api.post<Employee>(`/businesses/${businessId}/employees`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees", businessId] });
      qc.invalidateQueries({ queryKey: ["compliance", businessId] });
    },
  });
}

export function useDeleteEmployee(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.del(`/businesses/${businessId}/employees?email=${encodeURIComponent(email)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees", businessId] }),
  });
}

export function useStaff(businessId: number | null) {
  return useQuery({
    enabled: !!businessId,
    queryKey: ["staff", businessId],
    queryFn: () =>
      api.get<{ staff: StaffRoleRow[]; invites: StaffInvite[] }>(`/businesses/${businessId}/staff`),
  });
}

export function useInviteStaff(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; role: StaffRoleKind }) =>
      api.post(`/businesses/${businessId}/staff/invite`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

export function useAddStaffById(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { user_id: string; role: StaffRoleKind }) =>
      api.post(`/businesses/${businessId}/staff`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

export function useRemoveStaff(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.del(`/businesses/${businessId}/staff?user_id=${encodeURIComponent(userId)}&role=${role}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

export function useCancelInvite(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: number) => api.del(`/businesses/${businessId}/staff/invite/${inviteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", businessId] }),
  });
}

// Negocio activo del staff (persistido en localStorage).
export function getActiveBusiness(): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem("connek_food_business");
  return v ? Number(v) : null;
}
export function setActiveBusiness(id: number | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem("connek_food_business", String(id));
  else window.localStorage.removeItem("connek_food_business");
}
