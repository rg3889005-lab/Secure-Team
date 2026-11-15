'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const http = require('http');
const { Server: SocketIO } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { initializeSockets } = require('./src/sockets/socketHandler');

const PORT = parseInt(process.env.PORT) || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const startServer = async () => {
  // Connect to MongoDB Atlas first
  await connectDB();

  // Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // Initialize Socket.IO on the same HTTP server
  const io = new SocketIO(httpServer, {
    cors: {
      origin: [FRONTEND_URL, 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Make io available to all Express route handlers
  app.set('io', io);

  // Initialize socket event handlers
  initializeSockets(io);

  // Start listening
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Frontend:    ${FRONTEND_URL}`);
    console.log(`   Socket.IO:   ws://localhost:${PORT}\n`);

    // Asynchronously verify email service configuration on boot
    const { verifyEmailService } = require('./src/services/emailService');
    verifyEmailService()
      .then((res) => {
        const providerName = res.provider === 'gmail_api' ? 'Gmail API (HTTPS)' : 'Gmail SMTP';
        if (res.ok) {
          console.log(`📧 Email Service [${providerName}]: ${res.message}`);
        } else {
          console.warn(`📧 Email Service [${providerName}]: ${res.message} [Code: ${res.reason || res.code}]`);
        }
      })
      .catch((err) => {
        console.warn(`📧 Email Service Check encountered error: ${err.message}`);
      });
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;
