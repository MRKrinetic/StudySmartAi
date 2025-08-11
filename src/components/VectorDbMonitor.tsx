import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Server,
  BarChart3
} from "lucide-react";

interface VectorDbStatus {
  activeService: 'chromadb' | 'simple';
  isHealthy: boolean;
  totalEmbeddings: number;
  chromadbHealthy: boolean;
  connectionInfo?: {
    host: string;
    port: number;
    collection: string;
    initialized: boolean;
  };
  recommendations: string[];
}

interface HealthCheckData {
  status: string;
  timestamp: string;
  vectorDatabase: {
    active: { service: string; healthy: boolean };
    chromadb: {
      healthy: boolean;
      stats: any;
      connectionInfo: any;
    };
    simpleVectorDb: {
      healthy: boolean;
      stats: any;
    };
  };
}

export function VectorDbMonitor() {
  const [status, setStatus] = useState<VectorDbStatus | null>(null);
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/semantic/vector-db-status');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Vector DB service may be unavailable.');
      }

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch status');
      }
    } catch (err: any) {
      console.error('Failed to fetch vector DB status:', err);
      setError(`Vector DB service unavailable: ${err.message}`);
      setStatus(null);
    }
  };

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/detailed');

      if (!response.ok) {
        console.warn(`Health endpoint returned ${response.status}: ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Health endpoint returned non-JSON response');
        return;
      }

      const data = await response.json();
      setHealthData(data);
    } catch (err: any) {
      console.warn('Failed to fetch detailed health data:', err);
    }
  };

  const refreshConnection = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/semantic/refresh-vector-db', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchStatus();
        await fetchHealthData();
      } else {
        setError(data.message || 'Failed to refresh connection');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const reconnectChromaDb = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/health/chromadb/reconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchStatus();
        await fetchHealthData();
      } else {
        setError(data.message || 'Failed to reconnect ChromaDB');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchHealthData()]);
      setLoading(false);
    };

    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
      fetchHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vector Database Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vector Database Monitor
            <Button
              variant="outline"
              size="sm"
              onClick={refreshConnection}
              disabled={refreshing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Monitor the status and performance of your vector database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status && (
            <>
              {/* Active Service Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Active Service</div>
                    <div className="text-sm text-muted-foreground">
                      {status.activeService === 'chromadb' ? 'ChromaDB' : 'Simple Vector DB'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {status.isHealthy ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unhealthy
                    </Badge>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Total Embeddings</div>
                    <div className="text-sm text-muted-foreground">
                      Documents indexed for search
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {status.totalEmbeddings.toLocaleString()}
                </div>
              </div>

              {/* ChromaDB Specific Status */}
              {status.connectionInfo && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">ChromaDB Connection</div>
                    <div className="flex items-center gap-2">
                      {status.chromadbHealthy ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reconnectChromaDb}
                        disabled={refreshing}
                      >
                        Reconnect
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Host: {status.connectionInfo.host}:{status.connectionInfo.port}</div>
                    <div>Collection: {status.connectionInfo.collection}</div>
                    <div>Initialized: {status.connectionInfo.initialized ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {status.recommendations.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">Recommendations</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {status.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Health Data */}
              {healthData && (
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">System Health</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Status: {healthData.status}</div>
                    <div>Last Check: {new Date(healthData.timestamp).toLocaleString()}</div>
                    {healthData.vectorDatabase.chromadb.stats && (
                      <div>ChromaDB Documents: {healthData.vectorDatabase.chromadb.stats.count}</div>
                    )}
                    {healthData.vectorDatabase.simpleVectorDb.stats && (
                      <div>Simple DB Documents: {healthData.vectorDatabase.simpleVectorDb.stats.count}</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
