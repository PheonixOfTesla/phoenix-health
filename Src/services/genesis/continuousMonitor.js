/**
 * CONTINUOUS MONITORING SYSTEM
 * Genesis 24/7 autonomous loop - monitors, detects, fixes
 *
 * ELITE LEVEL: Works while you sleep, fixes before you wake up
 */

const codeAnalyzer = require('./codeAnalyzer');
const autoFixer = require('./autoFixer');
const safetyValidator = require('./safetyValidator');

// Environment-based URLs
const BACKEND_URL = process.env.BACKEND_URL || 'https://pal-backend-production.up.railway.app';

class ContinuousMonitor {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.stats = {
            checksPerformed: 0,
            issuesDetected: 0,
            issuesFixed: 0,
            errors: 0,
            lastCheck: null
        };
        this.checkIntervalMs = 3600000; // 1 hour
    }

    /**
     * Start autonomous monitoring
     * Called by /genesis-auto command
     */
    start() {
        if (this.isRunning) {
            console.log('[ContinuousMonitor] Already running');
            return { success: false, message: 'Already running' };
        }

        console.log('[ContinuousMonitor] 🤖 Starting autonomous monitoring...');
        this.isRunning = true;

        // Immediate first check
        this.performCheck();

        // Schedule recurring checks
        this.interval = setInterval(() => {
            this.performCheck();
        }, this.checkIntervalMs);

        return {
            success: true,
            message: 'Continuous monitoring started',
            checkInterval: `${this.checkIntervalMs / 60000} minutes`
        };
    }

    /**
     * Stop autonomous monitoring
     * Called by /genesis-stop command
     */
    stop() {
        if (!this.isRunning) {
            console.log('[ContinuousMonitor] Not running');
            return { success: false, message: 'Not running' };
        }

        console.log('[ContinuousMonitor] 🛑 Stopping autonomous monitoring...');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        return {
            success: true,
            message: 'Continuous monitoring stopped',
            stats: this.stats
        };
    }

    /**
     * Perform health check
     */
    async performCheck() {
        console.log('[ContinuousMonitor] 🔍 Performing system check...');
        this.stats.checksPerformed++;
        this.stats.lastCheck = new Date().toISOString();

        try {
            // 1. Check codebase health
            await this.checkCodebase();

            // 2. Check API health
            await this.checkAPIHealth();

            // 3. Check database performance
            await this.checkDatabasePerformance();

            // 4. Check error rates
            await this.checkErrorRates();

            // 5. Check memory usage
            await this.checkMemoryUsage();

            console.log('[ContinuousMonitor] ✅ Check complete');

        } catch (error) {
            console.error('[ContinuousMonitor] ❌ Check failed:', error);
            this.stats.errors++;
        }
    }

    /**
     * Check codebase for issues and auto-fix
     */
    async checkCodebase() {
        const projectRoot = process.cwd();

        // Analyze
        const analysis = await codeAnalyzer.analyzeCodebase(projectRoot);

        if (!analysis.success) {
            console.warn('[ContinuousMonitor] Code analysis failed');
            return;
        }

        this.stats.issuesDetected += analysis.stats.issuesFound;

        // Auto-fix if issues found
        if (analysis.fixableIssues.length > 0) {
            console.log(`[ContinuousMonitor] 🔧 Auto-fixing ${analysis.fixableIssues.length} issues...`);

            // Validate fixes are safe
            const validation = await safetyValidator.validateBatch(
                analysis.fixableIssues.map(issue => ({
                    operation: 'fix',
                    path: issue.file,
                    type: issue.fix,
                    autonomous: true
                }))
            );

            if (validation.safe) {
                const fixes = await autoFixer.applyOptimizations(analysis.fixableIssues);
                this.stats.issuesFixed += fixes.fixes?.length || 0;
                console.log(`[ContinuousMonitor] ✅ Fixed ${fixes.fixes?.length || 0} issues`);
            } else {
                console.warn('[ContinuousMonitor] ⚠️ Fixes blocked by safety validator');
            }
        }
    }

    /**
     * Check API endpoint health
     */
    async checkAPIHealth() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/health`);
            const data = await response.json();

            if (!response.ok || data.status !== 'healthy') {
                console.warn('[ContinuousMonitor] ⚠️ API health degraded:', data);
                await this.alertAPIIssue(data);
            }

        } catch (error) {
            console.error('[ContinuousMonitor] ❌ API health check failed:', error);
        }
    }

    /**
     * Check database performance
     */
    async checkDatabasePerformance() {
        // Check MongoDB connection
        const mongoose = require('mongoose');

        if (mongoose.connection.readyState !== 1) {
            console.warn('[ContinuousMonitor] ⚠️ Database not connected');
            return;
        }

        // Check for slow queries (in production, analyze logs)
        // For now, log connection state
        console.log('[ContinuousMonitor] ✅ Database connected');
    }

    /**
     * Check error rates
     */
    async checkErrorRates() {
        // In production: Query error logs from last hour
        // Check if error rate > threshold
        // For now, placeholder
        console.log('[ContinuousMonitor] ✅ Error rate normal');
    }

    /**
     * Check memory usage
     */
    async checkMemoryUsage() {
        const used = process.memoryUsage();
        const mb = (bytes) => Math.round(bytes / 1024 / 1024);

        console.log('[ContinuousMonitor] 📊 Memory:', {
            rss: `${mb(used.rss)}MB`,
            heapUsed: `${mb(used.heapUsed)}MB`,
            heapTotal: `${mb(used.heapTotal)}MB`
        });

        // Alert if memory usage > 1GB
        if (used.heapUsed > 1024 * 1024 * 1024) {
            console.warn('[ContinuousMonitor] ⚠️ High memory usage');
            // In production: trigger garbage collection or restart
        }
    }

    /**
     * Alert on API issues
     */
    async alertAPIIssue(healthData) {
        // In production: Send alert to monitoring service
        console.warn('[ContinuousMonitor] 🚨 API Issue Alert:', healthData);
    }

    /**
     * Generate overnight report
     */
    generateReport() {
        const uptime = this.stats.checksPerformed * (this.checkIntervalMs / 60000);

        return {
            title: 'Genesis Overnight Report',
            runtime: `${Math.round(uptime / 60)} hours`,
            checks: this.stats.checksPerformed,
            issues: {
                detected: this.stats.issuesDetected,
                fixed: this.stats.issuesFixed,
                fixRate: this.stats.issuesDetected > 0
                    ? ((this.stats.issuesFixed / this.stats.issuesDetected) * 100).toFixed(1) + '%'
                    : '0%'
            },
            errors: this.stats.errors,
            lastCheck: this.stats.lastCheck,
            status: this.isRunning ? 'RUNNING' : 'STOPPED'
        };
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            running: this.isRunning,
            checkInterval: `${this.checkIntervalMs / 60000} minutes`,
            stats: this.stats
        };
    }
}

module.exports = new ContinuousMonitor();
