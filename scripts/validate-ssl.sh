#!/bin/bash
# Healthcare Platform - SSL Certificate Validation Script
# Validates SSL certificates and configuration

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

# Default values
DOMAIN="${SSL_DOMAIN:-${SERVER_NAME:-localhost}}"
BACKEND_PORT="${SSL_PORT:-3443}"
FRONTEND_PORT="${HTTPS_PORT:-443}"

# Functions
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
Healthcare Platform SSL Validation Script

Usage: $0 [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN     Domain to test (default: localhost)
    -b, --backend-port PORT Backend HTTPS port (default: 3443)
    -f, --frontend-port PORT Frontend HTTPS port (default: 443)
    -h, --help              Show this help message

EXAMPLES:
    # Validate localhost certificates
    $0

    # Validate production domain
    $0 --domain example.com

    # Validate with custom ports
    $0 --domain localhost --backend-port 8443 --frontend-port 8080

EOF
}

check_certificate_files() {
    print_info "Checking certificate files..."
    
    local backend_cert="$CERTS_DIR/backend/server.crt"
    local backend_key="$CERTS_DIR/backend/server.key"
    local frontend_cert="$CERTS_DIR/frontend/server.crt"
    local frontend_key="$CERTS_DIR/frontend/server.key"
    
    local files_ok=true
    
    # Check backend certificates
    if [ -f "$backend_cert" ] && [ -f "$backend_key" ]; then
        print_success "Backend certificate files found"
        
        # Check permissions
        local cert_perms=$(stat -c "%a" "$backend_cert")
        local key_perms=$(stat -c "%a" "$backend_key")
        
        if [ "$cert_perms" = "644" ]; then
            print_success "Backend certificate permissions correct (644)"
        else
            print_warning "Backend certificate permissions: $cert_perms (should be 644)"
        fi
        
        if [ "$key_perms" = "600" ]; then
            print_success "Backend private key permissions correct (600)"
        else
            print_warning "Backend private key permissions: $key_perms (should be 600)"
        fi
    else
        print_error "Backend certificate files not found"
        files_ok=false
    fi
    
    # Check frontend certificates
    if [ -f "$frontend_cert" ] && [ -f "$frontend_key" ]; then
        print_success "Frontend certificate files found"
        
        # Check permissions
        local cert_perms=$(stat -c "%a" "$frontend_cert")
        local key_perms=$(stat -c "%a" "$frontend_key")
        
        if [ "$cert_perms" = "644" ]; then
            print_success "Frontend certificate permissions correct (644)"
        else
            print_warning "Frontend certificate permissions: $cert_perms (should be 644)"
        fi
        
        if [ "$key_perms" = "600" ]; then
            print_success "Frontend private key permissions correct (600)"
        else
            print_warning "Frontend private key permissions: $key_perms (should be 600)"
        fi
    else
        print_error "Frontend certificate files not found"
        files_ok=false
    fi
    
    return $([ "$files_ok" = true ] && echo 0 || echo 1)
}

validate_certificate_content() {
    print_info "Validating certificate content..."
    
    local cert_file="$1"
    local key_file="$2"
    local service_name="$3"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        print_error "$service_name certificate files not found"
        return 1
    fi
    
    # Check if certificate and key match
    local cert_hash=$(openssl x509 -noout -modulus -in "$cert_file" 2>/dev/null | openssl md5)
    local key_hash=$(openssl rsa -noout -modulus -in "$key_file" 2>/dev/null | openssl md5)
    
    if [ "$cert_hash" = "$key_hash" ]; then
        print_success "$service_name certificate and key match"
    else
        print_error "$service_name certificate and key do not match"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -checkend 86400 -noout -in "$cert_file" > /dev/null 2>&1; then
        print_success "$service_name certificate is valid for at least 24 hours"
    else
        print_warning "$service_name certificate expires within 24 hours"
    fi
    
    # Get certificate details
    local subject=$(openssl x509 -noout -subject -in "$cert_file" | sed 's/subject=//')
    local issuer=$(openssl x509 -noout -issuer -in "$cert_file" | sed 's/issuer=//')
    local not_after=$(openssl x509 -noout -enddate -in "$cert_file" | sed 's/notAfter=//')
    
    echo "  Subject: $subject"
    echo "  Issuer: $issuer"
    echo "  Expires: $not_after"
    
    return 0
}

test_ssl_connection() {
    print_info "Testing SSL connections..."
    
    local host="$1"
    local port="$2"
    local service_name="$3"
    
    # Test SSL connection
    if timeout 10 openssl s_client -connect "$host:$port" -servername "$host" </dev/null >/dev/null 2>&1; then
        print_success "$service_name SSL connection successful"
        
        # Get SSL details
        local ssl_info=$(timeout 10 openssl s_client -connect "$host:$port" -servername "$host" </dev/null 2>/dev/null)
        local protocol=$(echo "$ssl_info" | grep "Protocol" | head -1)
        local cipher=$(echo "$ssl_info" | grep "Cipher" | head -1)
        
        if [ -n "$protocol" ]; then
            echo "  $protocol"
        fi
        if [ -n "$cipher" ]; then
            echo "  $cipher"
        fi
        
        return 0
    else
        print_error "$service_name SSL connection failed"
        return 1
    fi
}

test_http_redirect() {
    print_info "Testing HTTP to HTTPS redirect..."
    
    local host="$1"
    local http_port="80"
    
    # Test HTTP redirect
    local response=$(curl -s -I -L --max-time 10 "http://$host:$http_port/" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q "HTTP.*301\|HTTP.*302"; then
        print_success "HTTP to HTTPS redirect is working"
    elif echo "$response" | grep -q "Strict-Transport-Security"; then
        print_success "HTTPS is working (HSTS header found)"
    else
        print_warning "HTTP to HTTPS redirect may not be configured"
    fi
}

test_security_headers() {
    print_info "Testing security headers..."
    
    # Get URL from environment or construct it
    local base_url="${FRONTEND_URL:-https://$1}"
    if [[ ! "$base_url" =~ ^https?:// ]]; then
        base_url="https://$base_url"
    fi
    
    # Test HTTPS response
    local headers=$(curl -s -I -k --max-time 10 "$base_url" 2>/dev/null || echo "")
    
    if [ -z "$headers" ]; then
        print_error "Could not retrieve headers from $base_url"
        return 1
    fi
    
    # Check for security headers
    local headers_found=0
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_success "HSTS header found"
        headers_found=$((headers_found + 1))
    else
        print_warning "HSTS header not found"
    fi
    
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_success "X-Frame-Options header found"
        headers_found=$((headers_found + 1))
    else
        print_warning "X-Frame-Options header not found"
    fi
    
    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_success "X-Content-Type-Options header found"
        headers_found=$((headers_found + 1))
    else
        print_warning "X-Content-Type-Options header not found"
    fi
    
    if echo "$headers" | grep -qi "content-security-policy"; then
        print_success "Content-Security-Policy header found"
        headers_found=$((headers_found + 1))
    else
        print_warning "Content-Security-Policy header not found"
    fi
    
    echo "  Security headers found: $headers_found/4"
    echo "  Testing URL: $base_url"
    
    return 0
}

generate_report() {
    local total_tests="$1"
    local passed_tests="$2"
    
    echo ""
    echo "================================"
    print_info "SSL Validation Report"
    echo "================================"
    echo "Domain: $DOMAIN"
    echo "Backend Port: $BACKEND_PORT"
    echo "Frontend Port: $FRONTEND_PORT"
    echo ""
    echo "Tests Passed: $passed_tests/$total_tests"
    
    local success_rate=$(( passed_tests * 100 / total_tests ))
    echo "Success Rate: $success_rate%"
    echo ""
    
    if [ $success_rate -eq 100 ]; then
        print_success "All SSL tests passed! Your SSL configuration is working correctly."
    elif [ $success_rate -ge 80 ]; then
        print_warning "Most SSL tests passed with minor issues. Review the warnings above."
    else
        print_error "Multiple SSL tests failed. Please review and fix the issues."
    fi
    
    echo ""
    print_info "Next steps:"
    if [ $success_rate -eq 100 ]; then
        echo "- ✅ SSL configuration is ready for production"
        echo "- 🔧 Consider setting up certificate monitoring"
        echo "- 📊 Set up SSL performance monitoring"
    else
        echo "- 🔍 Review failed tests above"
        echo "- 🛠️ Fix SSL configuration issues"
        echo "- 🔄 Re-run validation after fixes"
        echo "- 📖 Check SSL setup guide: docs/SSL_SETUP_GUIDE.md"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -b|--backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -f|--frontend-port)
            FRONTEND_PORT="$2"
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

# Main execution
main() {
    echo "🔐 Healthcare Platform SSL Validation"
    echo "====================================="
    echo ""
    
    local total_tests=0
    local passed_tests=0
    
    # Test 1: Check certificate files
    total_tests=$((total_tests + 1))
    if check_certificate_files; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 2: Validate backend certificate
    total_tests=$((total_tests + 1))
    if validate_certificate_content "$CERTS_DIR/backend/server.crt" "$CERTS_DIR/backend/server.key" "Backend"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 3: Validate frontend certificate
    total_tests=$((total_tests + 1))
    if validate_certificate_content "$CERTS_DIR/frontend/server.crt" "$CERTS_DIR/frontend/server.key" "Frontend"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 4: Test backend SSL connection
    total_tests=$((total_tests + 1))
    if test_ssl_connection "$DOMAIN" "$BACKEND_PORT" "Backend"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 5: Test frontend SSL connection
    total_tests=$((total_tests + 1))
    if test_ssl_connection "$DOMAIN" "$FRONTEND_PORT" "Frontend"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 6: Test HTTP redirect
    total_tests=$((total_tests + 1))
    if test_http_redirect "$DOMAIN"; then
        passed_tests=$((passed_tests + 1))
    fi
    echo ""
    
    # Test 7: Test security headers
    total_tests=$((total_tests + 1))
    if test_security_headers "$DOMAIN"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Generate report
    generate_report $total_tests $passed_tests
    
    # Exit with appropriate code
    if [ $passed_tests -eq $total_tests ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main