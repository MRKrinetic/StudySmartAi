# ChromaDB Setup Guide for Code Notes Buddy

This guide will help you set up ChromaDB as the vector database for the Code Notes Buddy application's semantic search functionality.

## 🎯 Overview

ChromaDB provides high-performance vector similarity search for the semantic search features. This setup replaces the simple file-based vector database with a proper ChromaDB instance running locally.

## 📋 Prerequisites

- **Python 3.8+** for ChromaDB
- **Node.js 16+** for the main application
- **pip** (Python package manager)

## 🚀 Quick Setup

### Step 1: Install ChromaDB

```bash
# Install ChromaDB using pip
pip install chromadb

# Or using conda
conda install -c conda-forge chromadb
```

### Step 2: Start ChromaDB Server

```bash
# Start ChromaDB server on localhost:8000
chroma run --host localhost --port 8000
```

The server will start and you should see output like:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:8000
```

### Step 3: Verify ChromaDB is Running

Open a new terminal and test the connection:
```bash
# Test API endpoint
curl http://localhost:8000/api/v1/heartbeat
```

Expected response: `{"nanosecond heartbeat": 123456789}`

## 🔧 Configuration

### Environment Variables

Your `.env` file should already have ChromaDB configuration:

```env
# ChromaDB Configuration
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_COLLECTION_NAME=code_notes_embeddings

# Semantic Search Configuration
SEMANTIC_SEARCH_THRESHOLD=0.7
MAX_CONTEXT_FILES=5
```

### Application Configuration

The application will automatically connect to ChromaDB when it's running on localhost:8000.

## 🧪 Testing ChromaDB Connection

### 1. Health Check
```bash
curl http://localhost:8000/api/v1/heartbeat
```
Expected response: `{"status":"ok"}`

### 2. Version Check
```bash
curl http://localhost:8000/api/v1/version
```
Expected response: `{"version":"x.x.x"}`

### 3. Application Integration Test
Start your application and check the logs for ChromaDB connection messages:
```bash
npm run dev
```

Look for messages like:
- `✅ Connected to existing ChromaDB collection: code_notes_embeddings`
- `✅ Created new ChromaDB collection: code_notes_embeddings`

## 📊 ChromaDB Management

### Starting ChromaDB
```bash
chroma run --host localhost --port 8000
```

### Stopping ChromaDB
Simply press `Ctrl+C` in the terminal where ChromaDB is running.

### Running ChromaDB in Background
```bash
# Windows (PowerShell)
Start-Process -NoNewWindow -FilePath "chroma" -ArgumentList "run", "--host", "localhost", "--port", "8000"

# Linux/macOS
nohup chroma run --host localhost --port 8000 &
```

### Accessing ChromaDB Data
ChromaDB data is stored locally in the current directory where you started the server. Look for a `.chroma` directory.

## 🔍 Troubleshooting

### Common Issues

#### 1. Port 8000 Already in Use
```bash
# Check what's using port 8000
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/macOS

# Change ChromaDB port in docker-compose.yml if needed
```

#### 2. ChromaDB Installation Issues
```bash
# Try upgrading pip first
pip install --upgrade pip

# Install ChromaDB with specific version if needed
pip install chromadb==0.4.22
```

#### 3. ChromaDB Won't Start
```bash
# Check if port 8000 is available
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/macOS

# Try a different port if needed
chroma run --host localhost --port 8001
```

#### 4. Connection Refused from Application
- Verify ChromaDB is running: `curl http://localhost:8000/api/v1/heartbeat`
- Check firewall settings
- Ensure correct host/port in `.env` file

### Performance Tuning

#### Memory Settings
For large datasets, you may need to adjust Docker memory limits:
```yaml
# In docker-compose.yml
services:
  chromadb:
    # ... other settings
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

#### Collection Settings
ChromaDB collections are automatically optimized, but you can monitor performance:
```bash
# Check collection stats via application API
curl http://localhost:3001/api/semantic/stats?userId=your-user-id
```

## 🔄 Migration from Simple Vector DB

If you have existing embeddings in the simple vector database (`.simple-vector-db.json`), they will be automatically migrated when you switch to ChromaDB.

The application includes migration utilities that:
1. Detect existing simple vector database data
2. Migrate embeddings to ChromaDB
3. Preserve all metadata and relationships

## 🎯 Next Steps

After ChromaDB is running:

1. **Start the application**: `npm run dev`
2. **Index your files**: The application will automatically index files when you use semantic search
3. **Test semantic search**: Try asking questions in the AI chat to see context-aware responses
4. **Monitor performance**: Use the stats endpoint to track embedding counts and search performance

## 📚 Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Code Notes Buddy Semantic Search Guide](./SEMANTIC_SEARCH_README.md)
