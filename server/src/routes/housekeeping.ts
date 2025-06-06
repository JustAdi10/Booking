import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize, auditLog, checkResourcePermission } from '../middleware/auth';
import { UserRole, HousekeepingTaskType, TaskPriority, HousekeepingTaskStatus, CreateHousekeepingTaskRequest, UpdateHousekeepingTaskRequest, HousekeepingTaskFilters, PaginationParams } from '../types';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/housekeeping/tasks
 * List housekeeping tasks with filters and pagination
 */
router.get('/tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      assignedTo,
      roomId,
      taskType,
      priority,
      status,
      deadline,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as HousekeepingTaskFilters & PaginationParams;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where: any = {};
    
    // Housekeeping staff can only see their assigned tasks
    if (req.user?.role === UserRole.HOUSEKEEPING) {
      where.assignedTo = req.user.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }
    
    if (roomId) where.roomId = roomId;
    if (taskType) where.taskType = taskType;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (deadline) {
      where.deadline = { lte: new Date(deadline) };
    }

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
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
  } catch (error) {
    console.error('Housekeeping tasks fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/housekeeping/tasks
 * Create housekeeping task (Admin only)
 */
router.post('/tasks',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('CREATE', 'HOUSEKEEPING_TASK'),
  async (req: Request, res: Response) => {
    try {
      const data: CreateHousekeepingTaskRequest = req.body;

      // Validate required fields
      if (!data.roomId || !data.assignedTo || !data.taskType) {
        return res.status(400).json({
          success: false,
          error: 'Room ID, assigned user, and task type are required'
        });
      }

      // Validate enums
      if (!Object.values(HousekeepingTaskType).includes(data.taskType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task type'
        });
      }

      if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid priority'
        });
      }

      // Check if room exists
      const room = await prisma.room.findUnique({
        where: { id: data.roomId }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          error: 'Room not found'
        });
      }

      // Check if assigned user exists and has housekeeping role
      const assignedUser = await prisma.user.findUnique({
        where: { id: data.assignedTo }
      });

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          error: 'Assigned user not found'
        });
      }

      if (assignedUser.role !== UserRole.HOUSEKEEPING && assignedUser.role !== UserRole.ADMIN) {
        return res.status(400).json({
          success: false,
          error: 'User must have housekeeping or admin role'
        });
      }

      const task = await prisma.housekeepingTask.create({
        data: {
          roomId: data.roomId,
          assignedTo: data.assignedTo,
          taskType: data.taskType,
          priority: data.priority || TaskPriority.MEDIUM,
          description: data.description,
          deadline: data.deadline ? new Date(data.deadline) : null,
          status: HousekeepingTaskStatus.PENDING
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
    } catch (error) {
      console.error('Housekeeping task creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/housekeeping/tasks/:id
 * Get housekeeping task details by ID
 */
router.get('/tasks/:id',
  authenticateToken,
  checkResourcePermission('housekeeping', 'read', async (req) => {
    const task = await prisma.housekeepingTask.findUnique({
      where: { id: req.params.id },
      select: { assignedTo: true }
    });
    return task?.assignedTo || null;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const task = await prisma.housekeepingTask.findUnique({
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
    } catch (error) {
      console.error('Housekeeping task fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/housekeeping/tasks/:id
 * Update housekeeping task
 */
router.put('/tasks/:id',
  authenticateToken,
  checkResourcePermission('housekeeping', 'update', async (req) => {
    const task = await prisma.housekeepingTask.findUnique({
      where: { id: req.params.id },
      select: { assignedTo: true }
    });
    return task?.assignedTo || null;
  }),
  auditLog('UPDATE', 'HOUSEKEEPING_TASK'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateHousekeepingTaskRequest = req.body;

      // Check if task exists
      const existingTask = await prisma.housekeepingTask.findUnique({
        where: { id }
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          error: 'Housekeeping task not found'
        });
      }

      // Validate enums if provided
      if (data.taskType && !Object.values(HousekeepingTaskType).includes(data.taskType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid task type'
        });
      }

      if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid priority'
        });
      }

      if (data.status && !Object.values(HousekeepingTaskStatus).includes(data.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      // Set completion timestamp if status is being changed to completed
      const updateData: any = {
        ...(data.taskType && { taskType: data.taskType }),
        ...(data.priority && { priority: data.priority }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.completionNotes !== undefined && { completionNotes: data.completionNotes }),
        ...(data.images !== undefined && { images: data.images })
      };

      if (data.status) {
        updateData.status = data.status;
        if (data.status === HousekeepingTaskStatus.COMPLETED && existingTask.status !== HousekeepingTaskStatus.COMPLETED) {
          updateData.completedAt = new Date();
        }
      }

      const updatedTask = await prisma.housekeepingTask.update({
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
    } catch (error) {
      console.error('Housekeeping task update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * DELETE /api/housekeeping/tasks/:id
 * Delete housekeeping task (Admin only)
 */
router.delete('/tasks/:id',
  authenticateToken,
  authorize([UserRole.ADMIN]),
  auditLog('DELETE', 'HOUSEKEEPING_TASK'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const task = await prisma.housekeepingTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Housekeeping task not found'
        });
      }

      await prisma.housekeepingTask.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Housekeeping task deleted successfully'
      });
    } catch (error) {
      console.error('Housekeeping task deletion error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * PUT /api/housekeeping/tasks/:id/status
 * Update task status (for housekeeping staff)
 */
router.put('/tasks/:id/status',
  authenticateToken,
  checkResourcePermission('housekeeping', 'update-assigned', async (req) => {
    const task = await prisma.housekeepingTask.findUnique({
      where: { id: req.params.id },
      select: { assignedTo: true }
    });
    return task?.assignedTo || null;
  }),
  auditLog('UPDATE_STATUS', 'HOUSEKEEPING_TASK'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, completionNotes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      if (!Object.values(HousekeepingTaskStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const existingTask = await prisma.housekeepingTask.findUnique({
        where: { id }
      });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          error: 'Housekeeping task not found'
        });
      }

      const updateData: any = { status };

      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }

      if (status === HousekeepingTaskStatus.COMPLETED && existingTask.status !== HousekeepingTaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updatedTask = await prisma.housekeepingTask.update({
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
    } catch (error) {
      console.error('Task status update error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * POST /api/housekeeping/tasks/:id/images
 * Upload task images
 */
router.post('/tasks/:id/images',
  authenticateToken,
  checkResourcePermission('housekeeping', 'update-assigned', async (req) => {
    const task = await prisma.housekeepingTask.findUnique({
      where: { id: req.params.id },
      select: { assignedTo: true }
    });
    return task?.assignedTo || null;
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { images } = req.body;

      if (!images || !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          error: 'Images array is required'
        });
      }

      const task = await prisma.housekeepingTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Housekeeping task not found'
        });
      }

      // Merge with existing images
      const existingImages = (task.images as string[]) || [];
      const updatedImages = [...existingImages, ...images];

      const updatedTask = await prisma.housekeepingTask.update({
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
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

/**
 * GET /api/housekeeping/my-tasks
 * Get tasks assigned to current user
 */
router.get('/my-tasks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, priority } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const where: any = { assignedTo: userId };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.housekeepingTask.findMany({
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
  } catch (error) {
    console.error('My tasks fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/housekeeping/history
 * Get housekeeping history
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomId, assignedTo, startDate, endDate, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      status: HousekeepingTaskStatus.COMPLETED
    };

    // Non-admin users can only see their own history
    if (req.user?.role !== UserRole.ADMIN) {
      where.assignedTo = req.user?.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (roomId) where.roomId = roomId;

    if (startDate && endDate) {
      where.completedAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [tasks, total] = await Promise.all([
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
  } catch (error) {
    console.error('Housekeeping history fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
