# StudySmart Pro - Development Guide

## 🚀 Quick Start

### Option 1: Use Development Scripts (Recommended)
```bash
# Windows
scripts\start-dev.bat

# Linux/Mac
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

### Option 2: Manual Commands
```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev
```

## 📋 Available Scripts

### Development Scripts
| Command | Description | Ports |
|---------|-------------|-------|
| `npm run dev` | Start both frontend & backend | 8080, 3001 |
| `npm run dev:client` | Start frontend only | 8080 |
| `npm run dev:server` | Start backend only | 3001 |

### Build Scripts
| Command | Description |
|---------|-------------|
| `npm run build` | Build for production |
| `npm run build:client` | Build frontend only |
| `npm run build:server` | Build backend only |
| `npm start` | Start production server |

### Other Scripts
| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## 🌐 Application URLs

### Development
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

### API Endpoints
```
GET    /api/notebooks           # Get all notebooks
POST   /api/notebooks           # Create notebook
PUT    /api/notebooks/:id       # Update notebook
DELETE /api/notebooks/:id       # Delete notebook

POST   /api/folders             # Create folder
PUT    /api/folders/:id         # Update folder
DELETE /api/folders/:id         # Delete folder

POST   /api/files               # Create file
GET    /api/files/single/:id    # Get single file
PUT    /api/files/:id           # Update file
DELETE /api/files/:id           # Delete file
```

## 🗂️ Project Structure

```
studysmart-pro/
├── src/                        # Frontend (React + TypeScript)
│   ├── components/            # React components
│   │   ├── NotebookSidebar.tsx # Main sidebar with CRUD operations
│   │   ├── dialogs/           # Create/Delete dialogs
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   │   └── useNotebooks.ts    # MongoDB integration hooks
│   ├── services/              # API services
│   │   └── notebookApi.ts     # API client functions
│   ├── types/                 # TypeScript type definitions
│   └── pages/                 # Page components
├── server/                     # Backend (Express + TypeScript)
│   ├── config/                # Configuration
│   │   └── database.ts        # MongoDB connection
│   ├── models/                # Mongoose models
│   │   ├── Notebook.ts        # Notebook schema
│   │   ├── Folder.ts          # Folder schema
│   │   └── File.ts            # File schema
│   ├── routes/                # API routes
│   │   ├── notebooks.ts       # Notebook CRUD routes
│   │   ├── folders.ts         # Folder CRUD routes
│   │   └── files.ts           # File CRUD routes
│   └── index.ts               # Express server setup
├── scripts/                   # Development scripts
└── public/                    # Static assets
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
# Backend
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string

# Frontend
VITE_API_BASE_URL=http://localhost:3001/api
```

### MongoDB Setup
The application uses MongoDB Atlas. Connection is configured in:
- `server/config/database.ts`

### CORS Configuration
CORS is configured in `server/index.ts` to allow:
- Development: `http://localhost:8080`, `http://localhost:3000`
- Production: Configure your production domain

## 🛠️ Development Features

### MongoDB Integration
- ✅ Full CRUD operations for notebooks, folders, and files
- ✅ Real-time UI updates after database operations
- ✅ Error handling with user feedback
- ✅ Loading states during operations

### Frontend Features
- ✅ React Query for state management and caching
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Radix UI components
- ✅ Toast notifications (Sonner)
- ✅ Form validation (React Hook Form + Zod)

### Backend Features
- ✅ Express.js with TypeScript
- ✅ Mongoose for MongoDB integration
- ✅ Input validation (Express Validator)
- ✅ Security middleware (Helmet, CORS, Rate Limiting)
- ✅ Error handling middleware
- ✅ Health check endpoint

## 🧪 Testing the Application

### Manual Testing
1. Start the development servers
2. Open http://localhost:8080
3. Test CRUD operations:
   - Create notebooks, folders, and files
   - Delete items with confirmation dialogs
   - Expand/collapse folders
   - Check real-time UI updates

### API Testing
Use tools like Postman or curl to test API endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Get all notebooks
curl http://localhost:3001/api/notebooks

# Create a notebook
curl -X POST http://localhost:3001/api/notebooks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Notebook","description":"Test description"}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Change ports in `vite.config.ts` (frontend) or `server/index.ts` (backend)

2. **MongoDB connection issues**
   - Check connection string in `server/config/database.ts`
   - Ensure network access to MongoDB Atlas

3. **Dependencies issues**
   - Delete `node_modules` and run `npm install`
   - Check Node.js version (requires 16+)

4. **CORS errors**
   - Ensure frontend URL is in CORS allowlist in `server/index.ts`

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=* npm run dev:server
```

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure production MongoDB URI
- Set production CORS origins
- Configure production API base URL
