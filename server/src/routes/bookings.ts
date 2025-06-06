import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize, auditLog, checkResourcePermission } from '../middleware/auth';
import { UserRole, BookingType, BookingStatus, CreateBookingRequest, UpdateBookingRequest, BookingFilters, PaginationParams } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/bookings
 * List bookings with filters and pagination
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      facilityId,
      roomId,
      bookingType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as BookingFilters & PaginationParams;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    
    // Non-admin users can only see their own bookings
    if (req.user?.role !== UserRole.ADMIN) {
      where.userId = req.user?.id;
    } else if (userId) {
      where.userId = userId;
    }
    
    if (facilityId) where.facilityId = facilityId;
    if (roomId) where.roomId = roomId;
    if (bookingType) where.bookingType = bookingType;
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) }
        }
      ];
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
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
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/bookings
 * Create new booking
 */
router.post('/',
  authenticateToken,
  auditLog('CREATE', 'BOOKING'),
  async (req: Request, res: Response) => {
    try {
      const data: CreateBookingRequest = req.body;
      const userId = req.user?.id;

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

      if (!Object.values(BookingType).includes(data.bookingType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid booking type'
        });
      }

      // Validate that either facilityId or roomId is provided based on booking type
      if (data.bookingType === BookingType.GROUND && !data.facilityId) {
        return res.status(400).json({
          success: false,
          error: 'Facility ID is required for ground bookings'
        });
      }

      if (data.bookingType === BookingType.ROOM && !data.roomId) {
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
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          ...(data.facilityId && { facilityId: data.facilityId }),
          ...(data.roomId && { roomId: data.roomId }),
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        }
      });

      if (conflictingBookings.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'The selected dates are not available'
        });
      }

      // Calculate total amount if room booking
      let totalAmount = 0;
      if (data.bookingType === BookingType.ROOM && data.roomId) {
        const room = await prisma.room.findUnique({
          where: { id: data.roomId },
          select: { pricePerNight: true }
        });

        if (room?.pricePerNight) {
          const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          totalAmount = Number(room.pricePerNight) * nights;
        }
      }

      const booking = await prisma.booking.create({
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
          status: BookingStatus.PENDING
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
    } catch (error) {
      console.error('Booking creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/bookings/:id
 * Get booking details by ID
 */
router.get('/:id',
  authenticateToken,
  checkResourcePermission('bookings', 'read', async (req) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: { userId: true }
    });
    return booking?.userId || null;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
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
    } catch (error) {
      console.error('Booking fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/bookings/:id
 * Update booking
 */
router.put('/:id',
  authenticateToken,
  checkResourcePermission('bookings', 'update', async (req) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: { userId: true }
    });
    return booking?.userId || null;
  }),
  auditLog('UPDATE', 'BOOKING'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateBookingRequest = req.body;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id }
      });

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      // Only allow updates if booking is pending or user is admin
      if (existingBooking.status !== BookingStatus.PENDING && req.user?.role !== UserRole.ADMIN) {
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
        const conflictingBookings = await prisma.booking.findMany({
          where: {
            id: { not: id }, // Exclude current booking
            ...(existingBooking.facilityId && { facilityId: existingBooking.facilityId }),
            ...(existingBooking.roomId && { roomId: existingBooking.roomId }),
            status: { in: ['PENDING', 'CONFIRMED'] },
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          }
        });

        if (conflictingBookings.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'The selected dates are not available'
          });
        }
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
          ...(data.startTime && { startTime: new Date(`1970-01-01T${data.startTime}:00Z`) }),
          ...(data.endTime && { endTime: new Date(`1970-01-01T${data.endTime}:00Z`) }),
          ...(data.guestsCount !== undefined && { guestsCount: data.guestsCount }),
          ...(data.specialRequests !== undefined && { specialRequests: data.specialRequests }),
          ...(data.status && req.user?.role === UserRole.ADMIN && { status: data.status })
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

      res.json({
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully'
      });
    } catch (error) {
      console.error('Booking update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/bookings/:id
 * Cancel booking
 */
router.delete('/:id',
  authenticateToken,
  checkResourcePermission('bookings', 'cancel', async (req) => {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      select: { userId: true }
    });
    return booking?.userId || null;
  }),
  auditLog('CANCEL', 'BOOKING'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const booking = await prisma.booking.findUnique({
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

      const cancelledBooking = await prisma.booking.update({
        where: { id },
        data: { status: BookingStatus.CANCELLED },
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
    } catch (error) {
      console.error('Booking cancellation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/bookings/my-bookings
 * Get current user's bookings
 */
router.get('/my-bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, upcoming = 'false' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const where: any = { userId };

    if (status) where.status = status;
    if (upcoming === 'true') {
      where.startDate = { gte: new Date() };
    }

    const bookings = await prisma.booking.findMany({
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
  } catch (error) {
    console.error('My bookings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/bookings/calendar
 * Get calendar view data
 */
router.get('/calendar', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { start, end, facilityId, roomId } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }

    const where: any = {
      startDate: { gte: new Date(start as string) },
      endDate: { lte: new Date(end as string) },
      status: { in: ['PENDING', 'CONFIRMED'] }
    };

    if (facilityId) where.facilityId = facilityId;
    if (roomId) where.roomId = roomId;

    const bookings = await prisma.booking.findMany({
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
    const events = bookings.map(booking => ({
      id: booking.id,
      title: `${booking.facility?.name || booking.room?.name} - ${booking.user.name}`,
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
    }));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Calendar data fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
