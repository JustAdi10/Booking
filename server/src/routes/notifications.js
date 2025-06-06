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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * GET /api/notifications
 * List user notifications
 */
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { isRead, type, page = 1, limit = 20 } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = { userId };
        if (isRead !== undefined)
            where.isRead = isRead === 'true';
        if (type)
            where.type = type;
        const [notifications, total] = yield Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({ where })
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: Number(page),
                limit: take,
                total,
                totalPages,
                hasNext: Number(page) < totalPages,
                hasPrev: Number(page) > 1
            }
        });
    }
    catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const notification = yield prisma.notification.findFirst({
            where: { id, userId }
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        const updatedNotification = yield prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({
            success: true,
            data: updatedNotification,
            message: 'Notification marked as read'
        });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const result = yield prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({
            success: true,
            message: `Marked ${result.count} notifications as read`
        });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const notification = yield prisma.notification.findFirst({
            where: { id, userId }
        });
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        yield prisma.notification.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/notifications/send
 * Send notification (Admin only)
 */
router.post('/send', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('SEND', 'NOTIFICATION'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        if (!data.userId || !data.title || !data.message || !data.type) {
            return res.status(400).json({
                success: false,
                error: 'User ID, title, message, and type are required'
            });
        }
        if (!Object.values(types_1.NotificationType).includes(data.type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid notification type'
            });
        }
        if (data.priority && !Object.values(types_1.NotificationPriority).includes(data.priority)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid notification priority'
            });
        }
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { id: data.userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const notification = yield prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type,
                priority: data.priority || types_1.NotificationPriority.MEDIUM,
                relatedId: data.relatedId,
                relatedType: data.relatedType
            }
        });
        // TODO: Send push notification here
        // await sendPushNotification(user, notification);
        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification sent successfully'
        });
    }
    catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
