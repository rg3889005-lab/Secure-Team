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

## 📧 Email Delivery Configuration (Invitations & Verification)

Secure-Team features a unified email service supporting **Gmail SMTP** (for local development and standard paid cloud hosts) and **Gmail API over HTTPS** (for Render Free Plan compatibility).

### Method 1: Gmail SMTP (Local Development & Render Paid)

Use standard SMTP with a 16-character Google App Password:

1. **Turn on 2-Step Verification** on your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. **Create an App Password**: Navigate to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), select "Mail", and name it `Secure-Team`.
3. Copy the 16-character code (e.g. `abcd efgh ijkl mnop`).
4. Set the following in `backend/.env` (spaces are automatically stripped):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   EMAIL_FROM="Secure-Team Workspace" <your_email@gmail.com>
   ```

### Method 2: Gmail API over HTTPS (Recommended for Render Free Plan)

> [!IMPORTANT]
> **Why Gmail API is required on Render Free**: Render's Free Web Service tier blocks all outbound TCP traffic to ports 25, 465, and 587 at the firewall level to prevent spam. Attempting to connect to Gmail SMTP on Render Free will fail with `ETIMEDOUT`. The Gmail API communicates exclusively over **HTTPS (port 443)**, which is unrestricted.

1. **Enable Gmail API**:
   - Go to Google Cloud Console: [https://console.cloud.google.com/apis/library/gmail.googleapis.com](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
   - Enable the **Gmail API** for your project.
2. **Configure OAuth 2.0 Client**:
   - Under **APIs & Services** > **Credentials**, create an **OAuth 2.0 Client ID** (Web application).
   - Add authorized redirect URI: `https://developers.google.com/oauthplayground`
   - Note your `Client ID` and `Client Secret`.
3. **Generate a Refresh Token**:
   - Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
   - Click the gear icon (top right), check **Use your own OAuth credentials**, and paste your `Client ID` and `Client Secret`.
   - In Step 1, authorize scope: `https://www.googleapis.com/auth/gmail.send`.
   - Click **Authorize APIs** and log in with your Gmail account.
   - In Step 2, click **Exchange authorization code for tokens** and copy the **Refresh token**.
4. **Set Environment Variables in Render Dashboard**:
   - Under your Render Web Service > **Environment**:
     ```env
     EMAIL_PROVIDER=gmail_api
     GMAIL_API_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
     GMAIL_API_CLIENT_SECRET=your_google_client_secret
     GMAIL_API_REFRESH_TOKEN=your_oauth_refresh_token
     GMAIL_API_USER=your_email@gmail.com
     EMAIL_FROM="Secure-Team Workspace" <your_email@gmail.com>
     FRONTEND_URL=https://secure-team.vercel.app
     ```

> [!NOTE]
> Never expose email credentials (`SMTP_PASS`, `GMAIL_API_CLIENT_SECRET`, `GMAIL_API_REFRESH_TOKEN`) in the frontend (`VITE_*`) or commit `.env` to Git.

---

## 📜 License
This project is licensed under the ISC License.
