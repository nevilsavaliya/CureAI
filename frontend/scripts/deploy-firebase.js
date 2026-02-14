#!/usr/bin/env node
/**
 * Healthcare Platform Frontend - Firebase Deployment Script
 * Automates the deployment process to Firebase Hosting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FirebaseDeployer {
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

    // Check if firebase.json exists
    if (!fs.existsSync(path.join(this.projectRoot, 'firebase.json'))) {
      throw new Error('firebase.json configuration file not found');
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

  updateFirebaseConfig(backendUrl) {
    this.log('Updating Firebase configuration...', 'info');

    const firebaseConfigPath = path.join(this.projectRoot, 'firebase.json');
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

    // Update API proxy destination
    config.hosting.rewrites = config.hosting.rewrites.map(rewrite => {
      if (rewrite.source === '/api/**') {
        rewrite.destination = `${backendUrl}/api/**`;
      }
      return rewrite;
    });

    fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
    this.log('Updated firebase.json with backend URL', 'success');
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

  checkFirebaseCLI() {
    try {
      execSync('firebase --version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  installFirebaseCLI() {
    this.log('Installing Firebase CLI...', 'info');
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    this.log('Firebase CLI installed successfully', 'success');
  }

  initializeFirebase(projectId) {
    this.log('Initializing Firebase project...', 'info');

    try {
      // Check if already logged in
      try {
        execSync('firebase projects:list', { stdio: 'ignore' });
      } catch (error) {
        this.log('Please login to Firebase first:', 'warning');
        execSync('firebase login', { stdio: 'inherit' });
      }

      // Initialize project if needed
      if (projectId) {
        execSync(`firebase use ${projectId}`, {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      } else {
        this.log('No project ID provided. Please run firebase init manually or provide --project-id', 'warning');
      }

    } catch (error) {
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  deployToFirebase() {
    this.log('Deploying to Firebase Hosting...', 'info');

    try {
      execSync('firebase deploy --only hosting', {
        cwd: this.projectRoot,
        stdio: 'inherit'
      });

      this.log('Deployment completed successfully!', 'success');
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  generateInstructions(backendUrl, projectId) {
    const instructions = `
🚀 Healthcare Platform Frontend - Firebase Deployment Complete!

📋 Deployment Summary:
- Platform: Firebase Hosting
- Backend URL: ${backendUrl}
- Project ID: ${projectId || 'Not specified'}
- Build Output: dist/healthcare-platform-frontend

🔧 Configuration Files Created:
- firebase.json (Firebase Hosting configuration)
- Updated environment.prod.ts

📝 Next Steps:
1. Visit Firebase Console to see your deployed site
2. Configure custom domain if needed
3. Set up preview channels for staging
4. Configure Firebase Functions if needed for backend

🧪 Testing Your Deployment:
1. Visit your Firebase Hosting URL
2. Test login/signup functionality
3. Verify API calls work correctly (proxied through Firebase)
4. Check hospital registration flow
5. Test admin dashboard access

🔗 Useful Commands:
- View hosting info: firebase hosting:sites:list
- Open site: firebase open hosting:site
- View logs: firebase functions:log (if using functions)
- Redeploy: npm run deploy:firebase

⚙️ Firebase Console:
Visit https://console.firebase.google.com/project/${projectId || 'your-project'}/hosting

📞 Support:
- Firebase Docs: https://firebase.google.com/docs/hosting
- Angular on Firebase: https://firebase.google.com/docs/hosting/frameworks/angular
- Project Issues: Check the project repository

✅ Your Healthcare Platform frontend is now live on Firebase Hosting!
`;

    console.log(instructions);

    // Save instructions to file
    fs.writeFileSync(
      path.join(this.projectRoot, 'FIREBASE_DEPLOYMENT.md'),
      instructions
    );
  }

  async deploy(options = {}) {
    try {
      const backendUrl = options.backendUrl || 'https://healthcare-platform-backend.onrender.com';
      const projectId = options.projectId;

      this.log('🚀 Starting Firebase deployment process...', 'info');

      // Step 1: Check prerequisites
      this.checkPrerequisites();

      // Step 2: Install Firebase CLI if needed
      if (!this.checkFirebaseCLI()) {
        this.installFirebaseCLI();
      }

      // Step 3: Update environment and config
      this.updateEnvironment(backendUrl);
      this.updateFirebaseConfig(backendUrl);

      // Step 4: Build application
      this.buildApplication();

      // Step 5: Initialize Firebase
      this.initializeFirebase(projectId);

      // Step 6: Deploy to Firebase
      this.deployToFirebase();

      // Step 7: Generate instructions
      this.generateInstructions(backendUrl, projectId);

      this.log('🎉 Firebase deployment completed successfully!', 'success');

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
  const projectId = args.find(arg => arg.startsWith('--project-id='))?.split('=')[1];

  const deployer = new FirebaseDeployer();
  deployer.deploy({ backendUrl, projectId });
}

module.exports = FirebaseDeployer;