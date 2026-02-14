#!/usr/bin/env node

/**
 * Docker Deployment Script
 * Helps prepare and deploy the backend using Docker
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🐳 Healthcare Platform - Docker Deployment Setup\n');

/**
 * Checks if Docker is installed and running
 */
function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Creates .dockerignore file
 */
function createDockerIgnore() {
  const dockerIgnoreContent = `# Dependencies
backend/node_modules
frontend/node_modules

# Build outputs
frontend/dist
backend/dist

# Environment files
backend/.env
backend/.env.local
backend/.env.production

# Logs
backend/logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode
.idea

# Git
.git
.gitignore

# Documentation
*.md
docs/

# Test files
backend/tests
*.test.js

# Temporary files
tmp/
temp/

# Cache
.cache
.npm
`;

  const dockerIgnorePath = path.join(__dirname, '..', '..', '.dockerignore');
  fs.writeFileSync(dockerIgnorePath, dockerIgnoreContent);
  console.log(`📄 Created .dockerignore at: ${dockerIgnorePath}\n`);
}

/**
 * Creates docker-compose.yml for development
 */
function createDockerCompose() {
  const dockerComposeContent = `version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=\${MONGODB_URI}
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_EXPIRES_IN=24h
      - FRONTEND_URL=\${FRONTEND_URL}
      - EMAIL_USER=\${EMAIL_USER}
      - EMAIL_PASSWORD=\${EMAIL_PASSWORD}
      - API_RATE_LIMIT=100
      - HOSPITAL_API_KEY_PREFIX=HK_
      - HOSPITAL_API_SECRET_LENGTH=64
      - PAYMENT_TIMEOUT_MINUTES=10
      - PAYMENT_POLL_INTERVAL_SECONDS=5
      - PAYMENT_MAX_RETRIES=3
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "\${HEALTH_CHECK_URL:-http://localhost:3000/api/health}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Optional: MongoDB for local development
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=healthcare-platform
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
`;

  const dockerComposePath = path.join(__dirname, '..', '..', 'docker-compose.yml');
  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log(`📄 Created docker-compose.yml at: ${dockerComposePath}\n`);
}

/**
 * Creates .env.docker template
 */
function createDockerEnvTemplate() {
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  
  const dockerEnvContent = `# Docker Environment Variables
# Copy this to .env.docker and update with your values

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare-platform

# JWT Configuration
JWT_SECRET=${jwtSecret}

# CORS Configuration
FRONTEND_URL=http://localhost:4200

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Optional: Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
UPI_ID=your_upi_id@bank

# Optional: Kotak Configuration
KOTAK_CLIENT_ID=your_kotak_client_id
KOTAK_CLIENT_SECRET=your_kotak_client_secret
KOTAK_MERCHANT_VPA=yourname@kotak
KOTAK_MERCHANT_MOBILE=919876543210
`;

  const dockerEnvPath = path.join(__dirname, '..', '.env.docker.example');
  fs.writeFileSync(dockerEnvPath, dockerEnvContent);
  console.log(`📄 Created .env.docker.example at: ${dockerEnvPath}\n`);
}

/**
 * Builds Docker image
 */
function buildDockerImage(imageName = 'healthcare-platform-backend') {
  console.log(`🔨 Building Docker image: ${imageName}\n`);
  
  try {
    const buildCommand = `docker build -t ${imageName} .`;
    console.log(`Running: ${buildCommand}`);
    execSync(buildCommand, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
    
    console.log(`\n✅ Docker image built successfully: ${imageName}\n`);
    return true;
  } catch (error) {
    console.error('❌ Failed to build Docker image:', error.message);
    return false;
  }
}

/**
 * Runs Docker container
 */
function runDockerContainer(imageName = 'healthcare-platform-backend', containerName = 'healthcare-backend') {
  console.log(`🚀 Running Docker container: ${containerName}\n`);
  
  try {
    // Stop existing container if running
    try {
      execSync(`docker stop ${containerName}`, { stdio: 'pipe' });
      execSync(`docker rm ${containerName}`, { stdio: 'pipe' });
      console.log('Stopped existing container');
    } catch (error) {
      // Container doesn't exist, continue
    }
    
    // Run new container
    const runCommand = `docker run -d --name ${containerName} -p 3000:3000 --env-file backend/.env.docker ${imageName}`;
    console.log(`Running: ${runCommand}`);
    execSync(runCommand, { stdio: 'inherit', cwd: path.join(__dirname, '..', '..') });
    
    console.log(`\n✅ Container started successfully: ${containerName}`);
    console.log('🌐 Backend available at: http://localhost:3000');
    console.log('🔍 Health check: http://localhost:3000/api/health\n');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to run Docker container:', error.message);
    return false;
  }
}

/**
 * Shows Docker deployment instructions
 */
function showDeploymentInstructions() {
  console.log('🎯 Docker Deployment Instructions:');
  console.log('==================================\n');
  
  console.log('📋 Local Development:');
  console.log('1. Copy .env.docker.example to .env.docker');
  console.log('2. Update .env.docker with your values');
  console.log('3. Build: docker build -t healthcare-platform-backend .');
  console.log('4. Run: docker run -p 3000:3000 --env-file backend/.env.docker healthcare-platform-backend');
  console.log('5. Test: http://localhost:3000/api/health\n');
  
  console.log('🐳 Docker Compose (Recommended):');
  console.log('1. Copy .env.docker.example to .env.docker');
  console.log('2. Update .env.docker with your values');
  console.log('3. Run: docker-compose up -d');
  console.log('4. Test: http://localhost:3000/api/health');
  console.log('5. Stop: docker-compose down\n');
  
  console.log('☁️  Production Deployment:');
  console.log('1. Push image to registry: docker push your-registry/healthcare-platform-backend');
  console.log('2. Deploy to your cloud provider (AWS ECS, Google Cloud Run, etc.)');
  console.log('3. Set environment variables in your cloud platform');
  console.log('4. Configure load balancer and SSL certificate\n');
  
  console.log('🔧 Useful Commands:');
  console.log('- View logs: docker logs healthcare-backend');
  console.log('- Enter container: docker exec -it healthcare-backend sh');
  console.log('- Stop container: docker stop healthcare-backend');
  console.log('- Remove container: docker rm healthcare-backend');
  console.log('- List containers: docker ps -a\n');
}

/**
 * Main deployment function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';
  
  // Check Docker
  if (!checkDocker()) {
    console.log('❌ Docker not found or not running. Please install and start Docker:');
    console.log('   https://docs.docker.com/get-docker/\n');
    process.exit(1);
  }
  
  console.log('✅ Docker found and running\n');
  
  switch (command) {
    case 'setup':
      createDockerIgnore();
      createDockerCompose();
      createDockerEnvTemplate();
      showDeploymentInstructions();
      break;
      
    case 'build':
      const imageName = args[1] || 'healthcare-platform-backend';
      buildDockerImage(imageName);
      break;
      
    case 'run':
      const imageToRun = args[1] || 'healthcare-platform-backend';
      const containerName = args[2] || 'healthcare-backend';
      runDockerContainer(imageToRun, containerName);
      break;
      
    case 'deploy':
      createDockerIgnore();
      createDockerCompose();
      createDockerEnvTemplate();
      if (buildDockerImage()) {
        runDockerContainer();
      }
      break;
      
    default:
      console.log('❌ Unknown command. Available commands:');
      console.log('   setup  - Create Docker configuration files');
      console.log('   build  - Build Docker image');
      console.log('   run    - Run Docker container');
      console.log('   deploy - Full setup, build, and run\n');
      console.log('Usage: node scripts/deploy-docker.js [command] [options]');
      break;
  }
  
  console.log('🎉 Docker deployment setup complete!');
}

// Run the script
main();