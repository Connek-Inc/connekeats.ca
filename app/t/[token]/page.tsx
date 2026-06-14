// Cáscara server. El comensal (token de QR) es web-only → no va en el bundle de
// la app staff. En el build SSR del VPS sigue sirviéndose normal por QR.
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [{ token: "_" }]; // página dummy; el comensal real es web/QR, no va en el bundle
}

export default function Page() {
  return <ClientPage />;
}
