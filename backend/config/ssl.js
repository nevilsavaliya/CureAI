/**
 * SSL/TLS Configuration for Healthcare Platform
 * Handles SSL certificate setup for secure HTTPS connections
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const logger = require('../services/logger');

class SSLConfig {
  constructor() {
    this.sslEnabled = process.env.SSL_ENABLED === 'true';
    this.sslPort = process.env.SSL_PORT || 443;
    this.certPath = process.env.SSL_CERT_PATH || './certs';
    this.keyFile = process.env.SSL_KEY_FILE || 'server.key';
    this.certFile = process.env.SSL_CERT_FILE || 'server.crt';
    this.caFile = process.env.SSL_CA_FILE || 'ca.crt';
  }

  /**
   * Get SSL options for HTTPS server
   * @returns {Object|null} SSL options or null if SSL not enabled
   */
  getSSLOptions() {
    if (!this.sslEnabled) {
      logger.info('SSL is disabled', { type: 'SSL_CONFIG' });
      return null;
    }

    try {
      const keyPath = path.join(this.certPath, this.keyFile);
      const certPath = path.join(this.certPath, this.certFile);
      const caPath = path.join(this.certPath, this.caFile);

      // Check if certificate files exist
      if (!fs.existsSync(keyPath)) {
        throw new Error(`SSL private key not found: ${keyPath}`);
      }

      if (!fs.existsSync(certPath)) {
        throw new Error(`SSL certificate not found: ${certPath}`);
      }

      const sslOptions = {
        key: fs.readFileSync(keyPath, 'utf8'),
        cert: fs.readFileSync(certPath, 'utf8')
      };

      // Add CA certificate if available (for intermediate certificates)
      if (fs.existsSync(caPath)) {
        sslOptions.ca = fs.readFileSync(caPath, 'utf8');
        logger.info('SSL CA certificate loaded', { type: 'SSL_CONFIG' });
      }

      // Security options
      sslOptions.secureProtocol = 'TLSv1_2_method';
      sslOptions.ciphers = [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384'
      ].join(':');
      sslOptions.honorCipherOrder = true;

      logger.info('SSL configuration loaded successfully', {
        type: 'SSL_CONFIG',
        keyFile: this.keyFile,
        certFile: this.certFile,
        port: this.sslPort
      });

      return sslOptions;
    } catch (error) {
      logger.error('Failed to load SSL configuration', {
        type: 'SSL_ERROR',
        error: error.message,
        certPath: this.certPath
      });
      throw error;
    }
  }

  /**
   * Create HTTPS server with SSL options
   * @param {Object} app Express application
   * @returns {Object|null} HTTPS server or null if SSL not enabled
   */
  createHTTPSServer(app) {
    const sslOptions = this.getSSLOptions();
    if (!sslOptions) {
      return null;
    }

    const httpsServer = https.createServer(sslOptions, app);
    
    httpsServer.on('error', (error) => {
      logger.error('HTTPS server error', {
        type: 'SSL_SERVER_ERROR',
        error: error.message,
        port: this.sslPort
      });
    });

    return httpsServer;
  }

  /**
   * Generate self-signed certificate for development
   * @returns {Promise<void>}
   */
  async generateSelfSignedCert() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Self-signed certificates should not be used in production');
    }

    const { execSync } = require('child_process');
    
    try {
      // Create certs directory if it doesn't exist
      if (!fs.existsSync(this.certPath)) {
        fs.mkdirSync(this.certPath, { recursive: true });
      }

      const keyPath = path.join(this.certPath, this.keyFile);
      const certPath = path.join(this.certPath, this.certFile);

      // Get domain from environment variables
      const domain = process.env.SSL_DOMAIN || process.env.SERVER_NAME || 'localhost';
      const organization = process.env.SSL_ORGANIZATION || 'Healthcare Platform';
      const organizationalUnit = process.env.SSL_OU || 'Development';
      const country = process.env.SSL_COUNTRY || 'US';
      const state = process.env.SSL_STATE || 'State';
      const city = process.env.SSL_CITY || 'City';

      // Generate private key
      execSync(`openssl genrsa -out ${keyPath} 2048`, { stdio: 'inherit' });

      // Generate certificate with dynamic domain configuration
      const subject = `/C=${country}/ST=${state}/L=${city}/O=${organization}/OU=${organizationalUnit}/CN=${domain}`;
      const opensslCmd = `openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "${subject}"`;
      
      // Add Subject Alternative Names for multiple domains
      const altNames = this.getSubjectAltNames(domain);
      if (altNames) {
        execSync(`${opensslCmd} -addext "${altNames}"`, { stdio: 'inherit' });
      } else {
        execSync(opensslCmd, { stdio: 'inherit' });
      }

      logger.info('Self-signed SSL certificate generated', {
        type: 'SSL_CERT_GENERATED',
        domain,
        keyPath,
        certPath,
        subject
      });

    } catch (error) {
      logger.error('Failed to generate self-signed certificate', {
        type: 'SSL_CERT_ERROR',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get Subject Alternative Names for certificate
   * @param {string} primaryDomain Primary domain name
   * @returns {string|null} SAN extension string or null
   */
  getSubjectAltNames(primaryDomain) {
    const altNames = [];
    
    // Add primary domain
    altNames.push(`DNS:${primaryDomain}`);
    
    // Add additional domains from environment
    const additionalDomains = process.env.SSL_ALT_NAMES;
    if (additionalDomains) {
      const domains = additionalDomains.split(',').map(d => d.trim());
      domains.forEach(domain => {
        if (domain && domain !== primaryDomain) {
          altNames.push(`DNS:${domain}`);
        }
      });
    }
    
    // Always include localhost for development
    if (primaryDomain !== 'localhost') {
      altNames.push('DNS:localhost');
      altNames.push('DNS:*.localhost');
    }
    
    // Add IP addresses
    altNames.push('IP:127.0.0.1');
    altNames.push('IP:::1');
    
    // Add custom IP addresses from environment
    const customIPs = process.env.SSL_ALT_IPS;
    if (customIPs) {
      const ips = customIPs.split(',').map(ip => ip.trim());
      ips.forEach(ip => {
        if (ip) {
          altNames.push(`IP:${ip}`);
        }
      });
    }
    
    return altNames.length > 1 ? `subjectAltName=${altNames.join(',')}` : null;
  }

  /**
   * Validate SSL certificate
   * @returns {Object} Certificate validation result
   */
  validateCertificate() {
    if (!this.sslEnabled) {
      return { valid: false, reason: 'SSL not enabled' };
    }

    try {
      const certPath = path.join(this.certPath, this.certFile);
      
      if (!fs.existsSync(certPath)) {
        return { valid: false, reason: 'Certificate file not found' };
      }

      const certContent = fs.readFileSync(certPath, 'utf8');
      const { execSync } = require('child_process');
      
      // Check certificate expiration
      const expiryCmd = `echo "${certContent}" | openssl x509 -noout -enddate`;
      const expiryOutput = execSync(expiryCmd, { encoding: 'utf8' });
      const expiryMatch = expiryOutput.match(/notAfter=(.+)/);
      
      if (expiryMatch) {
        const expiryDate = new Date(expiryMatch[1]);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          return { valid: false, reason: 'Certificate has expired' };
        }
        
        if (daysUntilExpiry <= 30) {
          logger.warn('SSL certificate expires soon', {
            type: 'SSL_CERT_WARNING',
            daysUntilExpiry,
            expiryDate: expiryDate.toISOString()
          });
        }
        
        return {
          valid: true,
          expiryDate,
          daysUntilExpiry
        };
      }
      
      return { valid: false, reason: 'Could not parse certificate expiry' };
      
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Setup HTTP to HTTPS redirect middleware
   * @returns {Function} Express middleware
   */
  httpsRedirectMiddleware() {
    return (req, res, next) => {
      if (this.sslEnabled && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        // Get the host from environment or request
        const host = process.env.SSL_DOMAIN || process.env.SERVER_NAME || req.get('host');
        const httpsPort = process.env.SSL_PORT || 443;
        
        // Construct HTTPS URL
        let httpsUrl;
        if (httpsPort === 443 || httpsPort === '443') {
          httpsUrl = `https://${host}${req.url}`;
        } else {
          httpsUrl = `https://${host}:${httpsPort}${req.url}`;
        }
        
        logger.info('Redirecting HTTP to HTTPS', {
          type: 'SSL_REDIRECT',
          originalUrl: req.url,
          httpsUrl,
          host,
          port: httpsPort
        });
        return res.redirect(301, httpsUrl);
      }
      next();
    };
  }

  /**
   * Get SSL security headers middleware
   * @returns {Function} Express middleware
   */
  securityHeadersMiddleware() {
    return (req, res, next) => {
      if (this.sslEnabled) {
        // Strict Transport Security
        const hstsMaxAge = process.env.HSTS_MAX_AGE || '31536000';
        const hstsIncludeSubDomains = process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false';
        const hstsPreload = process.env.HSTS_PRELOAD !== 'false';
        
        let hstsHeader = `max-age=${hstsMaxAge}`;
        if (hstsIncludeSubDomains) hstsHeader += '; includeSubDomains';
        if (hstsPreload) hstsHeader += '; preload';
        
        res.setHeader('Strict-Transport-Security', hstsHeader);
        
        // Content Security Policy with configurable frontend URLs
        const frontendUrls = this.getAllowedOrigins();
        const cspDirectives = [
          "default-src 'self'",
          `connect-src 'self' ${frontendUrls.join(' ')}`,
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "frame-ancestors 'none'"
        ];
        
        // Add upgrade-insecure-requests only if not in development
        if (process.env.NODE_ENV === 'production') {
          cspDirectives.push('upgrade-insecure-requests');
        }
        
        res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
      }
      next();
    };
  }

  /**
   * Get allowed origins for security headers
   * @returns {Array<string>} Array of allowed origin URLs
   */
  getAllowedOrigins() {
    const origins = [];
    
    // Add frontend URL from environment
    if (process.env.FRONTEND_URL) {
      origins.push(process.env.FRONTEND_URL);
    }
    
    // Add CORS origins
    if (process.env.CORS_ORIGINS) {
      const corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
      corsOrigins.forEach(origin => {
        if (origin && !origins.includes(origin)) {
          origins.push(origin);
        }
      });
    }
    
    // Add API URL if different from frontend
    if (process.env.API_URL && !origins.includes(process.env.API_URL)) {
      origins.push(process.env.API_URL);
    }
    
    // Add Socket URL if different
    if (process.env.SOCKET_URL && !origins.includes(process.env.SOCKET_URL)) {
      origins.push(process.env.SOCKET_URL);
    }
    
    // Fallback to localhost for development
    if (origins.length === 0) {
      origins.push('http://localhost:4200', 'https://localhost');
    }
    
    return origins;
  }
}

module.exports = new SSLConfig();