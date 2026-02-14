#!/usr/bin/env node

/**
 * Log Monitoring CLI Tool
 * Provides command-line access to log analysis and monitoring
 */

const LogAnalyzer = require('../utils/logAnalyzer');
const logger = require('../services/logger');

const logAnalyzer = new LogAnalyzer();

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'report':
        await generateReport();
        break;
      case 'hospital-activity':
        await showHospitalActivity();
        break;
      case 'security-events':
        await showSecurityEvents();
        break;
      case 'api-performance':
        await showApiPerformance();
        break;
      case 'search':
        await searchLogs();
        break;
      case 'tail':
        await tailLogs();
        break;
      case 'files':
        await listLogFiles();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function generateReport() {
  const days = parseInt(args[1]) || 7;
  console.log(`📊 Generating log report for the last ${days} days...\n`);
  
  const report = await logAnalyzer.generateReport(days);
  
  console.log('🏥 HOSPITAL ACTIVITY');
  console.log('='.repeat(50));
  console.log(`Total Registrations: ${report.hospitalActivity.totalRegistrations}`);
  console.log(`Total Logins: ${report.hospitalActivity.totalLogins}`);
  console.log(`Total API Calls: ${report.hospitalActivity.totalApiCalls}`);
  console.log(`Unique Hospitals: ${report.hospitalActivity.uniqueHospitals}`);
  
  if (report.hospitalActivity.topHospitals.length > 0) {
    console.log('\nTop Hospitals by API Usage:');
    report.hospitalActivity.topHospitals.forEach((hospital, index) => {
      console.log(`  ${index + 1}. Hospital ${hospital.hospitalId}: ${hospital.apiCallCount} calls`);
    });
  }
  
  console.log('\n🔒 SECURITY EVENTS');
  console.log('='.repeat(50));
  console.log(`Total Security Events: ${report.securityEvents.totalEvents}`);
  console.log(`Invalid Credentials: ${report.securityEvents.invalidCredentials}`);
  console.log(`Rate Limit Exceeded: ${report.securityEvents.rateLimitExceeded}`);
  console.log(`Suspicious Activity: ${report.securityEvents.suspiciousActivity}`);
  console.log(`Unauthorized Access: ${report.securityEvents.unauthorizedAccess}`);
  
  if (report.securityEvents.topIPs.length > 0) {
    console.log('\nTop IPs by Security Events:');
    report.securityEvents.topIPs.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip.ip}: ${ip.eventCount} events`);
    });
  }
  
  console.log('\n⚡ API PERFORMANCE');
  console.log('='.repeat(50));
  console.log(`Total Requests: ${report.apiPerformance.totalRequests}`);
  console.log(`Average Response Time: ${report.apiPerformance.averageResponseTime}ms`);
  console.log(`Slow Requests (>1s): ${report.apiPerformance.slowRequests}`);
  console.log(`Error Rate: ${report.apiPerformance.errorRate}%`);
  
  if (report.apiPerformance.topEndpoints.length > 0) {
    console.log('\nTop Endpoints by Request Count:');
    report.apiPerformance.topEndpoints.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint.endpoint}: ${endpoint.requestCount} requests`);
    });
  }
  
  console.log('\n📁 LOG FILES');
  console.log('='.repeat(50));
  report.logFiles.forEach(file => {
    const sizeKB = Math.round(file.size / 1024);
    console.log(`${file.name}: ${sizeKB}KB (modified: ${file.modified.toLocaleString()})`);
  });
}

async function showHospitalActivity() {
  const days = parseInt(args[1]) || 7;
  console.log(`🏥 Hospital Activity (last ${days} days)\n`);
  
  const activity = await logAnalyzer.getHospitalActivitySummary(days);
  
  console.log(`Registrations: ${activity.totalRegistrations}`);
  console.log(`Logins: ${activity.totalLogins}`);
  console.log(`API Calls: ${activity.totalApiCalls}`);
  console.log(`Unique Hospitals: ${activity.uniqueHospitals}`);
  
  if (activity.topHospitals.length > 0) {
    console.log('\nTop Hospitals:');
    activity.topHospitals.forEach((hospital, index) => {
      console.log(`  ${index + 1}. ${hospital.hospitalId}: ${hospital.apiCallCount} calls`);
    });
  }
}

async function showSecurityEvents() {
  const days = parseInt(args[1]) || 7;
  console.log(`🔒 Security Events (last ${days} days)\n`);
  
  const events = await logAnalyzer.getSecurityEventsSummary(days);
  
  console.log(`Total Events: ${events.totalEvents}`);
  console.log(`Invalid Credentials: ${events.invalidCredentials}`);
  console.log(`Rate Limit Exceeded: ${events.rateLimitExceeded}`);
  console.log(`Suspicious Activity: ${events.suspiciousActivity}`);
  console.log(`Unauthorized Access: ${events.unauthorizedAccess}`);
  
  if (events.topIPs.length > 0) {
    console.log('\nTop IPs:');
    events.topIPs.forEach((ip, index) => {
      console.log(`  ${index + 1}. ${ip.ip}: ${ip.eventCount} events`);
    });
  }
}

async function showApiPerformance() {
  const days = parseInt(args[1]) || 7;
  console.log(`⚡ API Performance (last ${days} days)\n`);
  
  const performance = await logAnalyzer.getApiPerformanceMetrics(days);
  
  console.log(`Total Requests: ${performance.totalRequests}`);
  console.log(`Average Response Time: ${performance.averageResponseTime}ms`);
  console.log(`Slow Requests: ${performance.slowRequests}`);
  console.log(`Error Rate: ${performance.errorRate}%`);
  
  if (performance.topEndpoints.length > 0) {
    console.log('\nTop Endpoints:');
    performance.topEndpoints.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint.endpoint}: ${endpoint.requestCount} requests`);
    });
  }
}

async function searchLogs() {
  const pattern = args[1];
  const logType = args[2] || 'all';
  const limit = parseInt(args[3]) || 50;
  
  if (!pattern) {
    console.error('❌ Search pattern is required');
    console.log('Usage: npm run log-monitor search <pattern> [logType] [limit]');
    return;
  }
  
  console.log(`🔍 Searching logs for: "${pattern}" (type: ${logType}, limit: ${limit})\n`);
  
  const results = await logAnalyzer.searchLogs(pattern, logType, limit);
  
  if (results.length === 0) {
    console.log('No results found.');
    return;
  }
  
  console.log(`Found ${results.length} results:\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. [${result.logFile}] ${result.timestamp}`);
    console.log(`   Type: ${result.type || 'N/A'}`);
    console.log(`   Level: ${result.level || 'N/A'}`);
    console.log(`   Message: ${result.message || JSON.stringify(result).substring(0, 100)}...`);
    console.log('');
  });
}

async function tailLogs() {
  const logType = args[1] || 'application';
  const lines = parseInt(args[2]) || 20;
  
  console.log(`📄 Showing last ${lines} lines from ${logType} logs\n`);
  
  const logFiles = logAnalyzer.getLogFiles();
  const targetFile = logFiles.find(file => file.name.includes(logType));
  
  if (!targetFile) {
    console.error(`❌ No log file found for type: ${logType}`);
    console.log('Available log types:', logFiles.map(f => f.name.split('-')[0]).join(', '));
    return;
  }
  
  const entries = await logAnalyzer.parseLogFile(targetFile.path, lines);
  
  entries.forEach(entry => {
    const timestamp = entry.timestamp || new Date(entry.time || Date.now()).toISOString();
    const level = entry.level || 'INFO';
    const message = entry.message || JSON.stringify(entry);
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  });
}

async function listLogFiles() {
  console.log('📁 Available Log Files\n');
  
  const files = logAnalyzer.getLogFiles();
  
  if (files.length === 0) {
    console.log('No log files found.');
    return;
  }
  
  files.forEach(file => {
    const sizeKB = Math.round(file.size / 1024);
    const modified = file.modified.toLocaleString();
    console.log(`${file.name}`);
    console.log(`  Size: ${sizeKB}KB`);
    console.log(`  Modified: ${modified}`);
    console.log('');
  });
}

function showHelp() {
  console.log('🔍 Log Monitor CLI Tool\n');
  console.log('Available commands:');
  console.log('');
  console.log('  report [days]                 - Generate comprehensive log report');
  console.log('  hospital-activity [days]      - Show hospital activity summary');
  console.log('  security-events [days]        - Show security events summary');
  console.log('  api-performance [days]        - Show API performance metrics');
  console.log('  search <pattern> [type] [limit] - Search logs for pattern');
  console.log('  tail [logType] [lines]        - Show recent log entries');
  console.log('  files                         - List all log files');
  console.log('  help                          - Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run log-monitor report 30');
  console.log('  npm run log-monitor search "hospital registration"');
  console.log('  npm run log-monitor tail security 50');
  console.log('  npm run log-monitor hospital-activity 7');
}

// Run the CLI
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});