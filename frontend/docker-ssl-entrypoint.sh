#!/bin/sh
# Healthcare Platform Frontend - SSL Docker Entrypoint
# Handles SSL certificate setup and nginx configuration

set -e

# Default values
SERVER_NAME=${SERVER_NAME:-localhost}
BACKEND_URL=${BACKEND_URL:-https://backend:3443}
SSL_CERT_PATH="/etc/nginx/ssl"
SELF_SIGNED=${SELF_SIGNED:-true}

echo "🔐 Starting Healthcare Platform Frontend with SSL..."
echo "Server Name: $SERVER_NAME"
echo "Backend URL: $BACKEND_URL"
echo "Self-signed certificates: $SELF_SIGNED"

# Function to generate self-signed certificates
generate_self_signed_cert() {
    echo "🔑 Generating self-signed SSL certificate for development..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p "$SSL_CERT_PATH"
    
    # Generate private key
    openssl genrsa -out "$SSL_CERT_PATH/server.key" 2048
    
    # Generate certificate signing request and certificate
    openssl req -new -x509 -key "$SSL_CERT_PATH/server.key" \
        -out "$SSL_CERT_PATH/server.crt" \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=Healthcare Platform/OU=Development/CN=$SERVER_NAME" \
        -addext "subjectAltName=DNS:$SERVER_NAME,DNS:localhost,IP:127.0.0.1"
    
    # Set proper permissions
    chmod 600 "$SSL_CERT_PATH/server.key"
    chmod 644 "$SSL_CERT_PATH/server.crt"
    
    echo "✅ Self-signed SSL certificate generated successfully"
}

# Function to check if SSL certificates exist
check_ssl_certificates() {
    if [ -f "$SSL_CERT_PATH/server.crt" ] && [ -f "$SSL_CERT_PATH/server.key" ]; then
        echo "✅ SSL certificates found"
        
        # Check certificate expiration
        if openssl x509 -checkend 86400 -noout -in "$SSL_CERT_PATH/server.crt" > /dev/null 2>&1; then
            echo "✅ SSL certificate is valid for at least 24 hours"
            return 0
        else
            echo "⚠️ SSL certificate expires within 24 hours"
            return 1
        fi
    else
        echo "❌ SSL certificates not found"
        return 1
    fi
}

# Function to setup Let's Encrypt certificates
setup_letsencrypt() {
    echo "🔐 Setting up Let's Encrypt certificates..."
    
    # Check if Let's Encrypt certificates exist
    if [ -f "/etc/letsencrypt/live/$SERVER_NAME/fullchain.pem" ] && \
       [ -f "/etc/letsencrypt/live/$SERVER_NAME/privkey.pem" ]; then
        echo "✅ Let's Encrypt certificates found, copying to nginx directory..."
        
        cp "/etc/letsencrypt/live/$SERVER_NAME/fullchain.pem" "$SSL_CERT_PATH/server.crt"
        cp "/etc/letsencrypt/live/$SERVER_NAME/privkey.pem" "$SSL_CERT_PATH/server.key"
        
        # Set proper permissions
        chmod 600 "$SSL_CERT_PATH/server.key"
        chmod 644 "$SSL_CERT_PATH/server.crt"
        
        echo "✅ Let's Encrypt certificates configured"
        return 0
    else
        echo "❌ Let's Encrypt certificates not found"
        return 1
    fi
}

# Function to configure nginx
configure_nginx() {
    echo "🔧 Configuring nginx..."
    
    # Replace environment variables in nginx configuration
    envsubst '${SERVER_NAME} ${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
    
    # Test nginx configuration
    if nginx -t; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration is invalid"
        exit 1
    fi
}

# Function to start nginx with graceful SSL handling
start_nginx() {
    echo "🚀 Starting nginx..."
    
    # Start nginx in the background
    nginx -g "daemon off;" &
    NGINX_PID=$!
    
    # Function to handle shutdown
    shutdown() {
        echo "🛑 Shutting down nginx..."
        kill -TERM $NGINX_PID
        wait $NGINX_PID
        echo "✅ Nginx stopped gracefully"
    }
    
    # Trap signals for graceful shutdown
    trap shutdown TERM INT
    
    # Wait for nginx process
    wait $NGINX_PID
}

# Main execution flow
main() {
    # Check if we're in production mode (not using self-signed certificates)
    if [ "$SELF_SIGNED" = "false" ] || [ "$NODE_ENV" = "production" ]; then
        echo "🏭 Production mode detected"
        
        # Try to setup Let's Encrypt certificates first
        if ! setup_letsencrypt; then
            echo "⚠️ Let's Encrypt certificates not available, checking for existing certificates..."
            
            if ! check_ssl_certificates; then
                echo "❌ No valid SSL certificates found in production mode"
                echo "Please provide SSL certificates or use Let's Encrypt"
                exit 1
            fi
        fi
    else
        echo "🧪 Development mode detected"
        
        # Check for existing certificates first
        if ! check_ssl_certificates; then
            # Generate self-signed certificates for development
            generate_self_signed_cert
        fi
    fi
    
    # Configure nginx with environment variables
    configure_nginx
    
    # Display certificate information
    echo "📋 SSL Certificate Information:"
    openssl x509 -in "$SSL_CERT_PATH/server.crt" -noout -subject -dates
    
    # Start nginx
    start_nginx
}

# Run main function
main "$@"