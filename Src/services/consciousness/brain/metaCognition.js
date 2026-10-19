/**
 * META-COGNITION
 * Think about thinking. Monitor own cognitive processes.
 *
 * ELITE LEVEL: Self-awareness of reasoning, confidence calibration, bias detection
 */

class MetaCognition {
    constructor() {
        this.state = {
            awareness: {
                currentProcess: null,       // What am I doing?
                confidence: 0.5,            // How sure am I?
                alternatives: [],           // What else could I do?
                biases: []                  // What might be distorting me?
            },

            monitoring: {
                accuracy: 0.7,              // Historical accuracy
                calibration: 0.6,           // Do my confidences match reality?
                blindSpots: [],             // Known unknowns
                lastCalibration: null
            },

            control: {
                strategyInUse: null,
                shouldSwitch: false,
                alternatives: []
            }
        };

        this.predictionHistory = [];        // For calibration
        this.knownBiases = this.initializeBiases();
    }

    /**
     * Assess confidence in a claim given evidence
     */
    async assessConfidence(claim, evidence) {
        console.log('[MetaCognition] Assessing confidence...');

        let confidence = 0.5; // Start neutral

        // Evidence quality
        const evidenceQuality = this.assessEvidenceQuality(evidence);
        confidence = evidenceQuality.avgQuality;

        // Evidence quantity
        if (evidence.length >= 3) {
            confidence = Math.min(0.95, confidence + 0.1);
        }

        // Check for contradictions
        const contradictions = this.findContradictions(evidence);
        if (contradictions.length > 0) {
            confidence *= 0.7;
        }

        // Check for biases
        const detectedBiases = await this.detectBias({ claim, evidence });
        if (detectedBiases.biases.length > 0) {
            confidence *= 0.8;
        }

        // Apply calibration correction (if we tend to be overconfident, adjust down)
        const calibrated = this.applyCalibration(confidence);

        this.state.awareness.confidence = calibrated;

        return {
            confidence: calibrated,
            raw: confidence,
            evidenceQuality: evidenceQuality.avgQuality,
            contradictions: contradictions.length,
            biases: detectedBiases.biases.length
        };
    }

    /**
     * Assess quality of evidence
     */
    assessEvidenceQuality(evidence) {
        if (!evidence || evidence.length === 0) {
            return { avgQuality: 0.3, items: [] };
        }

        const items = evidence.map(e => {
            let quality = 0.5;

            // Source reliability
            if (e.source === 'verified') quality += 0.2;
            if (e.source === 'user_reported') quality += 0.1;
            if (e.source === 'inferred') quality -= 0.1;

            // Recency
            if (e.timestamp) {
                const age = Date.now() - new Date(e.timestamp).getTime();
                const hoursSinceEvidence = age / 3600000;
                if (hoursSinceEvidence < 24) quality += 0.1;
                if (hoursSinceEvidence > 168) quality -= 0.1; // Week old
            }

            // Specificity
            if (e.specific) quality += 0.1;
            if (e.vague) quality -= 0.2;

            return {
                evidence: e,
                quality: Math.min(1, Math.max(0, quality))
            };
        });

        const avgQuality = items.reduce((sum, item) => sum + item.quality, 0) / items.length;

        return { avgQuality, items };
    }

    /**
     * Find contradictions in evidence
     */
    findContradictions(evidence) {
        const contradictions = [];

        for (let i = 0; i < evidence.length; i++) {
            for (let j = i + 1; j < evidence.length; j++) {
                if (this.isContradictory(evidence[i], evidence[j])) {
                    contradictions.push({
                        evidence1: evidence[i],
                        evidence2: evidence[j],
                        type: 'direct_contradiction'
                    });
                }
            }
        }

        return contradictions;
    }

    /**
     * Check if two pieces of evidence contradict
     */
    isContradictory(e1, e2) {
        // Simple heuristic: if they claim opposite things about same subject
        if (e1.subject && e2.subject && e1.subject === e2.subject) {
            // Check for opposing values
            if (e1.value !== undefined && e2.value !== undefined) {
                if (typeof e1.value === 'boolean' && typeof e2.value === 'boolean') {
                    return e1.value !== e2.value;
                }
            }
        }
        return false;
    }

    /**
     * Detect cognitive biases in reasoning
     */
    async detectBias(reasoning) {
        const detectedBiases = [];

        for (const bias of this.knownBiases) {
            if (bias.detector(reasoning)) {
                detectedBiases.push({
                    name: bias.name,
                    description: bias.description,
                    severity: bias.severity,
                    mitigation: bias.mitigation
                });
            }
        }

        this.state.awareness.biases = detectedBiases;

        return {
            biases: detectedBiases,
            count: detectedBiases.length
        };
    }

    /**
     * Initialize known biases to watch for
     */
    initializeBiases() {
        return [
            {
                name: 'confirmation_bias',
                description: 'Favoring evidence that confirms existing beliefs',
                severity: 'high',
                detector: (reasoning) => {
                    // Check if all evidence points one direction
                    if (reasoning.evidence && reasoning.evidence.length > 0) {
                        const allPositive = reasoning.evidence.every(e => e.supports === true);
                        const allNegative = reasoning.evidence.every(e => e.supports === false);
                        return allPositive || allNegative;
                    }
                    return false;
                },
                mitigation: 'Actively seek disconfirming evidence'
            },
            {
                name: 'availability_bias',
                description: 'Overweighting recent or vivid information',
                severity: 'medium',
                detector: (reasoning) => {
                    if (reasoning.evidence && reasoning.evidence.length > 0) {
                        const recentEvidence = reasoning.evidence.filter(e => {
                            if (!e.timestamp) return false;
                            const age = Date.now() - new Date(e.timestamp).getTime();
                            return age < 3600000; // Last hour
                        });
                        return recentEvidence.length > 0 && recentEvidence.length === reasoning.evidence.length;
                    }
                    return false;
                },
                mitigation: 'Consider historical data, not just recent events'
            },
            {
                name: 'anchoring_bias',
                description: 'Over-relying on first piece of information',
                severity: 'medium',
                detector: (reasoning) => {
                    // If first evidence has disproportionate weight
                    return false; // Placeholder - would need more context
                },
                mitigation: 'Consider all evidence equally, not just first impression'
            },
            {
                name: 'overconfidence_bias',
                description: 'Being more confident than accuracy warrants',
                severity: 'high',
                detector: (reasoning) => {
                    // Check if confidence is high but evidence is weak
                    if (reasoning.confidence > 0.8 && reasoning.evidence && reasoning.evidence.length < 2) {
                        return true;
                    }
                    return false;
                },
                mitigation: 'Calibrate confidence to match evidence strength'
            }
        ];
    }

    /**
     * Explain reasoning process
     */
    async explainReasoning(conclusion) {
        const explanation = {
            conclusion,
            process: this.state.awareness.currentProcess,
            confidence: this.state.awareness.confidence,
            steps: [],
            alternatives: this.state.awareness.alternatives,
            biases: this.state.awareness.biases,
            caveats: []
        };

        // Add caveats based on confidence
        if (this.state.awareness.confidence < 0.5) {
            explanation.caveats.push('Low confidence - more evidence needed');
        }

        if (this.state.awareness.biases.length > 0) {
            explanation.caveats.push(`Potential biases detected: ${this.state.awareness.biases.map(b => b.name).join(', ')}`);
        }

        return explanation;
    }

    /**
     * Calibrate confidence based on historical accuracy
     */
    async calibrate(predictions, outcomes) {
        console.log('[MetaCognition] Calibrating confidence...');

        if (predictions.length !== outcomes.length) {
            return { success: false, error: 'Predictions and outcomes must match' };
        }

        // Calculate calibration error
        let totalError = 0;
        const dataPoints = [];

        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const outcome = outcomes[i];

            const error = Math.abs(pred.confidence - (outcome.correct ? 1 : 0));
            totalError += error;

            dataPoints.push({
                predicted: pred.confidence,
                actual: outcome.correct ? 1 : 0,
                error
            });

            // Store in history
            this.predictionHistory.push({
                prediction: pred,
                outcome,
                error,
                timestamp: Date.now()
            });
        }

        const avgError = totalError / predictions.length;
        const calibration = 1 - avgError; // 0-1, higher is better

        this.state.monitoring.calibration = calibration;
        this.state.monitoring.lastCalibration = new Date();

        // Determine if we're overconfident or underconfident
        const avgPredicted = dataPoints.reduce((sum, d) => sum + d.predicted, 0) / dataPoints.length;
        const avgActual = dataPoints.reduce((sum, d) => sum + d.actual, 0) / dataPoints.length;

        const bias = avgPredicted - avgActual;
        let biasType;
        if (bias > 0.1) biasType = 'overconfident';
        else if (bias < -0.1) biasType = 'underconfident';
        else biasType = 'well_calibrated';

        console.log(`[MetaCognition] Calibration: ${(calibration * 100).toFixed(1)}%, Bias: ${biasType}`);

        return {
            success: true,
            calibration,
            biasType,
            avgError,
            dataPoints: dataPoints.length
        };
    }

    /**
     * Apply calibration correction to confidence
     */
    applyCalibration(rawConfidence) {
        const calibration = this.state.monitoring.calibration;

        // If we're typically overconfident, adjust down
        if (calibration < 0.6) {
            // Poor calibration - reduce confidence
            return rawConfidence * 0.8;
        } else if (calibration > 0.8) {
            // Good calibration - trust the confidence
            return rawConfidence;
        } else {
            // Moderate calibration - slight reduction
            return rawConfidence * 0.9;
        }
    }

    /**
     * Question own conclusion (devil's advocate)
     */
    async questionSelf(conclusion) {
        console.log('[MetaCognition] Questioning conclusion...');

        const challenges = [];

        // What evidence contradicts this?
        challenges.push({
            type: 'contradictory_evidence',
            question: 'What evidence contradicts this conclusion?'
        });

        // What assumptions are we making?
        challenges.push({
            type: 'assumptions',
            question: 'What assumptions underlie this conclusion?'
        });

        // What if we're wrong?
        challenges.push({
            type: 'consequences',
            question: 'What are the consequences if this conclusion is wrong?'
        });

        // Are there alternative explanations?
        challenges.push({
            type: 'alternatives',
            question: 'What alternative explanations exist?'
        });

        // What biases might be affecting this?
        if (this.state.awareness.biases.length > 0) {
            challenges.push({
                type: 'bias',
                question: `How might ${this.state.awareness.biases[0].name} be affecting this conclusion?`
            });
        }

        return {
            conclusion,
            challenges,
            recommendation: 'Consider these challenges before finalizing conclusion'
        };
    }

    /**
     * Set current cognitive process
     */
    setCurrentProcess(process) {
        this.state.awareness.currentProcess = process;
        console.log(`[MetaCognition] Current process: ${process}`);
    }

    /**
     * Get metacognitive state
     */
    getState() {
        return {
            ...this.state,
            predictionHistory: this.predictionHistory.length
        };
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            confidenceLevel: this.state?.confidence?.level || 0.5,
            currentProcess: this.state?.awareness?.currentProcess || 'none',
            biasCount: (this.state?.awareness?.biases || []).length,
            predictionAccuracy: (this.predictionHistory || []).length > 0
                ? (this.predictionHistory || []).filter(p => p.correct).length / (this.predictionHistory || []).length
                : 0
        };
    }
}

module.exports = new MetaCognition();
