# Security Guidelines

## Environment Variables

### 🔒 API Key Security

**NEVER** hardcode API keys or sensitive credentials in your code or Docker files. This project uses environment variables to securely manage sensitive information.

### Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values in `.env`:**
   ```bash
   # Database Configuration
   DB_HOST=your_actual_database_host
   DB_USER=your_database_user
   DB_PASS=your_secure_password
   DB_NAME=your_database_name

   # Gemini AI API Key
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. **Verify `.env` is in `.gitignore`:**
   The `.env` file should never be committed to version control. It's already included in our `.gitignore`.

### Production Deployment

For production environments:

1. **Use environment variables** provided by your hosting platform
2. **Never use `.env` files** in production - set environment variables directly
3. **Rotate API keys regularly**
4. **Use secrets management** services when available

### Docker Compose

The `docker-compose.yml` now uses environment variable substitution:

```yaml
environment:
  - GEMINI_API_KEY=${GEMINI_API_KEY}
```

This reads the value from your `.env` file or environment variables, keeping secrets secure.

## GitHub Security

### Preventing Secret Leaks

If you accidentally commit sensitive information:

1. **Immediately revoke** the exposed API key
2. **Generate a new key** from the provider
3. **Remove the secret from git history** using `git filter-branch` or similar
4. **Update your `.env` file** with the new key

### Security Alerts

GitHub will automatically detect hardcoded API keys and alert you. Always address these alerts immediately by:

1. Removing the hardcoded secret
2. Using environment variables instead
3. Revoking and regenerating the exposed key

## Best Practices

- ✅ Use environment variables for all secrets
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use `.env.example` as a template
- ✅ Rotate API keys regularly
- ❌ Never hardcode secrets in source code
- ❌ Never commit `.env` files to git
- ❌ Never share API keys in chat or email