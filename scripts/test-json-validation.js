#!/usr/bin/env node

/**
 * Comprehensive test to validate JSON responses from Vector DB API
 */

import http from 'http';

async function testAPICall(callNumber) {
  console.log(`\n🔍 Test ${callNumber}: Testing Vector DB Status API...`);
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/semantic/vector-db-status', (res) => {
      console.log(`📡 Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📡 Content-Type: ${res.headers['content-type']}`);
      
      let rawText = '';
      res.on('data', (chunk) => {
        rawText += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Raw Response Length: ${rawText.length} characters`);
        
        // Check for the specific "falsE" issue
        const falsEPattern = /isHealthy[^,}]*falsE/g;
        const falsEMatches = rawText.match(falsEPattern);
        
        if (falsEMatches) {
          console.log('❌ FOUND "falsE" pattern!');
          console.log('🔍 Matches:', falsEMatches);
          console.log('📄 Full response:', rawText);
        } else {
          console.log('✅ No "falsE" pattern found');
        }
        
        // Check for proper boolean values
        const isHealthyPattern = /"isHealthy":(true|false)/g;
        const booleanMatches = rawText.match(isHealthyPattern);
        
        if (booleanMatches) {
          console.log('✅ Found proper boolean values:', booleanMatches);
        } else {
          console.log('❌ No proper boolean values found');
        }
        
        // Validate JSON parsing
        try {
          const data = JSON.parse(rawText);
          console.log('✅ JSON parse successful');
          console.log(`📊 isHealthy value: ${data.data?.isHealthy}`);
          console.log(`📊 isHealthy type: ${typeof data.data?.isHealthy}`);
          
          if (typeof data.data?.isHealthy !== 'boolean') {
            console.log('❌ isHealthy is not a boolean!');
          }
          
          resolve({
            success: true,
            hasError: false,
            isHealthy: data.data?.isHealthy,
            type: typeof data.data?.isHealthy
          });
        } catch (parseError) {
          console.log('❌ JSON parse failed:', parseError.message);
          console.log('📄 Raw response:', rawText);
          resolve({
            success: false,
            hasError: true,
            error: parseError.message,
            rawResponse: rawText
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ API test failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runComprehensiveTest() {
  console.log('🚀 Comprehensive Vector DB API JSON Validation Test\n');
  
  const results = [];
  const numTests = 5;
  
  for (let i = 1; i <= numTests; i++) {
    try {
      const result = await testAPICall(i);
      results.push(result);
      
      // Small delay between requests
      if (i < numTests) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Test ${i} failed:`, error.message);
      results.push({
        success: false,
        hasError: true,
        error: error.message
      });
    }
  }
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.hasError).length;
  const withFalseE = results.filter(r => r.rawResponse && r.rawResponse.includes('falsE')).length;
  
  console.log(`✅ Successful: ${successful}/${numTests}`);
  console.log(`❌ Failed: ${failed}/${numTests}`);
  console.log(`🔍 With "falsE" issue: ${withFalseE}/${numTests}`);
  
  if (withFalseE > 0) {
    console.log('\n❌ ISSUE CONFIRMED: "falsE" pattern found in responses');
  } else {
    console.log('\n✅ ISSUE RESOLVED: No "falsE" pattern found in any response');
  }
  
  // Check for consistency
  const booleanTypes = results.filter(r => r.success).map(r => r.type);
  const allBoolean = booleanTypes.every(type => type === 'boolean');
  
  if (allBoolean) {
    console.log('✅ All isHealthy values are proper booleans');
  } else {
    console.log('❌ Some isHealthy values are not proper booleans');
    console.log('Types found:', [...new Set(booleanTypes)]);
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
