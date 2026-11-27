"use client";
import { useEffect, useState, type CSSProperties } from "react";
import FitText from "./FitText";
import Photo from "./Photo";
import { THUMB_WIDTHS } from "@/lib/img";
import { ArrowLeft, CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from "./Icons";
import type { CartItem, CustomerData } from "@/lib/types";

interface CartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  storeWhatsapp: string | null;
  storeName: string;
  currency: string;
  primaryColor: string;
  onOrderSent?: () => void;
}

export default function Cart({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  storeWhatsapp,
  storeName,
  currency,
  primaryColor,
  onOrderSent,
}: CartProps) {
  const fmt = (v: number) => `${currency}${Math.round(v).toLocaleString("es-CO")}`;
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    fullName: "",
    whatsapp: "",
    city: "",
    department: "",
    address: "",
  });
  const [sending, setSending] = useState(false);

  const total = items.reduce((sum, item) => {
    const price = item.variant && parseFloat(item.variant.price) > 0 ? parseFloat(item.variant.price) : parseFloat(item.product.basePrice);
    return sum + price * item.quantity;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSendOrder = async () => {
    if (!storeWhatsapp) { alert("La tienda no tiene WhatsApp configurado"); return; }
    setSending(true);

    // Se abre la ventana aquí mismo, dentro del clic y antes de cualquier
    // `await`. Más abajo hay varias peticiones en cadena; si `window.open`
    // se llamara después, el navegador lo trataría como un popup sin origen
    // y lo bloquearía silenciosamente, y el pedido nunca llegaría a WhatsApp.
    const waWindow = window.open("", "_blank");
    if (waWindow) waWindow.document.title = "Abriendo WhatsApp...";

    // Descontar stock de variantes
    for (const item of items) {
      if (item.variant) {
        try {
          await fetch(`/api/products/${item.product.id}/variants/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: item.variant.id, quantity: item.quantity }),
          });
        } catch { /* continue */ }
      }
    }

    let message = `🛒 *NUEVO PEDIDO - ${storeName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `👤 *DATOS DEL CLIENTE*\n`;
    message += `*• Nombre: ${customerData.fullName}*\n`;
    message += `*• WhatsApp: ${customerData.whatsapp}*\n`;
    message += `*• Ciudad: ${customerData.city}*\n`;
    message += `*• Departamento: ${customerData.department}*\n`;
    message += `*• Dirección: ${customerData.address}*\n\n`;
    message += `📦 *PRODUCTOS*\n━━━━━━━━━━━━━━━━━━━━━\n`;

    items.forEach((item, index) => {
      message += `\n${index + 1}. *${item.product.name}*\n`;
      if (item.variant) {
        if (item.variant.color) message += `   Color: ${item.variant.color}\n`;
        if (item.variant.size) message += `   Talla: ${item.variant.size}\n`;
      }
      message += `   Cantidad: ${item.quantity}\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL: ${fmt(total)}*\n\n`;
    message += `📅 Fecha: ${new Date().toLocaleString("es-MX")}\n`;

    const waUrl = storeWhatsapp.startsWith("http") ? storeWhatsapp.split("?")[0] : `https://wa.me/${storeWhatsapp.replace(/\D/g, "")}`;
    const target = `${waUrl}?text=${encodeURIComponent(message)}`;
    if (waWindow && !waWindow.closed) {
      // Reutiliza la ventana abierta al empezar: ya tiene permiso del navegador.
      waWindow.location.href = target;
      waWindow.focus();
    } else {
      // Si el navegador la cerró, se intenta abrir de todas formas.
      window.open(target, "_blank");
    }

    setSending(false);
    onClearCart();
    setShowCheckout(false);
    setCustomerData({ fullName: "", whatsapp: "", city: "", department: "", address: "" });
    onClose();
    if (onOrderSent) onOrderSent();
  };

  const isFormValid = customerData.fullName.trim() !== "" && customerData.whatsapp.trim() !== "" && customerData.city.trim() !== "" && customerData.department.trim() !== "" && customerData.address.trim() !== "";

  // Esc cierra el carrito.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div className="modal-backdrop absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />

      <aside className="animate-slide-in relative ml-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:rounded-l-[2rem]">
        {/* Encabezado */}
        <header className="cart-head shrink-0 px-5 pb-5 pt-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                <CartIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold leading-tight">{showCheckout ? "Datos de entrega" : "Mi carrito"}</h2>
                <p className="text-xs font-medium text-white/80">
                  {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar carrito" className="btn btn-glass h-10 w-10 shrink-0 rounded-full">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          {items.length > 0 && (
            <div className="mt-4 flex gap-2" aria-hidden="true">
              <span className="h-1.5 flex-1 rounded-full bg-white" />
              <span className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${showCheckout ? "bg-white" : "bg-white/30"}`} />
            </div>
          )}
        </header>

        {/* Contenido */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-slate-100 text-slate-300">
                <CartIcon className="h-11 w-11" />
              </span>
              <p className="mt-5 text-lg font-extrabold text-slate-800">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-slate-500">Agrega productos para hacer tu pedido</p>
              <button type="button" onClick={onClose} className="btn btn-brand btn-shine mt-6 rounded-xl px-6 py-3 text-sm font-bold">
                Ver productos
              </button>
            </div>
          ) : showCheckout ? (
            <div className="space-y-4 p-4 sm:p-5">
              <button type="button" onClick={() => setShowCheckout(false)} className="btn -ml-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> Volver al carrito
              </button>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900">📋 Completa tus datos</h3>
                <p className="mt-0.5 text-xs text-slate-500">Para enviar tu pedido por WhatsApp</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-xs font-bold text-slate-600">Nombre completo *</label>
                  <input id="c-name" type="text" autoComplete="name" value={customerData.fullName} onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })} placeholder="Tu nombre completo" className="field" />
                </div>
                <div>
                  <label htmlFor="c-phone" className="mb-1.5 block text-xs font-bold text-slate-600">Número de WhatsApp *</label>
                  <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" value={customerData.whatsapp} onChange={(e) => setCustomerData({ ...customerData, whatsapp: e.target.value })} placeholder="Ej: 3001234567" className="field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="c-city" className="mb-1.5 block text-xs font-bold text-slate-600">Ciudad *</label>
                    <input id="c-city" type="text" autoComplete="address-level2" value={customerData.city} onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })} placeholder="Ciudad" className="field" />
                  </div>
                  <div>
                    <label htmlFor="c-dept" className="mb-1.5 block text-xs font-bold text-slate-600">Departamento *</label>
                    <input id="c-dept" type="text" autoComplete="address-level1" value={customerData.department} onChange={(e) => setCustomerData({ ...customerData, department: e.target.value })} placeholder="Depto." className="field" />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-addr" className="mb-1.5 block text-xs font-bold text-slate-600">Dirección de entrega *</label>
                  <textarea id="c-addr" autoComplete="street-address" value={customerData.address} onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })} placeholder="Dirección completa" rows={2} className="field resize-none" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h4 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Resumen</h4>
                <div className="space-y-1.5 text-sm">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <span className="truncate text-slate-600">
                        {item.quantity}x {item.product.name.trim()}
                        {item.variant?.color && ` (${item.variant.color})`}
                        {item.variant?.size && ` - ${item.variant.size}`}
                      </span>
                      <span className="shrink-0 font-bold text-slate-800">
                        {fmt((item.variant && parseFloat(item.variant.price) > 0 ? parseFloat(item.variant.price) : parseFloat(item.product.basePrice)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-base font-extrabold">
                  <span>Total</span>
                  <span className="text-brand">{fmt(total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <ul className="space-y-3 p-4 sm:p-5">
              {items.map((item, index) => {
                const price = item.variant && parseFloat(item.variant.price) > 0 ? parseFloat(item.variant.price) : parseFloat(item.product.basePrice);
                return (
                  <li
                    key={`${item.product.id}-${item.variant?.id ?? "base"}`}
                    className="card-enter flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
                    style={{ "--i": Math.min(index, 8) } as CSSProperties}
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {item.product.images[0] ? (
                        <Photo src={item.product.images[0].url} sizes="80px" widths={THUMB_WIDTHS} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300"><CartIcon className="h-6 w-6" /></div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <FitText as="h4" text={item.product.name.trim()} min={12} max={15} lines={2} className="font-bold text-slate-900" />
                      {item.variant && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.variant.color && <span className="mr-2">{item.variant.color}</span>}
                          {item.variant.size && <span>Talla: {item.variant.size}</span>}
                        </p>
                      )}
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
                          <button type="button" aria-label="Quitar una unidad" onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))} className="btn btn-ghost h-7 w-7 rounded-lg">
                            <MinusIcon className="h-3.5 w-3.5" />
                          </button>
                          <span key={item.quantity} className="num-pop w-8 text-center text-sm font-extrabold tabular-nums">{item.quantity}</span>
                          <button type="button" aria-label="Agregar una unidad" onClick={() => onUpdateQuantity(index, item.quantity + 1)} className="btn btn-ghost h-7 w-7 rounded-lg">
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span key={price * item.quantity} className="num-pop ml-auto text-base font-extrabold text-brand">{fmt(price * item.quantity)}</span>
                        <button type="button" aria-label="Eliminar del carrito" onClick={() => onRemoveItem(index)} className="btn h-8 w-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie con total y acciones */}
        {items.length > 0 && (
          <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <div className="flex items-end justify-between">
              <span className="text-sm font-semibold text-slate-500">Total</span>
              <span key={total} className="num-pop text-3xl font-extrabold tracking-tight text-brand">{fmt(total)}</span>
            </div>

            {showCheckout && !storeWhatsapp && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">La tienda no tiene WhatsApp configurado.</p>
            )}

            {showCheckout ? (
              <button
                type="button"
                onClick={handleSendOrder}
                disabled={!isFormValid || sending || !storeWhatsapp}
                className="btn btn-brand btn-shine w-full rounded-2xl py-3.5 text-base font-bold disabled:opacity-50 disabled:shadow-none"
              >
                {sending ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Enviando...
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="btn-icon h-5 w-5" /> Enviar pedido por WhatsApp
                  </>
                )}
              </button>
            ) : (
              <button type="button" onClick={() => setShowCheckout(true)} className="btn btn-brand btn-shine btn-pulse w-full rounded-2xl py-3.5 text-base font-bold">
                Continuar con el pedido <span className="btn-nudge" aria-hidden="true">→</span>
              </button>
            )}

            {!showCheckout && (
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn btn-ghost flex-1 rounded-xl py-2.5 text-sm font-bold">
                  <ArrowLeft className="h-4 w-4" /> Seguir comprando
                </button>
                <button type="button" onClick={onClearCart} className="btn rounded-xl px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50">
                  Vaciar
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
