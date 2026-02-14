# Healthcare Platform - Complete Deployment Guide

## 🚀 Overview

This guide provides step-by-step instructions for deploying the Healthcare Platform backend to various cloud platforms.

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] MongoDB Atlas database created and configured
- [ ] Gmail account with App Password generated
- [ ] Frontend deployment URL available
- [ ] All environment variables prepared

### 2. Code Preparation
- [ ] All hospital feature code committed
- [ ] Database migrations completed
- [ ] Tests passing
- [ ] Environment validation successful

### 3. Deployment Files
- [ ] `render.yaml` - For Render deployment
- [ ] `vercel.json` - For Vercel deployment  
- [ ] `Procfile` - For Heroku deployment
- [ ] `Dockerfile` - For Docker deployment
- [ ] `docker-compose.yml` - For Docker Compose

## 🎯 Quick Start Commands

### Validate Deployment Readiness
```bash
# Validate environment configuration
cd backend
node scripts/setup-env.js --validate

# Run deployment validation
node scripts/validate-deployment.js https://your-deployed-url.com
```

### Platform-Specific Setup
```bash
# Render deployment
node scripts/deploy-render.js

# Heroku deployment  
node scripts/deploy-heroku.js my-healthcare-app

# Docker deployment
node scripts/deploy-docker.js deploy
```

## 🌐 Platform Deployment Instructions

### 1. Render (Recommended for MVP)

**Pros:** Free tier, automatic deployments, easy setup
**Cons:** Cold starts on free tier

#### Setup Steps:
1. **Run setup script:**
   ```bash
   cd backend
   node scripts/deploy-render.js
   ```

2. **Create Render service:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** healthcare-platform-backend
     - **Root Directory:** backend
     - **Build Command:** npm install
     - **Start Command:** npm start

3. **Add environment variables:**
   Copy from the script output and add each variable in Render dashboard

4. **Deploy:**
   - Click "Deploy Web Service"
   - Wait 5-10 minutes for deployment
   - Test: `https://your-app.onrender.com/api/health`

#### Environment Variables for Render:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform
JWT_SECRET=your-generated-secret
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend.vercel.app
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
API_RATE_LIMIT=100
HOSPITAL_API_KEY_PREFIX=HK_
HOSPITAL_API_SECRET_LENGTH=64
```

---

### 2. Heroku

**Pros:** Mature platform, good documentation
**Cons:** No free tier, more expensive

#### Setup Steps:
1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Run setup script:**
   ```bash
   cd backend
   node scripts/deploy-heroku.js my-healthcare-app
   ```

3. **Set manual environment variables:**
   ```bash
   heroku config:set MONGODB_URI="your_mongodb_uri" -a my-healthcare-app
   heroku config:set FRONTEND_URL="https://your-frontend.vercel.app" -a my-healthcare-app
   heroku config:set EMAIL_USER="your-email@gmail.com" -a my-healthcare-app
   heroku config:set EMAIL_PASSWORD="your-gmail-app-password" -a my-healthcare-app
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Add Heroku configuration"
   git subtree push --prefix=backend heroku main
   ```

5. **Test:**
   ```bash
   curl https://my-healthcare-app.herokuapp.com/api/health
   ```

---

### 3. Vercel

**Pros:** Excellent for serverless, fast deployments
**Cons:** Function timeout limits, cold starts

#### Setup Steps:
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from backend directory:**
   ```bash
   cd backend
   vercel
   ```

3. **Set environment variables:**
   ```bash
   vercel env add NODE_ENV
   vercel env add MONGODB_URI
   vercel env add JWT_SECRET
   vercel env add FRONTEND_URL
   vercel env add EMAIL_USER
   vercel env add EMAIL_PASSWORD
   ```

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

---

### 4. Docker (Self-hosted)

**Pros:** Full control, consistent environments
**Cons:** Requires server management

#### Setup Steps:
1. **Run Docker setup:**
   ```bash
   node scripts/deploy-docker.js setup
   ```

2. **Configure environment:**
   ```bash
   cp backend/.env.docker.example backend/.env.docker
   # Edit .env.docker with your values
   ```

3. **Build and run:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d
   
   # Or using Docker directly
   docker build -t healthcare-platform-backend .
   docker run -p 3000:3000 --env-file backend/.env.docker healthcare-platform-backend
   ```

4. **Test:**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

### 5. AWS EC2 / DigitalOcean

**Pros:** Full control, scalable
**Cons:** Requires server management, more complex setup

#### Setup Steps:
1. **Create server instance**
2. **Install Node.js and PM2:**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Deploy application:**
   ```bash
   git clone your-repository
   cd your-repository/backend
   npm install --production
   
   # Set environment variables
   cp .env.example .env
   # Edit .env with your values
   
   # Start with PM2
   pm2 start server.js --name healthcare-backend
   pm2 startup
   pm2 save
   ```

4. **Configure Nginx (optional):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔧 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `generated-secret` |
| `FRONTEND_URL` | Frontend application URL | `https://app.vercel.app` |
| `EMAIL_USER` | Gmail address | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Gmail App Password | `16-char-password` |

### Optional Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration |
| `API_RATE_LIMIT` | `100` | Hospital API rate limit |
| `HOSPITAL_API_KEY_PREFIX` | `HK_` | API key prefix |
| `HOSPITAL_API_SECRET_LENGTH` | `64` | API secret length |

## 🧪 Post-Deployment Testing

### 1. Automated Validation
```bash
# Test deployed backend
node scripts/validate-deployment.js https://your-backend-url.com

# Test with frontend URL for CORS
node scripts/validate-deployment.js https://your-backend-url.com https://your-frontend-url.com
```

### 2. Manual Testing
```bash
# Health check
curl https://your-backend-url.com/api/health

# API documentation
curl https://your-backend-url.com/api-docs.json

# Hospital registration (should return validation error)
curl -X POST https://your-backend-url.com/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Frontend Integration
1. Update frontend environment:
   ```typescript
   // frontend/src/environments/environment.prod.ts
   export const environment = {
     production: true,
     apiUrl: 'https://your-backend-url.com/api'
   };
   ```

2. Build and deploy frontend:
   ```bash
   cd frontend
   ng build --configuration production
   # Deploy dist/ folder to your frontend hosting
   ```

3. Update backend CORS:
   - Add frontend URL to `FRONTEND_URL` environment variable
   - Redeploy backend

## 🔒 Security Checklist

### Pre-Production
- [ ] Strong JWT secret (32+ characters)
- [ ] Secure MongoDB connection (Atlas recommended)
- [ ] Gmail App Password (not regular password)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in code)

### Post-Production
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Error logging enabled
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
**Symptoms:** Deployment fails or crashes immediately
**Solutions:**
- Check environment variables are set
- Verify JWT secret is 32+ characters
- Test MongoDB connection string
- Check logs for specific errors

#### 2. Database Connection Failed
**Symptoms:** "MongoServerError" or connection timeout
**Solutions:**
- Verify MongoDB URI format
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for cloud platforms)
- Ensure database user has correct permissions
- Test connection locally first

#### 3. CORS Errors
**Symptoms:** Frontend can't connect to API
**Solutions:**
- Verify `FRONTEND_URL` matches frontend domain exactly
- Check protocol (http vs https)
- Ensure no trailing slash in URL
- Test CORS with curl

#### 4. Email Not Sending
**Symptoms:** Hospital verification emails not sent
**Solutions:**
- Verify Gmail App Password setup (not regular password)
- Check 2FA is enabled on Google account
- Test email credentials locally
- Check email service logs

### Debug Commands
```bash
# Check environment variables
node -e "console.log('JWT Secret length:', process.env.JWT_SECRET?.length || 0)"

# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"

# Test email configuration
node backend/test-email.js
```

## 📊 Monitoring and Maintenance

### Health Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor `/api/health` endpoint
- Set up alerts for downtime

### Performance Monitoring
- Monitor response times
- Track error rates
- Monitor database performance
- Set up log aggregation

### Regular Maintenance
- Update dependencies monthly
- Rotate JWT secrets quarterly
- Review and clean logs
- Monitor database growth
- Update SSL certificates

## 💰 Cost Estimates

### Free Tier (MVP)
- **Render:** Free (with limitations)
- **MongoDB Atlas:** Free (512MB)
- **Vercel Frontend:** Free
- **Total:** $0/month

### Production Ready
- **Render Pro:** $7/month
- **MongoDB Atlas:** $9/month (2GB)
- **Vercel Pro:** $20/month
- **Total:** $36/month

### Enterprise Scale
- **AWS/GCP:** $50-200/month
- **MongoDB Atlas:** $57/month (10GB)
- **CDN:** $10/month
- **Total:** $117-267/month

## 🎉 Success Criteria

Your deployment is successful when:
- [ ] Health endpoint returns 200 OK
- [ ] API documentation is accessible
- [ ] Hospital endpoints respond correctly
- [ ] CORS allows frontend connections
- [ ] Database operations work
- [ ] Email notifications send
- [ ] Frontend can connect to backend
- [ ] All tests pass

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the validation script
3. Check platform-specific logs
4. Review environment variables
5. Test individual components

For platform-specific help:
- **Render:** [Render Docs](https://render.com/docs)
- **Heroku:** [Heroku Dev Center](https://devcenter.heroku.com/)
- **Vercel:** [Vercel Docs](https://vercel.com/docs)
- **Docker:** [Docker Docs](https://docs.docker.com/)

---

## 🚀 Ready to Deploy?

1. Choose your deployment platform
2. Run the appropriate setup script
3. Configure environment variables
4. Deploy and test
5. Update frontend configuration
6. Monitor and maintain

**Happy deploying! 🎉**