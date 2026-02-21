# Healthcare Platform MVP

A comprehensive healthcare platform connecting patients with doctors through symptom analysis, consultation scheduling, and video consultations.

## Project Structure

```
├── backend/          # Express.js API server
├── frontend/         # Angular web application
├── dataset/          # Data files and ML models (future)
├── docker/           # Docker configuration (future)
├── docs/             # Documentation
└── notebooks/        # Jupyter notebooks for ML (future)
```

## Technology Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing

### Frontend
- Angular 15
- Angular Material
- RxJS
- WebRTC for video calls

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment configuration:
```bash
# Interactive setup (recommended)
npm run setup

# Or copy and edit manually
cp .env.example .env
# Edit .env with your values

# Validate configuration
npm run setup:validate
```

4. Configure required environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `MAILERSEND_API_KEY`: Your MailerSend API key (see Email Configuration below)
   - `MAILERSEND_FROM_EMAIL`: Your verified sender email
   - `FRONTEND_URL`: Your frontend URL for CORS

5. Start the server:
```bash
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx ng serve
```
Or if you have Angular CLI installed globally:
```bash
ng serve
```

Frontend will run on http://localhost:4200

## 📧 Email Configuration

The platform uses MailerSend for sending transactional emails (notifications, alerts, etc.).

### MailerSend Setup

1. **Create Account**: Sign up at [mailersend.com](https://www.mailersend.com/)

2. **Verify Domain**:
   - Go to **Domains** → **Add Domain**
   - Add your domain and configure DNS records (SPF, DKIM, CNAME)
   - For testing, use the provided test domain (e.g., `test-xxxxx.mlsender.net`)

3. **Generate API Key**:
   - Go to **API Tokens** → **Create Token**
   - Name: "Healthcare Platform"
   - Permissions: Email → Full Access
   - Copy the API key (shown only once)

4. **Configure Environment Variables**:
   ```bash
   # Add to backend/.env
   MAILERSEND_API_KEY=mlsn.your_api_key_here
   MAILERSEND_FROM_EMAIL=no-reply@yourdomain.com
   MAILERSEND_FROM_NAME=Healthcare Platform
   ```

5. **Test Email Sending**:
   ```bash
   cd backend
   npm run dev
   # Look for: ✅ MailerSend email service is ready
   ```

### Email Features
- User removal notifications
- Admin welcome emails
- User restoration notifications
- Bulk operation summaries
- Suspicious activity alerts

### Migration from Gmail SMTP
If you're migrating from Gmail SMTP, see [MAILERSEND_MIGRATION_GUIDE.md](MAILERSEND_MIGRATION_GUIDE.md) for detailed instructions.

## 🔐 SSL/HTTPS Setup (Optional)

For secure HTTPS connections in development and production:

### Quick SSL Setup

```bash
# Development (self-signed certificates)
./scripts/ssl-setup.sh --domain localhost --type self-signed
docker-compose -f docker-compose.ssl.yml up -d

# Production (Let's Encrypt certificates)
./scripts/ssl-setup.sh \
  --domain yourdomain.com \
  --email admin@yourdomain.com \
  --type letsencrypt \
  --env production
```

### Access with HTTPS
- Frontend: https://localhost (or your domain)
- Backend: https://localhost:3443 (or your domain:3443)
- API Docs: https://localhost:3443/api-docs

### SSL Validation
```bash
# Validate SSL configuration
./scripts/validate-ssl.sh --domain localhost

# Validate production domain
./scripts/validate-ssl.sh --domain yourdomain.com
```

See [SSL Setup Guide](docs/SSL_SETUP_GUIDE.md) for detailed instructions.

## Features

### Patient Features
- Symptom input via chatbot interface
- Disease prediction (static for MVP)
- Doctor recommendations with contact details
- Messaging with doctors
- Consultation scheduling
- Video consultations
- Post-consultation feedback

### Doctor Features
- Professional profile management
- Subscription system
- Patient records dashboard
- Messaging with patients
- Consultation management
- Video consultations

### Admin Features
- User management
- Platform metrics
- System monitoring

## 📚 Documentation

- **[MailerSend Migration Guide](MAILERSEND_MIGRATION_GUIDE.md)** - Migrate from Gmail SMTP to MailerSend
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[SSL Setup Guide](docs/SSL_SETUP_GUIDE.md)** - HTTPS configuration

## API Documentation

API endpoints are documented in the design document at `.kiro/specs/healthcare-mvp-core/design.md`

## Development

- Backend runs on port 3000
- Frontend runs on port 4200
- MongoDB default port 27017

## License

ISC
