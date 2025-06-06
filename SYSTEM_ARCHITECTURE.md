# 🏏 Cricket Ground & Room Booking System - Complete Architecture

## 📋 **System Overview**

This is a comprehensive booking system for cricket grounds and rooms with advanced features including facility management, housekeeping, meal planning, and user access control.

### **Key Features Implemented:**
- ✅ **Multi-role Authentication** (Admin, Housekeeping, User)
- ✅ **Facility & Room Management** with hierarchical structure
- ✅ **Advanced Booking System** with conflict detection
- ✅ **Housekeeping Management** with task assignment and tracking
- ✅ **Meal Planning** with auto-generation based on occupancy
- ✅ **Comprehensive Reporting** with export capabilities
- ✅ **Push Notifications** and real-time updates
- ✅ **Role-based Access Control** with granular permissions
- ✅ **Audit Logging** for all system actions
- ✅ **RESTful API** with comprehensive endpoints

---

## 🛠️ **Technology Stack**

### **Backend:**
- **Runtime:** Node.js + Express + TypeScript
- **Database:** MySQL 8.0 with Prisma ORM
- **Authentication:** Firebase Admin SDK
- **File Storage:** AWS S3 / Cloudinary (configurable)
- **Push Notifications:** Firebase Cloud Messaging
- **Caching:** Redis (optional)
- **Queue:** Bull Queue for background tasks

### **Frontend:**
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Radix UI components
- **State Management:** Zustand + React Query (TanStack Query)
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Calendar:** React Big Calendar
- **Charts:** Recharts

### **Mobile (Future):**
- **Framework:** React Native + Expo
- **Navigation:** React Navigation v6
- **Offline Storage:** AsyncStorage + SQLite

---

## 🗄️ **Database Schema**

### **Core Tables:**
1. **users** - User authentication and profiles
2. **facilities** - Cricket grounds and buildings
3. **rooms** - Rooms within buildings
4. **bookings** - Booking records with conflict detection
5. **housekeeping_tasks** - Cleaning and maintenance tasks
6. **meal_plans** - Meal planning with auto-generation
7. **notifications** - In-app and push notifications
8. **push_tokens** - Device tokens for push notifications
9. **system_settings** - Configurable system settings
10. **audit_logs** - Complete audit trail

### **Key Relationships:**
- Facilities → Rooms (One-to-Many)
- Users → Bookings (One-to-Many)
- Users → HousekeepingTasks (One-to-Many)
- Rooms → HousekeepingTasks (One-to-Many)
- Users → Notifications (One-to-Many)

---

## 🔌 **API Endpoints**

### **Authentication & Users**
```
POST   /api/auth/login              # Firebase token verification
POST   /api/auth/logout             # Logout and cleanup
GET    /api/auth/profile            # Get current user profile
PUT    /api/auth/profile            # Update user profile
POST   /api/auth/register-token     # Register push notification token

GET    /api/users                   # List all users (Admin)
GET    /api/users/:id               # Get user by ID (Admin)
PUT    /api/users/:id               # Update user (Admin)
DELETE /api/users/:id               # Deactivate user (Admin)
PUT    /api/users/:id/role          # Change user role (Admin)
```

### **Facility & Room Management**
```
GET    /api/facilities              # List facilities with filters
POST   /api/facilities              # Create facility (Admin)
GET    /api/facilities/:id          # Get facility details
PUT    /api/facilities/:id          # Update facility (Admin)
DELETE /api/facilities/:id          # Delete facility (Admin)
GET    /api/facilities/:id/availability # Check availability
GET    /api/facilities/:id/rooms    # List rooms in facility
POST   /api/facilities/:id/rooms    # Add room to facility (Admin)

GET    /api/rooms/:id               # Get room details
PUT    /api/rooms/:id               # Update room (Admin)
DELETE /api/rooms/:id               # Delete room (Admin)
GET    /api/rooms/:id/availability  # Check room availability
```

### **Booking Management**
```
GET    /api/bookings               # List bookings with filters
POST   /api/bookings               # Create new booking
GET    /api/bookings/:id           # Get booking details
PUT    /api/bookings/:id           # Update booking
DELETE /api/bookings/:id           # Cancel booking
GET    /api/bookings/calendar      # Calendar view data
GET    /api/bookings/my-bookings   # User's bookings
```

### **Housekeeping Management**
```
GET    /api/housekeeping/tasks     # List tasks with filters
POST   /api/housekeeping/tasks     # Create task (Admin)
GET    /api/housekeeping/tasks/:id # Get task details
PUT    /api/housekeeping/tasks/:id # Update task
DELETE /api/housekeeping/tasks/:id # Delete task (Admin)
PUT    /api/housekeeping/tasks/:id/status # Update task status
POST   /api/housekeeping/tasks/:id/images # Upload task images
GET    /api/housekeeping/my-tasks  # Tasks assigned to current user
GET    /api/housekeeping/history   # Housekeeping history
```

### **Meal Planning**
```
GET    /api/meals/plans            # List meal plans
POST   /api/meals/plans            # Create meal plan (Admin)
POST   /api/meals/auto-generate    # Auto-generate meal plans
GET    /api/meals/calendar         # Meal calendar view
```

### **Notifications & Reporting**
```
GET    /api/notifications          # List user notifications
PUT    /api/notifications/:id/read # Mark notification as read
PUT    /api/notifications/read-all # Mark all as read
POST   /api/notifications/send     # Send notification (Admin)

GET    /api/reports/usage          # Usage reports
GET    /api/reports/bookings       # Booking reports
GET    /api/reports/housekeeping   # Housekeeping reports
POST   /api/reports/export         # Export reports (PDF/Excel)
```

---

## 🔐 **Security & Permissions**

### **Role-Based Access Control:**

**ADMIN:**
- Full access to all resources
- User management and role assignment
- System configuration
- All reports and analytics

**HOUSEKEEPING:**
- View assigned tasks
- Update task status and upload images
- View room and facility information
- Limited reporting (own tasks only)

**USER:**
- Create and manage own bookings
- View facility availability
- View meal plans
- Receive notifications

### **Security Features:**
- Firebase JWT token authentication
- Role-based middleware protection
- Rate limiting on all endpoints
- Input validation and sanitization
- Audit logging for all actions
- CORS protection
- SQL injection prevention via Prisma

---

## 📱 **Frontend Architecture**

### **Component Structure:**
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components
│   ├── forms/                 # Form components
│   └── features/              # Feature-specific components
├── pages/                     # Page components
├── hooks/                     # Custom React hooks
├── services/                  # API services
├── stores/                    # Zustand stores
├── utils/                     # Utility functions
└── types/                     # TypeScript types
```

### **Key Features:**
- Responsive design with Tailwind CSS
- Dark/light theme support
- Real-time updates with React Query
- Form validation with Zod
- Calendar integration
- Image upload with preview
- Export functionality
- Progressive Web App (PWA) ready

---

## 🚀 **Deployment & Setup**

### **Prerequisites:**
- Node.js 18.18.0+
- MySQL 8.0+
- Firebase project
- Docker (optional)

### **Environment Variables:**
```bash
# Server (.env)
PORT=3000
DATABASE_URL="mysql://user:pass@localhost:3306/cricket_booking"
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_SDK_PATH=./config/firebase-adminsdk.json

# Client (.env)
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_CONFIG={"apiKey":"..."}
```

### **Installation:**
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Setup database
cd ../server
npx prisma generate
npx prisma db push

# Start development servers
npm run dev  # In both server and client directories
```

### **Docker Deployment:**
```bash
docker-compose up --build
```

---

## 📊 **Performance & Scalability**

### **Database Optimizations:**
- Indexed queries for bookings, tasks, and notifications
- Efficient pagination with cursor-based pagination
- Connection pooling with Prisma
- Query optimization for complex joins

### **Caching Strategy:**
- Redis for session management
- API response caching for static data
- Client-side caching with React Query
- Image CDN for file storage

### **Monitoring:**
- Comprehensive audit logging
- Error tracking with Sentry
- Performance monitoring
- Database query analysis

---

## 🔄 **Data Flow**

### **Booking Process:**
1. User selects facility/room and dates
2. System checks availability in real-time
3. Conflict detection prevents double bookings
4. Admin approval workflow (optional)
5. Automatic meal plan generation
6. Housekeeping task creation
7. Notification to all stakeholders

### **Housekeeping Workflow:**
1. Admin creates tasks based on bookings
2. Tasks assigned to housekeeping staff
3. Staff receive push notifications
4. Status updates with image uploads
5. Completion tracking and history
6. Performance reporting

### **Meal Planning:**
1. Auto-generation based on confirmed bookings
2. Occupancy calculation for quantities
3. Manual override capabilities
4. Cost calculation and budgeting
5. Calendar view for planning

---

## 🎯 **Future Enhancements**

### **Phase 1 (Immediate):**
- [ ] Real-time chat system
- [ ] Advanced reporting dashboard
- [ ] Mobile app development
- [ ] Payment integration

### **Phase 2 (Medium-term):**
- [ ] AI-powered demand forecasting
- [ ] Automated pricing optimization
- [ ] Integration with external calendars
- [ ] Multi-language support

### **Phase 3 (Long-term):**
- [ ] IoT integration for smart facilities
- [ ] Machine learning for maintenance prediction
- [ ] Advanced analytics and insights
- [ ] Multi-tenant architecture

---

## 📞 **Support & Maintenance**

### **Monitoring:**
- Health check endpoints
- Automated backup systems
- Error alerting
- Performance metrics

### **Backup Strategy:**
- Daily database backups
- File storage replication
- Configuration backup
- Disaster recovery plan

### **Updates:**
- Rolling deployment strategy
- Database migration scripts
- Feature flag management
- A/B testing framework

---

This architecture provides a solid foundation for a comprehensive booking system that can scale with your organization's needs while maintaining security, performance, and user experience standards.
