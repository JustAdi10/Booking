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
 * GET /api/housekeeping/tasks
 * List housekeeping tasks with filters and pagination
 */
router.get('/tasks', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { assignedTo, roomId, taskType, priority, status, deadline, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause
        const where = {};
        // Housekeeping staff can only see their assigned tasks
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === types_1.UserRole.HOUSEKEEPING) {
            where.assignedTo = req.user.id;
        }
        else if (assignedTo) {
            where.assignedTo = assignedTo;
        }
        if (roomId)
            where.roomId = roomId;
        if (taskType)
            where.taskType = taskType;
        if (priority)
            where.priority = priority;
        if (status)
            where.status = status;
        if (deadline) {
            where.deadline = { lte: new Date(deadline) };
        }
        // Get tasks with pagination
        const [tasks, total] = yield Promise.all([
            prisma.housekeepingTask.findMany({
                where,
                include: {
                    room: {
                        include: {
                            facility: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    location: true
                                }
                            }
                        }
                    },
                    assignedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { [sortBy]: sortOrder }
            }),
            prisma.housekeepingTask.count({ where })
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            success: true,
            data: tasks,
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
        console.error('Housekeeping tasks fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/housekeeping/tasks
 * Create housekeeping task (Admin only)
 */
router.post('/tasks', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('CREATE', 'HOUSEKEEPING_TASK'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        // Validate required fields
        if (!data.roomId || !data.assignedTo || !data.taskType) {
            return res.status(400).json({
                success: false,
                error: 'Room ID, assigned user, and task type are required'
            });
        }
        // Validate enums
        if (!Object.values(types_1.HousekeepingTaskType).includes(data.taskType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid task type'
            });
        }
        if (data.priority && !Object.values(types_1.TaskPriority).includes(data.priority)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid priority'
            });
        }
        // Check if room exists
        const room = yield prisma.room.findUnique({
            where: { id: data.roomId }
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        // Check if assigned user exists and has housekeeping role
        const assignedUser = yield prisma.user.findUnique({
            where: { id: data.assignedTo }
        });
        if (!assignedUser) {
            return res.status(404).json({
                success: false,
                error: 'Assigned user not found'
            });
        }
        if (assignedUser.role !== types_1.UserRole.HOUSEKEEPING && assignedUser.role !== types_1.UserRole.ADMIN) {
            return res.status(400).json({
                success: false,
                error: 'User must have housekeeping or admin role'
            });
        }
        const task = yield prisma.housekeepingTask.create({
            data: {
                roomId: data.roomId,
                assignedTo: data.assignedTo,
                taskType: data.taskType,
                priority: data.priority || types_1.TaskPriority.MEDIUM,
                description: data.description,
                deadline: data.deadline ? new Date(data.deadline) : null,
                status: types_1.HousekeepingTaskStatus.PENDING
            },
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                location: true
                            }
                        }
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: task,
            message: 'Housekeeping task created successfully'
        });
    }
    catch (error) {
        console.error('Housekeeping task creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/housekeeping/tasks/:id
 * Get housekeeping task details by ID
 */
router.get('/tasks/:id', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('housekeeping', 'read', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield prisma.housekeepingTask.findUnique({
        where: { id: req.params.id },
        select: { assignedTo: true }
    });
    return (task === null || task === void 0 ? void 0 : task.assignedTo) || null;
})), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const task = yield prisma.housekeepingTask.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                location: true,
                                state: true,
                                city: true,
                                address: true
                            }
                        }
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true
                    }
                }
            }
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Housekeeping task not found'
            });
        }
        res.json({
            success: true,
            data: task
        });
    }
    catch (error) {
        console.error('Housekeeping task fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/housekeeping/tasks/:id
 * Update housekeeping task
 */
router.put('/tasks/:id', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('housekeeping', 'update', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield prisma.housekeepingTask.findUnique({
        where: { id: req.params.id },
        select: { assignedTo: true }
    });
    return (task === null || task === void 0 ? void 0 : task.assignedTo) || null;
})), (0, auth_1.auditLog)('UPDATE', 'HOUSEKEEPING_TASK'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        // Check if task exists
        const existingTask = yield prisma.housekeepingTask.findUnique({
            where: { id }
        });
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                error: 'Housekeeping task not found'
            });
        }
        // Validate enums if provided
        if (data.taskType && !Object.values(types_1.HousekeepingTaskType).includes(data.taskType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid task type'
            });
        }
        if (data.priority && !Object.values(types_1.TaskPriority).includes(data.priority)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid priority'
            });
        }
        if (data.status && !Object.values(types_1.HousekeepingTaskStatus).includes(data.status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        // Set completion timestamp if status is being changed to completed
        const updateData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.taskType && { taskType: data.taskType })), (data.priority && { priority: data.priority })), (data.description !== undefined && { description: data.description })), (data.deadline && { deadline: new Date(data.deadline) })), (data.completionNotes !== undefined && { completionNotes: data.completionNotes })), (data.images !== undefined && { images: data.images }));
        if (data.status) {
            updateData.status = data.status;
            if (data.status === types_1.HousekeepingTaskStatus.COMPLETED && existingTask.status !== types_1.HousekeepingTaskStatus.COMPLETED) {
                updateData.completedAt = new Date();
            }
        }
        const updatedTask = yield prisma.housekeepingTask.update({
            where: { id },
            data: updateData,
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                location: true
                            }
                        }
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Housekeeping task updated successfully'
        });
    }
    catch (error) {
        console.error('Housekeeping task update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * DELETE /api/housekeeping/tasks/:id
 * Delete housekeeping task (Admin only)
 */
router.delete('/tasks/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('DELETE', 'HOUSEKEEPING_TASK'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const task = yield prisma.housekeepingTask.findUnique({
            where: { id }
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Housekeeping task not found'
            });
        }
        yield prisma.housekeepingTask.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Housekeeping task deleted successfully'
        });
    }
    catch (error) {
        console.error('Housekeeping task deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/housekeeping/tasks/:id/status
 * Update task status (for housekeeping staff)
 */
router.put('/tasks/:id/status', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('housekeeping', 'update-assigned', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield prisma.housekeepingTask.findUnique({
        where: { id: req.params.id },
        select: { assignedTo: true }
    });
    return (task === null || task === void 0 ? void 0 : task.assignedTo) || null;
})), (0, auth_1.auditLog)('UPDATE_STATUS', 'HOUSEKEEPING_TASK'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, completionNotes } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }
        if (!Object.values(types_1.HousekeepingTaskStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        const existingTask = yield prisma.housekeepingTask.findUnique({
            where: { id }
        });
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                error: 'Housekeeping task not found'
            });
        }
        const updateData = { status };
        if (completionNotes) {
            updateData.completionNotes = completionNotes;
        }
        if (status === types_1.HousekeepingTaskStatus.COMPLETED && existingTask.status !== types_1.HousekeepingTaskStatus.COMPLETED) {
            updateData.completedAt = new Date();
        }
        const updatedTask = yield prisma.housekeepingTask.update({
            where: { id },
            data: updateData,
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Task status updated successfully'
        });
    }
    catch (error) {
        console.error('Task status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/housekeeping/tasks/:id/images
 * Upload task images
 */
router.post('/tasks/:id/images', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('housekeeping', 'update-assigned', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield prisma.housekeepingTask.findUnique({
        where: { id: req.params.id },
        select: { assignedTo: true }
    });
    return (task === null || task === void 0 ? void 0 : task.assignedTo) || null;
})), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { images } = req.body;
        if (!images || !Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                error: 'Images array is required'
            });
        }
        const task = yield prisma.housekeepingTask.findUnique({
            where: { id }
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Housekeeping task not found'
            });
        }
        // Merge with existing images
        const existingImages = task.images || [];
        const updatedImages = [...existingImages, ...images];
        const updatedTask = yield prisma.housekeepingTask.update({
            where: { id },
            data: { images: updatedImages },
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true
                            }
                        }
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedTask,
            message: 'Images uploaded successfully'
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/housekeeping/my-tasks
 * Get tasks assigned to current user
 */
router.get('/my-tasks', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { status, priority } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const where = { assignedTo: userId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        const tasks = yield prisma.housekeepingTask.findMany({
            where,
            include: {
                room: {
                    include: {
                        facility: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                location: true,
                                state: true,
                                city: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { deadline: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        res.json({
            success: true,
            data: tasks
        });
    }
    catch (error) {
        console.error('My tasks fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/housekeeping/history
 * Get housekeeping history
 */
router.get('/history', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { roomId, assignedTo, startDate, endDate, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {
            status: types_1.HousekeepingTaskStatus.COMPLETED
        };
        // Non-admin users can only see their own history
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== types_1.UserRole.ADMIN) {
            where.assignedTo = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        }
        else if (assignedTo) {
            where.assignedTo = assignedTo;
        }
        if (roomId)
            where.roomId = roomId;
        if (startDate && endDate) {
            where.completedAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const [tasks, total] = yield Promise.all([
            prisma.housekeepingTask.findMany({
                where,
                include: {
                    room: {
                        include: {
                            facility: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    location: true
                                }
                            }
                        }
                    },
                    assignedUser: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { completedAt: 'desc' }
            }),
            prisma.housekeepingTask.count({ where })
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            success: true,
            data: tasks,
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
        console.error('Housekeeping history fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
