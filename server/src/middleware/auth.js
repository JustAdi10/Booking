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
exports.errorHandler = exports.validateRequest = exports.rateLimiter = exports.auditLog = exports.checkResourcePermission = exports.authorize = exports.authenticateToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to authenticate Firebase token and attach user to request
 */
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Authorization token required'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify Firebase token
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(token);
        if (!decodedToken.uid) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }
        // Get user from database
        const user = yield prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                name: true,
                role: true,
                isActive: true
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                error: 'Account is deactivated'
            });
            return;
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
});
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check if user has required permissions
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to check specific permissions for resources
 */
const checkResourcePermission = (resource, action, getResourceOwnerId) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }
            const { role, id: userId } = req.user;
            // Admin has access to everything
            if (role === client_1.UserRole.ADMIN) {
                next();
                return;
            }
            // Check role-based permissions
            const permissions = getRolePermissions(role);
            const resourcePermissions = permissions[resource];
            if (!resourcePermissions || !resourcePermissions.includes(action)) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
                return;
            }
            // For actions that require ownership check
            if (action.includes('own') && getResourceOwnerId) {
                const resourceOwnerId = yield getResourceOwnerId(req);
                if (resourceOwnerId !== userId) {
                    res.status(403).json({
                        success: false,
                        error: 'Access denied: You can only access your own resources'
                    });
                    return;
                }
            }
            next();
        }
        catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    });
};
exports.checkResourcePermission = checkResourcePermission;
/**
 * Get permissions for a specific role
 */
function getRolePermissions(role) {
    const permissions = {
        [client_1.UserRole.ADMIN]: {
            facilities: ['create', 'read', 'update', 'delete'],
            rooms: ['create', 'read', 'update', 'delete'],
            bookings: ['create', 'read', 'update', 'delete', 'approve'],
            housekeeping: ['create', 'read', 'update', 'delete', 'assign'],
            meals: ['create', 'read', 'update', 'delete', 'auto-generate'],
            users: ['create', 'read', 'update', 'delete', 'change-role'],
            reports: ['read', 'export'],
            notifications: ['send', 'read']
        },
        [client_1.UserRole.HOUSEKEEPING]: {
            facilities: ['read'],
            rooms: ['read'],
            bookings: ['read'],
            housekeeping: ['read', 'update-assigned'],
            meals: ['read'],
            users: ['read-self'],
            reports: ['read-own'],
            notifications: ['read']
        },
        [client_1.UserRole.USER]: {
            facilities: ['read'],
            rooms: ['read'],
            bookings: ['create', 'read-own', 'update-own', 'cancel-own'],
            housekeeping: [],
            meals: ['read'],
            users: ['read-self', 'update-self'],
            reports: [],
            notifications: ['read-own']
        }
    };
    return permissions[role] || {};
}
/**
 * Middleware to log user actions for audit trail
 */
const auditLog = (action, entityType) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Store original res.json to capture response
            const originalJson = res.json;
            let responseData;
            res.json = function (data) {
                responseData = data;
                return originalJson.call(this, data);
            };
            // Continue with the request
            next();
            // Log after response is sent
            res.on('finish', () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                try {
                    if (req.user && res.statusCode < 400) {
                        const entityId = req.params.id || ((_a = responseData === null || responseData === void 0 ? void 0 : responseData.data) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
                        yield prisma.auditLog.create({
                            data: {
                                userId: req.user.id,
                                action,
                                entityType,
                                entityId,
                                oldValues: req.method === 'PUT' ? req.body.oldValues : null,
                                newValues: req.method !== 'GET' ? req.body : null,
                                ipAddress: req.ip,
                                userAgent: req.get('User-Agent')
                            }
                        });
                    }
                }
                catch (error) {
                    console.error('Audit log error:', error);
                }
            }));
        }
        catch (error) {
            console.error('Audit middleware error:', error);
            next();
        }
    });
};
exports.auditLog = auditLog;
/**
 * Rate limiting middleware
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        // Clean up old entries
        for (const [ip, data] of requests.entries()) {
            if (data.resetTime < windowStart) {
                requests.delete(ip);
            }
        }
        const current = requests.get(key);
        if (!current) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (current.resetTime < now) {
            // Reset window
            requests.set(key, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (current.count >= max) {
            res.status(429).json({
                success: false,
                error: 'Too many requests, please try again later'
            });
            return;
        }
        current.count++;
        next();
    };
};
exports.rateLimiter = rateLimiter;
/**
 * Middleware to validate request body against schema
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body, { abortEarly: false });
            if (error) {
                const errors = {};
                error.details.forEach((detail) => {
                    const field = detail.path.join('.');
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(detail.message);
                });
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    errors
                });
                return;
            }
            req.body = value;
            next();
        }
        catch (error) {
            console.error('Validation error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Error handling middleware
 */
const errorHandler = (error, req, res, next) => {
    console.error('Error:', error);
    // Prisma errors
    if (error.code === 'P2002') {
        res.status(409).json({
            success: false,
            error: 'Resource already exists'
        });
        return;
    }
    if (error.code === 'P2025') {
        res.status(404).json({
            success: false,
            error: 'Resource not found'
        });
        return;
    }
    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
