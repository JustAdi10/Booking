import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/reports/usage
 * Usage reports (Admin only)
 */
router.get('/usage', 
  authenticateToken, 
  authorize([UserRole.ADMIN]), 
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, facilityId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        });
      }

      const where: any = {
        startDate: { gte: new Date(startDate as string) },
        endDate: { lte: new Date(endDate as string) },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      };

      if (facilityId) where.facilityId = facilityId;

      const bookings = await prisma.booking.findMany({
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
      const facilityUsage: Record<string, any> = {};

      bookings.forEach(booking => {
        const facilityKey = booking.facility?.id || 'unknown';
        
        if (!facilityUsage[facilityKey]) {
          facilityUsage[facilityKey] = {
            facilityId: booking.facility?.id,
            facilityName: booking.facility?.name || 'Unknown',
            totalBookings: 0,
            totalRevenue: 0,
            totalDays: 0
          };
        }

        facilityUsage[facilityKey].totalBookings++;
        facilityUsage[facilityKey].totalRevenue += Number(booking.totalAmount || 0);
        
        const days = Math.ceil(
          (booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        facilityUsage[facilityKey].totalDays += days;
      });

      const usageReports = Object.values(facilityUsage).map((usage: any) => ({
        ...usage,
        averageStayDuration: usage.totalDays / usage.totalBookings || 0,
        occupancyRate: 0 // TODO: Calculate based on total available days
      }));

      res.json({
        success: true,
        data: usageReports,
        period: {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        }
      });
    } catch (error) {
      console.error('Usage report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/reports/bookings
 * Booking reports (Admin only)
 */
router.get('/bookings',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
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
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };

      const [
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        revenueData,
        topFacilities
      ] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
        prisma.booking.aggregate({
          where: { ...where, status: { in: ['CONFIRMED', 'COMPLETED'] } },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true }
        }),
        prisma.booking.groupBy({
          by: ['facilityId'],
          where: { ...where, status: { in: ['CONFIRMED', 'COMPLETED'] } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      ]);

      // Get facility names for top facilities
      const facilityIds = topFacilities.map(f => f.facilityId).filter(Boolean);
      const facilities = await prisma.facility.findMany({
        where: { id: { in: facilityIds as string[] } },
        select: { id: true, name: true }
      });

      const topFacilitiesWithNames = topFacilities.map(tf => {
        const facility = facilities.find(f => f.id === tf.facilityId);
        return {
          facilityId: tf.facilityId,
          facilityName: facility?.name || 'Unknown',
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
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        }
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Booking report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/reports/housekeeping
 * Housekeeping reports (Admin only)
 */
router.get('/housekeeping',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
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
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };

      const [
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        tasksByPriority,
        tasksByType,
        completionTimes
      ] = await Promise.all([
        prisma.housekeepingTask.count({ where }),
        prisma.housekeepingTask.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.housekeepingTask.count({ where: { ...where, status: 'PENDING' } }),
        prisma.housekeepingTask.count({
          where: {
            ...where,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            deadline: { lt: new Date() }
          }
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
          where: {
            ...where,
            status: 'COMPLETED',
            completedAt: { not: null }
          },
          select: {
            createdAt: true,
            completedAt: true
          }
        })
      ]);

      // Calculate average completion time
      const completionTimesMs = completionTimes
        .filter(task => task.completedAt)
        .map(task => task.completedAt!.getTime() - task.createdAt.getTime());
      
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
        }, {} as Record<string, number>),
        tasksByType: tasksByType.reduce((acc, item) => {
          acc[item.taskType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        period: {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        }
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Housekeeping report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/reports/export
 * Export reports (Admin only)
 */
router.post('/export',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
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
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
