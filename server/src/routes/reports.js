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
 * GET /api/reports/usage
 * Usage reports (Admin only)
 */
router.get('/usage', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, facilityId } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        const where = {
            startDate: { gte: new Date(startDate) },
            endDate: { lte: new Date(endDate) },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        };
        if (facilityId)
            where.facilityId = facilityId;
        const bookings = yield prisma.booking.findMany({
            where,
            include: {
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
                        roomNumber: true
                    }
                }
            }
        });
        // Calculate usage statistics
        const facilityUsage = {};
        bookings.forEach(booking => {
            var _a, _b, _c;
            const facilityKey = ((_a = booking.facility) === null || _a === void 0 ? void 0 : _a.id) || 'unknown';
            if (!facilityUsage[facilityKey]) {
                facilityUsage[facilityKey] = {
                    facilityId: (_b = booking.facility) === null || _b === void 0 ? void 0 : _b.id,
                    facilityName: ((_c = booking.facility) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown',
                    totalBookings: 0,
                    totalRevenue: 0,
                    totalDays: 0
                };
            }
            facilityUsage[facilityKey].totalBookings++;
            facilityUsage[facilityKey].totalRevenue += Number(booking.totalAmount || 0);
            const days = Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24));
            facilityUsage[facilityKey].totalDays += days;
        });
        const usageReports = Object.values(facilityUsage).map((usage) => (Object.assign(Object.assign({}, usage), { averageStayDuration: usage.totalDays / usage.totalBookings || 0, occupancyRate: 0 // TODO: Calculate based on total available days
         })));
        res.json({
            success: true,
            data: usageReports,
            period: {
                start: new Date(startDate),
                end: new Date(endDate)
            }
        });
    }
    catch (error) {
        console.error('Usage report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/reports/bookings
 * Booking reports (Admin only)
 */
router.get('/bookings', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        const where = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };
        const [totalBookings, confirmedBookings, cancelledBookings, pendingBookings, revenueData, topFacilities] = yield Promise.all([
            prisma.booking.count({ where }),
            prisma.booking.count({ where: Object.assign(Object.assign({}, where), { status: 'CONFIRMED' }) }),
            prisma.booking.count({ where: Object.assign(Object.assign({}, where), { status: 'CANCELLED' }) }),
            prisma.booking.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            prisma.booking.aggregate({
                where: Object.assign(Object.assign({}, where), { status: { in: ['CONFIRMED', 'COMPLETED'] } }),
                _sum: { totalAmount: true },
                _avg: { totalAmount: true }
            }),
            prisma.booking.groupBy({
                by: ['facilityId'],
                where: Object.assign(Object.assign({}, where), { status: { in: ['CONFIRMED', 'COMPLETED'] } }),
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            })
        ]);
        // Get facility names for top facilities
        const facilityIds = topFacilities.map(f => f.facilityId).filter(Boolean);
        const facilities = yield prisma.facility.findMany({
            where: { id: { in: facilityIds } },
            select: { id: true, name: true }
        });
        const topFacilitiesWithNames = topFacilities.map(tf => {
            const facility = facilities.find(f => f.id === tf.facilityId);
            return {
                facilityId: tf.facilityId,
                facilityName: (facility === null || facility === void 0 ? void 0 : facility.name) || 'Unknown',
                bookingCount: tf._count.id
            };
        });
        const report = {
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            pendingBookings,
            totalRevenue: Number(revenueData._sum.totalAmount || 0),
            averageBookingValue: Number(revenueData._avg.totalAmount || 0),
            topFacilities: topFacilitiesWithNames,
            period: {
                start: new Date(startDate),
                end: new Date(endDate)
            }
        };
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Booking report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * GET /api/reports/housekeeping
 * Housekeeping reports (Admin only)
 */
router.get('/housekeeping', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }
        const where = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };
        const [totalTasks, completedTasks, pendingTasks, overdueTasks, tasksByPriority, tasksByType, completionTimes] = yield Promise.all([
            prisma.housekeepingTask.count({ where }),
            prisma.housekeepingTask.count({ where: Object.assign(Object.assign({}, where), { status: 'COMPLETED' }) }),
            prisma.housekeepingTask.count({ where: Object.assign(Object.assign({}, where), { status: 'PENDING' }) }),
            prisma.housekeepingTask.count({
                where: Object.assign(Object.assign({}, where), { status: { in: ['PENDING', 'IN_PROGRESS'] }, deadline: { lt: new Date() } })
            }),
            prisma.housekeepingTask.groupBy({
                by: ['priority'],
                where,
                _count: { id: true }
            }),
            prisma.housekeepingTask.groupBy({
                by: ['taskType'],
                where,
                _count: { id: true }
            }),
            prisma.housekeepingTask.findMany({
                where: Object.assign(Object.assign({}, where), { status: 'COMPLETED', completedAt: { not: null } }),
                select: {
                    createdAt: true,
                    completedAt: true
                }
            })
        ]);
        // Calculate average completion time
        const completionTimesMs = completionTimes
            .filter(task => task.completedAt)
            .map(task => task.completedAt.getTime() - task.createdAt.getTime());
        const averageCompletionTime = completionTimesMs.length > 0
            ? completionTimesMs.reduce((sum, time) => sum + time, 0) / completionTimesMs.length / (1000 * 60 * 60) // Convert to hours
            : 0;
        const report = {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            averageCompletionTime,
            tasksByPriority: tasksByPriority.reduce((acc, item) => {
                acc[item.priority] = item._count.id;
                return acc;
            }, {}),
            tasksByType: tasksByType.reduce((acc, item) => {
                acc[item.taskType] = item._count.id;
                return acc;
            }, {}),
            period: {
                start: new Date(startDate),
                end: new Date(endDate)
            }
        };
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Housekeeping report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
/**
 * POST /api/reports/export
 * Export reports (Admin only)
 */
router.post('/export', auth_1.authenticateToken, (0, auth_1.authorize)([types_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reportType, format, startDate, endDate } = req.body;
        if (!reportType || !format || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Report type, format, start date, and end date are required'
            });
        }
        // TODO: Implement actual export functionality
        // This would typically involve generating PDF/Excel files
        res.json({
            success: true,
            message: 'Export functionality will be implemented',
            data: {
                reportType,
                format,
                startDate,
                endDate,
                downloadUrl: null // Will be populated when implemented
            }
        });
    }
    catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}));
exports.default = router;
