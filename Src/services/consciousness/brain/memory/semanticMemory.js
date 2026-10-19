/**
 * SEMANTIC MEMORY
 * Store facts, concepts, and general knowledge about the user
 *
 * ELITE LEVEL: Concept networks, inference, generalized learning
 */

class SemanticMemory {
    constructor() {
        this.concepts = new Map();          // Concept -> definition + relations
        this.facts = new Map();             // Domain -> facts
        this.schemas = new Map();           // Templates for understanding
        this.ontology = {                   // Concept relationships
            nodes: new Map(),
            edges: []
        };
    }

    /**
     * Store concept with definition and relations
     */
    async store(concept, definition, relations = []) {
        console.log(`[SemanticMemory] Storing concept: ${concept}`);

        const conceptData = {
            name: concept,
            definition,
            relations,
            stored: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0
        };

        this.concepts.set(concept, conceptData);

        // Add to ontology
        if (!this.ontology.nodes.has(concept)) {
            this.ontology.nodes.set(concept, {
                id: concept,
                type: 'concept',
                data: conceptData
            });
        }

        // Add relations to ontology
        for (const relation of relations) {
            this.ontology.edges.push({
                from: concept,
                to: relation.target,
                type: relation.type,
                strength: relation.strength || 0.7
            });
        }

        console.log(`[SemanticMemory] Concept stored (total: ${this.concepts.size})`);

        return { success: true, concept: conceptData };
    }

    /**
     * Retrieve concept
     */
    async retrieve(concept) {
        const conceptData = this.concepts.get(concept);

        if (!conceptData) {
            return { found: false };
        }

        // Update access info
        conceptData.lastAccessed = Date.now();
        conceptData.accessCount++;

        console.log(`[SemanticMemory] Retrieved concept: ${concept} (accesses: ${conceptData.accessCount})`);

        return {
            found: true,
            concept: conceptData
        };
    }

    /**
     * Find related concepts
     */
    async relate(concept1, concept2, relationType) {
        console.log(`[SemanticMemory] Creating relation: ${concept1} ${relationType} ${concept2}`);

        // Add to ontology edges
        this.ontology.edges.push({
            from: concept1,
            to: concept2,
            type: relationType,
            strength: 0.8,
            created: Date.now()
        });

        // Update concept relations
        const c1 = this.concepts.get(concept1);
        if (c1) {
            c1.relations.push({
                target: concept2,
                type: relationType,
                strength: 0.8
            });
        }

        return { success: true };
    }

    /**
     * Get all relations for a concept
     */
    getRelations(concept) {
        const outgoing = this.ontology.edges.filter(e => e.from === concept);
        const incoming = this.ontology.edges.filter(e => e.to === concept);

        return {
            outgoing,
            incoming,
            total: outgoing.length + incoming.length
        };
    }

    /**
     * Infer new knowledge from existing
     */
    async infer(query) {
        console.log('[SemanticMemory] Attempting inference...');

        // Simple transitive inference
        // If A -> B and B -> C, then A -> C

        const inferences = [];

        for (const edge1 of this.ontology.edges) {
            for (const edge2 of this.ontology.edges) {
                if (edge1.to === edge2.from) {
                    // Transitive relation found
                    const inference = {
                        from: edge1.from,
                        to: edge2.to,
                        via: edge1.to,
                        confidence: edge1.strength * edge2.strength * 0.7, // Reduce confidence
                        reasoning: `${edge1.from} ${edge1.type} ${edge1.to}, ${edge2.from} ${edge2.type} ${edge2.to}`
                    };

                    inferences.push(inference);
                }
            }
        }

        // Sort by confidence
        inferences.sort((a, b) => b.confidence - a.confidence);

        console.log(`[SemanticMemory] Generated ${inferences.length} inferences`);

        return {
            inferences: inferences.slice(0, 10),
            count: inferences.length
        };
    }

    /**
     * Update concept with new information
     */
    async update(concept, newInfo) {
        const existing = this.concepts.get(concept);

        if (!existing) {
            // Concept doesn't exist - store it
            return this.store(concept, newInfo.definition || '', newInfo.relations || []);
        }

        // Update definition if provided
        if (newInfo.definition) {
            existing.definition = newInfo.definition;
        }

        // Add new relations
        if (newInfo.relations) {
            existing.relations.push(...newInfo.relations);

            // Update ontology
            for (const relation of newInfo.relations) {
                this.ontology.edges.push({
                    from: concept,
                    to: relation.target,
                    type: relation.type,
                    strength: relation.strength || 0.7
                });
            }
        }

        existing.lastAccessed = Date.now();

        console.log(`[SemanticMemory] Concept updated: ${concept}`);

        return { success: true, concept: existing };
    }

    /**
     * Store fact in domain
     */
    async storeFact(domain, fact) {
        if (!this.facts.has(domain)) {
            this.facts.set(domain, []);
        }

        this.facts.get(domain).push({
            fact,
            stored: Date.now(),
            confidence: fact.confidence || 0.8
        });

        console.log(`[SemanticMemory] Fact stored in domain: ${domain}`);

        return { success: true };
    }

    /**
     * Retrieve facts from domain
     */
    getFacts(domain) {
        const facts = this.facts.get(domain) || [];

        return {
            domain,
            facts,
            count: facts.length
        };
    }

    /**
     * Store schema (template for understanding)
     */
    storeSchema(schemaName, structure) {
        this.schemas.set(schemaName, {
            name: schemaName,
            structure,
            stored: Date.now()
        });

        console.log(`[SemanticMemory] Schema stored: ${schemaName}`);

        return { success: true };
    }

    /**
     * Apply schema to data
     */
    applySchema(schemaName, data) {
        const schema = this.schemas.get(schemaName);

        if (!schema) {
            return { success: false, error: 'Schema not found' };
        }

        // Validate data against schema structure
        const validated = this.validateAgainstSchema(data, schema.structure);

        return {
            success: validated.valid,
            data: validated.data,
            errors: validated.errors
        };
    }

    /**
     * Validate data against schema
     */
    validateAgainstSchema(data, structure) {
        const errors = [];
        const validated = {};

        for (const [key, requirements] of Object.entries(structure)) {
            if (requirements.required && !(key in data)) {
                errors.push(`Missing required field: ${key}`);
            } else if (key in data) {
                validated[key] = data[key];
            }
        }

        return {
            valid: errors.length === 0,
            data: validated,
            errors
        };
    }

    /**
     * Get concept network around a concept
     */
    getConceptNetwork(concept, depth = 2) {
        const network = {
            center: concept,
            nodes: new Set([concept]),
            edges: []
        };

        const queue = [{ concept, currentDepth: 0 }];
        const visited = new Set([concept]);

        while (queue.length > 0) {
            const { concept: current, currentDepth } = queue.shift();

            if (currentDepth >= depth) continue;

            // Get all edges from this concept
            const outgoing = this.ontology.edges.filter(e => e.from === current);

            for (const edge of outgoing) {
                network.edges.push(edge);
                network.nodes.add(edge.to);

                if (!visited.has(edge.to)) {
                    visited.add(edge.to);
                    queue.push({ concept: edge.to, currentDepth: currentDepth + 1 });
                }
            }
        }

        return {
            center: concept,
            nodes: Array.from(network.nodes),
            edges: network.edges,
            size: network.nodes.size
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            concepts: this.concepts.size,
            facts: Array.from(this.facts.values()).reduce((sum, arr) => sum + arr.length, 0),
            schemas: this.schemas.size,
            ontology: {
                nodes: this.ontology.nodes.size,
                edges: this.ontology.edges.length
            }
        };
    }
}

module.exports = new SemanticMemory();
