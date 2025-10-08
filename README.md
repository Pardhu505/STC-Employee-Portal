# Showtime Employee Portal

A comprehensive full-stack employee management system built with FastAPI backend and React frontend, featuring real-time communication, attendance tracking, and employee management capabilities.

## 🚀 Features

### Core Functionality
- **Employee Management**: Complete CRUD operations for employee data
- **User Authentication**: Secure login/signup with password hashing
- **Real-time Communication**: WebSocket-based chat system with channels and direct messages
- **Attendance Tracking**: Daily attendance recording and reporting
- **File Management**: Upload and download functionality
- **Notifications**: Real-time notifications for messages and updates
- **User Profiles**: Comprehensive employee profile management

### Communication Features
- **Channel-based Chat**: Department and team-specific channels
- **Direct Messaging**: One-on-one and group conversations
- **Message Reactions**: Interactive message reactions
- **File Sharing**: Share files within chats
- **Message Management**: Delete messages for yourself or everyone
- **Online Status**: Real-time user presence indicators

### Attendance & Reporting
- **Daily Attendance**: Record check-in/check-out times
- **Manager Reports**: Team attendance summaries
- **Multiple Views**: Day, week, and month attendance reports
- **Late Tracking**: Monitor employee punctuality

### Administrative Features
- **Department Management**: Organize employees by departments and teams
- **Role-based Access**: Different permissions for managers and employees
- **Profile Pictures**: Employee photo management
- **Data Export**: Attendance data export capabilities

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Multiple databases for different concerns)
- **Authentication**: bcrypt password hashing
- **Real-time**: WebSocket support
- **File Handling**: Static file serving
- **CORS**: Cross-origin resource sharing enabled

### Frontend
- **Framework**: React 18 with Create React App
- **UI Libraries**: Material-UI, Radix UI components
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: MUI X Charts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React, React Icons

### Development Tools
- **Build Tool**: CRACO (Create React App Configuration Override)
- **Package Manager**: npm/yarn
- **Version Control**: Git

## 📁 Project Structure

```
showtime_employee_portal/
├── backend/
│   ├── server.py                 # Main FastAPI application
│   ├── populate_employees.py     # Employee data seeding
│   ├── populate_chat_employees.py # Chat data seeding
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Header.js         # Navigation header
│   │   │   ├── Login.js          # Authentication component
│   │   │   ├── UserProfile.js    # User profile management
│   │   │   ├── InternalCommunication.js # Chat interface
│   │   │   ├── Attence1.js       # Attendance tracking
│   │   │   ├── AttedenceReport.js # Attendance reports
│   │   │   ├── NotificationSystem.js # Notification management
│   │   │   └── ...
│   │   ├── Services/
│   │   │   └── api.js            # API service layer
│   │   ├── data/
│   │   │   └── mock.js           # Mock data for development
│   │   └── ...
│   ├── package.json              # Frontend dependencies
│   └── tailwind.config.js        # Tailwind configuration
├── tests/                        # Test files
├── TODO.md                       # Development tasks
└── README.md                     # This file
```

## 🗄️ Database Architecture

The application uses multiple MongoDB databases:

- **Main Database**: General application data
- **STC_Employees**: Employee information organized by teams
- **employee_attendance**: Attendance records and reports
- **Internal_communication**: Chat messages and notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or Atlas)
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory with:
   ```
   MONGO_URL=mongodb://localhost:27017/your_database
   DB_NAME=your_main_db
   ```

4. **Run the backend server**:
   ```bash
   python server.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   The application will open at `http://localhost:3000`

### Database Population

To populate the database with sample data:

```bash
python populate_employees.py
python populate_chat_employees.py
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Main database name

**Frontend (.env.development)**:
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8000)

## 📊 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/signup` - User registration

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/email/{email}` - Get employee by email
- `PUT /api/employees/{id}/profile-picture` - Update profile picture

### Communication
- `GET /api/messages` - Get messages
- `POST /api/messages/{id}/delete` - Delete message
- `WebSocket /api/ws/{client_id}` - Real-time messaging

### Attendance
- `POST /api/attendance-report` - Save attendance data
- `GET /api/attendance-report` - Get attendance reports
- `GET /api/attendance-report/user/{code}` - Get user attendance

## 🧪 Testing

Run frontend tests:
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment
1. Set production environment variables
2. Use a production ASGI server like Uvicorn
3. Configure MongoDB Atlas for production database

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Serve the `build` folder with a static server
3. Configure API URLs for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 Current Development Status

See [TODO.md](TODO.md) for current development tasks and planned features.

## 📄 License

This project is proprietary software for Showtime Communications.

## 👥 Support

For support or questions, please contact the development team.
