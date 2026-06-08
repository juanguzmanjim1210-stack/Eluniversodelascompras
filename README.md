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
