/**
 * GENESIS CODE CONSCIOUSNESS
 *
 * Genesis knows the entire Phoenix codebase - every file, function, pattern.
 * This is how Genesis understands where to add new code and what patterns to follow.
 */

const fs = require('fs').promises;
const path = require('path');

class CodeConsciousness {
    constructor() {
        this.codebaseMap = new Map();       // file → metadata
        this.patternLibrary = new Map();    // pattern → examples
        this.capabilities = new Map();       // what Genesis can do
        this.lastScan = null;
        this.rootPath = path.join(__dirname, '../../..');
    }

    /**
     * Scan entire codebase into memory
     */
    async scanCodebase() {
        console.log('[Genesis] Scanning codebase...');
        const files = await this.walkDirectory(this.rootPath);

        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const relativePath = path.relative(this.rootPath, file);

                    this.codebaseMap.set(relativePath, {
                        content,
                        exports: this.extractExports(content),
                        dependencies: this.extractDependencies(content),
                        patterns: this.detectPatterns(content),
                        size: content.length,
                        lastModified: (await fs.stat(file)).mtime
                    });
                } catch (error) {
                    console.error(`[Genesis] Error scanning ${file}:`, error.message);
                }
            }
        }

        this.lastScan = new Date();
        console.log(`[Genesis] Scanned ${this.codebaseMap.size} files`);
        return this.codebaseMap.size;
    }

    /**
     * Walk directory recursively
     */
    async walkDirectory(dir, fileList = []) {
        const files = await fs.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);

            // Skip node_modules, .git, etc.
            if (file === 'node_modules' || file === '.git' || file.startsWith('.')) {
                continue;
            }

            if (stat.isDirectory()) {
                await this.walkDirectory(filePath, fileList);
            } else {
                fileList.push(filePath);
            }
        }

        return fileList;
    }

    /**
     * Extract module.exports and exports
     */
    extractExports(content) {
        const exports = [];

        // module.exports = ...
        const moduleExportsMatch = content.match(/module\.exports\s*=\s*(\w+)/);
        if (moduleExportsMatch) {
            exports.push(moduleExportsMatch[1]);
        }

        // exports.functionName = ...
        const exportsMatches = content.matchAll(/exports\.(\w+)\s*=/g);
        for (const match of exportsMatches) {
            exports.push(match[1]);
        }

        return exports;
    }

    /**
     * Extract require() dependencies
     */
    extractDependencies(content) {
        const dependencies = [];
        const requireMatches = content.matchAll(/require\(['"]([^'"]+)['"]\)/g);

        for (const match of requireMatches) {
            dependencies.push(match[1]);
        }

        return dependencies;
    }

    /**
     * Detect code patterns
     */
    detectPatterns(content) {
        const patterns = [];

        // CRUD pattern
        if (this.hasCRUD(content)) patterns.push('crud');

        // Express route pattern
        if (this.hasExpressRoutes(content)) patterns.push('express-routes');

        // Mongoose model pattern
        if (this.hasMongooseSchema(content)) patterns.push('mongoose-model');

        // Service pattern
        if (this.hasServicePattern(content)) patterns.push('service');

        // Controller pattern
        if (this.hasControllerPattern(content)) patterns.push('controller');

        return patterns;
    }

    hasCRUD(content) {
        return content.includes('create') && content.includes('read') &&
               content.includes('update') && content.includes('delete');
    }

    hasExpressRoutes(content) {
        return content.includes('router.get') || content.includes('router.post') ||
               content.includes('router.put') || content.includes('router.delete');
    }

    hasMongooseSchema(content) {
        return content.includes('mongoose.Schema') || content.includes('new Schema');
    }

    hasServicePattern(content) {
        return content.includes('Service') && (content.includes('async') || content.includes('.find'));
    }

    hasControllerPattern(content) {
        return content.includes('req,') && content.includes('res') && content.includes('try');
    }

    /**
     * Find where to add new code
     */
    findInsertionPoint(type, domain) {
        const points = {
            service: `Src/services/${domain}/${type}Service.js`,
            route: `Src/routes/${domain}.js`,
            model: `Src/models/${domain}/${type}.js`,
            controller: `Src/controllers/${domain}Controller.js`
        };

        return points;
    }

    /**
     * Get example of similar code
     */
    getPatternExample(pattern) {
        for (const [file, data] of this.codebaseMap) {
            if (data.patterns.includes(pattern)) {
                return {
                    file,
                    content: data.content.substring(0, 1000) // First 1000 chars as example
                };
            }
        }
        return null;
    }

    /**
     * Analyze what capabilities Genesis has
     */
    analyzeCapabilities() {
        const capabilities = {
            canCreateServices: false,
            canCreateRoutes: false,
            canCreateModels: false,
            canCreateControllers: false,
            domains: [],
            patterns: new Set()
        };

        for (const [file, data] of this.codebaseMap) {
            if (file.includes('Src/services/')) capabilities.canCreateServices = true;
            if (file.includes('Src/routes/')) capabilities.canCreateRoutes = true;
            if (file.includes('Src/models/')) capabilities.canCreateModels = true;
            if (file.includes('Src/controllers/')) capabilities.canCreateControllers = true;

            // Extract domains (mercury, venus, earth, etc.)
            const domainMatch = file.match(/Src\/(?:services|routes|models)\/(\w+)/);
            if (domainMatch) {
                capabilities.domains.push(domainMatch[1]);
            }

            // Collect all patterns
            data.patterns.forEach(p => capabilities.patterns.add(p));
        }

        capabilities.domains = [...new Set(capabilities.domains)];
        capabilities.patterns = Array.from(capabilities.patterns);

        this.capabilities = capabilities;
        return capabilities;
    }

    /**
     * Get codebase statistics
     */
    getStats() {
        let totalLines = 0;
        let totalSize = 0;

        for (const [file, data] of this.codebaseMap) {
            totalLines += data.content.split('\n').length;
            totalSize += data.size;
        }

        return {
            files: this.codebaseMap.size,
            lines: totalLines,
            bytes: totalSize,
            lastScan: this.lastScan
        };
    }
}

// Singleton instance
const codeConsciousness = new CodeConsciousness();

module.exports = codeConsciousness;
