// Cáscara server. El billId es de runtime → no se pre-genera (en la app Tauri la
// factura se abre vía web). En el build SSR del VPS sigue funcionando normal.
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [{ billId: "_" }]; // página dummy (export exige ≥1); el staff abre la factura real vía web
}

export default function Page() {
  return <ClientPage />;
}
