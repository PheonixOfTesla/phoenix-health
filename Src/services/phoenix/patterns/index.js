/**
 * Phoenix AI Pattern Library - Universal Pattern Loader
 * Aggregates all 540 behavioral patterns from 9 category modules
 *
 * Pattern Categories:
 * - Relationship (60 patterns)
 * - Work (70 patterns)
 * - Health (80 patterns)
 * - Fitness (60 patterns)
 * - Mental Health (70 patterns)
 * - Financial (55 patterns)
 * - Social (55 patterns)
 * - Sleep (40 patterns)
 * - Lifestyle (50 patterns)
 *
 * Total: 540 patterns
 */

const relationshipPatterns = require('./relationship');
const workPatterns = require('./work');
const healthPatterns = require('./health');
const fitnessPatterns = require('./fitness');
const mentalHealthPatterns = require('./mentalHealth');
const financialPatterns = require('./financial');
const socialPatterns = require('./social');
const sleepPatterns = require('./sleep');
const lifestylePatterns = require('./lifestyle');

// Aggregate all patterns into single unified object
const allPatterns = {
  ...relationshipPatterns,
  ...workPatterns,
  ...healthPatterns,
  ...fitnessPatterns,
  ...mentalHealthPatterns,
  ...financialPatterns,
  ...socialPatterns,
  ...sleepPatterns,
  ...lifestylePatterns
};

// Pattern statistics
const patternStats = {
  total: Object.keys(allPatterns).length,
  categories: {
    relationship: Object.keys(relationshipPatterns).length,
    work: Object.keys(workPatterns).length,
    health: Object.keys(healthPatterns).length,
    fitness: Object.keys(fitnessPatterns).length,
    mentalHealth: Object.keys(mentalHealthPatterns).length,
    financial: Object.keys(financialPatterns).length,
    social: Object.keys(socialPatterns).length,
    sleep: Object.keys(sleepPatterns).length,
    lifestyle: Object.keys(lifestylePatterns).length
  },
  planets: {
    venus: Object.values(allPatterns).filter(p => p.planet === 'Venus').length,
    mercury: Object.values(allPatterns).filter(p => p.planet === 'Mercury').length,
    mars: Object.values(allPatterns).filter(p => p.planet === 'Mars').length
  },
  urgency: {
    critical: Object.values(allPatterns).filter(p => p.urgency === 'critical').length,
    high: Object.values(allPatterns).filter(p => p.urgency === 'high').length,
    medium: Object.values(allPatterns).filter(p => p.urgency === 'medium').length,
    low: Object.values(allPatterns).filter(p => p.urgency === 'low').length
  },
  sensitive: Object.values(allPatterns).filter(p => p.sensitive === true).length
};

// Helper functions for pattern queries
const getPatternsByCategory = (category) => {
  return Object.values(allPatterns).filter(p => p.category === category);
};

const getPatternsByPlanet = (planet) => {
  return Object.values(allPatterns).filter(p => p.planet === planet);
};

const getPatternsByUrgency = (urgency) => {
  return Object.values(allPatterns).filter(p => p.urgency === urgency);
};

const getSensitivePatterns = () => {
  return Object.values(allPatterns).filter(p => p.sensitive === true);
};

const getCriticalPatterns = () => {
  return Object.values(allPatterns).filter(p => p.urgency === 'critical');
};

// Log initialization







module.exports = {
  patterns: allPatterns,
  stats: patternStats,
  getPatternsByCategory,
  getPatternsByPlanet,
  getPatternsByUrgency,
  getSensitivePatterns,
  getCriticalPatterns
};
