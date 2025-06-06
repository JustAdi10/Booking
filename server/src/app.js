"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const client_1 = require("@prisma/client");
const auth_1 = require("./middleware/auth");
// Import routes
const auth_2 = __importDefault(require("./routes/auth"));
const facilities_1 = __importDefault(require("./routes/facilities"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const housekeeping_1 = __importDefault(require("./routes/housekeeping"));
const meals_1 = __importDefault(require("./routes/meals"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const reports_1 = __importDefault(require("./routes/reports"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
// Load environment variables
dotenv_1.default.config();
// Initialize Firebase Admin
if (!firebase_admin_1.default.apps.length) {
    const serviceAccount = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (serviceAccount) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(require(serviceAccount)),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
    }
    else {
        console.warn('Firebase Admin SDK not configured. Authentication will not work.');
    }
}
// Initialize Prisma
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// Create Express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
app.use((0, auth_1.rateLimiter)());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Cricket Ground & Room Booking System API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// API Routes
app.use('/api/auth', auth_2.default);
app.use('/api/users', users_1.default);
app.use('/api/facilities', facilities_1.default);
app.use('/api/rooms', rooms_1.default);
app.use('/api/bookings', bookings_1.default);
app.use('/api/housekeeping', housekeeping_1.default);
app.use('/api/meals', meals_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/upload', upload_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});
// Error handling middleware
app.use(auth_1.errorHandler);
// Graceful shutdown
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down gracefully...');
    yield exports.prisma.$disconnect();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down gracefully...');
    yield exports.prisma.$disconnect();
    process.exit(0);
}));
exports.default = app;
