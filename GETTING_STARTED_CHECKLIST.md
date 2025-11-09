# 🚀 Getting Started Checklist

Use this checklist to set up your MRG Labs Graphing Application with authentication.

## ✅ Pre-Installation Checklist

- [ ] **Node.js installed** (v16 or higher)

  - Check: `node --version`
  - Install: https://nodejs.org/

- [ ] **Python installed** (3.8 or higher)

  - Check: `python --version` or `python3 --version`
  - Install: https://www.python.org/downloads/

- [ ] **MySQL installed** (8.0 or higher)

  - Check: `mysql --version`
  - Install: https://dev.mysql.com/downloads/mysql/

- [ ] **Git installed**
  - Check: `git --version`
  - Install: https://git-scm.com/downloads

## 📦 Installation Checklist

### Database Setup

- [ ] Start MySQL server

  ```bash
  # macOS: brew services start mysql
  # Linux: sudo systemctl start mysql
  # Windows: Start from Services
  ```

- [ ] Login to MySQL

  ```bash
  mysql -u root -p
  ```

- [ ] Run database setup script

  ```bash
  mysql -u root -p < backend/database_setup.sql
  ```

- [ ] Verify database created
  ```sql
  SHOW DATABASES;  -- Should see mrg_labs_db
  USE mrg_labs_db;
  SHOW TABLES;     -- Should see users and graphs
  ```

### Backend Setup

- [ ] Navigate to backend directory

  ```bash
  cd backend
  ```

- [ ] Create Python virtual environment

  ```bash
  python3 -m venv venv
  ```

- [ ] Activate virtual environment

  ```bash
  # macOS/Linux:
  source venv/bin/activate

  # Windows:
  venv\Scripts\activate
  ```

- [ ] Install Python dependencies

  ```bash
  pip install -r requirements.txt
  ```

- [ ] Create `.env` file in backend directory

  ```bash
  touch .env  # or manually create the file
  ```

- [ ] Add environment variables to `.env`

  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASS=your_mysql_password_here
  DB_NAME=mrg_labs_db
  SESSION_SECRET=your-random-secret-key-here
  GEMINI_API_KEY=your-gemini-api-key-here
  ```

- [ ] Get Gemini API Key

  - Visit: https://makersuite.google.com/app/apikey
  - Create new API key
  - Add to `.env` file

- [ ] Test backend starts

  ```bash
  python -m uvicorn app:app --reload --port 8080
  ```

- [ ] Test health endpoint
  ```bash
  curl http://localhost:8080/health
  # Should return: {"status":"ok"}
  ```

### Frontend Setup

- [ ] Open new terminal (keep backend running)

- [ ] Navigate to frontend directory

  ```bash
  cd frontend
  ```

- [ ] Install Node dependencies

  ```bash
  npm install
  ```

- [ ] Start development server

  ```bash
  npm run dev
  ```

- [ ] Open browser to application
  - URL: http://localhost:5173
  - Should redirect to login page

## 🧪 Testing Checklist

### User Registration

- [ ] Navigate to http://localhost:5173
- [ ] Click "Sign Up" link
- [ ] Enter username (min 3 chars): `testuser`
- [ ] Enter password (min 6 chars): `testpass123`
- [ ] Confirm password: `testpass123`
- [ ] Click "Sign Up" button
- [ ] See success message
- [ ] Automatically logged in
- [ ] Redirected to dashboard

### User Login

- [ ] Click logout (top right profile icon)
- [ ] Redirected to login page
- [ ] Enter username: `testuser`
- [ ] Enter password: `testpass123`
- [ ] Click "Sign In" button
- [ ] Successfully logged in
- [ ] See dashboard

### Graph Upload & Analysis

- [ ] Prepare test CSV files

  - Baseline CSV with X,Y columns
  - One or more sample CSVs with X,Y columns

- [ ] Upload baseline CSV

  - Click "Baseline CSV" upload box
  - Select baseline file
  - See file loaded

- [ ] Upload sample CSV(s)

  - Click "Sample CSVs" upload box
  - Select sample file(s)
  - See files loaded in sidebar

- [ ] View graph

  - Graph displays with baseline (green) and sample (red/orange)
  - Can zoom in/out
  - Can pan
  - Can reset zoom

- [ ] View AI Analysis (if Gemini key configured)
  - Scroll to "AI-Powered Graph Analysis" section
  - Analysis automatically generates
  - See statistics (mean, std, etc.)
  - See AI insights text

### AI Chat

- [ ] Click chat icon (right side of screen)
- [ ] Chat panel opens
- [ ] See current graph context displayed
- [ ] Type a question: "What patterns do you see?"
- [ ] Click Send or press Enter
- [ ] AI responds with relevant answer
- [ ] Ask follow-up question
- [ ] Conversation history maintained

### Graph Export

- [ ] Click "Export Graphs" button
- [ ] Graphs generated
- [ ] ZIP file downloads
- [ ] Open ZIP file
- [ ] Contains PNG images of graphs

### Logout

- [ ] Click user profile icon (top right)
- [ ] Click "Logout"
- [ ] See success message
- [ ] Redirected to login page
- [ ] Session cleared

## 🔍 Verification Checklist

### Backend Verification

- [ ] Backend running on http://localhost:8080
- [ ] Health check passes: `curl http://localhost:8080/health`
- [ ] Chat health check: `curl http://localhost:8080/chat/health`
- [ ] Analysis health check: `curl http://localhost:8080/analysis/health`
- [ ] Database connection working
- [ ] Gemini API configured (if using AI features)

### Frontend Verification

- [ ] Frontend running on http://localhost:5173
- [ ] No console errors in browser DevTools
- [ ] Can access /login route
- [ ] Can access /signup route
- [ ] Dashboard protected (redirects if not logged in)
- [ ] Routing works correctly

### Database Verification

- [ ] Database `mrg_labs_db` exists
- [ ] Table `users` exists
- [ ] Table `graphs` exists
- [ ] Can insert user record
- [ ] Can query user records
- [ ] Foreign key constraints working

### Integration Verification

- [ ] Can register new user → user saved to database
- [ ] Can login → session created
- [ ] Can access protected routes when logged in
- [ ] Can upload files → files processed
- [ ] Can generate graphs → graphs saved with user_id
- [ ] Can logout → session destroyed
- [ ] Cannot access dashboard when logged out

## 🎯 Final Checks

- [ ] All features working as expected
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal
- [ ] No errors in browser console
- [ ] Documentation files present and readable
- [ ] `.env` file configured (and in `.gitignore`)
- [ ] Can run full workflow: signup → login → upload → analyze → export → logout

## 📚 Documentation Review

- [ ] Read `README.md` - Project overview
- [ ] Read `SETUP_GUIDE.md` - Detailed setup
- [ ] Read `AUTH_DOCUMENTATION.md` - Auth system details
- [ ] Read `backend/API_DOCUMENTATION.md` - API reference
- [ ] Bookmark `QUICK_REFERENCE.md` - Quick commands

## 🎉 Success Criteria

All items checked? **Congratulations!** 🎊

Your MRG Labs Graphing Application with authentication is now:

- ✅ Fully installed
- ✅ Properly configured
- ✅ Tested and working
- ✅ Ready for development
- ✅ Ready for use

## 🆘 Troubleshooting

If any checklist item failed, refer to:

1. **SETUP_GUIDE.md** - Detailed troubleshooting section
2. **AUTH_DOCUMENTATION.md** - Authentication-specific issues
3. **Backend terminal output** - Check for error messages
4. **Frontend terminal output** - Check for build errors
5. **Browser DevTools Console** - Check for JavaScript errors
6. **Browser DevTools Network tab** - Check for failed API calls

## 📞 Common Issues Quick Fix

### "Cannot connect to database"

```bash
# Check MySQL running
mysql -u root -p

# Verify .env credentials match MySQL
cat backend/.env
```

### "Port already in use"

```bash
# Find and kill process on port 8080
lsof -i :8080 | awk '{print $2}' | tail -n 1 | xargs kill -9

# Find and kill process on port 5173
lsof -i :5173 | awk '{print $2}' | tail -n 1 | xargs kill -9
```

### "Module not found" errors

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Session not persisting"

1. Clear browser cookies
2. Check SESSION_SECRET in `.env`
3. Verify `credentials: 'include'` in API calls
4. Restart backend server

---

## ✨ Next Steps

After completing this checklist:

1. **Customize** - Modify UI, add features
2. **Develop** - Build on the foundation
3. **Deploy** - Prepare for production
4. **Share** - Collaborate with your team

**Happy Coding!** 💻🚀
