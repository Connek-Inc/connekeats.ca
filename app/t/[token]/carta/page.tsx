// Cáscara server (carta imprimible del comensal). Web-only → no va en el bundle.
import ClientPage from "./ClientPage";

export function generateStaticParams() {
  return [{ token: "_" }]; // página dummy; carta del comensal es web/QR
}

export default function Page() {
  return <ClientPage />;
}
