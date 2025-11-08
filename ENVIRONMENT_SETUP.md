# Environment Configuration Setup

This document explains how to properly configure environment variables for the MRG Labs Graphing App.

## Security Enhancement

The application now uses environment variables loaded from a `.env` file for sensitive configuration data like API keys, instead of hardcoding them in Python files.

## Setup Instructions

### 1. Backend Configuration

The backend now uses `python-dotenv` to load environment variables from a `.env` file located in the `backend/` directory.

### 2. Environment File Setup

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the .env file:**
   ```bash
   # Google Gemini AI API Configuration
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Get your Gemini API Key:**
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Replace `your_actual_gemini_api_key_here` with your key

### 3. File Structure

```
backend/
├── .env                 # Your actual environment variables (not in git)
├── .env.example        # Template file (committed to git)
├── chatbox.py          # Updated to use dotenv
├── graph_analysis.py   # Updated to use dotenv
└── requirements.txt    # Now includes python-dotenv
```

### 4. Security Features

- **`.env` file**: Contains actual sensitive data, excluded from git
- **`.env.example`**: Template file that's safe to commit
- **`.gitignore`**: Ensures `.env` files are never committed
- **No hardcoded keys**: All sensitive data moved to environment variables

### 5. How It Works

Both `chatbox.py` and `graph_analysis.py` now:

1. Import `load_dotenv()` from the `python-dotenv` package
2. Call `load_dotenv()` to read the `.env` file
3. Use `os.getenv("GEMINI_API_KEY")` to access the API key
4. Provide graceful fallbacks if the key isn't found

### 6. Docker Integration

The Docker containers automatically include the new `python-dotenv` dependency and will read the `.env` file when the containers start.

### 7. Development vs Production

- **Development**: Use the `.env` file in the `backend/` directory
- **Production**: Set environment variables directly in your deployment environment
- **CI/CD**: Use secret management systems to inject environment variables

## Benefits

✅ **Security**: No more hardcoded API keys in source code  
✅ **Flexibility**: Easy to switch between different API keys for different environments  
✅ **Best Practice**: Follows 12-factor app methodology  
✅ **Version Control Safe**: Sensitive data never committed to git  
✅ **Team Friendly**: Each developer can have their own API keys  

## Troubleshooting

If you see "Warning: GEMINI_API_KEY environment variable not set":
1. Ensure the `.env` file exists in the `backend/` directory
2. Check that the file contains `GEMINI_API_KEY=your_key_here` (no spaces around =)
3. Restart the Docker containers after making changes
4. Verify your API key is valid at https://makersuite.google.com/