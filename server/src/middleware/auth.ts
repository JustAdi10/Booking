import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        firebaseUid: string;
        email: string;
        name: string;
        role: UserRole;
        isActive: boolean;
      };
    }
  }
}

/**
 * Middleware to authenticate Firebase token and attach user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user has required permissions
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check specific permissions for resources
 */
export const checkResourcePermission = (
  resource: string,
  action: string,
  getResourceOwnerId?: (req: Request) => Promise<string | null>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { role, id: userId } = req.user;

      // Admin has access to everything
      if (role === UserRole.ADMIN) {
        next();
        return;
      }

      // Check role-based permissions
      const permissions = getRolePermissions(role);
      const resourcePermissions = permissions[resource];

      if (!resourcePermissions || !resourcePermissions.includes(action)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }

      // For actions that require ownership check
      if (action.includes('own') && getResourceOwnerId) {
        const resourceOwnerId = await getResourceOwnerId(req);
        
        if (resourceOwnerId !== userId) {
          res.status(403).json({
            success: false,
            error: 'Access denied: You can only access your own resources'
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Get permissions for a specific role
 */
function getRolePermissions(role: UserRole): Record<string, string[]> {
  const permissions: Record<UserRole, Record<string, string[]>> = {
    [UserRole.ADMIN]: {
      facilities: ['create', 'read', 'update', 'delete'],
      rooms: ['create', 'read', 'update', 'delete'],
      bookings: ['create', 'read', 'update', 'delete', 'approve'],
      housekeeping: ['create', 'read', 'update', 'delete', 'assign'],
      meals: ['create', 'read', 'update', 'delete', 'auto-generate'],
      users: ['create', 'read', 'update', 'delete', 'change-role'],
      reports: ['read', 'export'],
      notifications: ['send', 'read']
    },
    [UserRole.HOUSEKEEPING]: {
      facilities: ['read'],
      rooms: ['read'],
      bookings: ['read'],
      housekeeping: ['read', 'update-assigned'],
      meals: ['read'],
      users: ['read-self'],
      reports: ['read-own'],
      notifications: ['read']
    },
    [UserRole.USER]: {
      facilities: ['read'],
      rooms: ['read'],
      bookings: ['create', 'read-own', 'update-own', 'cancel-own'],
      housekeeping: [],
      meals: ['read'],
      users: ['read-self', 'update-self'],
      reports: [],
      notifications: ['read-own']
    }
  };

  return permissions[role] || {};
}

/**
 * Middleware to log user actions for audit trail
 */
export const auditLog = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Store original res.json to capture response
      const originalJson = res.json;
      let responseData: any;

      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Continue with the request
      next();

      // Log after response is sent
      res.on('finish', async () => {
        try {
          if (req.user && res.statusCode < 400) {
            const entityId = req.params.id || responseData?.data?.id || 'unknown';
            
            await prisma.auditLog.create({
              data: {
                userId: req.user.id,
                action,
                entityType,
                entityId,
                oldValues: req.method === 'PUT' ? req.body.oldValues : null,
                newValues: req.method !== 'GET' ? req.body : null,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
              }
            });
          }
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }

    const current = requests.get(key);
    
    if (!current) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (current.resetTime < now) {
      // Reset window
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (current.count >= max) {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
      return;
    }

    current.count++;
    next();
  };
};

/**
 * Middleware to validate request body against schema
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.body, { abortEarly: false });
      
      if (error) {
        const errors: Record<string, string[]> = {};
        
        error.details.forEach((detail: any) => {
          const field = detail.path.join('.');
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(detail.message);
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors
        });
        return;
      }

      req.body = value;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  // Prisma errors
  if (error.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: 'Resource already exists'
    });
    return;
  }

  if (error.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
