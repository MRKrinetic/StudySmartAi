#!/usr/bin/env node

/**
 * ChromaDB Integration Test Script
 *
 * This script tests the ChromaDB integration for the StudySmart Pro application.
 * It verifies that ChromaDB is properly connected and functional.
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const CHROMADB_URL = process.env.CHROMADB_URL || 'http://localhost:8000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000, // 10 seconds
  retries: 3,
  testUserId: 'test-user-chromadb-integration'
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

function logStep(message) {
  log(`🔄 ${message}`, colors.cyan);
}

// Helper function to make HTTP requests with timeout
async function makeRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test 1: Check if ChromaDB server is running
async function testChromaDbServer() {
  logStep('Testing ChromaDB server connection...');
  
  try {
    const response = await makeRequest(`${CHROMADB_URL}/api/v1/heartbeat`);
    
    if (response.ok) {
      logSuccess('ChromaDB server is running and responding');
      
      // Get version info
      try {
        const versionResponse = await makeRequest(`${CHROMADB_URL}/api/v1/version`);
        const versionData = await versionResponse.json();
        logInfo(`ChromaDB version: ${versionData.version || 'unknown'}`);
      } catch (error) {
        logWarning('Could not get ChromaDB version info');
      }
      
      return true;
    } else {
      logError(`ChromaDB server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`ChromaDB server connection failed: ${error.message}`);
    logInfo('Make sure ChromaDB is running: chroma run --host localhost --port 8000');
    return false;
  }
}

// Test 2: Check application health endpoints
async function testApplicationHealth() {
  logStep('Testing application health endpoints...');
  
  try {
    // Test basic health
    const healthResponse = await makeRequest(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      logError(`Health endpoint failed: ${healthResponse.status}`);
      return false;
    }
    
    const healthData = await healthResponse.json();
    logSuccess(`Application health: ${healthData.status}`);
    
    // Test detailed health
    const detailedResponse = await makeRequest(`${API_BASE_URL}/health/detailed`);
    if (!detailedResponse.ok) {
      logError(`Detailed health endpoint failed: ${detailedResponse.status}`);
      return false;
    }
    
    const detailedData = await detailedResponse.json();
    logInfo(`Vector DB active service: ${detailedData.vectorDatabase?.active?.service || 'unknown'}`);
    logInfo(`ChromaDB healthy: ${detailedData.vectorDatabase?.chromadb?.healthy || false}`);
    
    return true;
  } catch (error) {
    logError(`Application health check failed: ${error.message}`);
    return false;
  }
}

// Test 3: Test vector database status
async function testVectorDbStatus() {
  logStep('Testing vector database status...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/semantic/vector-db-status`);
    
    if (!response.ok) {
      logError(`Vector DB status endpoint failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess(`Active vector service: ${data.data.activeService}`);
      logInfo(`Service healthy: ${data.data.isHealthy}`);
      logInfo(`Total embeddings: ${data.data.totalEmbeddings}`);
      
      if (data.data.activeService === 'chromadb') {
        logSuccess('ChromaDB is active and being used');
      } else {
        logWarning('Using Simple Vector DB instead of ChromaDB');
      }
      
      return true;
    } else {
      logError(`Vector DB status check failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Vector DB status test failed: ${error.message}`);
    return false;
  }
}

// Test 4: Test ChromaDB specific health
async function testChromaDbHealth() {
  logStep('Testing ChromaDB specific health...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/health/chromadb`);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      logSuccess('ChromaDB health check passed');
      logInfo(`Connection: ${data.connection.host}:${data.connection.port}`);
      logInfo(`Collection: ${data.connection.collection}`);
      logInfo(`Initialized: ${data.connection.initialized}`);
      
      if (data.stats) {
        logInfo(`Documents in ChromaDB: ${data.stats.count || 0}`);
      }
      
      return true;
    } else {
      logWarning(`ChromaDB health status: ${data.status}`);
      if (data.error) {
        logError(`ChromaDB error: ${data.error}`);
      }
      
      if (data.recommendations) {
        logInfo('Recommendations:');
        data.recommendations.forEach(rec => logInfo(`  - ${rec}`));
      }
      
      return false;
    }
  } catch (error) {
    logError(`ChromaDB health test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Test migration status
async function testMigrationStatus() {
  logStep('Testing migration status...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/semantic/migration-status`);
    
    if (!response.ok) {
      logError(`Migration status endpoint failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess('Migration status retrieved successfully');
      logInfo(`Simple DB documents: ${data.data.simpleDbStats.count}`);
      logInfo(`ChromaDB documents: ${data.data.chromaDbStats.count}`);
      logInfo(`ChromaDB healthy: ${data.data.chromaDbHealthy}`);
      
      if (data.data.recommendations.length > 0) {
        logInfo('Migration recommendations:');
        data.data.recommendations.forEach(rec => logInfo(`  - ${rec}`));
      }
      
      return true;
    } else {
      logError(`Migration status check failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Migration status test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Test vector database refresh
async function testVectorDbRefresh() {
  logStep('Testing vector database refresh...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/semantic/refresh-vector-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      logError(`Vector DB refresh failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data.success) {
      logSuccess('Vector database refresh completed');
      logInfo(`Active service after refresh: ${data.data.activeService}`);
      logInfo(`Service healthy: ${data.data.isHealthy}`);
      return true;
    } else {
      logError(`Vector DB refresh failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Vector DB refresh test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting ChromaDB Integration Tests\n', colors.cyan);
  
  const tests = [
    { name: 'ChromaDB Server', fn: testChromaDbServer },
    { name: 'Application Health', fn: testApplicationHealth },
    { name: 'Vector DB Status', fn: testVectorDbStatus },
    { name: 'ChromaDB Health', fn: testChromaDbHealth },
    { name: 'Migration Status', fn: testMigrationStatus },
    { name: 'Vector DB Refresh', fn: testVectorDbRefresh }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
    
    log(''); // Empty line for readability
  }
  
  // Summary
  log('📊 Test Results Summary\n', colors.cyan);
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });
  
  log(`\n🎯 Overall: ${passed}/${total} tests passed\n`, colors.cyan);
  
  if (passed === total) {
    logSuccess('All tests passed! ChromaDB integration is working correctly.');
    process.exit(0);
  } else {
    logError('Some tests failed. Please check the output above for details.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testChromaDbServer,
  testApplicationHealth,
  testVectorDbStatus,
  testChromaDbHealth,
  testMigrationStatus,
  testVectorDbRefresh
};
