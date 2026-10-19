/**
 * SAFETY VALIDATOR - Genesis Self-Modification Component
 * Prevents dangerous operations during autonomous mode
 *
 * ELITE LEVEL: Multi-layer safety checks before any code modification
 */

const path = require('path');

class SafetyValidator {
    constructor() {
        this.criticalPaths = [
            '/node_modules',
            '/.git',
            '/package.json',
            '/package-lock.json',
            '/.env',
            '/config/database.js'
        ];

        this.dangerousPatterns = [
            /rm\s+-rf/,           // Destructive commands
            /process\.exit/,       // Process termination
            /eval\(/,              // Code injection risk
            /exec\(/,              // Command injection risk
            /DROP\s+TABLE/i,       // Database destruction
            /DELETE\s+FROM.*WHERE\s+1=1/i  // Mass deletion
        ];
    }

    /**
     * Validate operation before execution
     * Called by genesisCore.js line 282
     */
    async validateOperation(spec) {
        // Removed verbose logging to prevent Railway rate limits

        const checks = [
            this.checkPath(spec),
            this.checkContent(spec),
            this.checkFileType(spec),
            this.checkPermissions(spec),
            this.checkInjectionRisk(spec)
        ];

        const results = await Promise.all(checks);
        const failed = results.filter(r => !r.passed);

        if (failed.length > 0) {
            return {
                safe: false,
                score: 0,
                blockedReasons: failed.map(f => f.reason),
                recommendation: 'Operation blocked due to safety concerns'
            };
        }

        // Calculate safety score (0-1)
        const score = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

        return {
            safe: true,
            score,
            blockedReasons: [],
            recommendation: score > 0.8 ? 'Proceed' : 'Proceed with caution'
        };
    }

    /**
     * Check if path is safe to modify
     */
    async checkPath(spec) {
        const targetPath = spec.path || spec.filePath || '';

        // Check against critical paths
        for (const criticalPath of this.criticalPaths) {
            if (targetPath.includes(criticalPath)) {
                return {
                    passed: false,
                    confidence: 0,
                    reason: `Critical path detected: ${criticalPath}`
                };
            }
        }

        // Check if path exists and is within project
        const normalized = path.normalize(targetPath);
        if (normalized.startsWith('..')) {
            return {
                passed: false,
                confidence: 0,
                reason: 'Path outside project directory'
            };
        }

        return { passed: true, confidence: 1.0 };
    }

    /**
     * Check content for dangerous patterns
     */
    async checkContent(spec) {
        const content = spec.content || spec.code || '';

        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(content)) {
                return {
                    passed: false,
                    confidence: 0,
                    reason: `Dangerous pattern detected: ${pattern.source}`
                };
            }
        }

        return { passed: true, confidence: 1.0 };
    }

    /**
     * Check file type is allowed
     */
    async checkFileType(spec) {
        const filePath = spec.path || spec.filePath || '';
        const allowedExtensions = ['.js', '.json', '.md', '.txt', '.css', '.html'];

        const ext = path.extname(filePath).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            return {
                passed: false,
                confidence: 0,
                reason: `File type not allowed: ${ext}`
            };
        }

        return { passed: true, confidence: 1.0 };
    }

    /**
     * Check if operation has proper permissions
     */
    async checkPermissions(spec) {
        // In autonomous mode, check if operation type is allowed
        const operation = spec.operation || spec.type || '';
        const autonomousMode = spec.autonomous || false;

        const restrictedOps = ['delete', 'drop', 'destroy', 'remove'];

        if (autonomousMode && restrictedOps.some(op => operation.toLowerCase().includes(op))) {
            return {
                passed: false,
                confidence: 0,
                reason: `Destructive operation not allowed in autonomous mode: ${operation}`
            };
        }

        return { passed: true, confidence: 0.9 };
    }

    /**
     * Check for injection risks
     */
    async checkInjectionRisk(spec) {
        const userInput = spec.userInput || spec.query || '';

        // Check for SQL injection patterns
        const sqlInjection = /['";]|--|\/\*|\*\/|xp_|sp_|exec\s/i;
        if (sqlInjection.test(userInput)) {
            return {
                passed: false,
                confidence: 0,
                reason: 'Potential SQL injection detected'
            };
        }

        // Check for command injection
        const cmdInjection = /[;&|`$()]/;
        if (cmdInjection.test(userInput)) {
            return {
                passed: false,
                confidence: 0,
                reason: 'Potential command injection detected'
            };
        }

        return { passed: true, confidence: 1.0 };
    }

    /**
     * Validate batch operations
     */
    async validateBatch(operations) {
        // Removed verbose logging to prevent Railway rate limits

        const results = await Promise.all(
            operations.map(op => this.validateOperation(op))
        );

        const unsafe = results.filter(r => !r.safe);

        if (unsafe.length > 0) {
            return {
                safe: false,
                totalOperations: operations.length,
                unsafeOperations: unsafe.length,
                blockedReasons: unsafe.flatMap(u => u.blockedReasons)
            };
        }

        return {
            safe: true,
            totalOperations: operations.length,
            unsafeOperations: 0,
            averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length
        };
    }
}

module.exports = new SafetyValidator();
