/**
 * GENESIS CORE ORCHESTRATOR
 *
 * Purpose: Main orchestrator for all Genesis self-modification operations
 * Coordinates: code generation, file operations, testing, deployment
 * Integrates with: existing consciousness modules (selfAwareness, selfCorrection, metaCognition)
 */

const codeGenerator = require('./codeGenerator');
const fileSystemManager = require('./fileSystemManager');
const GenesisOperation = require('../../models/genesis/GenesisOperation');

class GenesisCore {
  constructor() {
    this.operationTimeout = 10000; // 10 seconds per phase
    this.safetyChecks = true;
  }

  /**
   * Main entry point for Genesis operations
   * @param {String} operationType - Type of operation
   * @param {Object} spec - Operation specification
   * @param {Object} user - User who initiated operation
   * @returns {Object} Operation result
   */
  async executeOperation(operationType, spec, user) {
    const operationId = `genesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;


    // Create operation record
    const operation = new GenesisOperation({
      operationId,
      timestamp: new Date(),
      user: user._id,
      operationType,
      metadata: { spec }
    });

    try {
      await operation.save();

      let result;

      switch (operationType) {
        case 'code_generation':
          result = await this.generateCode(spec, operation);
          break;
        case 'file_modification':
          result = await this.modifyFiles(spec, operation);
          break;
        case 'analysis':
          result = await this.analyzeCodebase(spec, operation);
          break;
        case 'optimization':
          result = await this.optimizeCodebase(spec, operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }

      await operation.markSuccess(result);


      return {
        success: true,
        operationId,
        result
      };
    } catch (error) {
      console.error(`[GENESIS CORE] Operation ${operationId} failed:`, error);

      await operation.markFailure(error);

      // Attempt rollback if files were modified
      if (operation.filesChanged && operation.filesChanged.length > 0) {
        await this.rollback(operationId);
      }

      return {
        success: false,
        operationId,
        error: error.message
      };
    }
  }

  /**
   * Generate code from natural language
   */
  async generateCode(spec, operation) {
    try {

      const { description, type = 'feature' } = spec;

      let generated;

      if (type === 'feature') {
        // Generate complete feature (model, service, route, frontend)
        generated = await codeGenerator.generateFeature(description);
      } else {
        // Generate single file
        generated = await codeGenerator.generateCode({
          type,
          description,
          context: spec.context || {}
        });
      }

      // Validate generated code
      if (type !== 'feature') {
        const validation = await codeGenerator.validateCode(generated.code);
        if (!validation.valid) {
          throw new Error(`Generated code validation failed: ${validation.error}`);
        }
      }


      return {
        generated,
        validated: true
      };
    } catch (error) {
      console.error('[GENESIS CORE] Code generation error:', error);
      throw error;
    }
  }

  /**
   * Modify files on disk
   */
  async modifyFiles(spec, operation) {
    try {

      const { changes } = spec;
      const filesChanged = [];

      for (const change of changes) {
        const { action, path: filePath, content } = change;

        let result;

        if (action === 'create' || action === 'write') {
          result = await fileSystemManager.writeFile(filePath, content, { backup: true });
        } else if (action === 'delete') {
          result = await fileSystemManager.deleteFile(filePath, { backup: true });
        } else if (action === 'modify') {
          result = await fileSystemManager.modifyFile(filePath, change.transform, { backup: true });
        }

        const stats = await fileSystemManager.getFileStats(filePath);

        filesChanged.push({
          path: filePath,
          action,
          linesAdded: stats?.lines || 0,
          backupPath: result.backupPath
        });
      }

      // Update operation with files changed
      operation.filesChanged = filesChanged;
      await operation.save();


      return {
        filesChanged,
        count: filesChanged.length
      };
    } catch (error) {
      console.error('[GENESIS CORE] File modification error:', error);
      throw error;
    }
  }

  /**
   * Analyze codebase for issues
   */
  async analyzeCodebase(spec, operation) {
    try {

      // Import codeAnalyzer (circular dependency safe)
      const codeAnalyzer = require('./codeAnalyzer');

      const { path: analyzePath = './Src' } = spec;

      const analysis = await codeAnalyzer.analyzeCodebase(analyzePath);


      return analysis;
    } catch (error) {
      console.error('[GENESIS CORE] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Optimize codebase automatically
   */
  async optimizeCodebase(spec, operation) {
    try {

      // Import modules
      const codeAnalyzer = require('./codeAnalyzer');
      const autoFixer = require('./autoFixer');

      // Analyze
      const { path: analyzePath = './Src' } = spec;
      const analysis = await codeAnalyzer.analyzeCodebase(analyzePath);

      // Filter for fixable issues
      const fixableIssues = analysis.issues.filter(issue => issue.fixable);


      // Apply fixes
      const fixes = await autoFixer.applyOptimizations(fixableIssues);

      // Update operation
      operation.filesChanged = fixes.filesChanged;
      await operation.save();


      return {
        analyzed: analysis.issues.length,
        fixable: fixableIssues.length,
        fixed: fixes.fixed,
        filesChanged: fixes.filesChanged
      };
    } catch (error) {
      console.error('[GENESIS CORE] Optimization error:', error);
      throw error;
    }
  }

  /**
   * Rollback an operation
   */
  async rollback(operationId) {
    try {

      const operation = await GenesisOperation.findOne({ operationId });

      if (!operation) {
        throw new Error(`Operation ${operationId} not found`);
      }

      if (!operation.filesChanged || operation.filesChanged.length === 0) {
        return { success: true, filesRestored: 0 };
      }

      let restored = 0;

      for (const fileChange of operation.filesChanged) {
        if (fileChange.backupPath) {
          try {
            await fileSystemManager.restoreBackup(fileChange.backupPath);
            restored++;
          } catch (error) {
            console.error(`[GENESIS CORE] Failed to restore ${fileChange.path}:`, error);
          }
        }
      }


      return {
        success: true,
        filesRestored: restored
      };
    } catch (error) {
      console.error('[GENESIS CORE] Rollback error:', error);
      throw error;
    }
  }

  /**
   * Run safety checks before operation
   */
  async safetyCheck(spec) {
    if (!this.safetyChecks) return { safe: true };

    try {
      // Import safetyValidator
      const safetyValidator = require('./safetyValidator');

      const validation = await safetyValidator.validateOperation(spec);

      if (!validation.safe) {
        console.warn('[GENESIS CORE] Safety check failed:', validation.reason);
      }

      return validation;
    } catch (error) {
      console.error('[GENESIS CORE] Safety check error:', error);
      return { safe: false, reason: error.message };
    }
  }

  /**
   * Integration with existing consciousness
   */
  async runSelfAwareness() {
    try {
      const selfAwareness = require('../phoenix/selfAwareness');
      const awareness = await selfAwareness.getSystemAwareness();
      return awareness;
    } catch (error) {
      console.error('[GENESIS CORE] Self-awareness integration error:', error);
      return null;
    }
  }

  async runSelfCorrection(changes) {
    try {
      const selfCorrection = require('../phoenix/selfCorrection');
      const correction = await selfCorrection.analyzeChanges(changes);
      return correction;
    } catch (error) {
      console.error('[GENESIS CORE] Self-correction integration error:', error);
      return null;
    }
  }

  async runMetaCognition(result) {
    try {
      const metaCognition = require('../phoenix/metaCognition');
      const reflection = await metaCognition.reflect({
        operation: 'genesis',
        result
      });
      return reflection;
    } catch (error) {
      console.error('[GENESIS CORE] Meta-cognition integration error:', error);
      return null;
    }
  }

  /**
   * Get Genesis system status
   */
  async getStatus() {
    try {
      const recentOps = await GenesisOperation.getRecent(10);
      const activeOps = await GenesisOperation.getActive();
      const successRate = await GenesisOperation.getSuccessRate();

      return {
        recentOperations: recentOps,
        activeOperations: activeOps,
        successRate,
        safetyChecksEnabled: this.safetyChecks
      };
    } catch (error) {
      console.error('[GENESIS CORE] Status error:', error);
      return null;
    }
  }
}

// Singleton instance
module.exports = new GenesisCore();
