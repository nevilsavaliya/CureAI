#!/usr/bin/env node
/**
 * Healthcare Platform Frontend - Vercel Deployment Script
 * Automates the deployment process to Vercel
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VercelDeployer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.packageJson = require(path.join(this.projectRoot, 'package.json'));
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
    this.log('Checking deployment prerequisites...', 'info');

    // Check if package.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      throw new Error('package.json not found');
    }

    // Check if Angular CLI is available
    try {
      execSync('ng version', { stdio: 'ignore' });
    } catch (error) {
      this.log('Angular CLI not found globally. Installing...', 'warning');
      execSync('npm install -g @angular/cli', { stdio: 'inherit' });
    }

    // Check if vercel.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'vercel.json'))) {
      throw new Error('vercel.json configuration file not found');
    }

    this.log('Prerequisites check passed', 'success');
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

  updateVercelConfig(backendUrl) {
    this.log('Updating Vercel configuration...', 'info');

    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));

    // Update API proxy destination
    config.routes = config.routes.map(route => {
      if (route.src === '/api/(.*)') {
        route.dest = `${backendUrl}/api/$1`;
      }
      return route;
    });

    fs.writeFileSync(vercelConfigPath, JSON.stringify(config, null, 2));
    this.log('Updated vercel.json with backend URL', 'success');
  }

  checkVercelCLI() {
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  installVercelCLI() {
    this.log('Installing Vercel CLI...', 'info');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    this.log('Vercel CLI installed successfully', 'success');
  }

  deployToVercel(projectName) {
    this.log('Deploying to Vercel...', 'info');

    try {
      // Check if already logged in
      try {
        execSync('vercel whoami', { stdio: 'ignore' });
      } catch (error) {
        this.log('Please login to Vercel first:', 'warning');
        execSync('vercel login', { stdio: 'inherit' });
      }

      // Deploy
      const deployCommand = projectName 
        ? `vercel --prod --name ${projectName}`
        : 'vercel --prod';

      execSync(deployCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      this.log('Deployment completed successfully!', 'success');
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  generateInstructions(backendUrl, projectName) {
    const instructions = `
🚀 Healthcare Platform Frontend - Vercel Deployment Complete!

📋 Deployment Summary:
- Platform: Vercel
- Backend URL: ${backendUrl}
- Project Name: ${projectName || 'Auto-generated'}
- Framework: Angular
- Build Output: dist/healthcare-platform-frontend

🔧 Configuration Files Created:
- vercel.json (Vercel configuration)
- Updated environment.prod.ts

📝 Next Steps:
1. Visit your Vercel dashboard to see the deployed site
2. Configure custom domain if needed
3. Set up preview deployments for pull requests
4. Configure environment variables in Vercel dashboard if needed

🧪 Testing Your Deployment:
1. Visit your site URL (shown in deployment output)
2. Test login/signup functionality
3. Verify API calls work correctly (proxied through Vercel)
4. Check hospital registration flow
5. Test admin dashboard access

🔗 Useful Commands:
- View deployments: vercel ls
- Check project info: vercel inspect
- View logs: vercel logs
- Redeploy: npm run deploy:vercel

⚙️ Environment Variables (if needed):
Set these in Vercel dashboard if you need custom configuration:
- NODE_ENV=production
- BACKEND_URL=${backendUrl}

📞 Support:
- Vercel Docs: https://vercel.com/docs
- Angular on Vercel: https://vercel.com/guides/deploying-angular-with-vercel
- Project Issues: Check the project repository

✅ Your Healthcare Platform frontend is now live on Vercel!
`;

    console.log(instructions);

    // Save instructions to file
    fs.writeFileSync(
      path.join(this.projectRoot, 'VERCEL_DEPLOYMENT.md'),
      instructions
    );
  }

  async deploy(options = {}) {
    try {
      const backendUrl = options.backendUrl || 'https://healthcare-platform-backend.onrender.com';
      const projectName = options.projectName;

      this.log('🚀 Starting Vercel deployment process...', 'info');

      // Step 1: Check prerequisites
      this.checkPrerequisites();

      // Step 2: Install Vercel CLI if needed
      if (!this.checkVercelCLI()) {
        this.installVercelCLI();
      }

      // Step 3: Update environment and config
      this.updateEnvironment(backendUrl);
      this.updateVercelConfig(backendUrl);

      // Step 4: Deploy to Vercel (Vercel handles the build)
      this.deployToVercel(projectName);

      // Step 5: Generate instructions
      this.generateInstructions(backendUrl, projectName);

      this.log('🎉 Vercel deployment completed successfully!', 'success');

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
  const projectName = args.find(arg => arg.startsWith('--project-name='))?.split('=')[1];

  const deployer = new VercelDeployer();
  deployer.deploy({ backendUrl, projectName });
}

module.exports = VercelDeployer;