# 🏏 Cricket Ground & Room Booking System - Comprehensive Architecture

## 🎯 **System Overview**

A comprehensive booking system with facility management, housekeeping, meal planning, and user access control.

### **Core Modules:**
- ✅ Facility Management (Grounds, Buildings, Rooms)
- ✅ Booking Calendar (Grid/Calendar views)
- ✅ Housekeeping Management (Tasks, Status, Images)
- ✅ Meal Planning (Auto-generation, Manual override)
- ✅ Reporting (Usage, Export capabilities)
- ✅ User App (Availability, Bookings, Notifications)
- ✅ Authentication & Authorization (Role-based access)
- ✅ Push Notifications & Data Sync

---

## 🛠️ **Recommended Tech Stack**

### **Web Platform:**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **State Management:** Zustand + React Query (TanStack Query)
- **Calendar:** FullCalendar.js or React Big Calendar
- **Charts:** Recharts or Chart.js
- **File Upload:** React Dropzone + Cloudinary/AWS S3

### **Mobile Platform:**
- **Cross-Platform:** React Native + Expo
- **Navigation:** React Navigation v6
- **State Management:** Zustand + React Query
- **Push Notifications:** Expo Notifications + Firebase Cloud Messaging
- **Offline Storage:** AsyncStorage + SQLite (expo-sqlite)

### **Backend:**
- **Runtime:** Node.js + Express + TypeScript
- **Database:** MySQL 8.0 + Prisma ORM
- **Authentication:** Firebase Admin SDK
- **File Storage:** AWS S3 or Cloudinary
- **Push Notifications:** Firebase Cloud Messaging
- **API Documentation:** Swagger/OpenAPI
- **Caching:** Redis
- **Queue:** Bull Queue (for background tasks)

### **DevOps & Infrastructure:**
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** AWS/DigitalOcean/Vercel
- **Monitoring:** Sentry + Winston Logger
- **Database Backup:** Automated MySQL backups

---

## 🗄️ **Database Schema**

### **Core Tables:**

```sql
-- Users and Authentication
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('ADMIN', 'HOUSEKEEPING', 'USER') DEFAULT 'USER',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Facilities (Grounds and Buildings)
CREATE TABLE facilities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('GROUND', 'BUILDING') NOT NULL,
    description TEXT,
    location VARCHAR(255),
    state VARCHAR(100),
    city VARCHAR(100),
    address TEXT,
    capacity INT,
    amenities JSON, -- Store amenities as JSON array
    images JSON, -- Store image URLs as JSON array
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms (Sub-facilities linked to buildings)
CREATE TABLE rooms (
    id VARCHAR(36) PRIMARY KEY,
    facility_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    type ENUM('SINGLE', 'DOUBLE', 'SUITE', 'DORMITORY') NOT NULL,
    capacity INT NOT NULL,
    floor_number INT,
    amenities JSON,
    images JSON,
    price_per_night DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    facility_id VARCHAR(36),
    room_id VARCHAR(36),
    booking_type ENUM('GROUND', 'ROOM') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    guests_count INT DEFAULT 1,
    total_amount DECIMAL(10,2),
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- Housekeeping Tasks
CREATE TABLE housekeeping_tasks (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    assigned_to VARCHAR(36) NOT NULL,
    task_type ENUM('CLEANING', 'MAINTENANCE', 'INSPECTION') DEFAULT 'CLEANING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REPAIR') DEFAULT 'PENDING',
    description TEXT,
    deadline DATETIME,
    completion_notes TEXT,
    images JSON, -- Before/after cleaning images
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- Meal Plans
CREATE TABLE meal_plans (
    id VARCHAR(36) PRIMARY KEY,
    date DATE NOT NULL,
    meal_type ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS') NOT NULL,
    menu_items JSON NOT NULL, -- Array of menu items
    estimated_quantity INT NOT NULL,
    actual_quantity INT,
    cost_per_person DECIMAL(8,2),
    total_cost DECIMAL(10,2),
    notes TEXT,
    is_auto_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_meal (date, meal_type)
);

-- Notifications
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('BOOKING', 'HOUSEKEEPING', 'MEAL', 'SYSTEM') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    is_read BOOLEAN DEFAULT FALSE,
    is_push_sent BOOLEAN DEFAULT FALSE,
    related_id VARCHAR(36), -- ID of related booking/task/etc
    related_type VARCHAR(50), -- Type of related entity
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Push Notification Tokens
CREATE TABLE push_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    platform ENUM('WEB', 'IOS', 'ANDROID') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_token (user_id, token)
);

-- System Settings
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT,
    updated_by VARCHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit Logs
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### **Indexes for Performance:**
```sql
-- Booking queries
CREATE INDEX idx_bookings_date_range ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_facility ON bookings(facility_id, start_date);
CREATE INDEX idx_bookings_room ON bookings(room_id, start_date);
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at);

-- Housekeeping queries
CREATE INDEX idx_housekeeping_assigned ON housekeeping_tasks(assigned_to, status);
CREATE INDEX idx_housekeeping_room ON housekeeping_tasks(room_id, created_at);
CREATE INDEX idx_housekeeping_deadline ON housekeeping_tasks(deadline, status);

-- Notification queries
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Meal plan queries
CREATE INDEX idx_meal_plans_date ON meal_plans(date, meal_type);
```

---

## 🔌 **Backend API Endpoints**

### **Authentication & Users**
```typescript
// Auth routes
POST   /api/auth/login              // Firebase token verification
POST   /api/auth/logout             // Logout and cleanup
POST   /api/auth/refresh            // Refresh token
GET    /api/auth/profile            // Get current user profile
PUT    /api/auth/profile            // Update user profile
POST   /api/auth/register-token     // Register push notification token

// User management (Admin only)
GET    /api/users                   // List all users
GET    /api/users/:id               // Get user by ID
PUT    /api/users/:id               // Update user
DELETE /api/users/:id               // Deactivate user
PUT    /api/users/:id/role          // Change user role
```

### **Facility Management**
```typescript
// Facilities
GET    /api/facilities              // List facilities with filters
POST   /api/facilities              // Create facility (Admin)
GET    /api/facilities/:id          // Get facility details
PUT    /api/facilities/:id          // Update facility (Admin)
DELETE /api/facilities/:id          // Delete facility (Admin)
GET    /api/facilities/:id/availability // Check availability

// Rooms
GET    /api/facilities/:id/rooms    // List rooms in facility
POST   /api/facilities/:id/rooms    // Add room to facility (Admin)
GET    /api/rooms/:id               // Get room details
PUT    /api/rooms/:id               // Update room (Admin)
DELETE /api/rooms/:id               // Delete room (Admin)
GET    /api/rooms/:id/availability  // Check room availability
```

### **Booking Management**
```typescript
// Bookings
GET    /api/bookings               // List bookings with filters
POST   /api/bookings               // Create new booking
GET    /api/bookings/:id           // Get booking details
PUT    /api/bookings/:id           // Update booking
DELETE /api/bookings/:id           // Cancel booking
GET    /api/bookings/calendar      // Calendar view data
GET    /api/bookings/my-bookings   // User's bookings
PUT    /api/bookings/:id/status    // Update booking status (Admin)
```

### **Housekeeping Management**
```typescript
// Housekeeping tasks
GET    /api/housekeeping/tasks     // List tasks with filters
POST   /api/housekeeping/tasks     // Create task (Admin)
GET    /api/housekeeping/tasks/:id // Get task details
PUT    /api/housekeeping/tasks/:id // Update task
DELETE /api/housekeeping/tasks/:id // Delete task (Admin)
PUT    /api/housekeeping/tasks/:id/status // Update task status
POST   /api/housekeeping/tasks/:id/images // Upload task images
GET    /api/housekeeping/my-tasks  // Tasks assigned to current user
GET    /api/housekeeping/history   // Housekeeping history
```

### **Meal Planning**
```typescript
// Meal plans
GET    /api/meals/plans            // List meal plans
POST   /api/meals/plans            // Create meal plan (Admin)
GET    /api/meals/plans/:id        // Get meal plan details
PUT    /api/meals/plans/:id        // Update meal plan (Admin)
DELETE /api/meals/plans/:id        // Delete meal plan (Admin)
POST   /api/meals/auto-generate    // Auto-generate meal plans
GET    /api/meals/calendar         // Meal calendar view
```

### **Notifications**
```typescript
// Notifications
GET    /api/notifications          // List user notifications
PUT    /api/notifications/:id/read // Mark notification as read
PUT    /api/notifications/read-all // Mark all as read
DELETE /api/notifications/:id      // Delete notification
POST   /api/notifications/send     // Send notification (Admin)
```

### **Reporting**
```typescript
// Reports
GET    /api/reports/usage          // Usage reports
GET    /api/reports/bookings       // Booking reports
GET    /api/reports/housekeeping   // Housekeeping reports
GET    /api/reports/meals          // Meal reports
POST   /api/reports/export         // Export reports (PDF/Excel)
```

### **File Management**
```typescript
// File uploads
POST   /api/upload/images          // Upload images
DELETE /api/upload/images/:id      // Delete image
GET    /api/upload/images/:id      // Get image URL
```

---

## 🎨 **Frontend UI Components**

### **Admin Panel Components:**

```typescript
// Layout Components
- AdminLayout              // Main admin layout with sidebar
- Sidebar                  // Navigation sidebar
- Header                   // Top header with user menu
- Breadcrumb              // Navigation breadcrumb

// Dashboard Components
- DashboardStats          // Key metrics cards
- BookingChart            // Booking trends chart
- OccupancyChart          // Room occupancy chart
- RecentActivity          // Recent bookings/tasks list

// Facility Management
- FacilityList            // List of facilities with filters
- FacilityForm            // Add/edit facility form
- FacilityCard            // Facility display card
- RoomList                // List of rooms in facility
- RoomForm                // Add/edit room form
- RoomCard                // Room display card
- AvailabilityCalendar    // Room/ground availability calendar

// Booking Management
- BookingCalendar         // Full calendar view
- BookingGrid             // Grid view of bookings
- BookingForm             // Create/edit booking form
- BookingDetails          // Booking details modal
- BookingList             // List view with filters
- BookingStatus           // Status update component

// Housekeeping Management
- TaskList                // List of housekeeping tasks
- TaskForm                // Create/edit task form
- TaskCard                // Task display card
- TaskStatus              // Status update component
- ImageUpload             // Image upload for tasks
- TaskHistory             // Housekeeping history view

// Meal Planning
- MealCalendar            // Meal planning calendar
- MealForm                // Create/edit meal plan
- MealCard                // Meal plan display
- AutoGenerateModal       // Auto-generation settings
- MenuBuilder             // Menu items builder

// User Management
- UserList                // List of users
- UserForm                // Add/edit user form
- UserCard                // User display card
- RoleSelector            // Role assignment component

// Reporting
- ReportBuilder           // Report configuration
- ReportViewer            // Report display
- ExportOptions           // Export format selection
- ChartContainer          // Reusable chart wrapper
```

### **Mobile App Components:**

```typescript
// Navigation
- TabNavigator            // Bottom tab navigation
- StackNavigator          // Stack navigation
- DrawerNavigator         // Side drawer menu

// Authentication
- LoginScreen             // Login with Firebase
- ProfileScreen           // User profile management

// Booking Components
- FacilityMap             // Interactive facility map
- FacilityList            // List of available facilities
- FacilityCard            // Facility display card
- BookingForm             // Mobile booking form
- DatePicker              // Date selection component
- TimePicker              // Time selection component
- GuestCounter            // Guest count selector

// User Dashboard
- DashboardScreen         // User dashboard
- BookingCard             // User booking card
- UpcomingBookings        // Upcoming bookings list
- BookingHistory          // Past bookings list

// Meal Planning
- MealCalendar            // View meal plans
- MealCard                // Meal plan display
- MealDetails             // Detailed meal information

// Notifications
- NotificationList        // List of notifications
- NotificationCard        // Individual notification
- PushNotificationHandler // Handle push notifications

// Housekeeping (Staff only)
- TaskList                // Assigned tasks list
- TaskCard                // Task display card
- TaskDetails             // Task details screen
- StatusUpdate            // Update task status
- CameraUpload            // Camera integration for images

// Common Components
- LoadingSpinner          // Loading indicator
- ErrorBoundary           // Error handling
- OfflineIndicator        // Offline status
- SyncIndicator           // Data sync status
- SearchBar               // Search functionality
- FilterModal             // Filter options
- DateRangePicker         // Date range selection
```

---

## 🔐 **Security & Role-Based Access**

### **Role Permissions:**

```typescript
interface RolePermissions {
  ADMIN: {
    facilities: ['create', 'read', 'update', 'delete'];
    rooms: ['create', 'read', 'update', 'delete'];
    bookings: ['create', 'read', 'update', 'delete', 'approve'];
    housekeeping: ['create', 'read', 'update', 'delete', 'assign'];
    meals: ['create', 'read', 'update', 'delete', 'auto-generate'];
    users: ['create', 'read', 'update', 'delete', 'change-role'];
    reports: ['read', 'export'];
    notifications: ['send', 'read'];
  };

  HOUSEKEEPING: {
    facilities: ['read'];
    rooms: ['read'];
    bookings: ['read'];
    housekeeping: ['read', 'update-assigned'];
    meals: ['read'];
    users: ['read-self'];
    reports: ['read-own'];
    notifications: ['read'];
  };

  USER: {
    facilities: ['read'];
    rooms: ['read'];
    bookings: ['create', 'read-own', 'update-own', 'cancel-own'];
    housekeeping: [];
    meals: ['read'];
    users: ['read-self', 'update-self'];
    reports: [];
    notifications: ['read-own'];
  };
}
```

### **Security Middleware:**
```typescript
// Authentication middleware
const authenticateToken = async (req, res, next) => {
  // Verify Firebase token
  // Attach user to request
};

// Authorization middleware
const authorize = (permissions: string[]) => {
  return (req, res, next) => {
    // Check user role and permissions
  };
};

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## 📱 **Push Notifications & Data Sync**

### **Notification Flow:**
```typescript
// Notification types
enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  TASK_ASSIGNED = 'task_assigned',
  TASK_OVERDUE = 'task_overdue',
  MEAL_UPDATED = 'meal_updated',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}

// Notification service
class NotificationService {
  async sendPushNotification(userId: string, notification: Notification) {
    // Send via Firebase Cloud Messaging
    // Store in database
    // Send in-app notification
  }

  async sendBulkNotifications(userIds: string[], notification: Notification) {
    // Batch send notifications
  }

  async scheduleNotification(notification: Notification, scheduleTime: Date) {
    // Schedule future notifications
  }
}
```

### **Data Synchronization:**
```typescript
// Sync service for offline capability
class SyncService {
  async syncToServer(localData: any[]) {
    // Upload local changes to server
    // Handle conflicts
    // Update local storage
  }

  async syncFromServer() {
    // Download latest data from server
    // Update local storage
    // Trigger UI updates
  }

  async handleConflict(localData: any, serverData: any) {
    // Conflict resolution strategy
    // Server wins for most cases
    // User intervention for critical conflicts
  }
}

// Offline storage strategy
class OfflineStorage {
  async cacheEssentialData() {
    // Cache user bookings
    // Cache facility information
    // Cache assigned tasks (for housekeeping)
  }

  async queueOfflineActions(action: OfflineAction) {
    // Queue actions for later sync
    // Store in local database
  }
}
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Foundation (Weeks 1-2)**
1. ✅ Enhanced database schema implementation
2. ✅ Authentication & authorization system
3. ✅ Basic facility and room management
4. ✅ Simple booking system

### **Phase 2: Booking & Calendar (Weeks 3-4)**
1. ✅ Advanced booking calendar
2. ✅ Availability checking
3. ✅ Booking management (CRUD)
4. ✅ Basic admin panel

### **Phase 3: Housekeeping Module (Weeks 5-6)**
1. ✅ Task management system
2. ✅ Image upload functionality
3. ✅ Status tracking
4. ✅ Assignment system

### **Phase 4: Meal Planning (Week 7)**
1. ✅ Meal plan management
2. ✅ Auto-generation based on occupancy
3. ✅ Manual override capabilities

### **Phase 5: Mobile App (Weeks 8-9)**
1. ✅ React Native app setup
2. ✅ User booking interface
3. ✅ Push notifications
4. ✅ Offline capability

### **Phase 6: Advanced Features (Weeks 10-11)**
1. ✅ Reporting system
2. ✅ Export functionality
3. ✅ Advanced notifications
4. ✅ Data synchronization

### **Phase 7: Testing & Deployment (Week 12)**
1. ✅ Comprehensive testing
2. ✅ Performance optimization
3. ✅ Production deployment
4. ✅ Documentation

---

## 📊 **Next Steps**

1. **Database Setup**: Implement the enhanced schema with Prisma
2. **API Development**: Build RESTful APIs for all modules
3. **Frontend Enhancement**: Add advanced UI components
4. **Mobile App**: Develop React Native application
5. **Testing**: Implement comprehensive test suites
6. **Deployment**: Set up CI/CD pipeline

Would you like me to start implementing any specific module or component from this architecture?