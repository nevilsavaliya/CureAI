#!/usr/bin/env node

require('dotenv').config();
const alertService = require('../services/alertService');
const apiMonitoring = require('../services/apiMonitoring');

async function testAlertSystem() {
    try {
        console.log('🔍 Testing Alert System');
        console.log('======================');

        // Check alert configuration
        console.log('\n📋 Alert Configuration:');
        const config = alertService.getAlertConfig();
        console.log('- Monitoring enabled:', config.monitoringEnabled);
        console.log('- Email from:', config.emailConfig.from);
        console.log('- Email to:', config.emailConfig.to);
        console.log('- ALERTS_ENABLED:', process.env.ALERTS_ENABLED);

        // Check current metrics
        console.log('\n📊 Current Metrics:');
        const metrics = apiMonitoring.getRealTimeMetrics();
        console.log('- Total requests:', metrics.requests.total);
        console.log('- Error rate:', metrics.requests.errorRate + '%');
        console.log('- Average response time:', metrics.performance.averageResponseTime + 'ms');

        // Check alert stats
        console.log('\n📈 Alert Statistics:');
        const stats = alertService.getAlertStats();
        console.log('- Total alerts sent:', stats.totalAlerts);
        console.log('- Recent alerts:', stats.recentAlerts.length);

        if (stats.recentAlerts.length > 0) {
            console.log('\n🚨 Recent Alerts:');
            stats.recentAlerts.slice(0, 3).forEach((alert, index) => {
                console.log(`   ${index + 1}. ${alert.name} (${alert.severity}) - ${alert.message}`);
                console.log(`      Time: ${new Date(alert.timestamp).toLocaleString()}`);
            });
        }

        // Test email alert (if enabled)
        if (process.env.ALERTS_ENABLED !== 'false') {
            console.log('\n📧 Testing email alert...');
            try {
                await alertService.sendTestAlert();
                console.log('✅ Test alert sent successfully');
            } catch (error) {
                console.log('❌ Test alert failed:', error.message);
            }
        } else {
            console.log('\n📧 Alert system is disabled (ALERTS_ENABLED=false)');
        }

    } catch (error) {
        console.error('❌ Error testing alert system:', error);
    }
}

testAlertSystem();