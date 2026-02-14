#!/usr/bin/env node
/**
 * Healthcare Platform Frontend - Docker Deployment Script
 * Automates the Docker containerization and deployment process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DockerDeployer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.packageJson = require(path.join(this.projectRoot, 'package.json'));
    this.imageName = 'healthcare-platform-frontend';
    this.imageTag = 'latest';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const icon = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
  }

  checkPrerequisites() {
    this.log('Checking Docker prerequisites...', 'info');

    // Check if Docker is installed
    try {
      execSync('docker --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Docker is not installed. Please install Docker first.');
    }

    // Check if Docker is running
    try {
      execSync('docker info', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Docker is not running. Please start Docker first.');
    }

    // Check if Dockerfile exists
    if (!fs.existsSync(path.join(this.projectRoot, 'Dockerfile'))) {
      throw new Error('Dockerfile not found');
    }

    this.log('Docker prerequisites check passed', 'success');
  }

  updateEnvironment(backendUrl) {
    this.log('Updating production environment configuration...', 'info');

    const envProdPath = path.join(this.projectRoot, 'src/environments/environment.prod.ts');
    
    const envContent = `export const environment = {
  production: true,
  apiUrl: '${backendUrl}/api'
};
`;

    fs.writeFileSync(envProdPath, envContent);
    this.log(`Updated environment.prod.ts with backend URL: ${backendUrl}`, 'success');
  }

  buildDockerImage(tag) {
    this.log('Building Docker image...', 'info');

    const fullTag = `${this.imageName}:${tag || this.imageTag}`;

    try {
      execSync(`docker build -t ${fullTag} .`, {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      this.log(`Docker image built successfully: ${fullTag}`, 'success');
      return fullTag;
    } catch (error) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  runContainer(imageTag, options = {}) {
    this.log('Running Docker container...', 'info');

    const {
      port = 8080,
      backendUrl = 'https://healthcare-platform-backend.onrender.com',
      detached = true,
      name = 'healthcare-frontend'
    } = options;

    try {
      const runCommand = [
        'docker run',
        detached ? '-d' : '',
        `--name ${name}`,
        `-p ${port}:80`,
        `-e BACKEND_URL=${backendUrl}`,
        '--restart unless-stopped',
        imageTag
      ].filter(Boolean).join(' ');

      execSync(runCommand, { stdio: 'inherit' });
      
      this.log(`Container started successfully on port ${port}`, 'success');
      this.log(`Access your application at: http://localhost:${port}`, 'info');
      
      return { name, port, backendUrl };
    } catch (error) {
      throw new Error(`Container run failed: ${error.message}`);
    }
  }

  stopContainer(name) {
    this.log(`Stopping container: ${name}...`, 'info');

    try {
      execSync(`docker stop ${name}`, { stdio: 'inherit' });
      execSync(`docker rm ${name}`, { stdio: 'inherit' });
      this.log('Container stopped and removed', 'success');
    } catch (error) {
      this.log(`Failed to stop container: ${error.message}`, 'warning');
    }
  }

  createDockerCompose(backendUrl, port = 8080) {
    this.log('Creating docker-compose.yml...', 'info');

    const dockerCompose = `version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "${port}:80"
    environment:
      - BACKEND_URL=${backendUrl}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  default:
    name: healthcare-platform
`;

    fs.writeFileSync(path.join(this.projectRoot, 'docker-compose.yml'), dockerCompose);
    this.log('docker-compose.yml created', 'success');
  }

  generateInstructions(imageTag, containerInfo, backendUrl) {
    const instructions = `
🚀 Healthcare Platform Frontend - Docker Deployment Complete!

📋 Deployment Summary:
- Platform: Docker
- Image: ${imageTag}
- Container: ${containerInfo.name}
- Port: ${containerInfo.port}
- Backend URL: ${backendUrl}

🔧 Configuration Files Created:
- Dockerfile (Multi-stage build configuration)
- nginx.conf (Nginx web server configuration)
- docker-entrypoint.sh (Container startup script)
- docker-compose.yml (Docker Compose configuration)

🐳 Docker Commands:
# Build image
docker build -t ${this.imageName}:${this.imageTag} .

# Run container
docker run -d --name healthcare-frontend -p ${containerInfo.port}:80 \\
  -e BACKEND_URL=${backendUrl} \\
  --restart unless-stopped \\
  ${imageTag}

# Using Docker Compose
docker-compose up -d

# View logs
docker logs healthcare-frontend

# Stop container
docker stop healthcare-frontend
docker rm healthcare-frontend

# Stop with Docker Compose
docker-compose down

🌐 Access Your Application:
- Frontend: http://localhost:${containerInfo.port}
- Health Check: http://localhost:${containerInfo.port}/health

🧪 Testing Your Deployment:
1. Visit http://localhost:${containerInfo.port}
2. Test login/signup functionality
3. Verify API calls work correctly (proxied to backend)
4. Check hospital registration flow
5. Test admin dashboard access

⚙️ Environment Variables:
- BACKEND_URL: ${backendUrl}
- NODE_ENV: production

🔧 Container Management:
# View running containers
docker ps

# View all containers
docker ps -a

# View container logs
docker logs -f healthcare-frontend

# Execute commands in container
docker exec -it healthcare-frontend sh

# Restart container
docker restart healthcare-frontend

📊 Health Monitoring:
The container includes health checks that monitor:
- Nginx web server status
- Application availability
- Response time

🚀 Production Deployment:
For production deployment, consider:
1. Using a reverse proxy (nginx, traefik)
2. Setting up SSL certificates
3. Configuring log aggregation
4. Setting up monitoring and alerts
5. Using container orchestration (Docker Swarm, Kubernetes)

📞 Support:
- Docker Docs: https://docs.docker.com/
- Nginx Docs: https://nginx.org/en/docs/
- Project Issues: Check the project repository

✅ Your Healthcare Platform frontend is now running in Docker!
`;

    console.log(instructions);

    // Save instructions to file
    fs.writeFileSync(
      path.join(this.projectRoot, 'DOCKER_DEPLOYMENT.md'),
      instructions
    );
  }

  async deploy(options = {}) {
    try {
      const {
        backendUrl = 'https://healthcare-platform-backend.onrender.com',
        port = 8080,
        tag = this.imageTag,
        action = 'build'
      } = options;

      this.log('🚀 Starting Docker deployment process...', 'info');

      // Step 1: Check prerequisites
      this.checkPrerequisites();

      // Step 2: Update environment
      this.updateEnvironment(backendUrl);

      if (action === 'build' || action === 'deploy') {
        // Step 3: Build Docker image
        const imageTag = this.buildDockerImage(tag);

        if (action === 'deploy') {
          // Step 4: Stop existing container if running
          try {
            this.stopContainer('healthcare-frontend');
          } catch (error) {
            // Container might not exist, continue
          }

          // Step 5: Run new container
          const containerInfo = this.runContainer(imageTag, { port, backendUrl });

          // Step 6: Create docker-compose file
          this.createDockerCompose(backendUrl, port);

          // Step 7: Generate instructions
          this.generateInstructions(imageTag, containerInfo, backendUrl);
        }
      } else if (action === 'stop') {
        this.stopContainer('healthcare-frontend');
      }

      this.log('🎉 Docker deployment completed successfully!', 'success');

    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const backendUrl = args.find(arg => arg.startsWith('--backend-url='))?.split('=')[1];
  const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1];
  const tag = args.find(arg => arg.startsWith('--tag='))?.split('=')[1];
  const action = args[0] || 'build'; // build, deploy, stop

  const deployer = new DockerDeployer();
  deployer.deploy({ backendUrl, port: port ? parseInt(port) : undefined, tag, action });
}

module.exports = DockerDeployer;