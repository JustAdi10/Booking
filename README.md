# 🏏 Cricket Ground & Room Booking System

A comprehensive full-stack booking system for cricket grounds and rooms with advanced facility management, housekeeping, meal planning, and user access control. Built with modern technologies and designed for scalability.

---

## ✨ **Key Features**

### **🔐 Multi-Role Authentication**
- Firebase Authentication with Google Sign-In and Email/Password
- Role-based access control (Admin, Housekeeping, User)
- Secure JWT token-based API access
- User profile management

### **🏟️ Advanced Facility Management**
- Cricket grounds and building management
- Hierarchical room structure (Buildings → Rooms)
- Facility availability checking with conflict detection
- Image upload and amenity management
- Multi-state and location support

### **📅 Comprehensive Booking System**
- Real-time availability checking
- Calendar and grid view interfaces
- Booking conflict prevention
- Status management (Pending, Confirmed, Cancelled, Completed)
- Guest count and special requests handling

### **🧹 Housekeeping Management**
- Task assignment and tracking system
- Priority-based task management (Low, Medium, High, Urgent)
- Image upload for before/after cleaning photos
- Status updates (Pending, In Progress, Completed, Needs Repair)
- Housekeeping history and reporting

### **🍽️ Intelligent Meal Planning**
- Auto-generation based on room occupancy
- Manual meal plan creation and override
- Cost calculation and budgeting
- Menu item management
- Calendar view for meal planning

### **📊 Advanced Reporting & Analytics**
- Usage reports by facility and date range
- Booking analytics and revenue tracking
- Housekeeping performance metrics
- Export functionality (PDF/Excel)
- Real-time dashboard with key metrics

### **🔔 Notification System**
- In-app notifications
- Push notifications (Firebase Cloud Messaging)
- Email notifications (configurable)
- Notification history and management

### **🛡️ Security & Compliance**
- Comprehensive audit logging
- Rate limiting and CORS protection
- Input validation and sanitization
- SQL injection prevention
- Role-based permission system

---

## 🛠️ **Technology Stack**

### **Backend**
| Component | Technology |
|-----------|------------|
| Runtime | Node.js + Express + TypeScript |
| Database | MySQL 8.0 + Prisma ORM |
| Authentication | Firebase Admin SDK |
| File Storage | AWS S3 / Cloudinary |
| Push Notifications | Firebase Cloud Messaging |
| Caching | Redis (optional) |
| Queue | Bull Queue |

### **Frontend**
| Component | Technology |
|-----------|------------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Radix UI |
| State Management | Zustand + React Query |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Calendar | React Big Calendar |
| Charts | Recharts |

### **DevOps & Infrastructure**
| Component | Technology |
|-----------|------------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | AWS/DigitalOcean/Vercel |
| Monitoring | Sentry + Winston Logger |
| Database Backup | Automated MySQL backups |

---

## � **Quick Start**

### **Prerequisites**
- Node.js 18.18.0 or higher
- MySQL 8.0 or higher
- Firebase account and project
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/JustAdi10/Booking.git
   cd Booking
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd server && npm install

   # Frontend dependencies
   cd ../client && npm install
   ```

3. **Database setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE cricket_booking;
   exit

   # Setup Prisma
   cd server
   npx prisma generate
   npx prisma db push
   ```

4. **Firebase configuration**
   - Create Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password, Google Sign-In)
   - Download Admin SDK key to `server/config/firebase-adminsdk.json`
   - Get Web App config for client

5. **Environment setup**

   **Server (.env):**
   ```bash
   PORT=3000
   DATABASE_URL="mysql://username:password@localhost:3306/cricket_booking"
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_ADMIN_SDK_PATH=./config/firebase-adminsdk.json
   ```

   **Client (.env):**
   ```bash
   VITE_API_URL=http://localhost:3000
   VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"..."}
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

Visit http://localhost:5173 to access the application.

### **Docker Deployment**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d
```

---

## 📁 **Project Structure**

```
Booking/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API services
│   │   ├── stores/                 # Zustand stores
│   │   ├── utils/                  # Utility functions
│   │   └── types/                  # TypeScript types
│   ├── public/                     # Static assets
│   └── package.json
├── server/                          # Express Backend
│   ├── src/
│   │   ├── routes/                 # API route handlers
│   │   ├── middleware/             # Express middleware
│   │   ├── services/               # Business logic
│   │   ├── types/                  # TypeScript types
│   │   └── utils/                  # Utility functions
│   ├── prisma/                     # Database schema
│   ├── config/                     # Configuration files
│   └── package.json
├── docker-compose.yml              # Docker services
├── SYSTEM_ARCHITECTURE.md          # Detailed architecture
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
└── README.md                       # This file
```

---

## 🔌 **API Documentation**

### **Core Endpoints**
- **Authentication:** `/api/auth/*` - User login, logout, profile management
- **Facilities:** `/api/facilities/*` - Facility and room management
- **Bookings:** `/api/bookings/*` - Booking creation and management
- **Housekeeping:** `/api/housekeeping/*` - Task assignment and tracking
- **Meals:** `/api/meals/*` - Meal planning and management
- **Reports:** `/api/reports/*` - Analytics and reporting
- **Notifications:** `/api/notifications/*` - Notification management

### **Authentication**
All API endpoints require Firebase JWT token authentication:
```bash
Authorization: Bearer <firebase-jwt-token>
```

### **Response Format**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "pagination": {...}  // For paginated responses
}
```

---

## 🎯 **User Roles & Permissions**

### **Admin**
- Full system access and configuration
- User management and role assignment
- Facility and room management
- Booking oversight and approval
- Housekeeping task assignment
- Meal planning and management
- Comprehensive reporting and analytics

### **Housekeeping Staff**
- View assigned cleaning and maintenance tasks
- Update task status and upload progress images
- Access room and facility information
- View task history and performance metrics

### **End Users**
- Browse and book available facilities/rooms
- Manage personal bookings
- View meal plans and schedules
- Receive notifications and updates
- Access booking history

---

## 📊 **Key Features in Detail**

### **Smart Booking System**
- Real-time availability checking with conflict prevention
- Calendar and grid view interfaces
- Automatic pricing calculation for room bookings
- Guest count management and special requests
- Status workflow (Pending → Confirmed → Completed)

### **Intelligent Housekeeping**
- Automatic task generation based on bookings
- Priority-based task assignment (Low/Medium/High/Urgent)
- Image upload for before/after documentation
- Performance tracking and completion metrics
- Integration with booking system for seamless workflow

### **Automated Meal Planning**
- Occupancy-based meal quantity calculation
- Auto-generation with manual override capabilities
- Cost tracking and budget management
- Menu customization and dietary considerations
- Calendar integration for meal scheduling

### **Advanced Analytics**
- Facility utilization and revenue reports
- Booking trends and occupancy analytics
- Housekeeping performance metrics
- Export capabilities (PDF/Excel)
- Real-time dashboard with key insights

---

## 🛡️ **Security Features**

- **Multi-factor Authentication** via Firebase
- **Role-based Access Control** with granular permissions
- **API Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **SQL Injection Protection** via Prisma ORM
- **Comprehensive Audit Logging** for all actions
- **CORS Protection** for cross-origin requests
- **Secure File Upload** with validation

---

## 🚀 **Deployment Options**

### **Development**
```bash
npm run dev  # Both client and server
```

### **Production**
- **Docker:** `docker-compose up --build`
- **Cloud Platforms:** AWS, DigitalOcean, Vercel
- **Database:** MySQL, PlanetScale, AWS RDS
- **File Storage:** AWS S3, Cloudinary

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📚 **Documentation**

- **[System Architecture](SYSTEM_ARCHITECTURE.md)** - Comprehensive technical overview
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions
- **[API Documentation](docs/api.md)** - Complete API reference (coming soon)
- **[User Manual](docs/user-guide.md)** - End-user documentation (coming soon)

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow conventional commit messages
- Ensure code passes linting and formatting

---

## 📞 **Support**

### **Getting Help**
- **Issues:** Report bugs and feature requests via GitHub Issues
- **Documentation:** Check the comprehensive guides in `/docs`
- **Community:** Join our discussions for questions and support

### **System Requirements**
- **Minimum:** 2GB RAM, 1 CPU core, 10GB storage
- **Recommended:** 4GB RAM, 2 CPU cores, 20GB storage
- **Database:** MySQL 8.0+ or compatible

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Acknowledgments**

- **Firebase** for authentication and real-time features
- **Prisma** for excellent database tooling
- **React** and **TypeScript** communities
- **Tailwind CSS** for beautiful, responsive design
- **Open Source Community** for amazing tools and libraries

---

**Built with ❤️ for cricket associations and facility management**
