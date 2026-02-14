# 🔐 SSL/TLS Setup Guide - Healthcare Platform

## 📋 Overview

This guide covers SSL/TLS certificate setup for the Healthcare Platform to ensure secure HTTPS connections for both development and production environments.

## 🎯 SSL Features

- **Self-signed certificates** for development
- **Let's Encrypt certificates** for production
- **Automatic certificate validation** and expiry monitoring
- **HTTPS redirect** from HTTP
- **Security headers** (HSTS, CSP, etc.)
- **Certificate renewal** automation
- **Docker support** with SSL-enabled containers

## 🚀 Quick Start

### Development Setup (Self-signed)

```bash
# Generate self-signed certificates for development
./scripts/ssl-setup.sh --domain localhost --type self-signed

# Start with SSL support
docker-compose -f docker-compose.ssl.yml up -d

# Access the application
# Frontend: https://localhost
# Backend:  https://localhost:3443
```

### Production Setup (Let's Encrypt)

```bash
# Generate Let's Encrypt certificates for production
./scripts/ssl-setup.sh \
  --domain yourdomain.com \
  --email admin@yourdomain.com \
  --type letsencrypt \
  --env production

# Start with SSL support
docker-compose -f docker-compose.ssl.yml --profile production up -d
```

## 📁 SSL File Structure

```
project/
├── certs/
│   ├── backend/
│   │   ├── server.key      # Backend private key
│   │   ├── server.crt      # Backend certificate
│   │   └── ca.crt          # CA certificate (optional)
│   ├── frontend/
│   │   ├── server.key      # Frontend private key
│   │   ├── server.crt      # Frontend certificate
│   │   └── ca.crt          # CA certificate (optional)
│   ├── letsencrypt/        # Let's Encrypt certificates
│   └── www/                # Let's Encrypt webroot
├── backend/config/ssl.js   # SSL configuration
├── frontend/nginx-ssl.conf # SSL-enabled nginx config
├── docker-compose.ssl.yml  # SSL Docker Compose
└── scripts/ssl-setup.sh    # SSL setup script
```

## 🔧 Configuration

### Environment Variables

Create `.env.ssl` file or set these environment variables:

```bash
# SSL Configuration
SSL_ENABLED=true
SSL_PORT=3443
SSL_CERT_PATH=/app/certs
SSL_KEY_FILE=server.key
SSL_CERT_FILE=server.crt
SSL_CA_FILE=ca.crt

# Frontend Configuration
SERVER_NAME=yourdomain.com
SELF_SIGNED=false

# Let's Encrypt
LETSENCRYPT_EMAIL=admin@yourdomain.com

# URLs
BACKEND_URL=https://yourdomain.com:3443
FRONTEND_URL=https://yourdomain.com
```

### Backend SSL Configuration

The backend automatically detects SSL configuration:

```javascript
// backend/config/ssl.js handles:
// - SSL certificate loading
// - HTTPS server creation
// - Certificate validation
// - Security headers
// - HTTP to HTTPS redirect
```

### Frontend SSL Configuration

Nginx configuration with SSL support:

```nginx
# frontend/nginx-ssl.conf includes:
# - SSL/TLS protocols and ciphers
# - Security headers (HSTS, CSP, etc.)
# - HTTP to HTTPS redirect
# - Rate limiting
# - API proxy with SSL
```

## 🛠️ Manual Setup

### 1. Generate Self-signed Certificates

```bash
# Create certificate directories
mkdir -p certs/{backend,frontend}

# Generate private key
openssl genrsa -out certs/backend/server.key 2048

# Generate certificate
openssl req -new -x509 -key certs/backend/server.key \
  -out certs/backend/server.crt \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=Healthcare Platform/CN=localhost"

# Copy to frontend
cp certs/backend/* certs/frontend/

# Set permissions
chmod 600 certs/*/server.key
chmod 644 certs/*/server.crt
```

### 2. Configure Backend

```bash
# Set environment variables
export SSL_ENABLED=true
export SSL_PORT=3443
export SSL_CERT_PATH=./certs/backend

# Start backend with SSL
cd backend
npm start
```

### 3. Configure Frontend

```bash
# Build frontend with SSL Docker image
cd frontend
docker build -f Dockerfile.ssl -t healthcare-frontend-ssl .

# Run with SSL
docker run -d \
  -p 80:80 -p 443:443 \
  -v $(pwd)/../certs/frontend:/etc/nginx/ssl:ro \
  -e SERVER_NAME=localhost \
  -e BACKEND_URL=https://localhost:3443 \
  healthcare-frontend-ssl
```

## 🏭 Production Deployment

### Let's Encrypt with Docker

```bash
# 1. Setup Let's Encrypt certificates
./scripts/ssl-setup.sh \
  --domain yourdomain.com \
  --email admin@yourdomain.com \
  --type letsencrypt \
  --env production

# 2. Start production services
docker-compose -f docker-compose.ssl.yml --profile production up -d

# 3. Verify certificates
docker-compose -f docker-compose.ssl.yml logs certbot
```

### Certificate Renewal

```bash
# Manual renewal
docker-compose -f docker-compose.ssl.yml run --rm certbot-renew

# Automatic renewal (add to crontab)
0 12 * * * /path/to/project/certs/renew-certificates.sh
```

### Load Balancer SSL Termination

If using a load balancer (AWS ALB, Cloudflare, etc.):

```bash
# Disable SSL in application (SSL terminated at load balancer)
export SSL_ENABLED=false

# Use HTTP internally
export BACKEND_URL=http://backend:3000
export FRONTEND_URL=http://frontend:80

# Start without SSL
docker-compose up -d
```

## 🧪 Testing SSL Configuration

### Certificate Validation

```bash
# Check certificate details
openssl x509 -in certs/backend/server.crt -noout -text

# Check certificate expiration
openssl x509 -in certs/backend/server.crt -noout -dates

# Verify certificate and key match
openssl x509 -noout -modulus -in certs/backend/server.crt | openssl md5
openssl rsa -noout -modulus -in certs/backend/server.key | openssl md5
```

### SSL Connection Testing

```bash
# Test HTTPS connection
curl -k https://localhost:3443/api/health

# Test SSL certificate
openssl s_client -connect localhost:3443 -servername localhost

# Test security headers
curl -I https://localhost
```

### Automated Testing

```bash
# Run SSL validation
node frontend/scripts/validate-deployment.js https://localhost https://localhost:3443

# Test with SSL Labs (production only)
# Visit: https://www.ssllabs.com/ssltest/
```

## 🔒 Security Best Practices

### Certificate Security

- **Private keys**: Never commit to version control
- **Permissions**: Set restrictive permissions (600 for keys, 644 for certificates)
- **Rotation**: Rotate certificates regularly (Let's Encrypt auto-renews every 60 days)
- **Monitoring**: Monitor certificate expiration dates

### SSL/TLS Configuration

- **Protocols**: Use TLS 1.2+ only
- **Ciphers**: Use strong cipher suites
- **HSTS**: Enable HTTP Strict Transport Security
- **OCSP Stapling**: Enable for better performance

### Application Security

```nginx
# Security headers in nginx-ssl.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Content-Security-Policy "default-src 'self'";
```

## 🚨 Troubleshooting

### Common Issues

#### Certificate Not Found
```bash
# Error: SSL certificate not found
# Solution: Check certificate paths and permissions
ls -la certs/backend/
chmod 600 certs/backend/server.key
chmod 644 certs/backend/server.crt
```

#### Certificate Expired
```bash
# Error: Certificate has expired
# Solution: Regenerate or renew certificate
./scripts/ssl-setup.sh --domain localhost --type self-signed
```

#### Port Already in Use
```bash
# Error: Port 443 already in use
# Solution: Check what's using the port
sudo netstat -tlnp | grep :443
sudo systemctl stop apache2  # or nginx
```

#### Browser Security Warning
```bash
# Warning: Self-signed certificate
# Solution: Add certificate to browser trust store or use --insecure flag
curl -k https://localhost:3443/api/health
```

### Debug Commands

```bash
# Check SSL configuration
openssl s_client -connect localhost:3443 -servername localhost

# Test certificate chain
openssl verify -CAfile certs/backend/ca.crt certs/backend/server.crt

# Check nginx configuration
docker-compose -f docker-compose.ssl.yml exec frontend nginx -t

# View SSL logs
docker-compose -f docker-compose.ssl.yml logs frontend
docker-compose -f docker-compose.ssl.yml logs backend
```

## 📊 Monitoring

### Certificate Expiry Monitoring

```bash
# Check certificate expiration
openssl x509 -enddate -noout -in certs/backend/server.crt

# Monitor with script
./scripts/ssl-setup.sh --validate-only
```

### SSL Performance

- Monitor SSL handshake time
- Check certificate chain length
- Monitor OCSP response time
- Track SSL error rates

### Alerting

Set up alerts for:
- Certificate expiration (30 days before)
- SSL handshake failures
- Mixed content warnings
- Security header violations

## 🔄 Certificate Lifecycle

### Development Workflow

1. **Generate** self-signed certificates
2. **Test** SSL configuration locally
3. **Validate** certificate setup
4. **Deploy** to staging with Let's Encrypt
5. **Test** production SSL setup
6. **Monitor** certificate health

### Production Workflow

1. **Obtain** Let's Encrypt certificates
2. **Deploy** with SSL configuration
3. **Monitor** certificate expiration
4. **Automate** renewal process
5. **Test** renewal procedures
6. **Backup** certificates securely

## 📚 Additional Resources

### Documentation
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Docker SSL Best Practices](https://docs.docker.com/engine/security/https/)

### Tools
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Certificate Transparency Logs](https://crt.sh/)
- [HSTS Preload List](https://hstspreload.org/)

### Security Standards
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

**🔐 Your Healthcare Platform is now secured with SSL/TLS encryption!**

Choose the appropriate setup method based on your environment and follow the security best practices for a robust SSL implementation.