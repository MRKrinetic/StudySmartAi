#!/usr/bin/env node

/**
 * Test script to check the exact API response format
 */

import http from 'http';

async function testVectorDbStatusAPI() {
  console.log('🔍 Testing Vector DB Status API...');

  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/semantic/vector-db-status', (res) => {
    
      console.log(`📡 Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📡 Content-Type: ${res.headers['content-type']}`);

      let rawText = '';
      res.on('data', (chunk) => {
        rawText += chunk;
      });

      res.on('end', () => {
        console.log('\n📄 Raw Response Text:');
        console.log('---START---');
        console.log(rawText);
        console.log('---END---');

        console.log('\n🔍 Checking for "falsE" pattern...');
        if (rawText.includes('falsE')) {
          console.log('❌ FOUND "falsE" in response!');
          const matches = rawText.match(/isHealthy[^,}]*/g);
          if (matches) {
            console.log('🔍 isHealthy matches:', matches);
          }
        } else {
          console.log('✅ No "falsE" pattern found');
        }

        console.log('\n🔍 Attempting JSON parse...');
        try {
          const data = JSON.parse(rawText);
          console.log('✅ JSON parse successful');
          console.log('📊 isHealthy value:', data.data?.isHealthy);
          console.log('📊 isHealthy type:', typeof data.data?.isHealthy);
          resolve();
        } catch (parseError) {
          console.log('❌ JSON parse failed:', parseError.message);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ API test failed:', error.message);
      reject(error);
    });
  });
}

// Run the test
testVectorDbStatusAPI().catch(console.error);
