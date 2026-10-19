/**
 * INPUT VALIDATION MIDDLEWARE
 * Joi schema validation for all API endpoints
 * Prevents injection attacks, malformed data, and edge cases
 */

const Joi = require('joi');

/**
 * Validation schemas for common data types
 */
const schemas = {
    // Widget schemas
    createWidget: Joi.object({
        widgetId: Joi.string().alphanum().min(3).max(50).required(),
        widgetName: Joi.string().min(1).max(100).required(),
        widgetType: Joi.string().valid('custom_tracker', 'ai_generated', 'template', 'manual', 'system'),
        html: Joi.string().max(50000).required(),
        actions: Joi.object().pattern(Joi.string(), Joi.string().uri({ relativeOnly: true })),
        data: Joi.object(),
        trackingFields: Joi.array().items(Joi.string().max(50)),
        config: Joi.object({
            position: Joi.number().integer().min(0).max(1000),
            priority: Joi.number().integer().min(0).max(100),
            size: Joi.string().valid('small', 'medium', 'large', 'full'),
            theme: Joi.string().max(50),
            customClasses: Joi.array().items(Joi.string().max(50))
        }),
        generation: Joi.object({
            source: Joi.string().valid('ai_voice', 'ai_text', 'template', 'manual', 'system'),
            originalRequest: Joi.string().max(500),
            generatedBy: Joi.string().valid('gemini', 'claude', 'openai', 'manual'),
            templateId: Joi.string().max(50)
        }),
        tags: Joi.array().items(Joi.string().max(30)),
        notes: Joi.string().max(500)
    }),

    generateWidget: Joi.object({
        request: Joi.string().min(3).max(500).required(),
        source: Joi.string().valid('ai_voice', 'ai_text').default('ai_text')
    }),

    updateWidget: Joi.object({
        widgetName: Joi.string().min(1).max(100),
        html: Joi.string().max(50000),
        actions: Joi.object().pattern(Joi.string(), Joi.string().uri({ relativeOnly: true })),
        data: Joi.object(),
        trackingFields: Joi.array().items(Joi.string().max(50)),
        config: Joi.object({
            position: Joi.number().integer().min(0).max(1000),
            priority: Joi.number().integer().min(0).max(100),
            size: Joi.string().valid('small', 'medium', 'large', 'full'),
            theme: Joi.string().max(50),
            customClasses: Joi.array().items(Joi.string().max(50))
        }),
        tags: Joi.array().items(Joi.string().max(30)),
        notes: Joi.string().max(500)
    }),

    // Custom tracker schemas
    logEntry: Joi.object({
        value: Joi.alternatives().try(
            Joi.string().max(500),
            Joi.number(),
            Joi.boolean()
        ).required(),
        note: Joi.string().max(1000),
        metadata: Joi.object()
    }),

    executeAction: Joi.object({
        value: Joi.alternatives().try(
            Joi.string().max(500),
            Joi.number(),
            Joi.boolean()
        ),
        note: Joi.string().max(1000),
        metadata: Joi.object()
    }),

    // Auth schemas
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(128).required(),
        firstName: Joi.string().min(1).max(50),
        lastName: Joi.string().min(1).max(50),
        phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/), // E.164 format
        dateOfBirth: Joi.date().max('now')
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Voice/text query schemas
    voiceQuery: Joi.object({
        query: Joi.string().min(1).max(2000).required(),
        context: Joi.object()
    }),

    // Interface orchestration
    orchestrate: Joi.object({
        voiceQuery: Joi.string().max(2000),
        wearableData: Joi.object(),
        timeContext: Joi.string().valid('morning', 'afternoon', 'evening', 'night'),
        userPreferences: Joi.object()
    }),

    // Pattern detection
    patternQuery: Joi.object({
        domain: Joi.string().valid('health', 'fitness', 'sleep', 'nutrition', 'mental', 'work', 'social', 'finance', 'relationships'),
        timeRange: Joi.number().integer().min(1).max(365).default(90),
        minConfidence: Joi.number().min(0).max(1).default(0.5)
    }),

    // User preferences
    updatePreferences: Joi.object({
        userName: Joi.string().min(1).max(50),
        theme: Joi.string().valid('light', 'dark', 'auto'),
        notifications: Joi.object({
            email: Joi.boolean(),
            push: Joi.boolean(),
            sms: Joi.boolean()
        }),
        privacy: Joi.object({
            shareData: Joi.boolean(),
            analytics: Joi.boolean()
        })
    })
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of schema to validate against
 * @param {string} source - Where to get data ('body', 'query', 'params')
 * @returns {Function} - Express middleware
 */
function validate(schemaName, source = 'body') {
    return (req, res, next) => {
        const schema = schemas[schemaName];

        if (!schema) {
            console.error(`[Validation] Schema "${schemaName}" not found`);
            return res.status(500).json({
                success: false,
                message: 'Internal validation error'
            });
        }

        // Get data from specified source
        const data = req[source];

        // Validate data
        const { error, value } = schema.validate(data, {
            abortEarly: false, // Return all errors
            stripUnknown: true, // Remove unknown fields
            convert: true // Type coercion
        });

        if (error) {
            

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Replace request data with validated/sanitized data
        req[source] = value;

        next();
    };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHTML(html) {
    if (!html) return '';

    // Remove dangerous tags and attributes
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/data:/gi, ''); // Remove data: URLs
}

/**
 * Sanitize user input to prevent injection
 * @param {string} input - User input string
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 10000); // Limit length
}

module.exports = {
    validate,
    schemas,
    sanitizeHTML,
    sanitizeInput
};
