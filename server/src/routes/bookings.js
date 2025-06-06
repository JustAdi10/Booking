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
 * GET /api/bookings
 * List bookings with filters and pagination
 */
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId, facilityId, roomId, bookingType, status, startDate, endDate, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build where clause
        const where = {};
        // Non-admin users can only see their own bookings
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== types_1.UserRole.ADMIN) {
            where.userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        }
        else if (userId) {
            where.userId = userId;
        }
        if (facilityId)
            where.facilityId = facilityId;
        if (roomId)
            where.roomId = roomId;
        if (bookingType)
            where.bookingType = bookingType;
        if (status)
            where.status = status;
        if (startDate && endDate) {
            where.OR = [
                {
                    startDate: { lte: new Date(endDate) },
                    endDate: { gte: new Date(startDate) }
                }
            ];
        }
        else if (startDate) {
            where.startDate = { gte: new Date(startDate) };
        }
        else if (endDate) {
            where.endDate = { lte: new Date(endDate) };
        }
        // Get bookings with pagination
        const [bookings, total] = yield Promise.all([
            prisma.booking.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
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
                    room: {
                        select: {
                            id: true,
                            name: true,
                            roomNumber: true,
                            type: true,
                            capacity: true,
                            pricePerNight: true
                        }
                    }
                },
                skip,
                take,
                orderBy: { [sortBy]: sortOrder }
            }),
            prisma.booking.count({ where })
        ]);
        const totalPages = Math.ceil(total / take);
        res.json({
            success: true,
            data: bookings,
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
        console.error('Bookings fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/bookings
 * Create new booking
 */
router.post('/', auth_1.authenticateToken, (0, auth_1.auditLog)('CREATE', 'BOOKING'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const data = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        // Validate required fields
        if (!data.bookingType || !data.startDate || !data.endDate) {
            return res.status(400).json({
                success: false,
                error: 'Booking type, start date, and end date are required'
            });
        }
        if (!Object.values(types_1.BookingType).includes(data.bookingType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking type'
            });
        }
        // Validate that either facilityId or roomId is provided based on booking type
        if (data.bookingType === types_1.BookingType.GROUND && !data.facilityId) {
            return res.status(400).json({
                success: false,
                error: 'Facility ID is required for ground bookings'
            });
        }
        if (data.bookingType === types_1.BookingType.ROOM && !data.roomId) {
            return res.status(400).json({
                success: false,
                error: 'Room ID is required for room bookings'
            });
        }
        // Validate dates
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const now = new Date();
        if (startDate < now) {
            return res.status(400).json({
                success: false,
                error: 'Start date cannot be in the past'
            });
        }
        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                error: 'End date must be after start date'
            });
        }
        // Check availability
        const conflictingBookings = yield prisma.booking.findMany({
            where: Object.assign(Object.assign(Object.assign({}, (data.facilityId && { facilityId: data.facilityId })), (data.roomId && { roomId: data.roomId })), { status: { in: ['PENDING', 'CONFIRMED'] }, OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate }
                    }
                ] })
        });
        if (conflictingBookings.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'The selected dates are not available'
            });
        }
        // Calculate total amount if room booking
        let totalAmount = 0;
        if (data.bookingType === types_1.BookingType.ROOM && data.roomId) {
            const room = yield prisma.room.findUnique({
                where: { id: data.roomId },
                select: { pricePerNight: true }
            });
            if (room === null || room === void 0 ? void 0 : room.pricePerNight) {
                const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                totalAmount = Number(room.pricePerNight) * nights;
            }
        }
        const booking = yield prisma.booking.create({
            data: {
                userId,
                facilityId: data.facilityId,
                roomId: data.roomId,
                bookingType: data.bookingType,
                startDate,
                endDate,
                startTime: data.startTime ? new Date(`1970-01-01T${data.startTime}:00Z`) : null,
                endTime: data.endTime ? new Date(`1970-01-01T${data.endTime}:00Z`) : null,
                guestsCount: data.guestsCount || 1,
                totalAmount,
                specialRequests: data.specialRequests,
                status: types_1.BookingStatus.PENDING
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        location: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        roomNumber: true,
                        type: true,
                        capacity: true,
                        pricePerNight: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully'
        });
    }
    catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/bookings/:id
 * Get booking details by ID
 */
router.get('/:id', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('bookings', 'read', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma.booking.findUnique({
        where: { id: req.params.id },
        select: { userId: true }
    });
    return (booking === null || booking === void 0 ? void 0 : booking.userId) || null;
})), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const booking = yield prisma.booking.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        location: true,
                        state: true,
                        city: true,
                        address: true,
                        amenities: true,
                        images: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        roomNumber: true,
                        type: true,
                        capacity: true,
                        floorNumber: true,
                        amenities: true,
                        images: true,
                        pricePerNight: true
                    }
                }
            }
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        res.json({
            success: true,
            data: booking
        });
    }
    catch (error) {
        console.error('Booking fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * PUT /api/bookings/:id
 * Update booking
 */
router.put('/:id', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('bookings', 'update', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma.booking.findUnique({
        where: { id: req.params.id },
        select: { userId: true }
    });
    return (booking === null || booking === void 0 ? void 0 : booking.userId) || null;
})), (0, auth_1.auditLog)('UPDATE', 'BOOKING'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const data = req.body;
        // Check if booking exists
        const existingBooking = yield prisma.booking.findUnique({
            where: { id }
        });
        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        // Only allow updates if booking is pending or user is admin
        if (existingBooking.status !== types_1.BookingStatus.PENDING && ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== types_1.UserRole.ADMIN) {
            return res.status(400).json({
                success: false,
                error: 'Only pending bookings can be updated'
            });
        }
        // Validate dates if provided
        if (data.startDate || data.endDate) {
            const startDate = data.startDate ? new Date(data.startDate) : existingBooking.startDate;
            const endDate = data.endDate ? new Date(data.endDate) : existingBooking.endDate;
            const now = new Date();
            if (startDate < now) {
                return res.status(400).json({
                    success: false,
                    error: 'Start date cannot be in the past'
                });
            }
            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    error: 'End date must be after start date'
                });
            }
            // Check availability for new dates
            const conflictingBookings = yield prisma.booking.findMany({
                where: Object.assign(Object.assign(Object.assign({ id: { not: id } }, (existingBooking.facilityId && { facilityId: existingBooking.facilityId })), (existingBooking.roomId && { roomId: existingBooking.roomId })), { status: { in: ['PENDING', 'CONFIRMED'] }, OR: [
                        {
                            startDate: { lte: endDate },
                            endDate: { gte: startDate }
                        }
                    ] })
            });
            if (conflictingBookings.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'The selected dates are not available'
                });
            }
        }
        const updatedBooking = yield prisma.booking.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.startDate && { startDate: new Date(data.startDate) })), (data.endDate && { endDate: new Date(data.endDate) })), (data.startTime && { startTime: new Date(`1970-01-01T${data.startTime}:00Z`) })), (data.endTime && { endTime: new Date(`1970-01-01T${data.endTime}:00Z`) })), (data.guestsCount !== undefined && { guestsCount: data.guestsCount })), (data.specialRequests !== undefined && { specialRequests: data.specialRequests })), (data.status && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === types_1.UserRole.ADMIN && { status: data.status })),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        location: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        roomNumber: true,
                        type: true,
                        capacity: true,
                        pricePerNight: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedBooking,
            message: 'Booking updated successfully'
        });
    }
    catch (error) {
        console.error('Booking update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * DELETE /api/bookings/:id
 * Cancel booking
 */
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.checkResourcePermission)('bookings', 'cancel', (req) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield prisma.booking.findUnique({
        where: { id: req.params.id },
        select: { userId: true }
    });
    return (booking === null || booking === void 0 ? void 0 : booking.userId) || null;
})), (0, auth_1.auditLog)('CANCEL', 'BOOKING'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const booking = yield prisma.booking.findUnique({
            where: { id }
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        // Only allow cancellation if booking is pending or confirmed
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                error: 'Only pending or confirmed bookings can be cancelled'
            });
        }
        const cancelledBooking = yield prisma.booking.update({
            where: { id },
            data: { status: types_1.BookingStatus.CANCELLED },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
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
            }
        });
        res.json({
            success: true,
            data: cancelledBooking,
            message: 'Booking cancelled successfully'
        });
    }
    catch (error) {
        console.error('Booking cancellation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/bookings/my-bookings
 * Get current user's bookings
 */
router.get('/my-bookings', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { status, upcoming = 'false' } = req.query;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }
        const where = { userId };
        if (status)
            where.status = status;
        if (upcoming === 'true') {
            where.startDate = { gte: new Date() };
        }
        const bookings = yield prisma.booking.findMany({
            where,
            include: {
                facility: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        location: true,
                        state: true,
                        city: true,
                        images: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        roomNumber: true,
                        type: true,
                        capacity: true,
                        images: true,
                        pricePerNight: true
                    }
                }
            },
            orderBy: { startDate: 'asc' }
        });
        res.json({
            success: true,
            data: bookings
        });
    }
    catch (error) {
        console.error('My bookings fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/bookings/calendar
 * Get calendar view data
 */
router.get('/calendar', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start, end, facilityId, roomId } = req.query;
        if (!start || !end) {
            return res.status(400).json({
                success: false,
                error: 'Start and end dates are required'
            });
        }
        const where = {
            startDate: { gte: new Date(start) },
            endDate: { lte: new Date(end) },
            status: { in: ['PENDING', 'CONFIRMED'] }
        };
        if (facilityId)
            where.facilityId = facilityId;
        if (roomId)
            where.roomId = roomId;
        const bookings = yield prisma.booking.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
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
            orderBy: { startDate: 'asc' }
        });
        // Transform bookings to calendar events
        const events = bookings.map(booking => {
            var _a, _b;
            return ({
                id: booking.id,
                title: `${((_a = booking.facility) === null || _a === void 0 ? void 0 : _a.name) || ((_b = booking.room) === null || _b === void 0 ? void 0 : _b.name)} - ${booking.user.name}`,
                start: booking.startDate,
                end: booking.endDate,
                type: 'booking',
                status: booking.status,
                color: booking.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
                extendedProps: {
                    booking,
                    bookingType: booking.bookingType,
                    guestsCount: booking.guestsCount,
                    totalAmount: booking.totalAmount
                }
            });
        });
        res.json({
            success: true,
            data: events
        });
    }
    catch (error) {
        console.error('Calendar data fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
