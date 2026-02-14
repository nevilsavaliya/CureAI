#!/bin/bash
# Healthcare Platform - SSL Certificate Setup Script
# Automates SSL certificate generation and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="$PROJECT_ROOT/certs"
BACKEND_CERTS_DIR="$CERTS_DIR/backend"
FRONTEND_CERTS_DIR="$CERTS_DIR/frontend"

# Default values
DOMAIN="${SSL_DOMAIN:-${SERVER_NAME:-localhost}}"
EMAIL="${LETSENCRYPT_EMAIL:-}"
ENVIRONMENT="${NODE_ENV:-development}"
CERT_TYPE="${SSL_CERT_TYPE:-self-signed}"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🔐 Healthcare Platform SSL Setup${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

show_help() {
    cat << EOF
Healthcare Platform SSL Setup Script

Usage: $0 [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN     Domain name for the certificate (default: localhost)
    -e, --email EMAIL       Email for Let's Encrypt registration
    -t, --type TYPE         Certificate type: self-signed, letsencrypt (default: self-signed)
    -E, --env ENV           Environment: development, production (default: development)
    -h, --help              Show this help message

EXAMPLES:
    # Generate self-signed certificates for development
    $0 --domain localhost --type self-signed

    # Generate Let's Encrypt certificates for production
    $0 --domain example.com --email admin@example.com --type letsencrypt --env production

    # Quick development setup
    $0

EOF
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi
    
    if [ "$CERT_TYPE" = "letsencrypt" ] && ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

create_directories() {
    print_info "Creating certificate directories..."
    
    mkdir -p "$BACKEND_CERTS_DIR"
    mkdir -p "$FRONTEND_CERTS_DIR"
    mkdir -p "$CERTS_DIR/letsencrypt"
    mkdir -p "$CERTS_DIR/www"
    
    print_success "Certificate directories created"
}

generate_self_signed_cert() {
    print_info "Generating self-signed SSL certificates for $DOMAIN..."
    
    local key_file="$1/server.key"
    local cert_file="$1/server.crt"
    
    # Get certificate details from environment variables
    local country="${SSL_COUNTRY:-US}"
    local state="${SSL_STATE:-State}"
    local city="${SSL_CITY:-City}"
    local organization="${SSL_ORGANIZATION:-Healthcare Platform}"
    local org_unit="${SSL_OU:-IT Department}"
    
    # Generate private key
    openssl genrsa -out "$key_file" 2048
    
    # Prepare Subject Alternative Names
    local alt_names="DNS:$DOMAIN,DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"
    
    # Add additional domains from environment
    if [ -n "$SSL_ALT_NAMES" ]; then
        IFS=',' read -ra ADDITIONAL_DOMAINS <<< "$SSL_ALT_NAMES"
        for domain in "${ADDITIONAL_DOMAINS[@]}"; do
            domain=$(echo "$domain" | xargs)  # trim whitespace
            if [ -n "$domain" ]; then
                alt_names="$alt_names,DNS:$domain"
            fi
        done
    fi
    
    # Add additional IP addresses from environment
    if [ -n "$SSL_ALT_IPS" ]; then
        IFS=',' read -ra ADDITIONAL_IPS <<< "$SSL_ALT_IPS"
        for ip in "${ADDITIONAL_IPS[@]}"; do
            ip=$(echo "$ip" | xargs)  # trim whitespace
            if [ -n "$ip" ]; then
                alt_names="$alt_names,IP:$ip"
            fi
        done
    fi
    
    # Generate certificate with dynamic configuration
    openssl req -new -x509 -key "$key_file" \
        -out "$cert_file" \
        -days 365 \
        -subj "/C=$country/ST=$state/L=$city/O=$organization/OU=$org_unit/CN=$DOMAIN" \
        -addext "subjectAltName=$alt_names"
    
    # Set proper permissions
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    print_success "Self-signed certificate generated for $DOMAIN"
    print_info "Certificate includes domains: $(echo "$alt_names" | tr ',' ' ')"
}

generate_letsencrypt_cert() {
    if [ -z "$EMAIL" ]; then
        print_error "Email is required for Let's Encrypt certificates"
        exit 1
    fi
    
    print_info "Generating Let's Encrypt certificate for $DOMAIN..."
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        print_error "Docker is required for Let's Encrypt certificate generation"
        exit 1
    fi
    
    # Create temporary docker-compose file for certbot
    cat > "$CERTS_DIR/docker-compose.certbot.yml" << EOF
version: '3.8'
services:
  certbot:
    image: certbot/certbot
    volumes:
      - ./letsencrypt:/etc/letsencrypt
      - ./www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email $EMAIL --agree-tos --no-eff-email -d $DOMAIN
EOF
    
    # Run certbot
    cd "$CERTS_DIR"
    docker-compose -f docker-compose.certbot.yml run --rm certbot
    
    # Copy certificates to backend and frontend directories
    if [ -f "letsencrypt/live/$DOMAIN/fullchain.pem" ] && [ -f "letsencrypt/live/$DOMAIN/privkey.pem" ]; then
        cp "letsencrypt/live/$DOMAIN/fullchain.pem" "$BACKEND_CERTS_DIR/server.crt"
        cp "letsencrypt/live/$DOMAIN/privkey.pem" "$BACKEND_CERTS_DIR/server.key"
        cp "letsencrypt/live/$DOMAIN/fullchain.pem" "$FRONTEND_CERTS_DIR/server.crt"
        cp "letsencrypt/live/$DOMAIN/privkey.pem" "$FRONTEND_CERTS_DIR/server.key"
        
        # Set proper permissions
        chmod 600 "$BACKEND_CERTS_DIR/server.key" "$FRONTEND_CERTS_DIR/server.key"
        chmod 644 "$BACKEND_CERTS_DIR/server.crt" "$FRONTEND_CERTS_DIR/server.crt"
        
        print_success "Let's Encrypt certificate generated and configured"
    else
        print_error "Failed to generate Let's Encrypt certificate"
        exit 1
    fi
    
    # Clean up
    rm -f docker-compose.certbot.yml
    cd "$PROJECT_ROOT"
}

validate_certificates() {
    print_info "Validating SSL certificates..."
    
    local dirs=("$BACKEND_CERTS_DIR" "$FRONTEND_CERTS_DIR")
    
    for dir in "${dirs[@]}"; do
        local key_file="$dir/server.key"
        local cert_file="$dir/server.crt"
        
        if [ ! -f "$key_file" ] || [ ! -f "$cert_file" ]; then
            print_error "Certificate files not found in $dir"
            continue
        fi
        
        # Check if certificate and key match
        local cert_hash=$(openssl x509 -noout -modulus -in "$cert_file" | openssl md5)
        local key_hash=$(openssl rsa -noout -modulus -in "$key_file" | openssl md5)
        
        if [ "$cert_hash" = "$key_hash" ]; then
            print_success "Certificate and key match in $dir"
        else
            print_error "Certificate and key do not match in $dir"
            continue
        fi
        
        # Check certificate expiration
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -gt 0 ]; then
            print_success "Certificate in $dir is valid for $days_until_expiry days"
        else
            print_warning "Certificate in $dir has expired"
        fi
        
        # Display certificate information
        echo "Certificate details for $dir:"
        openssl x509 -in "$cert_file" -noout -subject -issuer -dates
        echo ""
    done
}

create_env_file() {
    print_info "Creating SSL environment configuration..."
    
    local env_file="$PROJECT_ROOT/.env.ssl"
    
    # Get backend and frontend URLs from environment or construct them
    local backend_url="${BACKEND_URL:-https://$DOMAIN:${SSL_PORT:-3443}}"
    local frontend_url="${FRONTEND_URL:-https://$DOMAIN}"
    local api_url="${API_URL:-$backend_url/api}"
    local socket_url="${SOCKET_URL:-$backend_url}"
    
    cat > "$env_file" << EOF
# SSL Configuration for Healthcare Platform
SSL_ENABLED=true
SSL_PORT=${SSL_PORT:-3443}
SSL_CERT_PATH=${SSL_CERT_PATH:-/app/certs}
SSL_KEY_FILE=${SSL_KEY_FILE:-server.key}
SSL_CERT_FILE=${SSL_CERT_FILE:-server.crt}
SSL_CA_FILE=${SSL_CA_FILE:-ca.crt}

# SSL Certificate Configuration
SSL_DOMAIN=$DOMAIN
SSL_ORGANIZATION=${SSL_ORGANIZATION:-Healthcare Platform}
SSL_OU=${SSL_OU:-IT Department}
SSL_COUNTRY=${SSL_COUNTRY:-US}
SSL_STATE=${SSL_STATE:-State}
SSL_CITY=${SSL_CITY:-City}
SSL_ALT_NAMES=${SSL_ALT_NAMES:-}
SSL_ALT_IPS=${SSL_ALT_IPS:-}

# Security Headers Configuration
HSTS_MAX_AGE=${HSTS_MAX_AGE:-31536000}
HSTS_INCLUDE_SUBDOMAINS=${HSTS_INCLUDE_SUBDOMAINS:-true}
HSTS_PRELOAD=${HSTS_PRELOAD:-true}

# Frontend SSL Configuration
SERVER_NAME=$DOMAIN
SELF_SIGNED=$([ "$CERT_TYPE" = "self-signed" ] && echo "true" || echo "false")

# Let's Encrypt Configuration (if applicable)
LETSENCRYPT_EMAIL=$EMAIL
SSL_CERT_TYPE=$CERT_TYPE

# Application URLs
BACKEND_URL=$backend_url
FRONTEND_URL=$frontend_url
API_URL=$api_url
SOCKET_URL=$socket_url
CORS_ORIGINS=$frontend_url

# Health Check URLs
HEALTH_CHECK_URL=$backend_url/api/health
FRONTEND_HEALTH_CHECK_URL=$frontend_url/health

# Redis Configuration (for session management)
REDIS_PASSWORD=${REDIS_PASSWORD:-healthcare123}
EOF
    
    print_success "SSL environment file created: $env_file"
    print_info "Configuration includes:"
    echo "  - Domain: $DOMAIN"
    echo "  - Backend URL: $backend_url"
    echo "  - Frontend URL: $frontend_url"
    echo "  - API URL: $api_url"
    echo "  - Socket URL: $socket_url"
}

setup_certificate_renewal() {
    if [ "$CERT_TYPE" = "letsencrypt" ]; then
        print_info "Setting up certificate renewal..."
        
        # Create renewal script
        cat > "$CERTS_DIR/renew-certificates.sh" << 'EOF'
#!/bin/bash
# Certificate renewal script for Healthcare Platform

CERTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$CERTS_DIR")"

echo "🔄 Renewing SSL certificates..."

cd "$CERTS_DIR"
docker-compose -f ../docker-compose.ssl.yml run --rm certbot-renew

# Reload nginx if certificates were renewed
if [ $? -eq 0 ]; then
    echo "✅ Certificates renewed successfully"
    docker-compose -f ../docker-compose.ssl.yml exec frontend nginx -s reload
else
    echo "ℹ️ No certificates were renewed"
fi
EOF
        
        chmod +x "$CERTS_DIR/renew-certificates.sh"
        
        print_success "Certificate renewal script created"
        print_info "To set up automatic renewal, add this to your crontab:"
        echo "0 12 * * * $CERTS_DIR/renew-certificates.sh"
    fi
}

show_next_steps() {
    print_header
    print_success "SSL setup completed successfully!"
    echo ""
    
    print_info "Next steps:"
    echo "1. Start the application with SSL support:"
    echo "   docker-compose -f docker-compose.ssl.yml up -d"
    echo ""
    echo "2. Access your application:"
    echo "   Frontend: https://$DOMAIN"
    echo "   Backend:  https://$DOMAIN:3443"
    echo "   API Docs: https://$DOMAIN:3443/api-docs"
    echo ""
    
    if [ "$CERT_TYPE" = "self-signed" ]; then
        print_warning "You are using self-signed certificates."
        echo "   Your browser will show a security warning."
        echo "   This is normal for development environments."
        echo ""
    fi
    
    if [ "$CERT_TYPE" = "letsencrypt" ]; then
        print_info "Let's Encrypt certificates are configured."
        echo "   Set up automatic renewal with:"
        echo "   crontab -e"
        echo "   Add: 0 12 * * * $CERTS_DIR/renew-certificates.sh"
        echo ""
    fi
    
    print_info "Configuration files created:"
    echo "   - SSL certificates: $CERTS_DIR/"
    echo "   - Environment file: $PROJECT_ROOT/.env.ssl"
    echo "   - Docker Compose: $PROJECT_ROOT/docker-compose.ssl.yml"
    echo ""
    
    print_info "To update backend SSL configuration:"
    echo "   Source the SSL environment: source .env.ssl"
    echo "   Restart the backend service"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -t|--type)
            CERT_TYPE="$2"
            shift 2
            ;;
        -E|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate arguments
if [ "$CERT_TYPE" != "self-signed" ] && [ "$CERT_TYPE" != "letsencrypt" ]; then
    print_error "Invalid certificate type: $CERT_TYPE"
    print_info "Valid types: self-signed, letsencrypt"
    exit 1
fi

if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_info "Valid environments: development, production"
    exit 1
fi

# Main execution
main() {
    print_header
    
    print_info "Configuration:"
    echo "  Domain: $DOMAIN"
    echo "  Certificate Type: $CERT_TYPE"
    echo "  Environment: $ENVIRONMENT"
    echo "  Email: ${EMAIL:-"Not provided"}"
    echo ""
    
    check_dependencies
    create_directories
    
    case $CERT_TYPE in
        "self-signed")
            generate_self_signed_cert "$BACKEND_CERTS_DIR"
            generate_self_signed_cert "$FRONTEND_CERTS_DIR"
            ;;
        "letsencrypt")
            generate_letsencrypt_cert
            ;;
    esac
    
    validate_certificates
    create_env_file
    setup_certificate_renewal
    show_next_steps
}

# Run main function
main