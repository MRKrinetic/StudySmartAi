# 🚀 How to Run StudySmart Pro

## Quick Start (Choose One Method)

### Method 1: Using Scripts (Easiest)

#### Windows
```bash
# Double-click or run in Command Prompt/PowerShell
scripts\start-dev.bat

# Or PowerShell
scripts\start-dev.ps1
```

#### Linux/Mac
```bash
# Make executable first
chmod +x scripts/start-dev.sh

# Then run
./scripts/start-dev.sh
```

### Method 2: Using Node.js Runner
```bash
# Install dependencies and start both servers
node run.js dev

# Other options
node run.js frontend    # Frontend only
node run.js backend     # Backend only
node run.js build       # Build for production
node run.js install     # Install dependencies
```

### Method 3: Direct npm Commands
```bash
# Install dependencies (first time only)
npm install

# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:client      # Frontend only (port 8080)
npm run dev:server      # Backend only (port 3001)
```

## 🌐 Application URLs

Once running, access these URLs:

- **Frontend Application**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 📋 All Available Scripts

### Development Scripts
| Script | Command | Description |
|--------|---------|-------------|
| Both Servers | `npm run dev` | Start frontend + backend |
| Frontend Only | `npm run dev:client` | React app on port 8080 |
| Backend Only | `npm run dev:server` | Express API on port 3001 |

### Build Scripts
| Script | Command | Description |
|--------|---------|-------------|
| Production Build | `npm run build` | Build both for production |
| Frontend Build | `npm run build:client` | Build React app only |
| Backend Build | `npm run build:server` | Build Express server only |
| Start Production | `npm start` | Run production build |

### Utility Scripts
| Script | Command | Description |
|--------|---------|-------------|
| Install Dependencies | `npm install` | Install all packages |
| Lint Code | `npm run lint` | Run ESLint |
| Preview Build | `npm run preview` | Preview production build |

## 🛠️ Prerequisites

### Required Software
1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **npm** (comes with Node.js)
   - Verify: `npm --version`

### First Time Setup
```bash
# 1. Navigate to project directory
cd studysmart-pro-main

# 2. Install dependencies
npm install

# 3. Start development servers
npm run dev
```

## 🔧 Configuration

### Default Ports
- **Frontend (React/Vite)**: 8080
- **Backend (Express)**: 3001

### MongoDB
- **Connection**: Pre-configured MongoDB Atlas
- **Database**: Automatically connects on server start

### Environment Variables (Optional)
Create `.env` file in root directory:
```env
# Backend
PORT=3001
NODE_ENV=development

# Frontend  
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🎯 What You'll See

### When Successfully Running
```
Frontend (Vite):
  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/

Backend (Express):
  Connecting to MongoDB...
  ✅ MongoDB connected successfully
  🚀 Server running on port 3001
  📍 Health check: http://localhost:3001/health
  🔗 API base URL: http://localhost:3001/api
```

### Application Features
- ✅ Create/Delete Notebooks
- ✅ Create/Delete Folders  
- ✅ Create/Delete Files
- ✅ Expand/Collapse folders
- ✅ Real-time MongoDB sync
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error handling

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
Error: listen EADDRINUSE :::8080
```
**Solution**: Kill process using the port or change port in `vite.config.ts`

#### 2. Dependencies Not Installed
```bash
Error: Cannot find module...
```
**Solution**: Run `npm install`

#### 3. Node.js Not Found
```bash
'node' is not recognized...
```
**Solution**: Install Node.js from https://nodejs.org/

#### 4. MongoDB Connection Failed
```bash
❌ Failed to connect to MongoDB
```
**Solution**: Check internet connection and MongoDB Atlas configuration

#### 5. CORS Errors
```bash
Access to fetch blocked by CORS policy
```
**Solution**: Ensure frontend URL is in CORS allowlist in `server/index.ts`

### Debug Steps
1. Check Node.js version: `node --version` (should be 16+)
2. Check npm version: `npm --version`
3. Clear dependencies: `rm -rf node_modules && npm install`
4. Check ports: `netstat -an | findstr :8080` (Windows) or `lsof -i :8080` (Mac/Linux)

## 📁 Project Structure
```
studysmart-pro/
├── src/                    # Frontend React code
├── server/                 # Backend Express code  
├── scripts/               # Helper scripts
├── public/                # Static files
├── package.json           # Dependencies & scripts
├── run.js                 # Node.js runner script
└── HOW-TO-RUN.md         # This file
```

## 🎉 Success Checklist

- [ ] Node.js installed (16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Both servers running (`npm run dev`)
- [ ] Frontend accessible at http://localhost:8080
- [ ] Backend accessible at http://localhost:3001
- [ ] MongoDB connected successfully
- [ ] Can create/delete notebooks, folders, files

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check console output for error messages
4. Ensure all dependencies are installed
