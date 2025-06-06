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
 * GET /api/users
 * List all users (Admin only)
 */
router.get('/', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, isActive, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause
        const where = {};
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive === 'true';
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [users, total] = yield Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    avatarUrl: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            bookings: true,
                            assignedTasks: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { [sortBy]: sortOrder }
            }),
            prisma.user.count({ where })
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            success: true,
            data: users,
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
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                bookings: {
                    select: {
                        id: true,
                        bookingType: true,
                        startDate: true,
                        endDate: true,
                        status: true,
                        totalAmount: true,
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        },
                        room: {
                            select: {
                                id: true,
                                name: true,
                                roomNumber: true,
                                type: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                assignedTasks: {
                    select: {
                        id: true,
                        taskType: true,
                        priority: true,
                        status: true,
                        deadline: true,
                        room: {
                            select: {
                                id: true,
                                name: true,
                                roomNumber: true,
                                facility: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: {
                        bookings: true,
                        assignedTasks: true,
                        notifications: true
                    }
                }
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
            data: user
        });
    }
    catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('UPDATE', 'USER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, phone, isActive } = req.body;
        const existingUser = yield prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const updatedUser = yield prisma.user.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign({}, (name && { name })), (phone !== undefined && { phone })), (isActive !== undefined && { isActive })),
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
            data: updatedUser,
            message: 'User updated successfully'
        });
    }
    catch (error) {
        console.error('User update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * DELETE /api/users/:id
 * Deactivate user (Admin only)
 */
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('DEACTIVATE', 'USER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        bookings: {
                            where: {
                                status: { in: ['PENDING', 'CONFIRMED'] }
                            }
                        },
                        assignedTasks: {
                            where: {
                                status: { in: ['PENDING', 'IN_PROGRESS'] }
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Check for active bookings or tasks
        if (user._count.bookings > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot deactivate user with active bookings'
            });
        }
        if (user._count.assignedTasks > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot deactivate user with pending tasks'
            });
        }
        // Deactivate instead of delete
        yield prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    }
    catch (error) {
        console.error('User deactivation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/users/:id/role
 * Change user role (Admin only)
 */
router.put('/:id/role', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('CHANGE_ROLE', 'USER'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !Object.values(types_1.UserRole).includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Valid role is required'
            });
        }
        const user = yield prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const updatedUser = yield prisma.user.update({
            where: { id },
            data: { role },
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
            data: updatedUser,
            message: 'User role updated successfully'
        });
    }
    catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
