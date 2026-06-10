// Color de IDENTIDAD por mesa: la única excepción cromática en una UI B/N.
// Idea: el comensal levanta el teléfono mostrando este color y el mesero lo
// ubica de un vistazo en un salón lleno. Determinístico por id → el mismo color
// siempre, e idéntico en la vista del comensal y del mesero (sin tocar la DB).

export type TableColor = { name: string; hex: string; fg: string };

const PALETTE: TableColor[] = [
  { name: "Morado", hex: "#A855F7", fg: "#ffffff" },
  { name: "Cian", hex: "#22D3EE", fg: "#000000" },
  { name: "Lima", hex: "#A3E635", fg: "#000000" },
  { name: "Rosa", hex: "#F472B6", fg: "#000000" },
  { name: "Naranja", hex: "#FB923C", fg: "#000000" },
  { name: "Azul", hex: "#60A5FA", fg: "#000000" },
  { name: "Esmeralda", hex: "#34D399", fg: "#000000" },
  { name: "Amarillo", hex: "#FACC15", fg: "#000000" },
  { name: "Coral", hex: "#FB7185", fg: "#000000" },
  { name: "Violeta", hex: "#818CF8", fg: "#ffffff" },
  { name: "Turquesa", hex: "#2DD4BF", fg: "#000000" },
  { name: "Fucsia", hex: "#E879F9", fg: "#000000" },
];

/** Color estable de una mesa por su id (>0). */
export function tableColor(id: number | null | undefined): TableColor {
  const n = typeof id === "number" && Number.isFinite(id) ? id : 0;
  const i = ((Math.trunc(n) % PALETTE.length) + PALETTE.length) % PALETTE.length;
  return PALETTE[i];
}
