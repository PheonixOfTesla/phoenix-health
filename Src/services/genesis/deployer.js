/**
 * GENESIS DEPLOYER
 *
 * Hot-deploys generated code without restart.
 * Supports rollback if something breaks.
 */

const fs = require('fs').promises;
const path = require('path');

class Deployer {
    constructor() {
        this.deployments = [];
        this.rollbackStack = [];
    }

    /**
     * Deploy generated code
     */
    async deploy(code, metadata) {
        console.log('[Genesis] Deploying code...', Object.keys(code));

        const deployment = {
            id: Date.now().toString(),
            timestamp: new Date(),
            files: {},
            metadata,
            status: 'pending'
        };

        try {
            // Write all files
            for (const [filePath, content] of Object.entries(code)) {
                const fullPath = path.join(__dirname, '../../../', filePath);

                // Create directory if needed
                await fs.mkdir(path.dirname(fullPath), { recursive: true });

                // Backup existing file for rollback
                try {
                    const existing = await fs.readFile(fullPath, 'utf8');
                    this.rollbackStack.push({ path: fullPath, content: existing });
                } catch (error) {
                    // File doesn't exist, that's fine
                    this.rollbackStack.push({ path: fullPath, content: null });
                }

                // Write new file
                await fs.writeFile(fullPath, content, 'utf8');
                deployment.files[filePath] = 'deployed';
                console.log(`[Genesis] Deployed: ${filePath}`);
            }

            deployment.status = 'success';
            this.deployments.push(deployment);

            // Clear module cache for hot reload
            this.clearModuleCache();

            console.log('[Genesis] Deployment successful');
            return { success: true, deployment };

        } catch (error) {
            deployment.status = 'failed';
            deployment.error = error.message;
            this.deployments.push(deployment);

            console.error('[Genesis] Deployment failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Rollback last deployment
     */
    async rollback() {
        console.log('[Genesis] Rolling back last deployment...');

        if (this.rollbackStack.length === 0) {
            return { success: false, error: 'Nothing to rollback' };
        }

        try {
            while (this.rollbackStack.length > 0) {
                const { path: filePath, content } = this.rollbackStack.pop();

                if (content === null) {
                    // File didn't exist before, delete it
                    try {
                        await fs.unlink(filePath);
                    } catch (error) {
                        // Ignore if file doesn't exist
                    }
                } else {
                    // Restore original content
                    await fs.writeFile(filePath, content, 'utf8');
                }
            }

            // Clear module cache
            this.clearModuleCache();

            console.log('[Genesis] Rollback successful');
            return { success: true };

        } catch (error) {
            console.error('[Genesis] Rollback failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear Node.js module cache for hot reload
     */
    clearModuleCache() {
        const cacheKeys = Object.keys(require.cache);
        for (const key of cacheKeys) {
            // Don't clear core modules or node_modules
            if (!key.includes('node_modules') && key.includes('Src/')) {
                delete require.cache[key];
            }
        }
        console.log('[Genesis] Module cache cleared for hot reload');
    }

    /**
     * Get deployment history
     */
    getHistory() {
        return this.deployments;
    }

    /**
     * Get last deployment
     */
    getLastDeployment() {
        return this.deployments[this.deployments.length - 1] || null;
    }
}

module.exports = new Deployer();
