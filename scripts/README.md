# StudySmart Pro - Development Scripts

This folder contains convenient scripts to help you run and manage the StudySmart Pro application.

## 🚀 Quick Start Scripts

### Windows (.bat files)

#### `start-dev.bat` - Start Both Frontend & Backend
```bash
# Double-click or run in command prompt
start-dev.bat
```
- Starts both frontend (React/Vite) and backend (Express/Node.js)
- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- API: http://localhost:3001/api

#### `start-frontend-only.bat` - Frontend Only
```bash
start-frontend-only.bat
```
- Starts only the React/Vite development server
- Useful when backend is running separately or using a different API

#### `start-backend-only.bat` - Backend Only
```bash
start-backend-only.bat
```
- Starts only the Express/Node.js server
- Useful for API development or when frontend is running separately

#### `build-production.bat` - Build for Production
```bash
build-production.bat
```
- Builds both frontend and backend for production deployment
- Creates optimized bundles in `dist/` folder

#### `install-dependencies.bat` - Install Dependencies
```bash
install-dependencies.bat
```
- Installs all npm dependencies
- Run this first if you haven't installed dependencies yet

### Linux/Mac (.sh files)

#### `start-dev.sh` - Start Both Frontend & Backend
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

## 📋 Manual Commands

If you prefer to run commands manually:

### Development
```bash
# Install dependencies (first time only)
npm install

# Start both frontend and backend
npm run dev

# Start frontend only (React/Vite on port 8080)
npm run dev:client

# Start backend only (Express/Node.js on port 3001)
npm run dev:server
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Preview production build
npm run preview
```

### Other Commands
```bash
# Run linting
npm run lint

# Build in development mode
npm run build:dev
```

## 🔧 Configuration

### Environment Variables
The application uses these default configurations:
- **Frontend Port**: 8080
- **Backend Port**: 3001
- **MongoDB**: Configured in `server/config/database.ts`

### API Base URL
The frontend is configured to connect to the backend at:
- Development: `http://localhost:3001/api`
- Production: Set via `VITE_API_BASE_URL` environment variable

## 🗂️ Project Structure
```
studysmart-pro/
├── src/                    # Frontend React code
├── server/                 # Backend Express code
├── scripts/               # Development scripts (this folder)
├── public/                # Static assets
├── dist/                  # Built files (after npm run build)
└── package.json           # Dependencies and scripts
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Frontend (8080): Change port in `vite.config.ts`
   - Backend (3001): Change PORT in `server/index.ts`

2. **Dependencies not installed**
   - Run `install-dependencies.bat` or `npm install`

3. **MongoDB connection issues**
   - Check connection string in `server/config/database.ts`
   - Ensure MongoDB Atlas is accessible

4. **CORS issues**
   - Check CORS configuration in `server/index.ts`
   - Ensure frontend URL is in allowed origins

### Getting Help
- Check the console output for error messages
- Ensure Node.js version 16+ is installed
- Make sure all dependencies are installed with `npm install`
