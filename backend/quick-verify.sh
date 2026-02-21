#!/bin/bash

# Quick Verification Script
# Task 21: Final verification and testing

echo "=========================================="
echo "Quick Verification Script"
echo "Task 21: Final verification and testing"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "Checking backend server..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend server is running${NC}"
else
    echo -e "${RED}✗ Backend server is NOT running${NC}"
    echo -e "${YELLOW}Please start the backend server:${NC}"
    echo "  cd backend && npm start"
    echo ""
    exit 1
fi

# Check if frontend is running
echo "Checking frontend server..."
if curl -s http://localhost:4200 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend server is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend server is NOT running${NC}"
    echo -e "${YELLOW}Please start the frontend server:${NC}"
    echo "  cd frontend && npm start"
    echo ""
fi

echo ""
echo "=========================================="
echo "Running automated verification tests..."
echo "=========================================="
echo ""

# Run the verification script
node backend/test-final-verification.js

# Capture exit code
EXIT_CODE=$?

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the test results above"
    echo "2. Perform manual testing using the guide:"
    echo "   .kiro/specs/frontend-backend-compatibility/TASK_21_VERIFICATION_GUIDE.md"
    echo "3. Document any issues found"
else
    echo -e "${RED}Some tests failed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the failed tests above"
    echo "2. Check the detailed guide:"
    echo "   .kiro/specs/frontend-backend-compatibility/TASK_21_VERIFICATION_GUIDE.md"
    echo "3. Fix the issues and re-run verification"
fi

echo ""
exit $EXIT_CODE
