# Semantic Search Integration with Gemini Chatbot

This document describes the implementation of semantic search functionality that allows the Gemini chatbot to search through saved code files and notes using vector embeddings for context-aware conversations.

## 🎯 Overview

The semantic search system enhances the existing Gemini chatbot by:
- Converting code files into vector embeddings using Google's Gemini embedding API
- Storing embeddings in ChromaDB for fast similarity search
- Automatically finding relevant files when users ask questions
- Injecting relevant code context into chat responses
- Providing intelligent, context-aware programming assistance

## 🏗️ Architecture

### Components

1. **Embedding Service** (`server/services/embeddingService.ts`)
   - Generates vector embeddings using Gemini's `text-embedding-004` model
   - Processes file content for optimal embedding quality
   - Handles batch processing with rate limiting

2. **Vector Database Service** (`server/services/vectorDbService.ts`)
   - Manages ChromaDB integration
   - Stores and retrieves vector embeddings with metadata
   - Performs similarity search with configurable thresholds

3. **Cache Service** (`server/services/cacheService.ts`)
   - Implements embedding cache to avoid re-processing unchanged files
   - Provides performance optimizations and token management
   - Handles cache cleanup and optimization

4. **Semantic Search API** (`server/routes/semanticSearch.ts`)
   - RESTful endpoints for indexing and searching
   - Integration with existing file management system
   - Error handling and validation

5. **Enhanced Chat Interface** (`src/components/AIChatSidebar.tsx`)
   - Shows semantic search indicators
   - Displays referenced files with similarity scores
   - Provides settings for search sensitivity

## 🚀 Setup and Configuration

### Prerequisites

1. **ChromaDB Server**: Install and run ChromaDB
   ```bash
   pip install chromadb
   chroma run --host localhost --port 8000
   ```

2. **Environment Variables**: Update `.env` file
   ```env
   # Google Gemini API Configuration
   VITE_GEMINI_API_KEY=your_gemini_api_key

   # ChromaDB Configuration
   CHROMADB_HOST=localhost
   CHROMADB_PORT=8000
   CHROMADB_COLLECTION_NAME=code_notes_embeddings

   # Semantic Search Configuration
   SEMANTIC_SEARCH_THRESHOLD=0.7
   MAX_CONTEXT_FILES=5
   ```

3. **Dependencies**: Install required packages
   ```bash
   npm install chromadb
   ```

### Installation Steps

1. **Start ChromaDB Server**
   ```bash
   chroma run --host localhost --port 8000
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Index Your Files**
   ```bash
   # Via API endpoint
   POST /api/index/semantic-files
   
   # Or via the frontend interface
   # The system will automatically index files when you start chatting
   ```

## 📡 API Endpoints

### Indexing

**POST `/api/index/semantic-files`**
- Indexes all files with vector embeddings
- Supports incremental indexing
- Returns indexing statistics

**POST `/api/semantic/index-files`**
- Advanced indexing with filtering options
- Supports file type and notebook filters
- Batch processing with progress tracking

### Search

**POST `/api/semantic/search`**
- Performs semantic search across indexed files
- Configurable similarity threshold and result count
- Returns ranked results with similarity scores

**POST `/api/semantic/chat`**
- Enhanced chat endpoint with semantic search
- Automatically finds relevant files for context
- Optimizes context for token limits

### Statistics

**GET `/api/semantic/stats`**
- Returns indexing and search statistics
- Vector database health check
- Cache performance metrics

## 💬 Chat Integration

### Enhanced Chat Flow

1. **User sends message** → System generates embedding for the query
2. **Semantic search** → Finds top 3-5 most relevant files (similarity > 70%)
3. **Context injection** → Adds relevant file content to the prompt
4. **Gemini response** → Generates context-aware response
5. **Display results** → Shows response with referenced files

### Context Optimization

- **Token Management**: Automatically optimizes context to stay within Gemini's token limits
- **Relevance Ranking**: Prioritizes files by similarity score
- **Content Truncation**: Intelligently truncates long files while preserving key information
- **Fallback Handling**: Gracefully falls back to regular chat if semantic search fails

## 🎛️ Configuration Options

### Semantic Search Settings

```typescript
interface SemanticSearchSettings {
  enabled: boolean;              // Enable/disable semantic search
  threshold: number;             // Similarity threshold (0-1)
  maxContextFiles: number;       // Max files to include in context
  fileTypeFilters: string[];     // Filter by file types
  notebookFilters: string[];     // Filter by notebooks
  showContextFiles: boolean;     // Show referenced files in UI
  autoIndex: boolean;            // Auto-index new files
}
```

### Performance Tuning

- **Cache TTL**: 24 hours (configurable)
- **Batch Size**: 5 files per batch (rate limiting)
- **Max Cache Entries**: 1000 embeddings
- **Token Limit**: 4000 tokens for context
- **Search Threshold**: 0.7 (70% similarity)

## 🧪 Testing

### Run Integration Tests

```bash
# Run the semantic search test suite
npx tsx server/test-semantic-search.ts
```

### Test Coverage

- ✅ Embedding generation and caching
- ✅ Vector database operations
- ✅ Semantic search accuracy
- ✅ Chat integration
- ✅ Performance optimization
- ✅ Error handling and fallbacks

## 🔧 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   - Ensure ChromaDB server is running on correct port
   - Check firewall settings
   - Verify environment variables

2. **Embedding Generation Errors**
   - Validate Gemini API key
   - Check API quota limits
   - Verify network connectivity

3. **Poor Search Results**
   - Lower similarity threshold
   - Increase max context files
   - Re-index files with updated content

4. **Performance Issues**
   - Enable caching
   - Optimize batch sizes
   - Clean up expired cache entries

### Debug Mode

Enable detailed logging by setting:
```env
DEBUG=semantic-search
```

## 📊 Performance Metrics

### Expected Performance

- **Embedding Generation**: ~200ms per file
- **Search Response Time**: <500ms for typical queries
- **Cache Hit Rate**: >80% for stable codebases
- **Context Relevance**: >85% user satisfaction

### Monitoring

- Vector database collection size
- Cache hit/miss ratios
- Search response times
- Token usage optimization
- Error rates and fallback frequency

## 🔮 Future Enhancements

### Planned Features

1. **Multi-user Support**: User-specific embeddings and search
2. **Advanced Filtering**: Date ranges, file size, complexity metrics
3. **Semantic Clustering**: Group related files automatically
4. **Code Understanding**: Function-level embeddings and search
5. **Real-time Indexing**: Automatic re-indexing on file changes
6. **Analytics Dashboard**: Search patterns and usage statistics

### Integration Opportunities

- **IDE Extensions**: Direct integration with VS Code
- **Git Integration**: Track changes and update embeddings
- **Documentation Generation**: Auto-generate docs from code
- **Code Review**: Suggest related files during reviews

## 📝 Contributing

When contributing to the semantic search functionality:

1. **Test thoroughly** with the provided test suite
2. **Update documentation** for any API changes
3. **Consider performance** impact of new features
4. **Maintain backward compatibility** with existing chat system
5. **Follow error handling** patterns established in the codebase

## 📄 License

This semantic search implementation is part of the Code Notes Buddy project and follows the same licensing terms.
