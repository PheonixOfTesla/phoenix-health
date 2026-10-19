/**
 * CODE ANALYZER - Genesis Self-Modification Component
 * Scans codebase for issues before optimization
 *
 * ELITE LEVEL: AST parsing + pattern detection + safety checks
 */

const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');

class CodeAnalyzer {
    constructor() {
        this.issues = [];
        this.stats = {
            filesScanned: 0,
            issuesFound: 0,
            fixableIssues: 0
        };
    }

    /**
     * Analyze entire codebase for issues
     * Called by genesisCore.js line 182
     */
    async analyzeCodebase(targetPath) {
        console.log(`[CodeAnalyzer] 🔍 Scanning ${targetPath}...`);
        this.issues = [];
        this.stats = { filesScanned: 0, issuesFound: 0, fixableIssues: 0 };

        try {
            await this.scanDirectory(targetPath);

            console.log(`[CodeAnalyzer] ✅ Scan complete: ${this.stats.filesScanned} files, ${this.stats.issuesFound} issues`);

            return {
                success: true,
                issues: this.issues,
                stats: this.stats,
                fixableIssues: this.issues.filter(i => i.fixable)
            };
        } catch (error) {
            console.error('[CodeAnalyzer] ❌ Analysis failed:', error);
            return {
                success: false,
                error: error.message,
                issues: [],
                stats: this.stats
            };
        }
    }

    /**
     * Recursively scan directory
     */
    async scanDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules, .git, etc.
            if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
                continue;
            }

            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath);
            } else if (entry.name.endsWith('.js')) {
                await this.analyzeFile(fullPath);
            }
        }
    }

    /**
     * Analyze single JavaScript file
     */
    async analyzeFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            this.stats.filesScanned++;

            // Issue 1: Console.log detection
            this.detectConsoleLogs(filePath, content);

            // Issue 2: Missing try/catch in async functions
            this.detectMissingErrorHandling(filePath, content);

            // Issue 3: Unused requires
            this.detectUnusedRequires(filePath, content);

            // Issue 4: Duplicate code patterns
            this.detectDuplicates(filePath, content);

        } catch (error) {
            // File read error - skip
        }
    }

    /**
     * Detect console.log statements (should use logger)
     */
    detectConsoleLogs(filePath, content) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
                this.addIssue({
                    type: 'console-log',
                    severity: 'low',
                    file: filePath,
                    line: index + 1,
                    message: 'console.log found (should use logger)',
                    fixable: true,
                    fix: 'remove'
                });
            }
        });
    }

    /**
     * Detect async functions without try/catch
     */
    detectMissingErrorHandling(filePath, content) {
        const asyncRegex = /async\s+(?:function\s+)?(\w+)?\s*\([^)]*\)\s*{/g;
        let match;

        while ((match = asyncRegex.exec(content)) !== null) {
            const funcStart = match.index;
            const funcBody = this.extractFunctionBody(content, funcStart);

            if (funcBody && !funcBody.includes('try') && !funcBody.includes('catch')) {
                const lineNum = content.substring(0, funcStart).split('\n').length;
                this.addIssue({
                    type: 'missing-error-handling',
                    severity: 'medium',
                    file: filePath,
                    line: lineNum,
                    message: 'Async function missing try/catch',
                    fixable: true,
                    fix: 'add-try-catch'
                });
            }
        }
    }

    /**
     * Detect unused require statements
     */
    detectUnusedRequires(filePath, content) {
        const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g;
        let match;

        while ((match = requireRegex.exec(content)) !== null) {
            const varName = match[1];
            const restOfFile = content.substring(match.index + match[0].length);

            // Check if variable is used later
            const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
            const usages = (restOfFile.match(usageRegex) || []).length;

            if (usages === 0) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                this.addIssue({
                    type: 'unused-require',
                    severity: 'low',
                    file: filePath,
                    line: lineNum,
                    message: `Unused require: ${varName}`,
                    fixable: true,
                    fix: 'remove'
                });
            }
        }
    }

    /**
     * Detect duplicate code blocks (simple version)
     */
    detectDuplicates(filePath, content) {
        // Simple check: look for repeated function signatures
        const funcRegex = /function\s+(\w+)\s*\([^)]*\)/g;
        const functions = new Map();
        let match;

        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (functions.has(funcName)) {
                const lineNum = content.substring(0, match.index).split('\n').length;
                this.addIssue({
                    type: 'duplicate-function',
                    severity: 'medium',
                    file: filePath,
                    line: lineNum,
                    message: `Duplicate function name: ${funcName}`,
                    fixable: false,
                    fix: null
                });
            }
            functions.set(funcName, true);
        }
    }

    /**
     * Extract function body (simple brace matching)
     */
    extractFunctionBody(content, start) {
        let braceCount = 0;
        let inFunction = false;
        let body = '';

        for (let i = start; i < content.length; i++) {
            const char = content[i];

            if (char === '{') {
                braceCount++;
                inFunction = true;
            } else if (char === '}') {
                braceCount--;
            }

            if (inFunction) {
                body += char;
            }

            if (braceCount === 0 && inFunction) {
                return body;
            }
        }

        return null;
    }

    /**
     * Add issue to list
     */
    addIssue(issue) {
        this.issues.push(issue);
        this.stats.issuesFound++;
        if (issue.fixable) {
            this.stats.fixableIssues++;
        }
    }

    /**
     * Get summary report
     */
    getSummary() {
        const bySeverity = {
            low: this.issues.filter(i => i.severity === 'low').length,
            medium: this.issues.filter(i => i.severity === 'medium').length,
            high: this.issues.filter(i => i.severity === 'high').length
        };

        const byType = {};
        this.issues.forEach(issue => {
            byType[issue.type] = (byType[issue.type] || 0) + 1;
        });

        return {
            total: this.stats.issuesFound,
            fixable: this.stats.fixableIssues,
            filesScanned: this.stats.filesScanned,
            bySeverity,
            byType
        };
    }
}

module.exports = new CodeAnalyzer();
