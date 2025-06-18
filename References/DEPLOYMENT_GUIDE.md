# 🚀 Cricket Ground & Room Booking System - Deployment Guide

## 📋 **Quick Start**

### **Prerequisites**
- Node.js 18.18.0 or higher
- MySQL 8.0 or higher
- Firebase account and project
- Git

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd Booking

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### **2. Database Setup**
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

### **3. Firebase Configuration**
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password and Google Sign-In
3. Generate Admin SDK private key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `server/config/firebase-adminsdk.json`
4. Get Web App config for client

### **4. Environment Configuration**

**Server (.env):**
```bash
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL="mysql://username:password@localhost:3306/cricket_booking"

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_SDK_PATH=./config/firebase-adminsdk.json
```

**Client (.env):**
```bash
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}
```

### **5. Start Development Servers**
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

Visit http://localhost:5173 to access the application.

---

## 🐳 **Docker Deployment**

### **Using Docker Compose**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Docker Compose Configuration**
The `docker-compose.yml` includes:
- MySQL database
- Backend API server
- Frontend web server
- Redis (optional)

---

## ☁️ **Production Deployment**

### **Option 1: DigitalOcean App Platform**

1. **Prepare for deployment:**
```bash
# Build the application
cd server && npm run build
cd ../client && npm run build
```

2. **Create App Spec:**
```yaml
name: cricket-booking-system
services:
- name: api
  source_dir: /server
  github:
    repo: your-username/cricket-booking
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: FIREBASE_PROJECT_ID
    value: your-firebase-project-id

- name: web
  source_dir: /client
  github:
    repo: your-username/cricket-booking
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: db
  engine: MYSQL
  version: "8"
```

### **Option 2: AWS Deployment**

**Backend (AWS Elastic Beanstalk):**
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
cd server
eb init
eb create production
eb deploy
```

**Frontend (AWS S3 + CloudFront):**
```bash
# Build and deploy
cd client
npm run build
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **Option 3: Vercel + PlanetScale**

**Backend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd server
vercel --prod
```

**Frontend (Vercel):**
```bash
cd client
vercel --prod
```

**Database (PlanetScale):**
```bash
# Install PlanetScale CLI
# Create database
pscale database create cricket-booking

# Create branch
pscale branch create cricket-booking main

# Connect
pscale connect cricket-booking main --port 3309

# Update DATABASE_URL to use PlanetScale connection
```

---

## 🔧 **Environment-Specific Configurations**

### **Development**
```bash
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/cricket_booking_dev"
FRONTEND_URL=http://localhost:5173
```

### **Staging**
```bash
NODE_ENV=staging
DATABASE_URL="mysql://user:pass@staging-db:3306/cricket_booking_staging"
FRONTEND_URL=https://staging.yourdomain.com
```

### **Production**
```bash
NODE_ENV=production
DATABASE_URL="mysql://user:pass@prod-db:3306/cricket_booking"
FRONTEND_URL=https://yourdomain.com
```

---

## 📊 **Database Migration**

### **Initial Setup**
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

### **Production Migrations**
```bash
# Generate migration
npx prisma migrate dev --name add_new_feature

# Deploy to production
npx prisma migrate deploy
```

### **Seed Data**
```bash
# Create seed script
npx prisma db seed
```

---

## 🔐 **Security Checklist**

### **Before Production:**
- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review Firebase security rules
- [ ] Enable audit logging
- [ ] Configure firewall rules

### **Environment Variables Security:**
- [ ] Use environment-specific .env files
- [ ] Never commit .env files to git
- [ ] Use secrets management in production
- [ ] Rotate API keys regularly
- [ ] Use least privilege access

---

## 📈 **Monitoring & Maintenance**

### **Health Checks**
```bash
# API health check
curl http://your-api-url/health

# Database connection check
curl http://your-api-url/api/health/db
```

### **Logging**
- Application logs: `/var/log/app/`
- Database logs: MySQL error logs
- Web server logs: Nginx/Apache logs

### **Backup Strategy**
```bash
# Database backup
mysqldump -u user -p cricket_booking > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > /backups/backup_$DATE.sql
aws s3 cp /backups/backup_$DATE.sql s3://your-backup-bucket/
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

**Database Connection Failed:**
```bash
# Check MySQL service
sudo systemctl status mysql

# Check connection
mysql -u username -p -h hostname

# Verify DATABASE_URL format
mysql://username:password@hostname:port/database
```

**Firebase Authentication Issues:**
```bash
# Verify Firebase config
# Check service account permissions
# Ensure correct project ID
```

**Build Failures:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18.18.0+
```

**CORS Errors:**
```bash
# Update FRONTEND_URL in server .env
# Check CORS configuration in app.ts
```

### **Performance Issues**
- Enable database query logging
- Monitor API response times
- Check memory usage
- Optimize database indexes
- Enable caching

---

## 📞 **Support**

### **Getting Help**
- Check logs first: `docker-compose logs -f`
- Review environment variables
- Verify database connections
- Check Firebase configuration
- Monitor system resources

### **Maintenance Schedule**
- **Daily:** Check application health
- **Weekly:** Review logs and performance
- **Monthly:** Update dependencies
- **Quarterly:** Security audit and backup testing

---

## 🎯 **Next Steps**

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up staging environment
5. Plan for scaling and optimization

Your Cricket Ground & Room Booking System is now ready for production use! 🎉
