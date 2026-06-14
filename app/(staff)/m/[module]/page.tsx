// Cáscara server: aporta generateStaticParams (requerido por el export estático
// de Tauri) y renderiza el componente client (que lee el módulo con useParams).
import ClientPage from "./ClientPage";

const MODULE_KEYS = [
  "reception",
  "kitchen",
  "bar",
  "buffet",
  "vip",
  "parking",
  "delivery",
  "services",
  "crm",
];

export function generateStaticParams() {
  return MODULE_KEYS.map((module) => ({ module }));
}

export default function Page() {
  return <ClientPage />;
}
