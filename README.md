<div align="center">

<img src="https://img.shields.io/badge/LifeLineX-Emergency%20Healthcare%20Platform-red?style=for-the-badge&logo=heart&logoColor=white" alt="LifeLineX Banner" />

<h1>🚑 LifeLineX</h1>
<h3><em>AI-Powered Real-Time Emergency Healthcare & Resource Dispatch Platform</em></h3>

<p>
  <a href="https://github.com/RAGUL-TR07/LifeLinex/stargazers"><img src="https://img.shields.io/github/stars/RAGUL-TR07/LifeLinex?style=flat-square&color=FFD700" alt="Stars" /></a>
  <a href="https://github.com/RAGUL-TR07/LifeLinex/network/members"><img src="https://img.shields.io/github/forks/RAGUL-TR07/LifeLinex?style=flat-square&color=0ea5e9" alt="Forks" /></a>
  <a href="https://github.com/RAGUL-TR07/LifeLinex/issues"><img src="https://img.shields.io/github/issues/RAGUL-TR07/LifeLinex?style=flat-square&color=ef4444" alt="Issues" /></a>
  <img src="https://img.shields.io/badge/Node.js-Express%205-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

<p>
  <b>LifeLineX</b> connects patients, volunteers, blood donors, hospitals, ambulance providers, and NGOs into one unified emergency-response ecosystem — powered by real-time websockets, AI-assisted dispatch, and a multi-role portal architecture.
</p>

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🧩 Portal Modules](#-portal-modules)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [📡 API Reference](#-api-reference)
- [🔌 WebSocket Events](#-websocket-events)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

| Category | Capability |
|---|---|
| 🚨 **Emergency SOS** | One-tap SOS dispatch with real-time GPS tracking and ambulance routing |
| 🩸 **Blood Donation** | AI-powered blood type matching between donors and recipients |
| 🏥 **Hospital Management** | Live bed availability, ICU tracking, and inventory control |
| 🚑 **Ambulance Dispatch** | Fleet tracking, ETA estimation, and RapidCare booking system |
| 💊 **Medicine & Equipment** | Request, donate, and track medical supplies and equipment |
| 💳 **Medical Crowdfunding** | Campaign creation with Razorpay payment gateway integration |
| 🤝 **Volunteer Network** | NGO-managed volunteer coordination with task assignment workflows |
| 👨‍💼 **Admin Dashboard** | Verification queues, analytics, activity logs, and full platform oversight |
| 🔐 **Multi-Role Auth** | JWT + Google OAuth 2.0 with role-based access control (RBAC) |
| 🌐 **Multi-language** | English & Tamil UI support via i18n |
| 📧 **Notifications** | In-app + email (SMTP/Nodemailer) + Firebase Cloud Messaging (FCM) push alerts |
| 📊 **Analytics** | Real-time charts (Recharts) for platform usage and emergency trends |

---

## 🏗️ Architecture

> See the full interactive diagram in [`ARCHITECTURE.md`](./ARCHITECTURE.md)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         👥 User Roles                               │
│     Patients  │  Volunteers/Donors  │  Hospitals  │  Admins         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│              💻 Frontend (React 19 + TanStack Start)                │
│          SSR · TanStack Router · Tailwind CSS · Recharts            │
│                   Socket.IO Client (Real-time)                      │
└─────────────┬───────────────────────────────────┬───────────────────┘
              │  REST API (HTTP)                   │  WebSocket
┌─────────────▼───────────────────────────────────▼───────────────────┐
│              ⚡ Backend (Express 5 + Socket.IO)                     │
│   Auth · SOS · Blood · Hospital · Ambulance · Volunteer · Admin     │
│         Campaign · Medicine · Equipment · Analytics · Chat          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│              🗄️ Data & External Services                            │
│  MongoDB Atlas (Mongoose ODM) │ Razorpay │ Cloudinary               │
│  Nodemailer (SMTP) │ Google OAuth 2.0 │ Firebase FCM │ Gemini AI    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Portal Modules

LifeLineX supports **9 distinct role-based portals**, each with tailored dashboards:

| Portal | Role | Key Capabilities |
|---|---|---|
| 🏠 **User / Patient** | Individual | SOS trigger, blood request, volunteer tasks, medicine request, fundraising |
| 🏥 **Hospital** | Organization | Bed management, emergency intake, inventory, staff coordination |
| 🩸 **Blood Bank** | Organization | Donor registry, blood stock, request fulfillment |
| 🚑 **Ambulance Provider** | Organization | Fleet management, dispatch, real-time GPS tracking |
| 💊 **NGO / Non-Profit** | Organization | Volunteer dispatch, medicine donation, community outreach |
| 💳 **Fundraising** | All | Campaign creation, donation tracking, Razorpay checkout |
| 👨‍💼 **Admin** | Super Admin | Platform verification, analytics, user management, global logs |
| 👤 **Profile** | All | Role-specific settings, emergency contacts, medical records |
| 🌍 **Community** | All | Chat rooms, public volunteer listings |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with concurrent features |
| **TanStack Start** | Full-stack SSR framework |
| **TanStack Router** | File-based type-safe routing |
| **Tailwind CSS** | Utility-first styling |
| **Recharts** | Data visualization & analytics charts |
| **Socket.IO Client** | Real-time bi-directional communication |
| **TypeScript** | Strict type safety throughout |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API gateway |
| **Socket.IO** | WebSocket server for live dispatch |
| **MongoDB Atlas + Mongoose** | Document database with ODM |
| **Passport.js** | Authentication strategies |
| **JWT** | Access & refresh token auth |
| **Helmet + Rate Limiter** | Security hardening |
| **Swagger (OpenAPI 3.0)** | Auto-generated API documentation |
| **Winston + Morgan** | Structured logging |
| **Jest** | Unit & integration testing |

### External Services
| Service | Purpose |
|---|---|
| **Google OAuth 2.0** | Social sign-in |
| **Razorpay** | Payment gateway for crowdfunding |
| **Cloudinary** | Document & image CDN |
| **Nodemailer (SMTP/Gmail)** | Email alerts & OTP delivery |
| **Firebase FCM** | Push notifications |
| **Google Gemini AI** | AI-assisted emergency triage |
| **Twilio** | SMS / OTP delivery |

---

## 📁 Project Structure

```
LifeLineX/
├── 📄 README.md
├── 📄 ARCHITECTURE.md
├── 🖼️ architecture_diagram.png
│
├── 🖥️ frontend/                    # React 19 + TanStack Start App
│   ├── src/
│   │   ├── routes/                 # File-based page routes
│   │   │   ├── index.tsx           # Landing / Home page
│   │   │   ├── login.tsx           # Unified login portal
│   │   │   ├── profile.tsx         # Role-specific profile dashboard
│   │   │   ├── emergency.tsx       # Emergency SOS & tracking
│   │   │   ├── blood.tsx           # Blood donation portal
│   │   │   ├── hospitals.tsx       # Hospital management portal
│   │   │   ├── ambulance.tsx       # Ambulance dispatch portal
│   │   │   ├── volunteer.tsx       # Volunteer coordination
│   │   │   ├── medicine.tsx        # Medicine & equipment portal
│   │   │   ├── fundraising.tsx     # Medical crowdfunding
│   │   │   ├── community.tsx       # Community & chat
│   │   │   ├── admin.index.tsx     # Admin dashboard
│   │   │   └── verify.tsx          # Email verification
│   │   ├── components/             # Reusable UI components
│   │   ├── context/                # React context providers
│   │   ├── hooks/                  # Custom React hooks
│   │   └── lib/                   # Utilities, i18n, API clients
│   ├── public/                     # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── ⚙️ backend/                     # Express 5 + Socket.IO API
│   ├── src/
│   │   ├── app.ts                  # Express app setup & middleware
│   │   ├── server.ts               # HTTP + Socket.IO server entry
│   │   ├── config/                 # Environment config & Passport
│   │   ├── controllers/            # Request/response handlers (thin layer)
│   │   ├── services/               # Core business logic
│   │   ├── models/                 # Mongoose schemas (19 models)
│   │   │   ├── User.ts
│   │   │   ├── Emergency.ts
│   │   │   ├── BloodRequest.ts / BloodDonation.ts
│   │   │   ├── Ambulance.ts / AmbulanceBooking.ts
│   │   │   ├── FundraisingCampaign.ts
│   │   │   ├── Organization.ts
│   │   │   ├── MedicalRecord.ts / MedicalEquipment.ts
│   │   │   ├── MedicineDonation.ts
│   │   │   ├── GovernmentScheme.ts
│   │   │   ├── ChatRoom.ts / Message.ts
│   │   │   ├── Notification.ts
│   │   │   ├── Transaction.ts
│   │   │   ├── ActivityLog.ts
│   │   │   └── OTP.ts / RefreshToken.ts
│   │   ├── routes/                 # 17 API route modules
│   │   ├── middlewares/            # Auth, error handling, validation
│   │   ├── repositories/           # Data access layer
│   │   ├── socket/                 # Socket.IO event handlers
│   │   ├── jobs/                   # Background scheduled jobs
│   │   ├── validators/             # Request validation schemas
│   │   ├── utils/                  # Logger, helpers, formatters
│   │   ├── constants/              # Shared constants
│   │   └── tests/                  # Jest test suites
│   ├── .env.example                # Environment variable template
│   ├── package.json
│   └── tsconfig.json
│
└── package.json                    # Root workspace config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **Bun** for the frontend)
- **MongoDB Atlas** account (or local MongoDB)
- A configured `.env` file for the backend (see [Environment Variables](#️-environment-variables))

### 1. Clone the Repository

```bash
git clone https://github.com/RAGUL-TR07/LifeLinex.git
cd LifeLinex
```

### 2. Setup the Backend

```bash
cd backend
npm install

# Copy the example env file and fill in your values
cp .env.example .env

# Run in development mode
npm run dev
```

The API will start at **`http://localhost:5000`**
Swagger docs available at **`http://localhost:5000/api-docs`**

### 3. Setup the Frontend

```bash
cd frontend
npm install   # or: bun install

# Run the dev server
npm run dev   # or: bun run dev
```

The app will be available at **`http://localhost:5173`**

### 4. (Optional) Install Root Workspace

```bash
# From the project root
npm install
```

---

## ⚙️ Environment Variables

Create a `backend/.env` file based on `backend/.env.example`. All required variables are listed below:

```env
# ── Server ────────────────────────────────────────────
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:5173

# ── Database ──────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# ── JWT ───────────────────────────────────────────────
JWT_ACCESS_SECRET=<your_access_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_ACCESS_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d

# ── Google OAuth ──────────────────────────────────────
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# ── Email (SMTP) ──────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<your_app_password>
EMAIL_FROM=LifeLineX <your_email>

# ── Cloudinary ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>

# ── Razorpay ──────────────────────────────────────────
RAZORPAY_KEY_ID=<key_id>
RAZORPAY_KEY_SECRET=<key_secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>

# ── Gemini AI ─────────────────────────────────────────
GEMINI_API_KEY=<your_gemini_api_key>

# ── Firebase (FCM) ────────────────────────────────────
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ── Twilio (SMS/OTP) ──────────────────────────────────
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<auth_token>
TWILIO_PHONE_NUMBER=<phone>

# ── Rate Limiting ─────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ── Security ──────────────────────────────────────────
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=<your_session_secret>
COOKIE_DOMAIN=localhost
```

> ⚠️ **Never commit your real `.env` file.** It is already listed in `.gitignore`.

---

## 📡 API Reference

The full API is documented via **Swagger UI** at `http://localhost:5000/api-docs` when running locally.

| Module | Base Route | Description |
|---|---|---|
| Auth | `POST /api/v1/auth/login` | Login for all user roles |
| Auth | `POST /api/v1/auth/admin/login` | Admin-only login |
| Auth | `POST /api/v1/auth/register/individual` | Register individual user |
| Auth | `POST /api/v1/auth/register/organization` | Register organization |
| Users | `/api/v1/users` | User profile & management |
| Emergencies | `/api/v1/emergencies` | SOS dispatch & tracking |
| Blood | `/api/v1/blood` | Blood requests & donations |
| Hospitals | `/api/v1/hospitals` | Hospital info & bed management |
| Ambulances | `/api/v1/ambulances` | Fleet dispatch & booking |
| Campaigns | `/api/v1/campaigns` | Medical crowdfunding |
| Medicines | `/api/v1/medicines` | Medicine requests & donations |
| Equipment | `/api/v1/equipment` | Medical equipment management |
| Volunteers | `/api/v1/volunteers` | Volunteer tasks & coordination |
| Admin | `/api/v1/admin` | Platform administration |
| Analytics | `/api/v1/analytics` | Usage analytics & reports |
| Notifications | `/api/v1/notifications` | In-app notifications |
| Chat | `/api/v1/chat` | Community chat rooms |
| Payments | `/api/v1/payments` | Razorpay payment processing |

---

## 🔌 WebSocket Events

Socket.IO powers real-time features across the platform:

| Event | Direction | Description |
|---|---|---|
| `emergency:created` | Server → Client | New SOS request broadcast |
| `emergency:updated` | Server → Client | Emergency status change |
| `ambulance:location_update` | Client → Server | Driver GPS position update |
| `ambulance:eta_update` | Server → Client | Updated ETA for patient |
| `blood:request_created` | Server → Client | New blood request alert |
| `chat:message` | Bi-directional | Real-time community chat |
| `chat:typing` | Client → Server | Typing indicator |
| `chat:read` | Client → Server | Message read receipt |
| `notification` | Server → Client | Push notification delivery |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/your-amazing-feature

# 3. Commit your changes (use conventional commits)
git commit -m "feat: add real-time ambulance tracking"

# 4. Push to your branch
git push origin feature/your-amazing-feature

# 5. Open a Pull Request
```

### Commit Convention

We use **Conventional Commits**:

| Prefix | Usage |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `chore:` | Build/config changes |
| `refactor:` | Code restructure |
| `test:` | Adding or updating tests |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ to save lives**

<sub>LifeLineX — Connecting people to emergency care, one second at a time.</sub>

[![GitHub](https://img.shields.io/badge/GitHub-RAGUL--TR07-181717?style=flat-square&logo=github)](https://github.com/RAGUL-TR07/LifeLinex)

</div>
