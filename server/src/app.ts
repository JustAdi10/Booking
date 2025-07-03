import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { rateLimiter, errorHandler } from './middleware/auth';
import fs from 'fs';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import facilityRoutes from './routes/facilities';
import roomRoutes from './routes/rooms';
import bookingRoutes from './routes/bookings';
import housekeepingRoutes from './routes/housekeeping';
import mealRoutes from './routes/meals';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/upload';
import userRoutes from './routes/users';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;

  if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
    try {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK configuration failed:', error.message);
      console.warn('Authentication will not work properly.');
    }
  } else {
    console.warn('⚠️ Firebase Admin SDK not configured or file not found. Authentication will not work.');
    console.warn('To enable authentication, set FIREBASE_ADMIN_SDK_PATH to a valid service account file.');
  }
}

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cricket Ground & Room Booking System API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Test endpoint for mock data
app.get('/test/facilities', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    data: [
      {
        id: "facility-1",
        name: "Main Cricket Ground",
        type: "GROUND"
      },
      {
        id: "facility-2",
        name: "Guest House Building A",
        type: "BUILDING"
      }
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
