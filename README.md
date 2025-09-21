# Full-Stack Authentication App

A complete authentication system built with Node.js/Express backend and Next.js frontend with Tailwind CSS.

## Features

- User registration and login
- JWT-based authentication
- SQLite database
- Responsive design with Tailwind CSS
- Protected routes
- Modern UI/UX

## Project Structure

```
├── backend/          # Node.js/Express backend
│   ├── server.js    # Main server file
│   └── package.json # Backend dependencies
├── frontend/         # Next.js frontend
│   ├── app/         # Next.js app directory
│   ├── styles/      # Global styles
│   └── package.json # Frontend dependencies
└── README.md        # This file
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be running on `http://localhost:3000`

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (protected)
- `GET /api/health` - Health check

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Register a new account or login with existing credentials
4. After successful authentication, you'll see the dashboard with user information

## Technologies Used

### Backend
- Node.js
- Express.js
- SQLite3
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- CORS

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios (HTTP client)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation
- CORS configuration
- Protected routes

## Development

- Backend uses nodemon for auto-restart
- Frontend uses Next.js hot reload
- SQLite database file is created automatically
