# Timetable Optimization Platform

A comprehensive web-based timetable optimization platform for higher education institutions, built with Node.js, Express, React, and SQLite.

## Features

### 🎯 Core Functionality
- **AI-Powered Optimization**: Advanced algorithms to generate conflict-free timetables
- **Multi-Parameter Optimization**: Considers faculty availability, room capacity, teaching loads, and student preferences
- **Multiple Timetable Options**: Generate and compare different optimized schedules
- **Conflict Detection**: Automatic identification and reporting of scheduling conflicts
- **Review & Approval Workflow**: Multi-level approval system for timetable management

### 👥 User Management
- **Role-Based Access Control**: Admin, Moderator, and User roles
- **Secure Authentication**: JWT-based authentication system
- **Department-Based Access**: Users can be assigned to specific departments

### 📊 Data Management
- **Comprehensive Data Models**: Departments, Faculty, Subjects, Classrooms, Student Batches
- **Faculty-Subject Mapping**: Assign subjects to faculty with preference levels
- **Flexible Scheduling Parameters**: Customizable working hours, break times, and constraints
- **Multi-Department Support**: Handle multiple departments and shifts

### 📱 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Interactive Timetable Grid**: Visual representation of schedules
- **Real-time Feedback**: Toast notifications and loading states
- **Export Functionality**: Export timetables to CSV format

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for development (easily replaceable with PostgreSQL/MySQL)
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate limiting** for API protection

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Axios** for API communication
- **React Toastify** for notifications
- **Modern CSS** with responsive design

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Backend Setup
1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize the database:
```bash
npm run dev
```
The database will be automatically created on first run.

### Frontend Setup
1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running the Application
1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
npm run client
```

3. Access the application at `http://localhost:3000`

## Default Credentials
- **Username**: admin
- **Password**: password

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Data Management
- `GET /api/data/departments` - Get all departments
- `POST /api/data/departments` - Create department
- `GET /api/data/classrooms` - Get all classrooms
- `POST /api/data/classrooms` - Create classroom
- `GET /api/data/faculty` - Get all faculty
- `POST /api/data/faculty` - Create faculty
- `GET /api/data/subjects` - Get subjects (with filters)
- `POST /api/data/subjects` - Create subject
- `GET /api/data/batches` - Get student batches (with filters)
- `POST /api/data/batches` - Create batch

### Timetable Management
- `GET /api/timetable` - Get all timetables
- `GET /api/timetable/:id` - Get specific timetable
- `POST /api/timetable/generate-options` - Generate timetable options
- `POST /api/timetable/save-option` - Save selected timetable
- `PUT /api/timetable/:id/status` - Update timetable status
- `GET /api/timetable/:id/conflicts` - Get timetable conflicts

## Database Schema

### Key Tables
- **users**: User accounts and authentication
- **departments**: Academic departments
- **classrooms**: Available rooms and labs
- **faculty**: Teaching staff information
- **subjects**: Course subjects and details
- **student_batches**: Student groups by semester
- **timetables**: Generated timetable records
- **timetable_slots**: Individual class slots
- **optimization_params**: Department-specific scheduling parameters

## Optimization Algorithm

The platform uses a sophisticated optimization algorithm that considers:

### Constraints
- Faculty availability and maximum teaching hours
- Classroom capacity and availability
- Student batch schedules
- Fixed time slots (special classes)
- Working hours and break times

### Optimization Goals
- Minimize faculty workload variance
- Maximize classroom utilization
- Avoid scheduling conflicts
- Respect subject frequency requirements
- Consider faculty subject preferences

### Algorithm Features
- **Constraint Satisfaction**: Ensures all hard constraints are met
- **Genetic Algorithm Elements**: Multiple solution variations
- **Scoring System**: Evaluates solution quality
- **Conflict Resolution**: Automatic conflict detection and avoidance

## Configuration

### Optimization Parameters
Each department can configure:
- Maximum classes per day
- Working hours (start/end times)
- Lunch break timing
- Minimum break duration between classes
- Working days per week

### Security Settings
- JWT token expiration
- Rate limiting configuration
- CORS settings
- Password complexity requirements

## Deployment

### Production Build
1. Build the frontend:
```bash
cd client && npm run build
```

2. Set environment to production:
```bash
export NODE_ENV=production
```

3. Start the server:
```bash
npm start
```

### Environment Variables
```
PORT=5000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
DB_PATH=./database/timetable.db
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Roadmap

### Upcoming Features
- Advanced analytics and reporting
- Mobile app for faculty and students
- Integration with existing college management systems
- Machine learning for better optimization
- Multi-language support
- Calendar integration
- Automated conflict resolution suggestions

---

Built with ❤️ for the Smart India Hackathon 2024
