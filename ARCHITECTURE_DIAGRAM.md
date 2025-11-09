# Authentication Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                          │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (http://localhost:5173)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Login Page  │  │ Signup Page  │  │  Dashboard   │          │
│  │  /login     │  │  /signup     │  │  /dashboard  │          │
│  └─────────────┘  └──────────────┘  └──────────────┘          │
│         │                │                    │                  │
│         └────────────────┴────────────────────┘                  │
│                          │                                       │
│                   ┌──────▼───────┐                              │
│                   │ AuthContext  │  (Global Auth State)         │
│                   └──────────────┘                              │
└────────────────────────────┼───────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Auth Service   │
                    │   (API Calls)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Fetch Requests │
                    │ with credentials│
                    └────────┬────────┘
                             │
═════════════════════════════╪═══════════════════════════════════
                             │  HTTP Requests
                             │  (Session Cookies)
═════════════════════════════╪═══════════════════════════════════
                             │
                    ┌────────▼────────┐
                    │   FastAPI       │
                    │ Backend Server  │
                    │ localhost:8080  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌────▼─────┐
    │   Session    │  │  Auth Routes │  │  bcrypt  │
    │  Middleware  │  │  /register   │  │ Password │
    │              │  │  /login      │  │ Hashing  │
    └───────┬──────┘  │  /logout     │  └────┬─────┘
            │         └──────┬───────┘       │
            │                │               │
            └────────────────┼───────────────┘
                             │
                    ┌────────▼────────┐
                    │   MySQL DB      │
                    │  mrg_labs_db    │
                    └─────────────────┘
                    │                 │
              ┌─────▼─────┐    ┌─────▼──────┐
              │   users   │    │   graphs   │
              │  table    │    │   table    │
              └───────────┘    └────────────┘
```

## Authentication Flow

### 1. User Registration (Signup)

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──── Visits /signup ──►                    │                     │
 │                     │                     │                     │
 │──── Fills form ────►│                     │                     │
 │                     │                     │                     │
 │──── Clicks Submit ─►│                     │                     │
 │                     │                     │                     │
 │                     │──── POST /register ──►                    │
 │                     │  { username, pass } │                     │
 │                     │                     │                     │
 │                     │                     │──── Hash password ──►│
 │                     │                     │                     │
 │                     │                     │──── INSERT user ────►│
 │                     │                     │                     │
 │                     │                     │◄──── user created ───│
 │                     │                     │                     │
 │                     │◄──── Success ───────│                     │
 │                     │  { status: "ok" }   │                     │
 │                     │                     │                     │
 │                     │──── Auto Login ────►│                     │
 │                     │                     │                     │
 │◄─── Redirect to ────│                     │                     │
 │     /dashboard      │                     │                     │
 │                     │                     │                     │
```

### 2. User Login

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──── Visits /login ─►│                     │                     │
 │                     │                     │                     │
 │──── Enters creds ──►│                     │                     │
 │                     │                     │                     │
 │──── Clicks Login ──►│                     │                     │
 │                     │                     │                     │
 │                     │──── POST /login ────►│                     │
 │                     │  { username, pass } │                     │
 │                     │                     │                     │
 │                     │                     │──── SELECT user ────►│
 │                     │                     │                     │
 │                     │                     │◄──── user data ──────│
 │                     │                     │  { id, password }   │
 │                     │                     │                     │
 │                     │                     │──── Verify password  │
 │                     │                     │     bcrypt.check    │
 │                     │                     │                     │
 │                     │                     │──── Set session     │
 │                     │                     │     user_id = X     │
 │                     │                     │                     │
 │                     │◄──── Success ───────│                     │
 │                     │  + Session Cookie   │                     │
 │                     │                     │                     │
 │◄─── Redirect to ────│                     │                     │
 │     /dashboard      │                     │                     │
 │                     │                     │                     │
```

### 3. Protected Route Access

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──── Visit /dash ───►│                     │                     │
 │                     │                     │                     │
 │                     │──── Check Auth ────►│                     │
 │                     │  isAuthenticated?   │                     │
 │                     │                     │                     │
 │                     │                     │──── Check Session   │
 │                     │                     │   user_id exists?   │
 │                     │                     │                     │
 │                     │◄──── Yes/No ────────│                     │
 │                     │                     │                     │
 │◄─── If Yes: ────────│                     │                     │
 │     Show Dashboard  │                     │                     │
 │                     │                     │                     │
 │◄─── If No: ─────────│                     │                     │
 │     Redirect /login │                     │                     │
 │                     │                     │                     │
```

### 4. API Request with Authentication

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──── Click Export ──►│                     │                     │
 │                     │                     │                     │
 │                     │─ POST /generate_graphs ►                  │
 │                     │  + Session Cookie   │                     │
 │                     │                     │                     │
 │                     │                     │─── Check Session ───►│
 │                     │                     │    user_id = ?      │
 │                     │                     │                     │
 │                     │                     │◄─── user_id found ───│
 │                     │                     │                     │
 │                     │                     │─── Generate graphs   │
 │                     │                     │                     │
 │                     │                     │─── Save to DB ──────►│
 │                     │                     │    with user_id     │
 │                     │                     │                     │
 │                     │◄──── Success ───────│                     │
 │                     │  { saved_paths }    │                     │
 │                     │                     │                     │
 │◄─── Download ───────│                     │                     │
 │     ZIP file        │                     │                     │
 │                     │                     │                     │
```

### 5. User Logout

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──── Click Logout ──►│                     │                     │
 │                     │                     │                     │
 │                     │──── POST /logout ───►│                     │
 │                     │  + Session Cookie   │                     │
 │                     │                     │                     │
 │                     │                     │──── Clear Session   │
 │                     │                     │     delete user_id  │
 │                     │                     │                     │
 │                     │◄──── Success ───────│                     │
 │                     │  Clear Cookie       │                     │
 │                     │                     │                     │
 │                     │─ Clear Auth State   │                     │
 │                     │   user = null       │                     │
 │                     │                     │                     │
 │◄─── Redirect to ────│                     │                     │
 │     /login          │                     │                     │
 │                     │                     │                     │
```

## Session Management

### Session Cookie Structure

```
Set-Cookie: session=<encrypted_session_id>;
            Path=/;
            HttpOnly;
            SameSite=Lax
```

### Session Storage (Server-Side)

```
{
  "session_id_123": {
    "user_id": 42,
    "created_at": "2025-11-08T12:00:00Z",
    "expires_at": "2025-11-08T18:00:00Z"
  }
}
```

## Data Flow

### User Registration Data Flow

```
Frontend Form          API Request              Backend Processing
┌─────────────┐       ┌──────────────┐         ┌────────────────┐
│ username:   │       │ POST         │         │ 1. Validate    │
│ "john_doe"  │────►  │ /register    │────►    │ 2. Hash pass   │
│             │       │              │         │ 3. Insert DB   │
│ password:   │       │ Body:        │         │ 4. Auto login  │
│ "pass123"   │       │ {            │         │ 5. Set session │
└─────────────┘       │   username,  │         └────────────────┘
                      │   password   │                │
                      │ }            │                │
                      └──────────────┘                ▼
                                               ┌────────────────┐
                                               │ Response:      │
                                               │ {              │
                                               │   status: ok   │
                                               │   username     │
                                               │ }              │
                                               │ + Session      │
                                               └────────────────┘
```

## Component Interaction

```
┌────────────────────────────────────────────────────────────┐
│                         App.tsx                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              BrowserRouter                           │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │          AuthProvider                          │  │ │
│  │  │  (Provides auth state to all children)         │  │ │
│  │  │                                                 │  │ │
│  │  │  ┌──────────────────────────────────────────┐  │  │ │
│  │  │  │            Routes                        │  │  │ │
│  │  │  │                                          │  │  │ │
│  │  │  │  /login     →  Login                    │  │  │ │
│  │  │  │  /signup    →  Signup                   │  │  │ │
│  │  │  │  /dashboard →  ProtectedRoute(Dashboard)│  │  │ │
│  │  │  │  /          →  Redirect to /dashboard   │  │  │ │
│  │  │  └──────────────────────────────────────────┘  │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layer 1                      │
│              Frontend Route Protection                   │
│         (ProtectedRoute component checks auth)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Security Layer 2                      │
│                 Session Cookie                           │
│      (HttpOnly, Secure in production)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Security Layer 3                      │
│            Backend Session Validation                    │
│         (Checks session before API access)               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Security Layer 4                      │
│             Password Hashing (bcrypt)                    │
│         (Passwords never stored in plain text)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Security Layer 5                      │
│          Database Security (MySQL)                       │
│       (Parameterized queries, no SQL injection)          │
└─────────────────────────────────────────────────────────┘
```

---

**This visual diagram shows the complete flow of authentication in the MRG Labs Graphing Application.**
