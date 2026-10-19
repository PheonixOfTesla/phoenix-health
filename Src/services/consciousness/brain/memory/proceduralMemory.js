/**
 * PROCEDURAL MEMORY
 * Know how to do things - skills, procedures, automated routines
 *
 * ELITE LEVEL: Skill learning, expertise development, procedural composition
 */

class ProceduralMemory {
    constructor() {
        this.procedures = new Map();        // procedureId -> Procedure
    }

    /**
     * Learn new procedure
     */
    async learn(procedure) {
        console.log(`[ProceduralMemory] Learning procedure: ${procedure.name}`);

        const proc = {
            id: procedure.id || `proc-${Date.now()}`,
            name: procedure.name,
            trigger: procedure.trigger || null,    // Condition that triggers this
            steps: procedure.steps || [],
            expertise: 0.3,                         // Start as novice
            lastUsed: null,
            successRate: 0,
            attempts: 0,
            successes: 0,
            learned: Date.now()
        };

        this.procedures.set(proc.id, proc);

        console.log(`[ProceduralMemory] Procedure learned (total: ${this.procedures.size})`);

        return { success: true, procedure: proc };
    }

    /**
     * Execute procedure
     */
    async execute(procedureId, context = {}) {
        const proc = this.procedures.get(procedureId);

        if (!proc) {
            return { success: false, error: 'Procedure not found' };
        }

        console.log(`[ProceduralMemory] Executing: ${proc.name}`);

        // Track usage
        proc.lastUsed = Date.now();
        proc.attempts++;

        // Execute steps
        const results = [];
        let success = true;

        for (const [index, step] of proc.steps.entries()) {
            try {
                // Execute step (in production, this would actually perform the action)
                const stepResult = await this.executeStep(step, context);
                results.push({
                    step: index,
                    result: stepResult,
                    success: true
                });
            } catch (error) {
                results.push({
                    step: index,
                    error: error.message,
                    success: false
                });
                success = false;
                break; // Stop on first failure
            }
        }

        // Update success rate
        if (success) {
            proc.successes++;
        }
        proc.successRate = proc.successes / proc.attempts;

        console.log(`[ProceduralMemory] Execution ${success ? 'succeeded' : 'failed'} (success rate: ${(proc.successRate * 100).toFixed(1)}%)`);

        return {
            success,
            results,
            successRate: proc.successRate
        };
    }

    /**
     * Execute single step
     */
    async executeStep(step, context) {
        // In production, this would actually perform the action
        // For now, just log it
        console.log(`  Step: ${step.action}`);

        return { completed: true, action: step.action };
    }

    /**
     * Improve procedure based on feedback
     */
    async improve(procedureId, feedback) {
        const proc = this.procedures.get(procedureId);

        if (!proc) {
            return { success: false, error: 'Procedure not found' };
        }

        console.log(`[ProceduralMemory] Improving procedure: ${proc.name}`);

        // Update expertise based on feedback
        if (feedback.successful) {
            proc.expertise = Math.min(1, proc.expertise + 0.05);
        } else {
            proc.expertise = Math.max(0, proc.expertise - 0.02);
        }

        // If feedback includes step modifications, apply them
        if (feedback.modifyStep) {
            const stepIndex = feedback.modifyStep.index;
            if (stepIndex >= 0 && stepIndex < proc.steps.length) {
                proc.steps[stepIndex] = {
                    ...proc.steps[stepIndex],
                    ...feedback.modifyStep.changes
                };
            }
        }

        // If feedback includes new steps, add them
        if (feedback.addSteps) {
            proc.steps.push(...feedback.addSteps);
        }

        console.log(`[ProceduralMemory] Expertise now: ${(proc.expertise * 100).toFixed(1)}%`);

        return {
            success: true,
            procedure: proc,
            expertise: proc.expertise
        };
    }

    /**
     * Compose two procedures into one
     */
    async compose(procedure1Id, procedure2Id, newName) {
        const proc1 = this.procedures.get(procedure1Id);
        const proc2 = this.procedures.get(procedure2Id);

        if (!proc1 || !proc2) {
            return { success: false, error: 'One or both procedures not found' };
        }

        console.log(`[ProceduralMemory] Composing: ${proc1.name} + ${proc2.name}`);

        const composed = {
            id: `proc-${Date.now()}`,
            name: newName || `${proc1.name} then ${proc2.name}`,
            trigger: proc1.trigger, // Use first procedure's trigger
            steps: [...proc1.steps, ...proc2.steps],
            expertise: Math.min(proc1.expertise, proc2.expertise), // Limited by weakest skill
            lastUsed: null,
            successRate: 0,
            attempts: 0,
            successes: 0,
            learned: Date.now(),
            composed: true,
            components: [procedure1Id, procedure2Id]
        };

        this.procedures.set(composed.id, composed);

        console.log('[ProceduralMemory] Procedures composed');

        return { success: true, procedure: composed };
    }

    /**
     * Check if trigger condition is met
     */
    checkTrigger(procedureId, context) {
        const proc = this.procedures.get(procedureId);

        if (!proc || !proc.trigger) {
            return false;
        }

        // Simple condition checking
        const trigger = proc.trigger;

        if (trigger.type === 'context_match') {
            return context[trigger.key] === trigger.value;
        }

        if (trigger.type === 'always') {
            return true;
        }

        return false;
    }

    /**
     * Find procedures that match context
     */
    findMatchingProcedures(context) {
        const matching = [];

        for (const [id, proc] of this.procedures.entries()) {
            if (this.checkTrigger(id, context)) {
                matching.push({
                    id,
                    name: proc.name,
                    expertise: proc.expertise,
                    successRate: proc.successRate
                });
            }
        }

        // Sort by expertise * successRate
        matching.sort((a, b) =>
            (b.expertise * b.successRate) - (a.expertise * a.successRate)
        );

        return matching;
    }

    /**
     * Get procedure details
     */
    getProcedure(procedureId) {
        const proc = this.procedures.get(procedureId);

        if (!proc) {
            return { found: false };
        }

        return {
            found: true,
            procedure: proc
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const procs = Array.from(this.procedures.values());

        return {
            total: procs.length,
            avgExpertise: procs.reduce((sum, p) => sum + p.expertise, 0) / (procs.length || 1),
            avgSuccessRate: procs.reduce((sum, p) => sum + p.successRate, 0) / (procs.length || 1),
            expert: procs.filter(p => p.expertise > 0.8).length,
            novice: procs.filter(p => p.expertise < 0.4).length
        };
    }
}

module.exports = new ProceduralMemory();
