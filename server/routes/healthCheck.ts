import express from 'express';
import { vectorDbService } from '../services/vectorDbService';

const router = express.Router();

// GET /api/health - Basic health check
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// GET /api/health/detailed - Comprehensive health check
router.get('/detailed', async (req: express.Request, res: express.Response) => {
  try {
    const startTime = Date.now();

    // Check ChromaDB service
    const [chromaHealth, chromaStats] = await Promise.allSettled([
      vectorDbService.healthCheck(),
      vectorDbService.getDetailedStats().catch(() => null)
    ]);

    const responseTime = Date.now() - startTime;

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      vectorDatabase: {
        chromadb: {
          healthy: chromaHealth.status === 'fulfilled' ? chromaHealth.value : false,
          stats: chromaStats.status === 'fulfilled' ? chromaStats.value : null,
          connectionInfo: vectorDbService.getConnectionInfo()
        }
      },
      services: {
        database: 'MongoDB',
        embedding: 'ChromaDB (all-MiniLM-L6-v2)',
        vectorSearch: 'ChromaDB'
      }
    };

    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/health/chromadb - ChromaDB specific health check
router.get('/chromadb', async (req: express.Request, res: express.Response) => {
  try {
    const startTime = Date.now();
    
    // Test ChromaDB connection
    const connectionInfo = vectorDbService.getConnectionInfo();
    const isHealthy = await vectorDbService.healthCheck();
    
    let stats = null;
    let error = null;
    
    if (isHealthy) {
      try {
        stats = await vectorDbService.getDetailedStats();
      } catch (err: any) {
        error = err.message;
      }
    }

    const responseTime = Date.now() - startTime;

    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      connection: {
        host: connectionInfo.host,
        port: connectionInfo.port,
        collection: connectionInfo.collection,
        initialized: connectionInfo.isInitialized
      },
      stats,
      error,
      recommendations: isHealthy ? [
        'ChromaDB is running optimally'
      ] : [
        'Check if ChromaDB server is running',
        'Verify connection settings in .env file',
        'Try: chroma run --host localhost --port 8000'
      ]
    };

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      recommendations: [
        'Check if ChromaDB server is running',
        'Verify connection settings',
        'Check server logs for more details'
      ]
    });
  }
});

// POST /api/health/chromadb/reconnect - Force ChromaDB reconnection
router.post('/chromadb/reconnect', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔄 Manual ChromaDB reconnection requested');

    await vectorDbService.reconnect();

    const isHealthy = await vectorDbService.healthCheck();

    res.json({
      success: true,
      message: 'ChromaDB reconnection completed',
      data: {
        chromadbHealthy: isHealthy,
        service: 'ChromaDB',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('ChromaDB reconnection failed:', error);
    res.status(500).json({
      success: false,
      error: 'Reconnection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/health/vector-db - ChromaDB health (alias for chromadb endpoint)
router.get('/vector-db', async (req: express.Request, res: express.Response) => {
  // Redirect to ChromaDB health endpoint
  res.redirect('/api/health/chromadb');
});

export default router;
