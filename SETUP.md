# FinNavi Pro - Setup Guide

## 🔐 Security & Environment Configuration

Este proyecto ahora utiliza variables de entorno para todas las credenciales sensibles. **NUNCA** incluyas credenciales directamente en el código.

---

## 📋 Requisitos Previos

- Node.js 18+ y npm
- n8n instalado (`npm install -g n8n`)
- Cuenta de Supabase activa
- API Key de Google Gemini (opcional, para insights avanzados)
- ngrok (opcional, para túneles públicos)

---

## ⚙️ Configuración Inicial

### 1. Clonar y configurar variables de entorno

```bash
cd F:\FinNaviPro

# Copiar el archivo de ejemplo
copy .env.example .env.local

# Editar .env.local con tus credenciales reales
notepad .env.local
```

### 2. Configurar `.env.local`

Abre [.env.local](.env.local) y completa con tus credenciales:

```env
# Supabase (Frontend - Anon Key)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui

# Google Gemini AI
GEMINI_API_KEY=tu_gemini_api_key

# n8n Webhooks
VITE_N8N_WEBHOOK_URL=https://tu-ngrok-url.ngrok-free.dev/webhook
N8N_API_KEY=tu_n8n_api_key
N8N_BASE_URL=http://localhost:5678

# Supabase Service Role (n8n Backend - Admin)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Obtener Credenciales de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com/dashboard)
2. Settings → API
3. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Solo para backend/n8n)

### 4. Obtener API Key de n8n

```bash
# Iniciar n8n
n8n start

# Ir a: http://localhost:5678
# Settings → API → Create API Key
# Copiar el token generado → N8N_API_KEY
```

### 5. Configurar Variables de Entorno en n8n

Para que los workflows accedan a Supabase, configura variables en n8n:

**Opción A: Via UI**
1. Abre n8n: `http://localhost:5678`
2. Settings → Environments
3. Agrega:
   ```
   SUPABASE_URL=https://hmtuiccwkibnsspdypam.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_1rFD-kDfzZkOYsBVQYSgag_K7IMubYl
   ```

**Opción B: Via archivo .env en n8n**
```bash
# En el directorio de n8n (normalmente ~/.n8n/)
cd %USERPROFILE%\.n8n
notepad .env

# Agregar:
SUPABASE_URL=https://hmtuiccwkibnsspdypam.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_1rFD-kDfzZkOYsBVQYSgag_K7IMubYl
```

---

## 🚀 Iniciar el Proyecto

### Paso 1: Instalar dependencias

```bash
cd F:\FinNaviPro
npm install
```

### Paso 2: Iniciar n8n

```bash
# Opción A: Con CORS habilitado (para desarrollo)
start_n8n_cors.bat

# Opción B: Manual
n8n start
```

### Paso 3: Verificar workflows de n8n

Abre [http://localhost:5678](http://localhost:5678) y verifica que existan:

1. **FinNavi - Chat (Auto)** (ACTIVO)
2. **FinNavi - Sync (Auto)** (ACTIVO)

Si no existen, créalos desde la UI de n8n o usa:

```bash
python n8n_deployer.py
```

### Paso 4: Configurar túnel público (opcional para producción)

```bash
# Instalar ngrok
winget install ngrok

# Crear túnel a n8n
ngrok http 5678

# Copiar la URL generada (ej: https://abc123.ngrok-free.dev)
# Actualizar en .env.local:
# VITE_N8N_WEBHOOK_URL=https://abc123.ngrok-free.dev/webhook
```

### Paso 5: Iniciar la aplicación React

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 🔒 Seguridad y Buenas Prácticas

### ✅ QUÉ HACER

- ✅ Usar `VITE_SUPABASE_ANON_KEY` en el frontend (tiene permisos limitados)
- ✅ Usar `SUPABASE_SERVICE_ROLE_KEY` SOLO en n8n/backend
- ✅ Mantener `.env.local` en `.gitignore`
- ✅ Usar Row Level Security (RLS) en Supabase
- ✅ Validar `userId` en n8n workflows antes de consultar DB

### ❌ QUÉ NO HACER

- ❌ NUNCA commitear `.env.local` a Git
- ❌ NUNCA exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend
- ❌ NUNCA usar credenciales hardcodeadas en código
- ❌ NUNCA compartir API keys en repositorios públicos

---

## 🗄️ Estructura de Base de Datos (Supabase)

### Tabla: `debts`

```sql
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  apr DECIMAL(5,2),
  min_payment DECIMAL(10,2),
  monthly_payment DECIMAL(10,2),
  payment_type TEXT,
  total_months INTEGER,
  total_interest DECIMAL(10,2),
  cut_off_day INTEGER,
  payment_due_day INTEGER,
  months_paid INTEGER DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Row Level Security
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);
```

### Tabla: `payments`

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔄 Workflows de n8n

### Workflow 1: FinNavi - Chat (Auto)

**Endpoint:** `POST /webhook/chat`

**Flujo:**
1. Webhook recibe `{ message, userId }`
2. Consulta Supabase: `SELECT * FROM debts WHERE user_id = userId`
3. Envía datos + mensaje al AI Agent (OpenAI GPT)
4. Responde con consejo financiero personalizado

**Configuración:**
- ✅ Usa `$env.SUPABASE_URL` y `$env.SUPABASE_SERVICE_ROLE_KEY`
- ✅ Filtra por `user_id` para seguridad
- ✅ Retry automático (3 intentos)
- ✅ Manejo de errores con `onError: continueRegularOutput`

### Workflow 2: FinNavi - Sync (Auto)

**Endpoint:** `GET /webhook/sync`

**Flujo:**
1. Webhook recibe request
2. Code node genera datos mock de usuario
3. Responde con estructura JSON

**Nota:** Este workflow actualmente usa datos mock. En producción, debería consultar Supabase.

---

## 🧪 Probar la Integración

### Test 1: Verificar variables de entorno

```bash
# En la consola del navegador (DevTools)
console.log(import.meta.env.VITE_SUPABASE_URL)
# Debe mostrar: https://hmtuiccwkibnsspdypam.supabase.co
```

### Test 2: Probar autenticación Supabase

1. Ir a [Login](http://localhost:3000/login)
2. Crear cuenta o iniciar sesión
3. Verificar que el Dashboard cargue tus deudas

### Test 3: Probar chat con n8n

1. Ir a [Advisor](http://localhost:3000/advisor)
2. Enviar mensaje: "¿Cuál es mi deuda total?"
3. El AI debe responder con datos reales de Supabase

### Test 4: Verificar query de Supabase en n8n

```bash
# En n8n, ejecutar manualmente el workflow "FinNavi - Chat (Auto)"
# Verificar el HTTP Request node que consulta Supabase
# Debe incluir: ?user_id=eq.UUID_DEL_USUARIO
```

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"

**Solución:**
```bash
# Verificar que .env.local existe
dir .env.local

# Verificar que las variables están configuradas
type .env.local

# Reiniciar el servidor de desarrollo
npm run dev
```

### Error: "n8n connection failed"

**Solución:**
```bash
# Verificar que n8n está corriendo
curl http://localhost:5678/healthz

# Verificar webhook URL
echo %VITE_N8N_WEBHOOK_URL%

# Verificar workflows activos en n8n UI
```

### Error: "Supabase query returns empty"

**Solución:**
- Verificar que el `userId` se está enviando correctamente desde el frontend
- Verificar en n8n que la query incluye `?user_id=eq.UUID`
- Verificar RLS policies en Supabase
- Usar Supabase SQL Editor para probar query manualmente:

```sql
SELECT * FROM debts WHERE user_id = 'tu-user-id-aqui';
```

### n8n no puede leer variables de entorno

**Solución:**
```bash
# Reiniciar n8n después de agregar variables
taskkill /F /IM n8n.exe
n8n start

# Verificar en n8n workflow:
# Agregar Code node temporal:
# return [{ json: { url: $env.SUPABASE_URL } }];
```

---

## 📚 Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)

---

## 🔐 Variables de Entorno - Resumen

| Variable | Uso | Ubicación | Tipo |
|----------|-----|-----------|------|
| `VITE_SUPABASE_URL` | URL de Supabase | Frontend (.env.local) | Público |
| `VITE_SUPABASE_ANON_KEY` | Auth pública | Frontend (.env.local) | Público |
| `VITE_N8N_WEBHOOK_URL` | URL webhooks n8n | Frontend (.env.local) | Público |
| `GEMINI_API_KEY` | Google AI | Frontend (.env.local) | Privado |
| `N8N_API_KEY` | n8n REST API | Backend (scripts) | Privado |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB | n8n workflows | **MUY PRIVADO** |

---

## ✅ Checklist de Configuración

- [ ] `.env.local` creado con todas las variables
- [ ] Credenciales de Supabase configuradas
- [ ] n8n iniciado y accesible en localhost:5678
- [ ] Variables de entorno configuradas en n8n
- [ ] Workflows activos en n8n
- [ ] Frontend corriendo en localhost:3000
- [ ] Autenticación funcional
- [ ] Chat con AI respondiendo con datos reales
- [ ] `.env.local` en `.gitignore`

---

¡Listo! Tu aplicación FinNavi Pro está configurada de forma segura. 🚀
