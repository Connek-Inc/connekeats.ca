// Utilidades de formato compartidas (un solo lugar, en vez de redefinir `money`
// en cada página).

export const money = (n: number | null | undefined): string => `$${(Number(n) || 0).toFixed(2)}`;

export const dateTime = (s: string | null | undefined): string =>
  s ? new Date(s).toLocaleString() : "—";
