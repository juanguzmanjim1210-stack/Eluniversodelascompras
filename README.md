# 🛍️ Catálogo Digital

Un catálogo en línea moderno con panel de administración integrado y seguro.

## ✨ Características

### Catálogo Público
- 📱 Diseño responsive (móvil, tablet, desktop)
- 🖼️ Galería de imágenes por producto (hasta 10)
- 🔍 Búsqueda en tiempo real
- 🏷️ Filtrado por categorías
- 📊 Variantes de productos (color, talla, precio, stock)
- 📋 Características personalizables
- 💬 Botón de WhatsApp para consultas
- 🔄 Actualización automática en tiempo real

### Panel de Administración
- 🔐 **Contraseña editable** — cámbiala cuando quieras desde el panel
- 🧾 **Pedidos** — estados, detalle, totales y resumen de ventas
- 📦 Gestión ilimitada de productos
- 🖼️ Hasta 10 imágenes por producto (URLs de imgbb.com)
- 🏷️ Gestión de categorías
- 🎨 Variantes de productos
- ⚙️ Características personalizables
- 🏪 Configuración de tienda (logo, portada, redes sociales)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/catalogo-digital.git
cd catalogo-digital
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env`:
```env
DATABASE_URL=postgresql://usuario:contraseña@host:5432/database
ADMIN_PASSWORD=tu-contraseña-inicial
JWT_SECRET=un-secreto-aleatorio-largo
```

### 4. Crear la base de datos
```bash
npx drizzle-kit push
```

### 5. Ejecutar
```bash
npm run dev     # Desarrollo
npm run build   # Producción
npm start
```

## 🔐 Sistema de Contraseñas

### Contraseña Inicial
La primera vez que accedas, usa la contraseña configurada en `ADMIN_PASSWORD` del archivo `.env`.

### Cambiar Contraseña
1. Accede al panel de admin (icono ⚙️)
2. Ve a la pestaña **🔐 Seguridad**
3. Ingresa tu contraseña actual
4. Escribe la nueva contraseña
5. Confirma y guarda

La nueva contraseña se guarda de forma **encriptada** en la base de datos.

## 📱 Cómo Usar

1. **Acceder al Admin**: Clic en ⚙️ (esquina superior derecha)
2. **Subir Imágenes**: Usa [imgbb.com](https://imgbb.com) y pega los enlaces
3. **Gestionar Productos**: Pestaña 📦 Productos
4. **Configurar Tienda**: Pestaña 🏪 Tienda

## 🔒 Seguridad

Todas las rutas que **modifican** datos exigen sesión de admin (cookie
`admin_session`, HttpOnly + SameSite=Lax + Secure en producción). Las de
**lectura** siguen públicas, porque el catálogo se muestra sin login.

| Ruta | Antes | Ahora |
|------|-------|-------|
| `POST /api/products` | pública | 🔒 admin |
| `PUT`/`DELETE /api/products/[id]` | pública | 🔒 admin |
| `PUT`/`DELETE .../images` | pública | 🔒 admin |
| `POST`/`DELETE .../features` | pública | 🔒 admin |
| `POST`/`DELETE .../variants` | pública | 🔒 admin |
| `POST`/`DELETE /api/categories` | pública | 🔒 admin |
| `PUT /api/store-settings` | pública | 🔒 admin |
| `POST .../variants/stock` (`setStock`) | pública | 🔒 admin |
| `POST .../variants/stock` (`quantity`) | pública | pública, con cantidad entera ≥ 1. El carrito ya no la usa: el descuento vive en `POST /api/orders` |
| `POST /api/auth/change-password` | pública | 🔒 admin + límite de intentos |

Además:

- **Límite de intentos**: 8 fallos cada 15 minutos por IP en `login`,
  `change-password` y `reset` → `429 Retry-After`.
- **`JWT_SECRET` obligatorio en producción**. Sin él, `login` responde `503`
  en lugar de firmar sesiones con un secreto conocido por todos.
- **`/api/auth/reset`** ya no acepta el secreto por defecto y compara con
  comparación constante (`timingSafeEqual`).
- **Stock**: `quantity` debe ser un entero entre 1 y 1000. Antes un valor
  negativo *sumaba* stock desde cualquier navegador sin sesión.

### Checkout en el servidor (resuelto)

El pedido ya **no** se arma desde el navegador. `POST /api/orders` recibe
solo qué quiere comprar; precios, stock y total se leen de la base de datos
dentro de una transacción:

- **Precio**: el total se calcula en el servidor con `base_price`/`price`
  reales. Cambiar un precio en la consola del navegador no cambia lo cobrado.
- **Stock**: cada línea se descuenta con una condición
  `stock >= cantidad` dentro de la misma transacción. Dos compradores a la
  vez no pueden llevarse la última unidad, y el inventario nunca baja de 0.
  Antes el navegador llamaba a `/variants/stock` línea por línea, sin
  transacción ni validación de precios.
- **Agotado**: si algo cambió mientras el cliente miraba el carrito, la API
  responde `409` con el motivo y el carrito se queda como estaba.
- **Pedido registrado**: cada compra guarda `orders` + `order_items` con un
  número correlativo (`#0001`), los datos de entrega y el precio congelado
  de cada línea.
- **Cancelación**: al marcar un pedido como *Cancelado* en el panel, las
  unidades vuelven al stock.
- **Límite**: 8 intentos por IP cada 15 minutos en `/api/orders`.

| Ruta | Acceso |
|------|--------|
| `POST /api/orders` | pública, con límite de intentos |
| `GET /api/orders` | 🔒 admin |
| `PATCH /api/orders/[id]` | 🔒 admin |

En el panel de administración hay una pestaña **🧾 Pedidos** con el estado
de cada compra (pendiente → preparando → enviado → entregado / cancelado),
el detalle de artículos, el total, el enlace de WhatsApp del cliente y un
resumen de pendientes y ventas.

## 🌐 Despliegue

### Vercel
1. Sube a GitHub
2. Conecta en [vercel.com](https://vercel.com)
3. Configura variables de entorno:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD` (contraseña inicial)
   - `JWT_SECRET`

### Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de PostgreSQL |
| `ADMIN_PASSWORD` | Contraseña inicial del admin |
| `JWT_SECRET` | Secreto para tokens (mínimo 32 caracteres) |

## 📦 Tecnologías

- Next.js 16, React 19, Tailwind CSS 4
- PostgreSQL + Drizzle ORM
- bcrypt (contraseñas encriptadas)
- JWT (sesiones seguras)

## 📄 Licencia

MIT

---

Hecho con ❤️ para emprendedores
