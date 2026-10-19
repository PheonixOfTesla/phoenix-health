/**
 * GENESIS CREATION ENGINE
 *
 * Main interface for creating new capabilities from natural language.
 * This is what Phoenix calls when user says "I want to track X"
 */

const codeConsciousness = require('./codeConsciousness');
const selfModification = require('./selfModification');
const sandboxTester = require('./sandboxTester');
const deployer = require('./deployer');
const evolutionaryMemory = require('./evolutionaryMemory');

class CreationEngine {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * Initialize Genesis (scan codebase once)
     */
    async initialize() {
        if (this.isInitialized) return;

        console.log('[Genesis] Initializing Creation Engine...');
        
        // Skip heavy scanning in production startup to prevent OOM/Timeout
        if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_GENESIS_SCAN) {
            console.log('[Genesis] Production mode: Skipping codebase scan (ENABLE_GENESIS_SCAN not set)');
            this.isInitialized = true;
            return;
        }

        await codeConsciousness.scanCodebase();
        await codeConsciousness.analyzeCapabilities();
        this.isInitialized = true;
        console.log('[Genesis] Creation Engine ready');
    }

    /**
     * Create new capability from natural language
     */
    async create(request, options = {}) {
        console.log('[Genesis] Creating from request:', request);

        try {
            // Ensure initialized
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Check if we've done something similar before
            const similar = evolutionaryMemory.findSimilar(request);
            if (similar.length > 0 && similar[0].similarity > 0.8) {
                console.log('[Genesis] Found similar past creation:', similar[0].request);
            }

            // Generate code
            const generation = await selfModification.generateFromRequest(request);
            if (!generation.success) {
                throw new Error('Code generation failed');
            }

            console.log('[Genesis] Generated files:', generation.files);

            // Test code in sandbox
            const testResults = {
                passed: 0,
                failed: 0,
                errors: []
            };

            for (const [filePath, code] of Object.entries(generation.code)) {
                const fileType = this.detectFileType(filePath);
                const result = await sandboxTester.testCode(code, fileType);

                if (!result.success) {
                    console.error(`[Genesis] Test failed for ${filePath}:`, result.tests.errors);
                    testResults.failed += result.tests.failed;
                    testResults.errors.push(...result.tests.errors);

                    if (!options.skipTests) {
                        throw new Error(`Tests failed: ${result.tests.errors.join(', ')}`);
                    }
                } else {
                    testResults.passed += result.tests.passed;
                }
            }

            console.log('[Genesis] All tests passed');

            // Deploy if tests passed
            let deployment = null;
            if (!options.dryRun) {
                deployment = await deployer.deploy(generation.code, {
                    request,
                    intent: generation.intent
                });

                if (!deployment.success) {
                    throw new Error(`Deployment failed: ${deployment.error}`);
                }

                console.log('[Genesis] Deployment successful');
            }

            // Remember this creation
            const memory = await evolutionaryMemory.remember({
                request,
                intent: generation.intent,
                files: generation.files,
                success: true,
                testResults,
                deployment: deployment?.deployment
            });

            return {
                success: true,
                message: `Created ${generation.files.length} new files`,
                files: generation.files,
                code: generation.code,
                testResults,
                deployment: deployment?.deployment,
                memoryId: memory.id
            };

        } catch (error) {
            console.error('[Genesis] Creation failed:', error);

            // Remember the failure
            await evolutionaryMemory.remember({
                request,
                intent: null,
                files: [],
                success: false,
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect file type from path
     */
    detectFileType(filePath) {
        if (filePath.includes('models/')) return 'model';
        if (filePath.includes('services/')) return 'service';
        if (filePath.includes('routes/')) return 'route';
        if (filePath.includes('widgets/')) return 'widget';
        return 'unknown';
    }

    /**
     * Get Genesis statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return {
            codebase: codeConsciousness.getStats(),
            capabilities: codeConsciousness.capabilities,
            memory: evolutionaryMemory.getStats(),
            deployments: deployer.getHistory(),
            isInitialized: this.isInitialized
        };
    }

    /**
     * Rollback last creation
     */
    async rollback() {
        return await deployer.rollback();
    }

    /**
     * Get creation history
     */
    getHistory() {
        return evolutionaryMemory.getAll();
    }
}

module.exports = new CreationEngine();
