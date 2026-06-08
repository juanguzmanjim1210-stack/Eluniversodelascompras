"use client";
import { useState } from "react";
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
  const fmt = (v: number) => `${currency}${v.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
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

    // Descontar stock
    for (const item of items) {
      try {
        if (item.variant) {
          // Descontar stock de la variante
          await fetch(`/api/products/${item.product.id}/variants/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: item.variant.id, quantity: item.quantity }),
          });
        } else {
          // Descontar stock del producto directamente
          await fetch(`/api/products/${item.product.id}/variants/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: item.quantity }),
          });
        }
      } catch { /* continue */ }
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
    window.open(`${waUrl}?text=${encodeURIComponent(message)}`, "_blank");

    setSending(false);
    onClearCart();
    setShowCheckout(false);
    setCustomerData({ fullName: "", whatsapp: "", city: "", department: "", address: "" });
    onClose();
    if (onOrderSent) onOrderSent();
  };

  const isFormValid = customerData.fullName.trim() !== "" && customerData.whatsapp.trim() !== "" && customerData.city.trim() !== "" && customerData.department.trim() !== "" && customerData.address.trim() !== "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in">
        {/* Header */}
        <div style={{ backgroundColor: primaryColor }} className="text-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🛒</span>
            <div>
              <span className="font-bold text-sm sm:text-base">Mi Carrito</span>
              <span className="ml-1.5 text-green-100 text-xs sm:text-sm">({itemCount})</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-green-700 flex items-center justify-center transition text-sm">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <span className="text-5xl mb-3">🛒</span>
              <p className="text-base font-medium">Tu carrito está vacío</p>
              <p className="text-xs mt-1">Agrega productos para hacer tu pedido</p>
            </div>
          ) : showCheckout ? (
            <div className="p-3 sm:p-4 space-y-3">
              <button onClick={() => setShowCheckout(false)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">← Volver al carrito</button>

              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <h3 className="font-bold text-green-800 text-sm mb-0.5">📋 Completa tus datos</h3>
                <p className="text-xs text-green-600">Para enviar tu pedido por WhatsApp</p>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input type="text" value={customerData.fullName} onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })} placeholder="Tu nombre completo" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número de WhatsApp *</label>
                  <input type="tel" value={customerData.whatsapp} onChange={(e) => setCustomerData({ ...customerData, whatsapp: e.target.value })} placeholder="Ej: 3001234567" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad *</label>
                    <input type="text" value={customerData.city} onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })} placeholder="Ciudad" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Departamento *</label>
                    <input type="text" value={customerData.department} onChange={(e) => setCustomerData({ ...customerData, department: e.target.value })} placeholder="Depto." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dirección de Entrega *</label>
                  <textarea value={customerData.address} onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })} placeholder="Dirección completa" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <h4 className="font-semibold text-xs text-gray-700 mb-1.5">Resumen</h4>
                <div className="space-y-1 text-xs">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="text-gray-600 truncate">
                        {item.quantity}x {item.product.name}
                        {item.variant?.color && ` (${item.variant.color})`}
                        {item.variant?.size && ` - ${item.variant.size}`}
                      </span>
                      <span className="font-medium flex-shrink-0">
                        {fmt((item.variant && parseFloat(item.variant.price) > 0 ? parseFloat(item.variant.price) : parseFloat(item.product.basePrice)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                  <span>Total</span>
                   <span style={{ color: primaryColor }}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-2">
              {items.map((item, index) => {
                const price = item.variant && parseFloat(item.variant.price) > 0 ? parseFloat(item.variant.price) : parseFloat(item.product.basePrice);
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-2.5 flex gap-2.5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {item.product.images[0] ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">📷</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-1">{item.product.name}</h4>
                      {item.variant && (
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {item.variant.color && <span className="mr-1.5">{item.variant.color}</span>}
                          {item.variant.size && <span>Talla: {item.variant.size}</span>}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm font-bold mt-0.5" style={{ color: primaryColor }}>{fmt(price * item.quantity)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold">-</button>
                        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(index, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold">+</button>
                        <button onClick={() => onRemoveItem(index)} className="ml-auto text-red-500 text-[10px] sm:text-xs hover:bg-red-50 px-1.5 py-0.5 rounded">Eliminar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-3 sm:p-4 bg-white flex-shrink-0 space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Total:</span>
              <span className="text-xl sm:text-2xl font-bold" style={{ color: primaryColor }}>{fmt(total)}</span>
            </div>
            {showCheckout ? (
              <button onClick={handleSendOrder} disabled={!isFormValid || sending || !storeWhatsapp} style={{ backgroundColor: primaryColor }} className="w-full text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base">
                {sending ? "Enviando..." : <><WhatsAppIcon /> Enviar Pedido por WhatsApp</>}
              </button>
            ) : (
              <button onClick={() => setShowCheckout(true)} style={{ backgroundColor: primaryColor }} className="w-full text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm sm:text-base">
                Continuar con el Pedido →
              </button>
            )}
            {!showCheckout && <button onClick={onClearCart} className="w-full text-red-500 text-xs hover:bg-red-50 py-1.5 rounded-lg transition">Vaciar carrito</button>}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

function WhatsAppIcon() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
}
