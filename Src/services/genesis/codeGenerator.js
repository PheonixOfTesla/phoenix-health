/**
 * GENESIS CODE GENERATOR
 *
 * Purpose: Natural language to code generation using Claude Sonnet 4
 * Generates: Express routes, Mongoose models, frontend components, services
 * Fallback: Kimi K2 via OptimalMind when Claude unavailable
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

// Lazy load OptimalMind for Kimi K2 fallback
let optimalMind;
try {
  optimalMind = require('../ai/optimalMind');
} catch (e) {
  console.warn('[CODE GENERATOR] OptimalMind not available for fallback');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key-not-configured'
});

const MODEL = 'claude-sonnet-4-20250514';

/**
 * Generate code from natural language specification
 */
const generateCode = async (spec) => {
  try {
    const { type, description, context = {} } = spec;

    let prompt;
    let systemPrompt;

    if (type === 'route') {
      prompt = buildRoutePrompt(description, context);
      systemPrompt = getRouteSystemPrompt();
    } else if (type === 'model') {
      prompt = buildModelPrompt(description, context);
      systemPrompt = getModelSystemPrompt();
    } else if (type === 'service') {
      prompt = buildServicePrompt(description, context);
      systemPrompt = getServiceSystemPrompt();
    } else if (type === 'frontend') {
      prompt = buildFrontendPrompt(description, context);
      systemPrompt = getFrontendSystemPrompt();
    } else {
      throw new Error(`Unknown code type: ${type}`);
    }

    let generatedCode;
    let tokens = 0;
    let usedModel = MODEL;

    try {
      // Try Claude first
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      generatedCode = response.content[0].text;
      tokens = response.usage.output_tokens;
    } catch (claudeError) {
      console.warn('[CODE GENERATOR] Claude failed, trying Kimi K2 fallback:', claudeError.message);

      // Fallback to Kimi K2 via OptimalMind
      if (optimalMind) {
        const fallbackPrompt = `${systemPrompt}\n\n${prompt}`;
        const fallbackResponse = await optimalMind.generateResponse(fallbackPrompt, 'genesis-code-gen');
        generatedCode = fallbackResponse.response || fallbackResponse;
        usedModel = 'kimi-k2-fallback';
      } else {
        throw claudeError;
      }
    }

    return {
      code: generatedCode,
      type,
      tokens,
      model: usedModel
    };
  } catch (error) {
    console.error('[CODE GENERATOR] Error:', error);
    throw error;
  }
};

/**
 * Build prompt for Express route generation
 */
const buildRoutePrompt = (description, context) => {
  return `Generate an Express.js route file for: ${description}

${context.existingRoutes ? `Existing routes in this domain: ${JSON.stringify(context.existingRoutes, null, 2)}` : ''}

Requirements:
- Use async/await throughout
- Comprehensive try/catch error handling
- Return format: { success: boolean, data/error, message }
- Include JSDoc comments
- Use middleware: protect (auth), optionally requireGenesisGod
- Follow RESTful conventions
- Include input validation

Output ONLY the JavaScript code, no explanations.`;
};

/**
 * Build prompt for Mongoose model generation
 */
const buildModelPrompt = (description, context) => {
  return `Generate a Mongoose model for: ${description}

${context.existingModels ? `Related models: ${JSON.stringify(context.existingModels, null, 2)}` : ''}

Requirements:
- Proper schema definition with types
- Add indexes for frequently queried fields
- Include timestamps: true
- Add instance methods if useful
- Add static methods for common queries
- Include JSDoc comments
- Pre-save hooks if needed

Output ONLY the JavaScript code, no explanations.`;
};

/**
 * Build prompt for service generation
 */
const buildServicePrompt = (description, context) => {
  return `Generate a Node.js service class for: ${description}

${context.relatedServices ? `Related services: ${JSON.stringify(context.relatedServices, null, 2)}` : ''}

Requirements:
- Class-based architecture
- Constructor with dependencies
- Async methods with try/catch
- Include JSDoc comments
- Return consistent response format
    // Logging configured for production
- Singleton export pattern

Output ONLY the JavaScript code, no explanations.`;
};

/**
 * Build prompt for frontend component generation
 */
const buildFrontendPrompt = (description, context) => {
  return `Generate a Web Component for: ${description}

${context.existingComponents ? `Related components: ${JSON.stringify(context.existingComponents, null, 2)}` : ''}

Requirements:
- Custom Element (extends HTMLElement)
- Shadow DOM
- Event listeners
- Responsive CSS
- Accessibility (ARIA labels)
- Call backend via window.api object
- Include JSDoc comments

Output ONLY the JavaScript code, no explanations.`;
};

/**
 * System prompts for different code types
 */
const getRouteSystemPrompt = () => `You are an expert Express.js developer. Generate production-ready route files that follow Phoenix backend patterns:

- Async/await consistently
- Try/catch error handling
- Response format: { success, data/error, message }
- JSDoc comments
- Input validation
- Logging
- No unnecessary dependencies

Generate ONLY code, no markdown, no explanations.`;

const getModelSystemPrompt = () => `You are an expert Mongoose developer. Generate production-ready Mongoose models that follow Phoenix patterns:

- Proper schema types
- Indexes on common queries
- timestamps: true
- Useful instance/static methods
- JSDoc comments
- Pre-save hooks when needed

Generate ONLY code, no markdown, no explanations.`;

const getServiceSystemPrompt = () => `You are an expert Node.js developer. Generate production-ready service classes that follow Phoenix patterns:

- Class-based architecture
- Comprehensive error handling
- Consistent return format
- JSDoc comments
- Singleton pattern
- Logging

Generate ONLY code, no markdown, no explanations.`;

const getFrontendSystemPrompt = () => `You are an expert frontend developer. Generate production-ready Web Components that follow Phoenix patterns:

- Custom Elements API
- Shadow DOM
- Event-driven
- Responsive CSS
- Accessibility
- Uses window.api for backend calls

Generate ONLY code, no markdown, no explanations.`;

/**
 * Generate multiple related files
 */
const generateFeature = async (description) => {
  try {

    const files = [];

    // Generate model
    const model = await generateCode({
      type: 'model',
      description: `Model for ${description}`
    });
    files.push({ type: 'model', ...model });

    // Generate service
    const service = await generateCode({
      type: 'service',
      description: `Service for ${description}`
    });
    files.push({ type: 'service', ...service });

    // Generate route
    const route = await generateCode({
      type: 'route',
      description: `API routes for ${description}`
    });
    files.push({ type: 'route', ...route });

    // Generate frontend component
    const frontend = await generateCode({
      type: 'frontend',
      description: `Frontend UI for ${description}`
    });
    files.push({ type: 'frontend', ...frontend });

    return {
      success: true,
      files,
      totalTokens: files.reduce((sum, f) => sum + f.tokens, 0)
    };
  } catch (error) {
    console.error('[CODE GENERATOR] Feature generation error:', error);
    throw error;
  }
};

/**
 * Validate generated code (basic syntax check)
 */
const validateCode = async (code) => {
  try {
    // Try to parse as JavaScript
    new Function(code);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Get code template
 */
const getTemplate = (type) => {
  const templates = {
    route: `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// TODO: Add routes here

module.exports = router;`,

    model: `const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  // TODO: Add fields
}, {
  timestamps: true
});

module.exports = mongoose.model('ModelName', Schema);`,

    service: `class ServiceName {
  constructor() {
    // TODO: Initialize
  }

  async method() {
    try {
      // TODO: Implement
      return { success: true };
    } catch (error) {
      console.error('[SERVICE] Error:', error);
      throw error;
    }
  }
}

module.exports = new ServiceName();`,

    frontend: `class ComponentName extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        /* TODO: Add styles */
      </style>
      <div>
        <!-- TODO: Add content -->
      </div>
    \`;
  }
}

customElements.define('component-name', ComponentName);`
  };

  return templates[type] || '';
};

module.exports = {
  generateCode,
  generateFeature,
  validateCode,
  getTemplate
};
