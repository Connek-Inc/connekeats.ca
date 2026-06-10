"use client";
// Hooks de datos (react-query) contra la API del staff.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import type {
  Bill,
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
  Floor,
  MenuCategory,
  MenuItem,
  Order,
  ParkingTicket,
  Review,
  SalesSummary,
  SeedRequestInput,
  SeedResult,
  SeedTablesInput,
  ServiceRequest,
  StaffInvite,
  StaffRoleRow,
  Table,
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
    mutationFn: (body: { name?: string; mode?: "bar" | "restaurant"; currency?: string; features?: string[] }) =>
      api.patch<Business>(`/businesses/${businessId}`, body),
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
  Pick<MenuItem, "name" | "price" | "available" | "description" | "available_in" | "category_id" | "station">
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
  });
}

export function useOrderWithItems(businessId: number, orderId: number | null) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ["order", businessId, orderId],
    queryFn: () => api.get<Order>(`/businesses/${businessId}/orders/${orderId}`),
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
    mutationFn: ({ billId, paymentMethod }: { billId: number; paymentMethod?: string }) =>
      api.patch(
        `/businesses/${businessId}/bills/${billId}/paid${paymentMethod ? `?payment_method=${paymentMethod}` : ""}`,
      ),
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
    mutationFn: (body: { table_id: number; items: { menu_item_id: number; qty: number }[] }) =>
      api.post(`/businesses/${businessId}/orders`, { ...body, channel: "waiter" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", businessId] });
      qc.invalidateQueries({ queryKey: ["tables", businessId] });
    },
  });
}

// Cobrar una mesa de una vez (crea/paga la cuenta, cierra orden, libera mesa).
export function useCheckoutTable(businessId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, paymentMethod }: { tableId: number; paymentMethod?: string }) =>
      api.post(`/businesses/${businessId}/bills/checkout`, {
        table_id: tableId,
        payment_method: paymentMethod ?? null,
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
    }) => api.post<Employee>(`/businesses/${businessId}/employees`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees", businessId] }),
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
