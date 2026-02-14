#!/usr/bin/env node
/**
 * Healthcare Platform Frontend - Netlify Deployment Script
 * Automates the deployment process to Netlify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NetlifyDeployer {
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

    // Check if netlify.toml exists
    if (!fs.existsSync(path.join(this.projectRoot, 'netlify.toml'))) {
      throw new Error('netlify.toml configuration file not found');
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

  buildApplication() {
    this.log('Building Angular application for production...', 'info');

    try {
      execSync('npm run build --configuration=production', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });
      this.log('Build completed successfully', 'success');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  checkNetlifyCLI() {
    try {
      execSync('netlify --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  installNetlifyCLI() {
    this.log('Installing Netlify CLI...', 'info');
    execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    this.log('Netlify CLI installed successfully', 'success');
  }

  deployToNetlify(siteName) {
    this.log('Deploying to Netlify...', 'info');

    try {
      // Check if already logged in
      try {
        execSync('netlify status', { stdio: 'ignore' });
      } catch (error) {
        this.log('Please login to Netlify first:', 'warning');
        execSync('netlify login', { stdio: 'inherit' });
      }

      // Deploy
      const deployCommand = siteName 
        ? `netlify deploy --prod --site ${siteName}`
        : 'netlify deploy --prod';

      execSync(deployCommand, {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      this.log('Deployment completed successfully!', 'success');
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  generateInstructions(backendUrl, siteName) {
    const instructions = `
🚀 Healthcare Platform Frontend - Netlify Deployment Complete!

📋 Deployment Summary:
- Platform: Netlify
- Backend URL: ${backendUrl}
- Site Name: ${siteName || 'Auto-generated'}
- Build Output: dist/healthcare-platform-frontend

🔧 Configuration Files Created:
- netlify.toml (Netlify configuration)
- Updated environment.prod.ts

📝 Next Steps:
1. Visit your Netlify dashboard to see the deployed site
2. Configure custom domain if needed
3. Set up branch deployments for staging
4. Configure environment variables in Netlify dashboard if needed

🧪 Testing Your Deployment:
1. Visit your site URL
2. Test login/signup functionality
3. Verify API calls work correctly
4. Check hospital registration flow
5. Test admin dashboard access

🔗 Useful Commands:
- View site: netlify open
- Check status: netlify status  
- View logs: netlify logs
- Redeploy: npm run deploy:netlify

📞 Support:
- Netlify Docs: https://docs.netlify.com/
- Angular Deployment: https://angular.io/guide/deployment
- Project Issues: Check the project repository

✅ Your Healthcare Platform frontend is now live on Netlify!
`;

    console.log(instructions);

    // Save instructions to file
    fs.writeFileSync(
      path.join(this.projectRoot, 'NETLIFY_DEPLOYMENT.md'),
      instructions
    );
  }

  async deploy(options = {}) {
    try {
      const backendUrl = options.backendUrl || 'https://healthcare-platform-backend.onrender.com';
      const siteName = options.siteName;

      this.log('🚀 Starting Netlify deployment process...', 'info');

      // Step 1: Check prerequisites
      this.checkPrerequisites();

      // Step 2: Install Netlify CLI if needed
      if (!this.checkNetlifyCLI()) {
        this.installNetlifyCLI();
      }

      // Step 3: Update environment
      this.updateEnvironment(backendUrl);

      // Step 4: Build application
      this.buildApplication();

      // Step 5: Deploy to Netlify
      this.deployToNetlify(siteName);

      // Step 6: Generate instructions
      this.generateInstructions(backendUrl, siteName);

      this.log('🎉 Netlify deployment completed successfully!', 'success');

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
  const siteName = args.find(arg => arg.startsWith('--site-name='))?.split('=')[1];

  const deployer = new NetlifyDeployer();
  deployer.deploy({ backendUrl, siteName });
}

module.exports = NetlifyDeployer;