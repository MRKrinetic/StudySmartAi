#!/usr/bin/env node

/**
 * Simple script to test ChromaDB connection
 * This helps diagnose vector DB API issues
 */

import { ChromaClient } from 'chromadb';

async function testChromaDBConnection() {
  console.log('🔍 Testing ChromaDB connection...');
  
  const CHROMADB_HOST = process.env.CHROMADB_HOST || 'localhost';
  const CHROMADB_PORT = parseInt(process.env.CHROMADB_PORT || '8000');
  
  console.log(`📍 Connecting to ChromaDB at ${CHROMADB_HOST}:${CHROMADB_PORT}`);
  
  try {
    // Initialize ChromaDB client
    const client = new ChromaClient({
      host: CHROMADB_HOST,
      port: CHROMADB_PORT
    });
    
    console.log('✅ ChromaDB client created successfully');
    
    // Test basic connection with heartbeat
    const heartbeat = await client.heartbeat();
    console.log('✅ ChromaDB heartbeat successful:', heartbeat);
    
    // List collections
    const collections = await client.listCollections();
    console.log(`✅ Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Test collection creation/access
    const collectionName = 'test_connection';
    let collection;
    
    try {
      collection = await client.getCollection({ name: collectionName });
      console.log(`✅ Found existing collection: ${collectionName}`);
    } catch (error) {
      console.log(`📝 Creating test collection: ${collectionName}`);
      collection = await client.createCollection({ name: collectionName });
      console.log(`✅ Created test collection: ${collectionName}`);
    }
    
    // Get collection count
    const count = await collection.count();
    console.log(`📊 Collection ${collectionName} has ${count} documents`);
    
    console.log('🎉 ChromaDB connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ ChromaDB connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Suggestions:');
      console.log('   1. Start ChromaDB: chroma run --host localhost --port 8000');
      console.log('   2. Check if port 8000 is available');
      console.log('   3. Verify ChromaDB installation: pip install chromadb');
    }
    
    return false;
  }
}

// Test API endpoint as well
async function testAPIEndpoint() {
  console.log('\n🔍 Testing API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3001/api/semantic/vector-db-status');
    
    console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
    console.log(`📡 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ API Error Response:', text.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 Make sure the server is running on port 3001');
  }
}

async function main() {
  console.log('🚀 ChromaDB Connection Diagnostic Tool\n');
  
  const chromaOk = await testChromaDBConnection();
  await testAPIEndpoint();
  
  console.log('\n📋 Summary:');
  console.log(`   ChromaDB Direct Connection: ${chromaOk ? '✅ OK' : '❌ Failed'}`);
  console.log('   API Endpoint: Check output above');
  
  if (!chromaOk) {
    console.log('\n🔧 To fix ChromaDB issues:');
    console.log('   1. Install ChromaDB: pip install chromadb');
    console.log('   2. Start ChromaDB: chroma run --host localhost --port 8000');
    console.log('   3. Verify it\'s running: curl http://localhost:8000/api/v1/heartbeat');
  }
}

// Run the main function
main().catch(console.error);

export { testChromaDBConnection, testAPIEndpoint };
