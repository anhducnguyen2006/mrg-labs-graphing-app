# 🚀 Quick Reference - Authentication System

## Essential Commands

### Start Development

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m uvicorn app:app --reload --port 8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Database Setup (First Time Only)

```bash
mysql -u root -p < backend/database_setup.sql
```

## API Endpoints

| Endpoint           | Method | Auth Required | Description           |
| ------------------ | ------ | ------------- | --------------------- |
| `/register`        | POST   | No            | Register new user     |
| `/login`           | POST   | No            | Login user            |
| `/logout`          | POST   | Yes           | Logout user           |
| `/api/v1/files`    | GET    | Yes           | Get user's files      |
| `/generate_graphs` | POST   | Yes           | Generate graphs       |
| `/chat/*`          | \*     | No\*          | AI chat endpoints     |
| `/analysis/*`      | \*     | No\*          | AI analysis endpoints |

\*AI endpoints don't require auth but work better with context

## Frontend Routes

| Route        | Access    | Component | Description            |
| ------------ | --------- | --------- | ---------------------- |
| `/`          | Auto      | -         | Redirects to dashboard |
| `/login`     | Public    | Login     | Login page             |
| `/signup`    | Public    | Signup    | Registration page      |
| `/dashboard` | Protected | Dashboard | Main application       |

## Environment Variables

### Backend `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=mrg_labs_db
SESSION_SECRET=random-secret-key-here
GEMINI_API_KEY=your-gemini-key
```

### Frontend `.env` (Optional)

```env
VITE_API_URL=http://localhost:8080
```

## useAuth Hook

```typescript
import { useAuth } from "../contexts/AuthContext";

const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
```

## Common Code Snippets

### Protected API Request

```typescript
fetch("http://localhost:8080/api/v1/files", {
  method: "GET",
  credentials: "include", // Important!
});
```

### Using Auth in Component

```typescript
function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.username}!</div>;
}
```

### Logout Handler

```typescript
const handleLogout = async () => {
  await fetch("http://localhost:8080/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/login";
};
```

## Troubleshooting Quick Fixes

### Backend won't start

```bash
cd backend
pip install -r requirements.txt
```

### Frontend won't start

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails

```bash
# Check MySQL is running
mysql -u root -p

# Verify .env file exists and has correct credentials
cat backend/.env
```

### Session not persisting

1. Clear browser cookies
2. Verify SESSION_SECRET in `.env`
3. Check `credentials: 'include'` in fetch calls

### Port already in use

```bash
# Kill process on port 8080
lsof -i :8080 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts and opens browser
- [ ] Can access `/signup` page
- [ ] Can create new account
- [ ] Auto-logged in after signup
- [ ] Can see dashboard
- [ ] Can logout
- [ ] Can login with created account
- [ ] Upload CSV files works
- [ ] Graphs generate correctly
- [ ] AI chat works
- [ ] AI analysis works

## File Locations

| File                                         | Purpose               |
| -------------------------------------------- | --------------------- |
| `frontend/src/services/auth.ts`              | Auth API calls        |
| `frontend/src/contexts/AuthContext.tsx`      | Auth state management |
| `frontend/src/pages/Login.tsx`               | Login page            |
| `frontend/src/pages/Signup.tsx`              | Signup page           |
| `frontend/src/components/ProtectedRoute.tsx` | Route guard           |
| `backend/app.py`                             | Backend API           |
| `backend/database_setup.sql`                 | Database schema       |

## Documentation Files

- `README.md` - Project overview
- `SETUP_GUIDE.md` - Detailed setup instructions
- `AUTH_DOCUMENTATION.md` - Authentication system details
- `IMPLEMENTATION_SUMMARY.md` - What was implemented
- `backend/API_DOCUMENTATION.md` - API endpoints

## Support

**Issues?** Check these in order:

1. Backend terminal for errors
2. Frontend terminal for errors
3. Browser DevTools console
4. Browser DevTools Network tab
5. Database connection
6. Environment variables

**Still stuck?** Review `SETUP_GUIDE.md` for detailed troubleshooting.

---

**Quick Access URLs:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health
- Chat Health: http://localhost:8080/chat/health
- Analysis Health: http://localhost:8080/analysis/health
