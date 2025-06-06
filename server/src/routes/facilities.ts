import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize, auditLog } from '../middleware/auth';
import { UserRole, FacilityType, CreateFacilityRequest, UpdateFacilityRequest, FacilityFilters, PaginationParams } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/facilities
 * List facilities with filters and pagination
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      type,
      state,
      city,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as FacilityFilters & PaginationParams;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    
    if (type) where.type = type;
    if (state) where.state = state;
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = String(isActive) === 'true';
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get facilities with pagination
    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        include: {
          rooms: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              capacity: true,
              pricePerNight: true
            }
          },
          _count: {
            select: {
              rooms: true,
              bookings: true
            }
          }
        },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.facility.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: facilities,
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
    console.error('Facilities fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/facilities
 * Create new facility (Admin only)
 */
router.post('/', 
  authenticateToken, 
  authorize([UserRole.ADMIN]),
  auditLog('CREATE', 'FACILITY'),
  async (req: Request, res: Response) => {
    try {
      const data: CreateFacilityRequest = req.body;

      // Validate required fields
      if (!data.name || !data.type) {
        return res.status(400).json({
          success: false,
          error: 'Name and type are required'
        });
      }

      if (!Object.values(FacilityType).includes(data.type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid facility type'
        });
      }

      const facility = await prisma.facility.create({
        data: {
          name: data.name,
          type: data.type,
          description: data.description,
          location: data.location,
          state: data.state,
          city: data.city,
          address: data.address,
          capacity: data.capacity,
          amenities: data.amenities || [],
          images: data.images || []
        },
        include: {
          rooms: true,
          _count: {
            select: {
              rooms: true,
              bookings: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: facility,
        message: 'Facility created successfully'
      });
    } catch (error) {
      console.error('Facility creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/facilities/:id
 * Get facility details by ID
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
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
        _count: {
          select: {
            rooms: true,
            bookings: true
          }
        }
      }
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found'
      });
    }

    res.json({
      success: true,
      data: facility
    });
  } catch (error) {
    console.error('Facility fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/facilities/:id
 * Update facility (Admin only)
 */
router.put('/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('UPDATE', 'FACILITY'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateFacilityRequest = req.body;

      // Check if facility exists
      const existingFacility = await prisma.facility.findUnique({
        where: { id }
      });

      if (!existingFacility) {
        return res.status(404).json({
          success: false,
          error: 'Facility not found'
        });
      }

      // Validate facility type if provided
      if (data.type && !Object.values(FacilityType).includes(data.type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid facility type'
        });
      }

      const updatedFacility = await prisma.facility.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.type && { type: data.type }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.amenities !== undefined && { amenities: data.amenities }),
          ...(data.images !== undefined && { images: data.images }),
          ...(data.isActive !== undefined && { isActive: data.isActive })
        },
        include: {
          rooms: true,
          _count: {
            select: {
              rooms: true,
              bookings: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: updatedFacility,
        message: 'Facility updated successfully'
      });
    } catch (error) {
      console.error('Facility update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/facilities/:id
 * Delete facility (Admin only)
 */
router.delete('/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('DELETE', 'FACILITY'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if facility exists
      const facility = await prisma.facility.findUnique({
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

      if (!facility) {
        return res.status(404).json({
          success: false,
          error: 'Facility not found'
        });
      }

      // Check for active bookings
      if (facility._count.bookings > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete facility with active bookings'
        });
      }

      await prisma.facility.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Facility deleted successfully'
      });
    } catch (error) {
      console.error('Facility deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/facilities/:id/availability
 * Check facility availability for date range
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

    const facility = await prisma.facility.findUnique({
      where: { id }
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found'
      });
    }

    // Get bookings for the date range
    const bookings = await prisma.booking.findMany({
      where: {
        facilityId: id,
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

    res.json({
      success: true,
      data: {
        facility,
        bookings,
        isAvailable: bookings.length === 0
      }
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/facilities/:id/rooms
 * List rooms in facility
 */
router.get('/:id/rooms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive = 'true' } = req.query;

    const facility = await prisma.facility.findUnique({
      where: { id }
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        error: 'Facility not found'
      });
    }

    const rooms = await prisma.room.findMany({
      where: {
        facilityId: id,
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      },
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
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Rooms fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/facilities/:id/rooms
 * Add room to facility (Admin only)
 */
router.post('/:id/rooms',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('CREATE', 'ROOM'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Check if facility exists and is a building
      const facility = await prisma.facility.findUnique({
        where: { id }
      });

      if (!facility) {
        return res.status(404).json({
          success: false,
          error: 'Facility not found'
        });
      }

      if (facility.type !== FacilityType.BUILDING) {
        return res.status(400).json({
          success: false,
          error: 'Rooms can only be added to buildings'
        });
      }

      // Validate required fields
      if (!data.name || !data.type || !data.capacity) {
        return res.status(400).json({
          success: false,
          error: 'Name, type, and capacity are required'
        });
      }

      const room = await prisma.room.create({
        data: {
          facilityId: id,
          name: data.name,
          roomNumber: data.roomNumber,
          type: data.type,
          capacity: data.capacity,
          floorNumber: data.floorNumber,
          amenities: data.amenities || [],
          images: data.images || [],
          pricePerNight: data.pricePerNight
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

      res.status(201).json({
        success: true,
        data: room,
        message: 'Room created successfully'
      });
    } catch (error) {
      console.error('Room creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
