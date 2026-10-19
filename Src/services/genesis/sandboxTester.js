/**
 * GENESIS SANDBOX TESTER
 *
 * Tests generated code in isolation before deployment.
 * Prevents breaking changes.
 */

const vm = require('vm');

class SandboxTester {
    constructor() {
        this.testResults = [];
    }

    /**
     * Test generated code in sandbox
     */
    async testCode(code, type) {
        console.log(`[Genesis] Testing ${type} code in sandbox...`);

        const tests = {
            passed: 0,
            failed: 0,
            errors: []
        };

        try {
            // Syntax validation
            if (!this.validateSyntax(code)) {
                tests.failed++;
                tests.errors.push('Syntax validation failed');
                return { success: false, tests };
            }
            tests.passed++;

            // Check for required patterns
            if (!this.validatePatterns(code, type)) {
                tests.failed++;
                tests.errors.push('Pattern validation failed');
                return { success: false, tests };
            }
            tests.passed++;

            // Security check
            if (!this.securityCheck(code)) {
                tests.failed++;
                tests.errors.push('Security check failed');
                return { success: false, tests };
            }
            tests.passed++;

            console.log('[Genesis] All tests passed');
            return { success: true, tests };

        } catch (error) {
            tests.failed++;
            tests.errors.push(error.message);
            return { success: false, tests, error: error.message };
        }
    }

    /**
     * Validate JavaScript syntax
     */
    validateSyntax(code) {
        try {
            new vm.Script(code);
            return true;
        } catch (error) {
            console.error('[Genesis] Syntax error:', error.message);
            return false;
        }
    }

    /**
     * Validate code follows expected patterns
     */
    validatePatterns(code, type) {
        const patterns = {
            'model': ['mongoose.Schema', 'module.exports'],
            'service': ['async', 'try', 'catch', 'module.exports'],
            'route': ['router.', 'auth', 'async', 'req', 'res'],
            'widget': ['class', 'constructor', 'render']
        };

        const required = patterns[type] || [];
        for (const pattern of required) {
            if (!code.includes(pattern)) {
                console.error(`[Genesis] Missing required pattern: ${pattern}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Security checks
     */
    securityCheck(code) {
        // Dangerous patterns
        const dangerous = [
            'eval(',
            'Function(',
            'child_process',
            'rm -rf',
            'process.exit'
        ];

        for (const pattern of dangerous) {
            if (code.includes(pattern)) {
                console.error(`[Genesis] Security risk detected: ${pattern}`);
                return false;
            }
        }

        return true;
    }

    /**
     * Get test history
     */
    getHistory() {
        return this.testResults;
    }
}

module.exports = new SandboxTester();
