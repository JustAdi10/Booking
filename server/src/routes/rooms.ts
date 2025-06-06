import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize, auditLog } from '../middleware/auth';
import { UserRole, RoomType, UpdateRoomRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/rooms/:id
 * Get room details by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
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
  } catch (error) {
    console.error('Room fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/rooms/:id
 * Update room (Admin only)
 */
router.put('/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('UPDATE', 'ROOM'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateRoomRequest = req.body;

      // Check if room exists
      const existingRoom = await prisma.room.findUnique({
        where: { id }
      });

      if (!existingRoom) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      // Validate room type if provided
      if (data.type && !Object.values(RoomType).includes(data.type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid room type'
        });
      }

      const updatedRoom = await prisma.room.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.roomNumber !== undefined && { roomNumber: data.roomNumber }),
          ...(data.type && { type: data.type }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.floorNumber !== undefined && { floorNumber: data.floorNumber }),
          ...(data.amenities !== undefined && { amenities: data.amenities }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.pricePerNight !== undefined && { pricePerNight: data.pricePerNight }),
          ...(data.isActive !== undefined && { isActive: data.isActive })
        },
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
    } catch (error) {
      console.error('Room update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/rooms/:id
 * Delete room (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('DELETE', 'ROOM'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if room exists
      const room = await prisma.room.findUnique({
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

      await prisma.room.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      console.error('Room deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/rooms/:id/availability
 * Check room availability for date range
 */
router.get('/:id/availability', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const room = await prisma.room.findUnique({
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
    const bookings = await prisma.booking.findMany({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startDate: { lte: new Date(endDate as string) },
            endDate: { gte: new Date(startDate as string) }
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
    const housekeepingTasks = await prisma.housekeepingTask.findMany({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
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
  } catch (error) {
    console.error('Room availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
