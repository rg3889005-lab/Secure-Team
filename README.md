# Secure-Team

A secure, collaborative team workspace application built with a modern React frontend and Node.js/Express backend, featuring real-time messaging, project & task management, role-based access control, file storage, and comprehensive security auditing.

---

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with refresh tokens, email verification, password reset, and role-based access control (Admin / Member).
- **Real-Time Collaboration**: Real-time team messaging and updates powered by Socket.io.
- **Project & Task Management**: Organize projects, assign tasks, track statuses, and monitor deadlines.
- **File Management**: Secure file uploads, metadata management, and permission controls.
- **Admin Dashboard**: User management, system audit logs, broadcast messaging, and analytics charts.
- **Security First**: Helmet protection, rate limiting, CORS configuration, audit trails, and input validation with Zod / express-validator.

---

## 🛠️ Tech Stack

### Backend
- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Communication**: Socket.io
- **Security & Validation**: Helmet, express-rate-limit, bcryptjs, jsonwebtoken, Zod, express-validator
- **File Uploads**: Multer
- **Mailing**: Nodemailer

### Frontend
- **Framework & Build Tool**: React 19, Vite
- **Routing**: React Router v7
- **UI & Icons**: Lucide React, Recharts
- **State & Forms**: React Hook Form with Zod resolver, Context API
- **Real-Time Client**: Socket.io Client
- **Notifications**: React Hot Toast

---

## 📁 Project Structure

```
Secure-Team/
├── backend/
│   ├── scripts/            # Database seeding and verification utilities
│   ├── src/
│   │   ├── config/         # Database and server configuration
│   │   ├── controllers/    # API endpoint request controllers
│   │   ├── middleware/     # Auth and error handling middleware
│   │   ├── models/         # Mongoose data models
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Audit, email, and notification services
│   │   ├── sockets/        # Socket.io handlers
│   │   └── utils/          # JWT and helper utilities
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── assets/         # App assets & images
│   │   ├── components/     # Layout & UI components
│   │   ├── contexts/       # Auth, Socket, and Theme contexts
│   │   ├── layouts/        # AppLayout and AuthLayout
│   │   ├── pages/          # Admin and User pages
│   │   ├── routes/         # Protected and Admin route wrappers
│   │   └── services/       # Axios API client services
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/rg3889005-lab/Secure-Team.git
cd Secure-Team
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, etc.

# Optional: Seed initial database data
npm run seed

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Configure environment variables
cp .env.example .env

# Start frontend development server
npm run dev
```

---

## 📜 License
This project is licensed under the ISC License.
