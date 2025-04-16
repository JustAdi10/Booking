# 🏏 Cricket Ground & Room Booking System

A full-stack booking system for a Pondicherry cricket association that manages grounds and rooms across multiple states. Built using React, TypeScript, Node.js, MySQL, and Firebase for authentication. Dockerized for easy development and deployment.

---

## 🚀 Features

- 🔐 Firebase Authentication (Google Sign-In, Email/Password)
- 🏟️ Book cricket grounds and rooms by date and location
- 📍 Multi-state support with geo-based filtering
- 🧾 Admin panel for managing bookings and availability
- ⚡ RESTful API with secure token-based access
- 🐳 Containerized with Docker for consistent environments

---

## 🧱 Tech Stack

| Layer         | Technology                  |
|---------------|----------------------------|
| Frontend      | React + TypeScript + Vite  |
| Backend       | Node.js + Express + TypeScript |
| Database      | MySQL                      |
| Auth          | Firebase Authentication    |
| ORM           | Prisma                     |
| DevOps        | Docker, Docker Compose     |

---

## 🔧 Setup Instructions

### Prerequisites

- Node.js (v18.18.0 or higher)
- Docker and Docker Compose
- MySQL (if running locally)
- Firebase account and project

### Development Setup

1. Clone the repository
```bash
git clone https://github.com/JustAdi10/Booking.git
cd Booking
```

2. Install dependencies
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Environment Configuration

Create `.env` files in both client and server directories:

```bash
# client/.env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_CONFIG={your-firebase-config}

# server/.env
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/booking
FIREBASE_ADMIN_SDK_PATH=path/to/firebase-adminsdk.json
```

4. Start Development Servers

```bash
# Start frontend (in client directory)
npm run dev

# Start backend (in server directory)
npm run dev
```

### Docker Setup

1. Build and run with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:3000
- MySQL at localhost:3306

## 📁 Project Structure

```
Booking/
├── client/                 # React Frontend
│   ├── src/               # Source files
│   └── vite.config.ts     # Vite configuration
├── server/                # Express Backend
│   ├── src/              # Source files
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/      # API routes
│   │   ├── models/      # Data models
│   │   └── config/      # Configurations
│   └── package.json
└── docker-compose.yml    # Docker services config
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
