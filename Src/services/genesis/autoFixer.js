/**
 * AUTO-FIXER - Genesis Self-Modification Component
 * Automatically fixes detected code issues
 *
 * ELITE LEVEL: Safe automatic fixes with rollback capability
 */

const fs = require('fs').promises;
const path = require('path');

class AutoFixer {
    constructor() {
        this.fixes = [];
        this.backups = new Map();
    }

    /**
     * Apply optimizations to fixable issues
     * Called by genesisCore.js line 204
     */
    async applyOptimizations(fixableIssues) {
        console.log(`[AutoFixer] 🔧 Fixing ${fixableIssues.length} issues...`);
        this.fixes = [];

        try {
            // Group issues by file for efficient fixing
            const byFile = this.groupByFile(fixableIssues);

            for (const [filePath, issues] of Object.entries(byFile)) {
                await this.fixFile(filePath, issues);
            }

            console.log(`[AutoFixer] ✅ Applied ${this.fixes.length} fixes`);

            return {
                success: true,
                fixes: this.fixes,
                filesModified: Object.keys(byFile).length
            };
        } catch (error) {
            console.error('[AutoFixer] ❌ Fix failed:', error);
            await this.rollbackAll();
            return {
                success: false,
                error: error.message,
                fixes: []
            };
        }
    }

    /**
     * Group issues by file
     */
    groupByFile(issues) {
        const byFile = {};
        issues.forEach(issue => {
            if (!byFile[issue.file]) {
                byFile[issue.file] = [];
            }
            byFile[issue.file].push(issue);
        });
        return byFile;
    }

    /**
     * Fix all issues in a single file
     */
    async fixFile(filePath, issues) {
        try {
            // Read file
            const content = await fs.readFile(filePath, 'utf-8');

            // Create backup
            this.backups.set(filePath, content);

            let modifiedContent = content;
            const lines = content.split('\n');

            // Sort issues by line number (descending) to avoid line number shifts
            const sortedIssues = issues.sort((a, b) => b.line - a.line);

            for (const issue of sortedIssues) {
                switch (issue.fix) {
                    case 'remove':
                        modifiedContent = this.removeLine(modifiedContent, issue.line);
                        this.recordFix(issue, 'removed');
                        break;

                    case 'add-try-catch':
                        modifiedContent = this.addTryCatch(modifiedContent, issue.line);
                        this.recordFix(issue, 'added try/catch');
                        break;

                    default:
                        console.warn(`[AutoFixer] Unknown fix type: ${issue.fix}`);
                }
            }

            // Write modified file
            await fs.writeFile(filePath, modifiedContent, 'utf-8');
            console.log(`[AutoFixer] ✓ Fixed ${issues.length} issues in ${path.basename(filePath)}`);

        } catch (error) {
            console.error(`[AutoFixer] Failed to fix ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Remove a specific line
     */
    removeLine(content, lineNumber) {
        const lines = content.split('\n');
        lines.splice(lineNumber - 1, 1);
        return lines.join('\n');
    }

    /**
     * Add try/catch to async function
     */
    addTryCatch(content, lineNumber) {
        const lines = content.split('\n');
        const functionLine = lines[lineNumber - 1];

        // Find the opening brace
        let braceIndex = lineNumber - 1;
        while (braceIndex < lines.length && !lines[braceIndex].includes('{')) {
            braceIndex++;
        }

        if (braceIndex >= lines.length) {
            return content; // Can't find brace, skip
        }

        // Find the closing brace
        let braceCount = 0;
        let closeIndex = braceIndex;
        for (let i = braceIndex; i < lines.length; i++) {
            const line = lines[i];
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            if (braceCount === 0) {
                closeIndex = i;
                break;
            }
        }

        // Get function body
        const indent = lines[braceIndex].match(/^\s*/)[0];
        const bodyLines = lines.slice(braceIndex + 1, closeIndex);

        // Check if already has try/catch
        const hasTryCatch = bodyLines.some(line => line.includes('try') || line.includes('catch'));
        if (hasTryCatch) {
            return content; // Already has try/catch
        }

        // Wrap body in try/catch
        const newBody = [
            lines[braceIndex], // Opening brace
            `${indent}    try {`,
            ...bodyLines.map(line => `    ${line}`),
            `${indent}    } catch (error) {`,
            `${indent}        console.error('Error in function:', error);`,
            `${indent}        throw error;`,
            `${indent}    }`,
            lines[closeIndex] // Closing brace
        ];

        // Reconstruct file
        const newLines = [
            ...lines.slice(0, braceIndex),
            ...newBody,
            ...lines.slice(closeIndex + 1)
        ];

        return newLines.join('\n');
    }

    /**
     * Record successful fix
     */
    recordFix(issue, action) {
        this.fixes.push({
            file: issue.file,
            line: issue.line,
            type: issue.type,
            action: action,
            timestamp: Date.now()
        });
    }

    /**
     * Rollback all changes
     */
    async rollbackAll() {
        console.log('[AutoFixer] ⏪ Rolling back changes...');

        for (const [filePath, originalContent] of this.backups.entries()) {
            try {
                await fs.writeFile(filePath, originalContent, 'utf-8');
                console.log(`[AutoFixer] ✓ Rolled back ${path.basename(filePath)}`);
            } catch (error) {
                console.error(`[AutoFixer] Failed to rollback ${filePath}:`, error);
            }
        }

        this.backups.clear();
    }

    /**
     * Get fix summary
     */
    getSummary() {
        const byType = {};
        this.fixes.forEach(fix => {
            byType[fix.type] = (byType[fix.type] || 0) + 1;
        });

        return {
            total: this.fixes.length,
            byType,
            filesModified: this.backups.size
        };
    }
}

module.exports = new AutoFixer();
