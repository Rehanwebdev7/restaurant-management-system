# RMS — Admin Dashboard (Frontend)

Role-based admin dashboard for restaurant management, built with React 18.

> This repo contains the **frontend only**. The backend API is in a separate repo and runs on port `8085`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Routing | React Router v6 |
| UI | Bootstrap 5, React-Bootstrap, Bootstrap Icons |
| HTTP | Axios |
| Auth & Push | Firebase |
| Charts | Chart.js |
| Other | QRCode, Google Maps, react-toastify |

---

## Prerequisites

- **Node.js** 16 or higher
- **npm** (comes with Node)
- **Backend API** running at `http://localhost:8085`

---

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd rms-frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# open .env and set REACT_APP_API_BASE_URL

# 4. Run dev server
npm start
# opens http://localhost:3000
```

---

## Build & Deploy

```bash
npm run build      # production build → /build folder
```

Deployment is done via Vercel.

---

## User Roles

The app supports **7 role types**, each with its own layout, sidebar, and routes:

`superadmin` · `admin` · `restaurant` · `branch` · `kitchen` · `cashier` · `customer`

---

## Folder Structure

```
rms-frontend/
├── public/
│   ├── index.html
│   └── assets/
│
├── src/
│   ├── App.js                        → Root component, role-based routing
│   ├── index.js
│   ├── index.css
│   │
│   ├── pages/                        → Screen components per role
│   │   ├── auth/                     → Login, ForgotPassword, VerifyOtp
│   │   └── modules/
│   │       ├── superadmin/
│   │       ├── admin/
│   │       ├── restaurant/
│   │       ├── branch/
│   │       ├── kitchen/
│   │       ├── cashier/
│   │       └── Customer/
│   │
│   ├── components/                   → Reusable UI components
│   │   ├── common/
│   │   ├── modals/
│   │   ├── Header.js, Footer.js
│   │   └── {Role}Sidebar.js
│   │
│   ├── layouts/                      → Role-based page wrappers
│   │   ├── AdminLayout.jsx
│   │   ├── RestaurantLayout.jsx
│   │   ├── BranchLayout.jsx
│   │   ├── CashierLayout.jsx
│   │   ├── KitchenLayout.jsx
│   │   ├── SuperAdminLayout.jsx
│   │   └── MainLayout.jsx
│   │
│   ├── routes/                       → Route configs per role
│   │   ├── AdminRoutes.js
│   │   ├── RestaurantRoutes.js
│   │   ├── BranchRoutes.js
│   │   ├── KitchenRoutes.js
│   │   ├── CashierRoutes.js
│   │   ├── SuperAdminRoutes.js
│   │   └── LoginRoutes.js
│   │
│   ├── api/
│   │   └── apiClient.js              → Axios setup
│   │
│   ├── ApiServices/                  → API call helpers
│   │   └── ApiServices.js
│   │
│   ├── services/                     → Business logic
│   │   ├── AuthServices.js
│   │   ├── AdminService.js
│   │   └── themeService.js
│   │
│   ├── contexts/                     → React Context (auth, theme, notifications)
│   │   ├── AuthContext.js
│   │   ├── ThemeContext.js
│   │   └── NotificationContext.js
│   │
│   ├── firebase/
│   │   └── firebase.js               → Firebase setup
│   │
│   └── utils/                        → Helper functions
│       ├── constants.js
│       ├── tokenUtils.js
│       └── toast.js
│
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `REACT_APP_API_BASE_URL` | Base URL of the backend API |

---

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Run dev server on port 3000 |
| `npm run build` | Create production build |
| `npm test` | Run tests |

---

## License

Private — All rights reserved.
