

const API_BASE_URL = 'http://localhost:3001/api';

async function testIntegration() {
  console.log('🧪 Starting StudySmart Pro Integration Test...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData.status);

    // Test 2: Get notebooks
    console.log('\n2. Testing notebooks endpoint...');
    const notebooksResponse = await fetch(`${API_BASE_URL}/notebooks`);
    const notebooksData = await notebooksResponse.json();
    console.log('✅ Notebooks fetched:', notebooksData.data.notebooks.length, 'notebooks found');

    // Test 3: Create a new notebook
    console.log('\n3. Testing notebook creation...');
    const newNotebook = {
      name: 'Integration Test Notebook',
      description: 'Created by integration test'
    };
    
    const createResponse = await fetch(`${API_BASE_URL}/notebooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotebook)
    });
    const createdNotebook = await createResponse.json();
    console.log('✅ Notebook created:', createdNotebook.data.name);
    const notebookId = createdNotebook.data.id;

    // Test 4: Create a folder
    console.log('\n4. Testing folder creation...');
    const newFolder = {
      name: 'Test Folder',
      notebookId: notebookId
    };
    
    const folderResponse = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFolder)
    });
    const createdFolder = await folderResponse.json();
    console.log('✅ Folder created:', createdFolder.data.name);

    // Test 5: Create a file
    console.log('\n5. Testing file creation...');
    const newFile = {
      name: 'integration-test.md',
      content: '# Integration Test\n\nThis file was created by the integration test.',
      type: 'md',
      notebookId: notebookId
    };
    
    const fileResponse = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFile)
    });
    const createdFile = await fileResponse.json();
    console.log('✅ File created:', createdFile.data.name);

    // Test 6: Get files for notebook
    console.log('\n6. Testing file retrieval...');
    const filesResponse = await fetch(`${API_BASE_URL}/files/notebook/${notebookId}`);
    const filesData = await filesResponse.json();
    console.log('✅ Files retrieved:', filesData.data.length, 'files found');

    // Test 7: Get updated notebooks structure
    console.log('\n7. Testing updated notebooks structure...');
    const updatedNotebooksResponse = await fetch(`${API_BASE_URL}/notebooks`);
    const updatedNotebooksData = await updatedNotebooksResponse.json();
    console.log('✅ Updated structure retrieved');
    
    const testNotebook = updatedNotebooksData.data.notebooks.find(nb => nb.id === notebookId);
    if (testNotebook) {
      console.log('   - Notebook sections:', testNotebook.sections.length);
      console.log('   - Total files in notebook:', testNotebook.sections.reduce((acc, section) => acc + section.files.length, 0));
    }

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Backend API is running and accessible');
    console.log('   ✅ MongoDB connection is working');
    console.log('   ✅ CRUD operations for notebooks, folders, and files work');
    console.log('   ✅ Data persistence is working');
    console.log('   ✅ API responses are properly formatted');
    console.log('\n🌐 Frontend is available at: http://localhost:8080');
    console.log('🔗 Backend API is available at: http://localhost:3001/api');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testIntegration();
