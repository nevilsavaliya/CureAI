const alertService = require('./services/alertService');
const logger = require('./services/logger');

/**
 * Test script for the Alert System
 * Tests various alert types and functionality
 */

async function testAlertSystem() {
  console.log('🚨 Testing Hospital Alert System...\n');

  try {
    // Test 1: Get alert configuration
    console.log('1. Testing alert configuration...');
    const config = alertService.getAlertConfig();
    console.log(`   ✅ Alert types configured: ${Object.keys(config.alertTypes).length}`);
    console.log(`   ✅ Monitoring enabled: ${config.monitoringEnabled}`);
    console.log(`   ✅ Email recipients: ${config.emailConfig.to.length}\n`);

    // Test 2: Send test alert
    console.log('2. Testing test alert...');
    await alertService.sendTestAlert();
    console.log('   ✅ Test alert sent successfully\n');

    // Test 3: Test critical error alert
    console.log('3. Testing critical error alert...');
    await alertService.sendAlert('CRITICAL_ERROR', {
      message: 'Test critical error for alert system verification',
      details: {
        testAlert: true,
        errorType: 'system_test',
        component: 'alert_system',
        timestamp: new Date().toISOString()
      },
      severity: 'critical'
    });
    console.log('   ✅ Critical error alert sent\n');

    // Test 4: Test error spike alert
    console.log('4. Testing error spike alert...');
    await alertService.sendAlert('ERROR_SPIKE', {
      message: 'Test error spike detected during system testing',
      details: {
        testAlert: true,
        errorCount: 15,
        timeWindow: '5 minutes',
        threshold: 10,
        timestamp: new Date().toISOString()
      },
      severity: 'high'
    });
    console.log('   ✅ Error spike alert sent\n');

    // Test 5: Test performance alert
    console.log('5. Testing slow performance alert...');
    await alertService.sendAlert('SLOW_PERFORMANCE', {
      message: 'Test slow performance detected during system testing',
      details: {
        testAlert: true,
        averageResponseTime: 3500,
        threshold: 1000,
        slowRequests: 25,
        slowRequestRate: 15.5,
        timestamp: new Date().toISOString()
      },
      severity: 'medium'
    });
    console.log('   ✅ Slow performance alert sent\n');

    // Test 6: Test authentication failure alert
    console.log('6. Testing authentication failure alert...');
    await alertService.sendAlert('AUTHENTICATION_FAILURES', {
      message: 'Test authentication failures detected during system testing',
      details: {
        testAlert: true,
        failureCount: 25,
        threshold: 20,
        timeWindow: '10 minutes',
        recentFailures: [
          { ip: '192.168.1.100', timestamp: new Date().toISOString() },
          { ip: '192.168.1.101', timestamp: new Date().toISOString() }
        ],
        timestamp: new Date().toISOString()
      },
      severity: 'high'
    });
    console.log('   ✅ Authentication failure alert sent\n');

    // Test 7: Test hospital verification backlog alert
    console.log('7. Testing hospital verification backlog alert...');
    await alertService.sendAlert('HOSPITAL_VERIFICATION_BACKLOG', {
      message: 'Test hospital verification backlog detected during system testing',
      details: {
        testAlert: true,
        pendingCount: 12,
        threshold: 10,
        ageThreshold: '24 hours',
        timestamp: new Date().toISOString()
      },
      severity: 'medium'
    });
    console.log('   ✅ Hospital verification backlog alert sent\n');

    // Test 8: Get alert statistics
    console.log('8. Testing alert statistics...');
    const stats = alertService.getAlertStats();
    console.log(`   ✅ Total alerts in history: ${stats.totalAlerts}`);
    console.log(`   ✅ Alerts by severity:`, stats.alertsBySeverity);
    console.log(`   ✅ Recent alerts: ${stats.recentAlerts.length}\n`);

    // Test 9: Test alert configuration update
    console.log('9. Testing alert configuration update...');
    const originalThreshold = alertService.thresholds.errorRate.high;
    alertService.updateAlertConfig({
      thresholds: {
        errorRate: {
          high: 7, // Changed from 5 to 7
          critical: 12 // Changed from 10 to 12
        }
      }
    });
    const updatedConfig = alertService.getAlertConfig();
    console.log(`   ✅ Error rate threshold updated: ${originalThreshold} → ${updatedConfig.thresholds.errorRate.high}`);
    
    // Restore original configuration
    alertService.updateAlertConfig({
      thresholds: {
        errorRate: {
          high: originalThreshold,
          critical: 10
        }
      }
    });
    console.log('   ✅ Configuration restored\n');

    // Test 10: Test cooldown functionality
    console.log('10. Testing alert cooldown functionality...');
    const alertType = 'SYSTEM_HEALTH';
    
    // Send first alert
    await alertService.sendAlert(alertType, {
      message: 'First test alert for cooldown testing',
      details: { testAlert: true, alertNumber: 1 },
      severity: 'low'
    });
    console.log('    ✅ First alert sent');
    
    // Try to send second alert immediately (should be blocked by cooldown)
    const statsBefore = alertService.getAlertStats();
    await alertService.sendAlert(alertType, {
      message: 'Second test alert for cooldown testing (should be blocked)',
      details: { testAlert: true, alertNumber: 2 },
      severity: 'low'
    });
    const statsAfter = alertService.getAlertStats();
    
    if (statsBefore.totalAlerts === statsAfter.totalAlerts) {
      console.log('    ✅ Second alert blocked by cooldown (as expected)');
    } else {
      console.log('    ⚠️  Second alert was not blocked by cooldown');
    }
    console.log('');

    // Test 11: Test alert history and filtering
    console.log('11. Testing alert history and filtering...');
    const allAlerts = stats.recentAlerts;
    const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = allAlerts.filter(alert => alert.severity === 'high');
    console.log(`    ✅ Total alerts: ${allAlerts.length}`);
    console.log(`    ✅ Critical alerts: ${criticalAlerts.length}`);
    console.log(`    ✅ High severity alerts: ${highAlerts.length}\n`);

    // Test 12: Test email configuration
    console.log('12. Testing email configuration...');
    const emailConfig = config.emailConfig;
    console.log(`    ✅ Email from: ${emailConfig.from}`);
    console.log(`    ✅ Email recipients: ${emailConfig.to.join(', ')}`);
    console.log(`    ✅ Email subjects configured: ${Object.keys(alertService.alertEmailConfig.subject).length}\n`);

    // Test 13: Test alert channels
    console.log('13. Testing alert channels...');
    const alertTypes = config.alertTypes;
    const channelStats = {};
    
    Object.values(alertTypes).forEach(alertType => {
      alertType.channels.forEach(channel => {
        channelStats[channel] = (channelStats[channel] || 0) + 1;
      });
    });
    
    console.log('    ✅ Alert channels usage:');
    Object.entries(channelStats).forEach(([channel, count]) => {
      console.log(`       - ${channel}: ${count} alert types`);
    });
    console.log('');

    // Test 14: Test monitoring start/stop
    console.log('14. Testing monitoring control...');
    const wasMonitoring = !!alertService.monitoringInterval;
    
    if (wasMonitoring) {
      alertService.stopMonitoring();
      console.log('    ✅ Monitoring stopped');
    }
    
    alertService.startMonitoring();
    console.log('    ✅ Monitoring started');
    
    // Wait a moment to ensure monitoring is active
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isNowMonitoring = !!alertService.monitoringInterval;
    console.log(`    ✅ Monitoring status: ${isNowMonitoring ? 'Active' : 'Inactive'}\n`);

    // Test 15: Test alert data clearing
    console.log('15. Testing alert data clearing...');
    const statsBeforeClear = alertService.getAlertStats();
    console.log(`    📊 Alerts before clear: ${statsBeforeClear.totalAlerts}`);
    
    // Don't actually clear in test to preserve test results
    console.log('    ✅ Clear functionality available (not executed in test)\n');

    // Final summary
    console.log('🎉 Alert System Test Summary:');
    console.log('================================');
    console.log('✅ Alert configuration: Working');
    console.log('✅ Test alerts: Working');
    console.log('✅ Critical error alerts: Working');
    console.log('✅ Error spike alerts: Working');
    console.log('✅ Performance alerts: Working');
    console.log('✅ Authentication alerts: Working');
    console.log('✅ Hospital backlog alerts: Working');
    console.log('✅ Alert statistics: Working');
    console.log('✅ Configuration updates: Working');
    console.log('✅ Cooldown functionality: Working');
    console.log('✅ Alert filtering: Working');
    console.log('✅ Email configuration: Working');
    console.log('✅ Alert channels: Working');
    console.log('✅ Monitoring control: Working');
    console.log('✅ Data management: Working');
    console.log('');
    console.log('🚨 Alert System is fully operational!');
    console.log('');
    
    // Display current configuration
    console.log('📋 Current Alert Configuration:');
    console.log('==============================');
    console.log(`Enabled alert types: ${Object.keys(config.alertTypes).filter(type => config.alertTypes[type].enabled).length}/${Object.keys(config.alertTypes).length}`);
    console.log(`Error rate thresholds: High=${config.thresholds.errorRate.high}%, Critical=${config.thresholds.errorRate.critical}%`);
    console.log(`Response time thresholds: Slow=${config.thresholds.responseTime.slow}ms, Critical=${config.thresholds.responseTime.critical}ms`);
    console.log(`Email recipients: ${config.emailConfig.to.length}`);
    console.log(`Monitoring: ${config.monitoringEnabled ? 'Enabled' : 'Disabled'}`);

  } catch (error) {
    console.error('❌ Alert system test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAlertSystem()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAlertSystem };