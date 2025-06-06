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
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * POST /api/auth/login
 * Verify Firebase token and create/update user in database
 */
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                error: 'ID token is required'
            });
        }
        // Verify Firebase token
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(idToken);
        if (!decodedToken.uid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        // Get or create user in database
        let user = yield prisma.user.findUnique({
            where: { firebaseUid: decodedToken.uid }
        });
        if (!user) {
            // Create new user
            user = yield prisma.user.create({
                data: {
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email || '',
                    name: decodedToken.name || ((_a = decodedToken.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'User',
                    role: types_1.UserRole.USER, // Default role
                    avatarUrl: decodedToken.picture
                }
            });
        }
        else {
            // Update user info if needed
            user = yield prisma.user.update({
                where: { id: user.id },
                data: {
                    email: decodedToken.email || user.email,
                    name: decodedToken.name || user.name,
                    avatarUrl: decodedToken.picture || user.avatarUrl
                }
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatarUrl: user.avatarUrl
                }
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}));
/**
 * POST /api/auth/logout
 * Logout user and cleanup
 */
router.post('/logout', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Deactivate push tokens for this user
        if (req.user) {
            yield prisma.pushToken.updateMany({
                where: { userId: req.user.id },
                data: { isActive: false }
            });
        }
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const { name, phone, avatarUrl } = req.body;
        const updatedUser = yield prisma.user.update({
            where: { id: req.user.id },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (phone && { phone })), (avatarUrl && { avatarUrl })),
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            data: { user: updatedUser },
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/auth/register-token
 * Register push notification token
 */
router.post('/register-token', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const { token, platform } = req.body;
        if (!token || !platform) {
            return res.status(400).json({
                success: false,
                error: 'Token and platform are required'
            });
        }
        if (!Object.values(types_1.Platform).includes(platform)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid platform'
            });
        }
        // Deactivate existing tokens for this user and platform
        yield prisma.pushToken.updateMany({
            where: {
                userId: req.user.id,
                platform: platform
            },
            data: { isActive: false }
        });
        // Create new token
        const pushToken = yield prisma.pushToken.create({
            data: {
                userId: req.user.id,
                token,
                platform,
                isActive: true
            }
        });
        res.json({
            success: true,
            data: { pushToken },
            message: 'Push token registered successfully'
        });
    }
    catch (error) {
        console.error('Token registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/auth/refresh
 * Refresh user session (verify current token)
 */
router.post('/refresh', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    name: req.user.name,
                    role: req.user.role
                }
            },
            message: 'Token is valid'
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
