/**
 * SILENT GUIDANCE GENERATOR
 *
 * Phoenix knows what's happening, but guides the user to self-discovery.
 * This is the "pretend not to know" layer.
 */

class SilentGuidanceGenerator {
  /**
   * Generate natural discovery questions from detected patterns
   */
  generateGuidanceFromPatterns(detectedPatterns, userContext) {
    if (!detectedPatterns || detectedPatterns.length === 0) {
      return null;
    }

    // Prioritize by urgency and confidence
    const sortedPatterns = this.prioritizePatterns(detectedPatterns);
    const topPattern = sortedPatterns[0];

    // Check if already surfaced
    if (topPattern.surfaced) {
      return null;
    }

    return {
      patternId: topPattern.patternId,
      patternName: topPattern.patternName,
      confidence: topPattern.confidence,
      urgency: topPattern.urgency,

      // The gentle discovery question
      guidanceQuestion: topPattern.silentGuidance?.discovery_question || this.generateDefaultQuestion(topPattern),

      // Follow-up prompts if needed
      followUpPrompts: topPattern.silentGuidance?.follow_up_prompts || [],

      // When to surface this
      triggerContext: topPattern.silentGuidance?.intervention_timing || 'natural conversation flow',

      // What Phoenix secretly knows
      internalKnowledge: {
        label: topPattern.silentGuidance?.internal_label || topPattern.patternName,
        evidence: topPattern.evidence,
        confidence: topPattern.confidence,
        predictions: topPattern.predictions
      }
    };
  }

  /**
   * Prioritize patterns by urgency and confidence
   */
  prioritizePatterns(patterns) {
    const urgencyWeights = {
      'critical': 100,
      'high': 75,
      'medium': 50,
      'normal': 25,
      'low': 10
    };

    return patterns.sort((a, b) => {
      const aScore = urgencyWeights[a.urgency || 'normal'] + a.confidence;
      const bScore = urgencyWeights[b.urgency || 'normal'] + b.confidence;
      return bScore - aScore;
    });
  }

  /**
   * Generate default discovery question if pattern doesn't have one
   */
  generateDefaultQuestion(pattern) {
    const templates = {
      'relationship': "I've noticed some shifts in your metrics lately. How have things been going personally?",
      'work_stress': "Your stress markers are showing some changes. How's work been treating you?",
      'acute_health': "Your recovery metrics caught my attention. How are you feeling physically?",
      'injury_risk': "Your training load is elevated while recovery is down. How's your body feeling?",
      'financial_stress': "I'm seeing some stress indicators. Everything going okay?",
      'sleep': "Your sleep patterns have shifted. What's been going on?",
      'default': "I notice some changes in your data. Want to talk about how things are going?"
    };

    return templates[pattern.category] || templates['default'];
  }

  /**
   * Check if user's message is a good moment to surface pattern
   */
  shouldSurfacePattern(pattern, userMessage) {
    if (!pattern || !userMessage) return false;

    const message = userMessage.toLowerCase();

    // Trigger keywords by pattern type
    const triggers = {
      'relationship': ['tired', 'stressed', 'rough week', 'not feeling', 'down', 'sad', 'breakup', 'relationship'],
      'work_stress': ['work', 'job', 'busy', 'stressed', 'deadline', 'meeting', 'boss', 'project'],
      'acute_health': ['sick', 'ill', 'tired', 'exhausted', 'feeling off', 'not well', 'under the weather'],
      'injury_risk': ['sore', 'pain', 'ache', 'injury', 'hurt', 'workout', 'training'],
      'sleep': ['tired', 'exhausted', 'sleep', 'sleeping', 'insomnia', 'can\'t sleep'],
      'burnout': ['exhausted', 'overwhelmed', 'burned out', 'can\'t do this', 'too much']
    };

    const categoryTriggers = triggers[pattern.category] || [];

    return categoryTriggers.some(keyword => message.includes(keyword));
  }

  /**
   * Generate empathetic acknowledgment after user confirms pattern
   */
  generateAcknowledgment(pattern, userConfirmation) {
    const acknowledgments = {
      'P001': { // Relationship breakup
        response: "That makes a lot of sense. Breakups create real physiological stress - your body is processing a significant change. Here's what I recommend:",
        recommendations: [
          "Keep workouts light for the next 1-2 weeks (walks, yoga, stretching)",
          "Prioritize 8+ hours of sleep - your recovery needs it",
          "Your HRV should start improving in 2-3 weeks",
          "Be patient with yourself - this is a real stressor"
        ]
      },
      'P004': { // Job stress
        response: "Work stress shows up clearly in your metrics. Let's support your system through this period:",
        recommendations: [
          "Maintain consistent sleep schedule despite work demands",
          "Short stress-relief breaks during the day (5-10 min walks)",
          "Light exercise to manage cortisol",
          "Consider scaling back training intensity by 20%"
        ]
      },
      'P007': { // Illness onset
        response: "Your body's been signaling this for a couple days. Good catch. Here's the plan:",
        recommendations: [
          "Prioritize rest and sleep (8-9 hours)",
          "Skip workouts for 2-3 days minimum",
          "Stay hydrated",
          "Let your immune system do its work",
          "We'll resume training when recovery normalizes"
        ]
      },
      'P010': { // Injury risk
        response: "I'm glad we're catching this early. Your body's sending clear signals it needs recovery:",
        recommendations: [
          "Take 1-2 complete rest days immediately",
          "Reduce training volume by 40% next week",
          "Focus on mobility and recovery work",
          "Prioritize 8+ hours of sleep",
          "Monitor for any pain or unusual soreness"
        ]
      },
      'P008': { // Burnout
        response: "This is serious - chronic burnout requires real intervention. Here's what needs to happen:",
        recommendations: [
          "Complete training pause for 1-2 weeks minimum",
          "Consider taking time off work if possible",
          "Medical consultation recommended",
          "Focus only on restorative activities",
          "This isn't weakness - it's your body demanding recovery"
        ]
      },
      'default': {
        response: "Thank you for sharing that. It helps me understand what's showing up in your data. Here's what I recommend:",
        recommendations: pattern.recommendations || [
          "Listen to what your body is telling you",
          "Prioritize recovery and sleep",
          "Adjust training load as needed",
          "I'll keep monitoring and adjust recommendations"
        ]
      }
    };

    const ack = acknowledgments[pattern.patternId] || acknowledgments['default'];

    return {
      acknowledgment: ack.response,
      recommendations: ack.recommendations,
      follow_up: "I'll keep tracking your metrics and let you know when things start improving. You've got this."
    };
  }

  /**
   * Generate contextual guidance based on conversation flow
   */
  generateContextualGuidance(pattern, conversationContext) {
    // If user is asking about specific metrics, tie guidance to that
    if (conversationContext.includes('hrv') || conversationContext.includes('recovery')) {
      return {
        type: 'metric_explanation',
        message: `Your HRV has dropped ${Math.abs(pattern.evidence[0]?.match(/-?\d+\.?\d*/)?.[0] || 0)}% recently. This often happens when there's increased stress - physical, emotional, or mental. ${pattern.silentGuidance?.discovery_question || 'What do you think might be contributing?'}`
      };
    }

    if (conversationContext.includes('sleep')) {
      return {
        type: 'metric_explanation',
        message: `Sleep quality has been off lately. Sometimes external factors affect our sleep before we fully register them. ${pattern.silentGuidance?.discovery_question || 'Any changes in your routine or life recently?'}`
      };
    }

    // Default gentle discovery
    return {
      type: 'gentle_discovery',
      message: pattern.silentGuidance?.discovery_question || this.generateDefaultQuestion(pattern)
    };
  }
}

module.exports = new SilentGuidanceGenerator();
