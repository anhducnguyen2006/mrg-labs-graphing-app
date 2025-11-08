# AI Features Setup Guide

## Overview

Your MRG Labs Graphing App now includes two powerful AI-powered features:

1. **AI-Powered Graph Analysis** - Provides intelligent insights about your graph comparisons
2. **Interactive AI Chatbox** - An AI assistant to help with data analysis questions

## Current Status

✅ **Backend APIs**: Successfully integrated and running  
✅ **Frontend Components**: Chatbox and Graph Summary components added  
✅ **Docker Integration**: All components containerized and running  
⚠️ **AI Features**: Require Gemini API key configuration  

## Setting Up AI Features

To enable the AI-powered features, you need to configure a Google Gemini API key:

### Step 1: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Configure the API Key

Choose one of these methods:

#### Method A: Environment Variable (Recommended)
```bash
export GEMINI_API_KEY=your_api_key_here
docker-compose down
docker-compose up -d
```

#### Method B: Docker Compose Environment
Add to your `docker-compose.yml` under backend service:
```yaml
services:
  backend:
    # ... existing config
    environment:
      - PYTHONUNBUFFERED=1
      - GEMINI_API_KEY=your_api_key_here
```

#### Method C: .env File
Create a `.env` file in the backend directory:
```bash
GEMINI_API_KEY=your_api_key_here
```

### Step 3: Verify Setup

After configuring the API key, restart the services and test:

```bash
docker-compose restart backend
curl http://localhost:8080/analysis/health
curl http://localhost:8080/chat/health
```

You should see `"gemini_api": "configured"` in the response.

## Using the New Features

### Graph Analysis
1. Upload baseline and sample CSV files
2. The AI analysis will appear automatically under the graph
3. View statistical summaries and AI-generated insights
4. Click to expand/collapse different sections

### AI Chatbox
1. Click the chat icon on the right side of the screen
2. The chatbox will slide out from the right
3. Ask questions about your data, graphs, or analysis
4. The AI maintains conversation context and understands your current analysis

### Example Questions for the Chatbox:
- "What might cause the peaks to shift in spectroscopy data?"
- "How do I interpret the statistical differences shown?"
- "What should I look for in this type of analysis?"
- "Can you explain what this trend means?"

## Features Available

### Graph Analysis Features:
- ✅ Statistical comparison (mean, std dev, ranges)
- ✅ Visual pattern recognition
- ✅ Trend identification  
- ✅ Scientific interpretation
- ✅ Data quality assessment
- ✅ Automated insights generation

### Chatbox Features:
- ✅ Conversation memory
- ✅ Context-aware responses about current graphs
- ✅ Scientific knowledge base
- ✅ Data analysis guidance
- ✅ Research workflow suggestions
- ✅ Quick questions mode

## API Endpoints

### Analysis API
- `POST /analysis/generate_insights` - Generate AI analysis
- `GET /analysis/health` - Service health check

### Chat API
- `POST /chat/send_message` - Send chat message
- `POST /chat/quick_question` - Ask quick question
- `GET /chat/conversation/{id}` - Get conversation history
- `DELETE /chat/conversation/{id}` - Clear conversation
- `GET /chat/health` - Service health check

## Troubleshooting

### Common Issues:

1. **"Analysis Failed" error**
   - Ensure Gemini API key is configured
   - Check that both baseline and sample files are uploaded
   - Verify files are valid CSV format

2. **Chatbox not responding**
   - Check Gemini API key configuration
   - Verify backend is running (`docker ps`)
   - Check browser console for errors

3. **API key not working**
   - Ensure API key is valid and has quota remaining
   - Check Google Cloud Console for API usage limits
   - Verify the key has Generative AI API enabled

### Support

If you encounter issues:
1. Check Docker container logs: `docker logs mrg-labs-graphing-app-backend-1`
2. Verify frontend console for errors
3. Test API endpoints directly with curl
4. Check that all required files are uploaded

## Next Steps

The AI features are now fully integrated! You can:
1. Configure your Gemini API key to enable AI features
2. Start using the intelligent graph analysis
3. Explore the interactive chatbox assistant
4. Provide feedback for further improvements

The system is designed to be extensible - additional AI features can be easily added in the future.