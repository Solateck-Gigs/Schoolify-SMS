# SchoolSync - School Management System Backend

A comprehensive school management system backend built with Node.js, Express, TypeScript, and MongoDB.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd schoolify-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/schoolsync
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "admin",
  "user_id_number": "ADMIN001"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "user_id_number": "ADMIN001",
  "password": "password123"
}
```

## Test Data

### 1. Admin User
```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@schoolsync.com",
  "password": "admin123",
  "role": "admin",
  "user_id_number": "ADMIN001"
}
```

### 2. Teachers
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@schoolsync.com",
  "password": "teacher123",
  "role": "teacher",
  "user_id_number": "TEACH001",
  "employeeId": "EMP001",
  "dateOfHire": "2024-01-01",
  "subjectsTaught": ["Mathematics", "Physics"],
  "qualifications": ["BSc Mathematics", "PGCE"],
  "experienceYears": 5
}

{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@schoolsync.com",
  "password": "teacher123",
  "role": "teacher",
  "user_id_number": "TEACH002",
  "employeeId": "EMP002",
  "dateOfHire": "2024-01-01",
  "subjectsTaught": ["English", "Literature"],
  "qualifications": ["BA English", "MA Education"],
  "experienceYears": 8
}
```

### 3. Parents
```json
{
  "firstName": "Michael",
  "lastName": "Brown",
  "email": "michael.brown@example.com",
  "password": "parent123",
  "role": "parent",
  "user_id_number": "PAR001",
  "homeAddress": "123 Main St, City",
  "occupation": "Engineer"
}

{
  "firstName": "Emily",
  "lastName": "Wilson",
  "email": "emily.wilson@example.com",
  "password": "parent123",
  "role": "parent",
  "user_id_number": "PAR002",
  "homeAddress": "456 Oak Ave, City",
  "occupation": "Doctor"
}
```

### 4. Students
```json
{
  "firstName": "James",
  "lastName": "Brown",
  "email": "james.brown@student.schoolsync.com",
  "password": "student123",
  "role": "student",
  "user_id_number": "STU001",
  "admissionNumber": "2024001",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "parent": "PAR001",
  "medicalConditions": ["Asthma"],
  "bloodType": "O+",
  "allergies": ["Peanuts"]
}

{
  "firstName": "Emma",
  "lastName": "Wilson",
  "email": "emma.wilson@student.schoolsync.com",
  "password": "student123",
  "role": "student",
  "user_id_number": "STU002",
  "admissionNumber": "2024002",
  "dateOfBirth": "2010-08-20",
  "gender": "female",
  "parent": "PAR002"
}
```

### 5. Classes
```json
{
  "name": "Class 10",
  "section": "A",
  "academicYear": "2024",
  "teacher": "TEACH001",
  "capacity": 30,
  "description": "Senior secondary class focusing on sciences"
}

{
  "name": "Class 9",
  "section": "B",
  "academicYear": "2024",
  "teacher": "TEACH002",
  "capacity": 30,
  "description": "Junior secondary class with emphasis on literature"
}
```

### 6. Attendance Records
```json
{
  "student": "STU001",
  "class": "Class 10-A",
  "date": "2024-03-15",
  "status": "present",
  "academic_year": "2024",
  "term": "Term 1",
  "marked_by": "TEACH001"
}
```

### 7. Marks/Grades
```json
{
  "student": "STU001",
  "class": "Class 10-A",
  "subject": "Mathematics",
  "academic_year": "2024",
  "term": "Term 1",
  "assessment_type": "exam",
  "score": 85,
  "total_score": 100,
  "grade": "A",
  "remarks": "Excellent performance",
  "teacher": "TEACH001"
}
```

### 8. Fees
```json
{
  "student": "STU001",
  "academicYear": "2024",
  "term": "Term 1",
  "amountDue": 5000,
  "amountPaid": 5000,
  "dueDate": "2024-03-31",
  "status": "paid"
}
```

### 9. Announcements
```json
{
  "title": "School Reopening",
  "content": "School will reopen on April 15th, 2024 for the new term.",
  "author": "ADMIN001",
  "targetRoles": ["all"]
}
```

### 10. Messages
```json
{
  "sender": "PAR001",
  "receiver": "TEACH001",
  "subject": "Regarding James's Performance",
  "content": "I would like to discuss James's recent test scores.",
  "type": "general"
}
```

## Testing the API

1. First, register an admin user using the registration endpoint
2. Login with the admin credentials to get a JWT token
3. Add the JWT token to your request headers:
```
Authorization: Bearer <your-jwt-token>
```

4. Use the token to access protected routes and create other entities in this order:
   - Create teachers
   - Create parents
   - Create students (linking them to parents)
   - Create classes (linking them to teachers)
   - Add students to classes
   - Create attendance records
   - Add marks/grades
   - Create fee records
   - Post announcements
   - Send messages

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Each error response includes a message explaining what went wrong:
```json
{
  "error": "Detailed error message"
}
```

## Data Validation

- User ID numbers must be unique
- Email addresses must be unique and valid
- Passwords must be at least 6 characters long
- Required fields are enforced for all models
- Date fields must be valid dates
- Numeric fields (like scores) must be within valid ranges
- Role-based access control is enforced for all routes 