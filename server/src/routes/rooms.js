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
 * GET /api/rooms/:id
 * Get room details by ID
 */
router.get('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const room = yield prisma.room.findUnique({
            where: { id },
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
                },
                bookings: {
                    where: {
                        startDate: { gte: new Date() }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { startDate: 'asc' },
                    take: 10
                },
                housekeepingTasks: {
                    where: {
                        status: { in: ['PENDING', 'IN_PROGRESS'] }
                    },
                    include: {
                        assignedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { deadline: 'asc' },
                    take: 5
                },
                _count: {
                    select: {
                        bookings: true,
                        housekeepingTasks: true
                    }
                }
            }
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        res.json({
            success: true,
            data: room
        });
    }
    catch (error) {
        console.error('Room fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/rooms/:id
 * Update room (Admin only)
 */
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('UPDATE', 'ROOM'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        // Check if room exists
        const existingRoom = yield prisma.room.findUnique({
            where: { id }
        });
        if (!existingRoom) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        // Validate room type if provided
        if (data.type && !Object.values(types_1.RoomType).includes(data.type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid room type'
            });
        }
        const updatedRoom = yield prisma.room.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.name && { name: data.name })), (data.roomNumber !== undefined && { roomNumber: data.roomNumber })), (data.type && { type: data.type })), (data.capacity !== undefined && { capacity: data.capacity })), (data.floorNumber !== undefined && { floorNumber: data.floorNumber })), (data.amenities !== undefined && { amenities: data.amenities })), (data.images !== undefined && { images: data.images })), (data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight })), (data.isActive !== undefined && { isActive: data.isActive })),
            include: {
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedRoom,
            message: 'Room updated successfully'
        });
    }
    catch (error) {
        console.error('Room update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * DELETE /api/rooms/:id
 * Delete room (Admin only)
 */
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (0, auth_1.auditLog)('DELETE', 'ROOM'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if room exists
        const room = yield prisma.room.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        bookings: {
                            where: {
                                status: { in: ['PENDING', 'CONFIRMED'] }
                            }
                        }
                    }
                }
            }
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        // Check for active bookings
        if (room._count.bookings > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete room with active bookings'
            });
        }
        yield prisma.room.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    }
    catch (error) {
        console.error('Room deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/rooms/:id/availability
 * Check room availability for date range
 */
router.get('/:id/availability', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        const room = yield prisma.room.findUnique({
            where: { id },
            include: {
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true
                    }
                }
            }
        });
        if (!room) {
            return res.status(404).json({
                success: false,
                error: 'Room not found'
            });
        }
        // Get bookings for the date range
        const bookings = yield prisma.booking.findMany({
            where: {
                roomId: id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                OR: [
                    {
                        startDate: { lte: new Date(endDate) },
                        endDate: { gte: new Date(startDate) }
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { startDate: 'asc' }
        });
        // Get housekeeping tasks that might affect availability
        const housekeepingTasks = yield prisma.housekeepingTask.findMany({
            where: {
                roomId: id,
                status: { in: ['PENDING', 'IN_PROGRESS'] },
                deadline: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { deadline: 'asc' }
        });
        const isAvailable = bookings.length === 0 &&
            housekeepingTasks.filter(task => task.priority === 'URGENT').length === 0;
        res.json({
            success: true,
            data: {
                room,
                bookings,
                housekeepingTasks,
                isAvailable,
                availabilityNotes: !isAvailable ?
                    (bookings.length > 0 ? 'Room is booked for this period' : 'Room has urgent maintenance tasks') :
                    'Room is available'
            }
        });
    }
    catch (error) {
        console.error('Room availability check error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
