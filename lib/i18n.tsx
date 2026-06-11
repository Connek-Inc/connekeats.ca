"use client";
// i18n ligero (ES / EN / FR de Québec). Sin dependencias: contexto + diccionario
// + hook useT. La preferencia se guarda en localStorage y sincroniza <html lang>.
// El francés cubre el requisito de la Charte de la langue française (Bill 96):
// el menú QR del comensal y la factura deben poder mostrarse en francés.

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "es" | "en" | "fr";
export const LOCALES: { key: Locale; label: string }[] = [
  { key: "es", label: "ES" },
  { key: "en", label: "EN" },
  { key: "fr", label: "FR" },
];

const STORAGE_KEY = "connek_locale";

const ES: Record<string, string> = {
  "lang.es": "Español", "lang.en": "English", "lang.fr": "Français",
  "common.save": "Guardar", "common.close": "Cerrar", "common.loading": "Cargando…", "common.total": "Total", "common.add": "Agregar", "common.language": "Idioma",
  "nav.home": "Inicio", "nav.waiter": "Mesero", "nav.kitchen": "Cocina", "nav.setup": "Setup", "nav.signout": "Salir",
  "home.hello": "Hola", "home.business": "Negocio", "home.quickActions": "Acciones rápidas", "home.tables": "Mesas", "home.tablesSub": "Salón, pedidos y cobro", "home.clientView": "Vista cliente", "home.clientViewSub": "Ver el menú QR de una mesa", "home.openClientView": "abrir vista cliente", "home.noTables": "No hay mesas. Créalas en Setup.", "home.operation": "Operación", "home.salesToday": "Ventas hoy", "home.orders": "pedidos", "home.occupied": "ocupadas", "home.activeOrders": "Pedidos activos", "home.toCollect": "Por cobrar", "home.createBusiness": "Crear negocio", "home.firstBusinessTitle": "Crea tu primer negocio", "home.firstBusinessSub": "Elige modo bar o restaurante, agrega mesas y menú, y genera los QR.", "home.caja": "Caja & Reportes",
  "diner.here": "Estoy aquí", "diner.yourBill": "Tu cuenta", "diner.payNow": "Ir a pagar", "diner.billRequested": "Cuenta solicitada · el mesero va en camino para cobrarte.", "diner.orderReady": "¡Tu pedido está listo! 🎉", "diner.alcoholClosed": "Alcohol no disponible a esta hora.", "diner.printMenu": "Carta imprimible", "diner.ofTheDay": "Del día", "diner.noItems": "Este menú aún no tiene ítems.", "diner.noCatItems": "No hay ítems en esta categoría.", "diner.all": "Todo", "diner.sendOrder": "Enviar pedido", "diner.alsoLike": "También te puede gustar", "diner.noDescription": "Sin descripción.", "diner.seeMore": "ver más", "diner.seeLess": "ver menos", "diner.howWasIt": "¿Qué te pareció?", "diner.reviewPlaceholder": "Cuéntanos tu experiencia (opcional)", "diner.sendReview": "Enviar opinión", "diner.thanksReview": "¡Gracias por tu opinión!", "diner.cantOpen": "No se pudo abrir la mesa", "diner.cantOpenSub": "QR inválido", "diner.liftPhone": "Levanta el teléfono", "diner.waiterLocates": "El mesero te ubica por tu color", "diner.tapToClose": "Toca para cerrar",
  "toast.orderSent": "¡Pedido enviado a cocina!", "toast.waiterNotified": "Mesero avisado", "toast.billRequested": "Cuenta solicitada", "toast.couldNotSend": "No se pudo enviar",
  "inv.title": "Factura", "inv.print": "Imprimir / PDF", "inv.subtotal": "Subtotal", "inv.discount": "Descuento", "inv.tax": "Impuesto", "inv.tip": "Propina", "inv.total": "Total", "inv.folio": "Folio", "inv.date": "Fecha", "inv.qty": "Cant.", "inv.item": "Descripción", "inv.price": "Precio",
  // Presets del comensal (modo + término de menú) y accesos rápidos.
  "preset.bar.label": "Bar", "preset.restaurant.label": "Restaurante", "preset.bar.menu": "Carta", "preset.restaurant.menu": "Menú",
  "qa.ice": "Hielo", "qa.lime": "Limón", "qa.round": "Otra ronda", "qa.napkins": "Servilletas", "qa.bread": "Pan", "qa.waiter": "Mesero", "qa.bill": "La cuenta",
};

const EN: Record<string, string> = {
  "lang.es": "Español", "lang.en": "English", "lang.fr": "Français",
  "common.save": "Save", "common.close": "Close", "common.loading": "Loading…", "common.total": "Total", "common.add": "Add", "common.language": "Language",
  "nav.home": "Home", "nav.waiter": "Waiter", "nav.kitchen": "Kitchen", "nav.setup": "Setup", "nav.signout": "Sign out",
  "home.hello": "Hello", "home.business": "Business", "home.quickActions": "Quick actions", "home.tables": "Tables", "home.tablesSub": "Floor, orders and payment", "home.clientView": "Customer view", "home.clientViewSub": "View a table's QR menu", "home.openClientView": "open customer view", "home.noTables": "No tables. Create them in Setup.", "home.operation": "Operation", "home.salesToday": "Sales today", "home.orders": "orders", "home.occupied": "occupied", "home.activeOrders": "Active orders", "home.toCollect": "To collect", "home.createBusiness": "Create business", "home.firstBusinessTitle": "Create your first business", "home.firstBusinessSub": "Choose bar or restaurant mode, add tables and a menu, and generate the QR codes.", "home.caja": "Cash & Reports",
  "diner.here": "I'm here", "diner.yourBill": "Your bill", "diner.payNow": "Pay now", "diner.billRequested": "Bill requested · your server is on the way to collect.", "diner.orderReady": "Your order is ready! 🎉", "diner.alcoholClosed": "Alcohol not available at this time.", "diner.printMenu": "Printable menu", "diner.ofTheDay": "Of the day", "diner.noItems": "This menu has no items yet.", "diner.noCatItems": "No items in this category.", "diner.all": "All", "diner.sendOrder": "Send order", "diner.alsoLike": "You may also like", "diner.noDescription": "No description.", "diner.seeMore": "see more", "diner.seeLess": "see less", "diner.howWasIt": "How was it?", "diner.reviewPlaceholder": "Tell us about your experience (optional)", "diner.sendReview": "Send review", "diner.thanksReview": "Thanks for your review!", "diner.cantOpen": "Couldn't open the table", "diner.cantOpenSub": "Invalid QR", "diner.liftPhone": "Raise your phone", "diner.waiterLocates": "The server finds you by your color", "diner.tapToClose": "Tap to close",
  "toast.orderSent": "Order sent to the kitchen!", "toast.waiterNotified": "Server notified", "toast.billRequested": "Bill requested", "toast.couldNotSend": "Couldn't send",
  "inv.title": "Invoice", "inv.print": "Print / PDF", "inv.subtotal": "Subtotal", "inv.discount": "Discount", "inv.tax": "Tax", "inv.tip": "Tip", "inv.total": "Total", "inv.folio": "Folio", "inv.date": "Date", "inv.qty": "Qty", "inv.item": "Description", "inv.price": "Price",
  "preset.bar.label": "Bar", "preset.restaurant.label": "Restaurant", "preset.bar.menu": "Menu", "preset.restaurant.menu": "Menu",
  "qa.ice": "Ice", "qa.lime": "Lime", "qa.round": "Another round", "qa.napkins": "Napkins", "qa.bread": "Bread", "qa.waiter": "Waiter", "qa.bill": "The bill",
};

const FR: Record<string, string> = {
  "lang.es": "Español", "lang.en": "English", "lang.fr": "Français",
  "common.save": "Enregistrer", "common.close": "Fermer", "common.loading": "Chargement…", "common.total": "Total", "common.add": "Ajouter", "common.language": "Langue",
  "nav.home": "Accueil", "nav.waiter": "Serveur", "nav.kitchen": "Cuisine", "nav.setup": "Configuration", "nav.signout": "Déconnexion",
  "home.hello": "Bonjour", "home.business": "Entreprise", "home.quickActions": "Actions rapides", "home.tables": "Tables", "home.tablesSub": "Salle, commandes et paiement", "home.clientView": "Vue client", "home.clientViewSub": "Voir le menu QR d'une table", "home.openClientView": "ouvrir la vue client", "home.noTables": "Aucune table. Créez-les dans Configuration.", "home.operation": "Opérations", "home.salesToday": "Ventes du jour", "home.orders": "commandes", "home.occupied": "occupées", "home.activeOrders": "Commandes actives", "home.toCollect": "À encaisser", "home.createBusiness": "Créer une entreprise", "home.firstBusinessTitle": "Créez votre première entreprise", "home.firstBusinessSub": "Choisissez le mode bar ou restaurant, ajoutez des tables et un menu, puis générez les codes QR.", "home.caja": "Caisse et rapports",
  "diner.here": "Je suis ici", "diner.yourBill": "Votre addition", "diner.payNow": "Payer l'addition", "diner.billRequested": "Addition demandée · votre serveur arrive pour l'encaissement.", "diner.orderReady": "Votre commande est prête! 🎉", "diner.alcoholClosed": "Alcool non disponible à cette heure.", "diner.printMenu": "Menu imprimable", "diner.ofTheDay": "Du jour", "diner.noItems": "Ce menu n'a pas encore d'articles.", "diner.noCatItems": "Aucun article dans cette catégorie.", "diner.all": "Tout", "diner.sendOrder": "Envoyer la commande", "diner.alsoLike": "Vous aimerez aussi", "diner.noDescription": "Aucune description.", "diner.seeMore": "voir plus", "diner.seeLess": "voir moins", "diner.howWasIt": "Comment c'était?", "diner.reviewPlaceholder": "Parlez-nous de votre expérience (facultatif)", "diner.sendReview": "Envoyer l'avis", "diner.thanksReview": "Merci pour votre avis!", "diner.cantOpen": "Impossible d'ouvrir la table", "diner.cantOpenSub": "QR invalide", "diner.liftPhone": "Levez votre téléphone", "diner.waiterLocates": "Le serveur vous repère par votre couleur", "diner.tapToClose": "Touchez pour fermer",
  "toast.orderSent": "Commande envoyée à la cuisine!", "toast.waiterNotified": "Serveur avisé", "toast.billRequested": "Addition demandée", "toast.couldNotSend": "Échec de l'envoi",
  "inv.title": "Facture", "inv.print": "Imprimer / PDF", "inv.subtotal": "Sous-total", "inv.discount": "Rabais", "inv.tax": "Taxes", "inv.tip": "Pourboire", "inv.total": "Total", "inv.folio": "Folio", "inv.date": "Date", "inv.qty": "Qté", "inv.item": "Description", "inv.price": "Prix",
  "preset.bar.label": "Bar", "preset.restaurant.label": "Restaurant", "preset.bar.menu": "Carte", "preset.restaurant.menu": "Menu",
  "qa.ice": "Glace", "qa.lime": "Citron", "qa.round": "Une autre tournée", "qa.napkins": "Serviettes", "qa.bread": "Pain", "qa.waiter": "Serveur", "qa.bill": "L'addition",
};

const DICT: Record<Locale, Record<string, string>> = { es: ES, en: EN, fr: FR };

function detect(): Locale {
  if (typeof navigator !== "undefined") {
    const l = (navigator.language || "").slice(0, 2).toLowerCase();
    if (l === "fr") return "fr";
    if (l === "en") return "en";
  }
  return "es";
}

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLoc] = useState<Locale>("es");

  // Carga la preferencia (o detecta del navegador) tras montar, evitando mismatch de hidratación.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setLoc(saved && DICT[saved as Locale] ? (saved as Locale) : detect());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLoc(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx) ?? { locale: "es" as Locale, setLocale: () => {} };
}

// Hook de traducción. t("clave", { var }) interpola {var}.
export function useT() {
  const { locale } = useLocale();
  return (key: string, vars?: Record<string, string | number>) => {
    let s = DICT[locale]?.[key] ?? DICT.es[key] ?? key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
    return s;
  };
}
