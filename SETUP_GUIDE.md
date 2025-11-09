# Complete Setup Guide - MRG Labs Graphing App with Authentication

This guide will walk you through setting up the entire application with authentication from scratch.

## Prerequisites

- **Node.js** (v16 or higher)
- **Python** (3.8 or higher)
- **MySQL** (8.0 or higher)
- **Git** (for cloning the repository)

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mrg-labs-graphing-app
```

### Step 2: Database Setup

#### 2.1. Start MySQL

Make sure MySQL server is running on your system.

```bash
# On macOS with Homebrew
brew services start mysql

# On Linux
sudo systemctl start mysql

# On Windows
# Start MySQL from Services or MySQL Workbench
```

#### 2.2. Create Database

```bash
# Log into MySQL
mysql -u root -p

# Run the setup script
mysql -u root -p < backend/database_setup.sql

# Or manually run the commands
```

Alternatively, copy and paste the contents of `backend/database_setup.sql` into your MySQL client.

#### 2.3. Verify Database

```sql
USE mrg_labs_db;
SHOW TABLES;
-- Should show: graphs, users
```

### Step 3: Backend Setup

#### 3.1. Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### 3.2. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 3.3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=mrg_labs_db

# Session Secret (generate a random string)
SESSION_SECRET=$(openssl rand -hex 32)

# Gemini AI API Key (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

**Get a Gemini API Key**:

1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to your `.env` file

#### 3.4. Test Backend

```bash
# Make sure you're in the backend directory with venv activated
python -m uvicorn app:app --reload --port 8080
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8080
INFO:     Application startup complete.
```

Test the health endpoint:

```bash
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

### Step 4: Frontend Setup

Open a new terminal window (keep backend running).

#### 4.1. Install Dependencies

```bash
cd frontend
npm install
```

#### 4.2. Start Development Server

```bash
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Test the Application

#### 5.1. Open Browser

Navigate to: `http://localhost:5173`

You should be automatically redirected to the login page.

#### 5.2. Create an Account

1. Click "Sign Up" link
2. Enter a username (min 3 characters): `testuser`
3. Enter a password (min 6 characters): `testpass123`
4. Confirm password: `testpass123`
5. Click "Sign Up"

You should:

- See a success message
- Be automatically logged in
- Be redirected to the dashboard

#### 5.3. Test Features

**Upload and Analyze Graphs**:

1. Upload a baseline CSV file
2. Upload one or more sample CSV files
3. View the graph comparison
4. See AI-powered analysis (if Gemini API key is configured)

**Use AI Chatbot**:

1. Click the chat icon on the right side
2. Ask questions about your data
3. Get AI-powered responses

**Logout**:

1. Click your profile icon (top right)
2. Click "Logout"
3. You'll be redirected to login page

#### 5.4. Test Login

1. On the login page, enter your credentials
2. Click "Sign In"
3. You should be logged in and see the dashboard

## Verification Checklist

- [ ] MySQL database `mrg_labs_db` exists with `users` and `graphs` tables
- [ ] Backend `.env` file configured with all required variables
- [ ] Backend running on `http://localhost:8080`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Can access signup page at `/signup`
- [ ] Can create a new user account
- [ ] Automatically logged in after signup
- [ ] Can access dashboard after login
- [ ] Can upload CSV files and view graphs
- [ ] Can logout successfully
- [ ] Can login with existing credentials
- [ ] Redirected to login when not authenticated

## Common Issues and Solutions

### Issue: "Module not found" errors in frontend

**Solution**:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot connect to database"

**Solutions**:

1. Verify MySQL is running: `mysql -u root -p`
2. Check database credentials in `.env`
3. Verify database exists: `SHOW DATABASES;`
4. Check user permissions: `SHOW GRANTS FOR 'root'@'localhost';`

### Issue: "Port already in use"

**Backend (port 8080)**:

```bash
# Find process using port 8080
lsof -i :8080
# Kill the process
kill -9 <PID>
```

**Frontend (port 5173)**:

```bash
# Find process using port 5173
lsof -i :5173
# Kill the process
kill -9 <PID>
```

### Issue: "Session not persisting"

**Solution**:

1. Clear browser cookies
2. Verify SESSION_SECRET is set in backend `.env`
3. Check browser console for CORS errors
4. Ensure `credentials: 'include'` in API requests

### Issue: "Username already exists"

**Solution**:

- Choose a different username, or
- Login with existing credentials, or
- Delete the user from database (for testing):
  ```sql
  USE mrg_labs_db;
  DELETE FROM users WHERE username = 'testuser';
  ```

### Issue: Gemini AI features not working

**Solution**:

1. Verify GEMINI_API_KEY is set in `.env`
2. Check API key is valid at https://makersuite.google.com/app/apikey
3. Test API endpoints:
   ```bash
   curl http://localhost:8080/chat/health
   curl http://localhost:8080/analysis/health
   ```

## Development Workflow

### Running Both Services

**Terminal 1 - Backend**:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app:app --reload --port 8080
```

**Terminal 2 - Frontend**:

```bash
cd frontend
npm run dev
```

### Stopping Services

**Backend**: Press `Ctrl+C` in the backend terminal

**Frontend**: Press `Ctrl+C` in the frontend terminal

**MySQL** (optional):

```bash
# On macOS with Homebrew
brew services stop mysql

# On Linux
sudo systemctl stop mysql
```

## Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Make sure to update docker-compose.yml with database configuration
docker compose up --build
```

Access the application at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## Next Steps

After successful setup:

1. **Read the documentation**:

   - `AUTH_DOCUMENTATION.md` - Authentication system details
   - `backend/API_DOCUMENTATION.md` - API endpoints
   - `README.md` - General application information

2. **Explore features**:

   - Upload and analyze CSV data
   - Use AI-powered analysis
   - Chat with AI assistant about your data
   - Export graphs

3. **Customize**:
   - Modify UI components in `frontend/src/components/`
   - Add new API endpoints in `backend/app.py`
   - Enhance AI prompts in `backend/chatbox.py` and `backend/graph_analysis.py`

## Production Deployment

For production deployment, see:

- Add HTTPS/SSL certificates
- Use production database (not localhost)
- Set secure session cookies
- Implement rate limiting
- Add monitoring and logging
- Use environment-specific configurations

## Getting Help

If you encounter issues:

1. Check the console output for errors
2. Review browser DevTools console
3. Check backend logs in terminal
4. Verify all environment variables are set
5. Consult the documentation files
6. Search for similar issues in the project repository

---

**Setup Complete!** 🎉

You now have a fully functional graphing application with AI-powered analysis and user authentication.
