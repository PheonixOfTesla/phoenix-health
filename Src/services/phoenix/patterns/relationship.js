/**
 * PHOENIX AI - RELATIONSHIP PATTERNS (60 patterns)
 * Covers: Breakups, Marriage, Divorce, Dating, Family, Infidelity, Parenting
 */

module.exports = {
  R001_SUDDEN_BREAKUP: {
    id: 'R001',
    name: 'Sudden Relationship Ending',
    planet: 'Venus',
    category: 'relationship',
    description: 'Unexpected breakup with severe immediate impact',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 2 }
    ],
    logic: 'IF (hrv_drops_20%+ IN 2_days) AND (sleep_drops_18%+) AND (rhr_spikes_12%+) THEN sudden_breakup_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [2, 7],
    silent_guidance: {
      discovery_question: "Your body's been through something intense recently. How are you holding up?",
      follow_up_prompts: ["Has anything major changed in your life?"],
      internal_label: 'Sudden breakup detected',
      intervention_timing: 'When user mentions stress, sleep, or emotions'
    },
    urgency: 'high',
    sensitive: true
  },

  R002_MUTUAL_BREAKUP: {
    id: 'R002',
    name: 'Mutual Relationship Ending',
    planet: 'Venus',
    category: 'relationship',
    description: 'Planned/mutual breakup with moderate gradual impact',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 8, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_gradual_decline) AND (sleep_moderate_drop) AND (routine_shift) THEN mutual_breakup_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "I notice things have been shifting for you lately. Want to talk about it?",
      follow_up_prompts: ["How are things with your partner?"],
      internal_label: 'Mutual breakup',
      intervention_timing: 'When user discusses relationships or life changes'
    },
    urgency: 'medium',
    sensitive: true
  },

  R003_TOXIC_RELATIONSHIP_EXIT: {
    id: 'R003',
    name: 'Leaving Toxic Relationship',
    planet: 'Venus',
    category: 'relationship',
    description: 'Ending unhealthy relationship - metrics IMPROVE after exit',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_quality_improves) AND (rhr_drops) THEN toxic_exit_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Your body seems relieved about something. What's been changing?",
      follow_up_prompts: ["Did you make a big decision recently?"],
      internal_label: 'Leaving toxic relationship (positive)',
      intervention_timing: 'When user mentions relationships or relief'
    },
    urgency: 'medium',
    sensitive: true
  },

  R004_LONG_TERM_BREAKUP: {
    id: 'R004',
    name: 'Long-term Relationship Ending',
    planet: 'Venus',
    category: 'relationship',
    description: 'Breakup after multi-year relationship',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_disrupted) AND (routine_shattered) THEN longterm_breakup_likely',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [5, 30],
    silent_guidance: {
      discovery_question: "Your whole routine has shifted. What's going on?",
      follow_up_prompts: ["Did a major relationship change?"],
      internal_label: 'Long-term relationship ending',
      intervention_timing: 'When user mentions significant life changes'
    },
    urgency: 'high',
    sensitive: true
  },

  // MARRIAGE & COMMITMENT
  R005_WEDDING_PLANNING_STRESS: {
    id: 'R005',
    name: 'Wedding Planning Stress',
    planet: 'Venus',
    category: 'relationship',
    description: 'High stress from wedding preparation',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_moderate_drop) AND (sleep_quality_drops) AND (rhr_elevated) THEN wedding_stress_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [14, 90],
    silent_guidance: {
      discovery_question: "You seem to have a lot on your plate. What's keeping you busy?",
      follow_up_prompts: ["Are you planning something big?"],
      internal_label: 'Wedding planning stress',
      intervention_timing: 'When user mentions being busy or stressed'
    },
    urgency: 'low',
    sensitive: false
  },

  R006_NEWLYWED_ADJUSTMENT: {
    id: 'R006',
    name: 'Newlywed Adjustment Period',
    planet: 'Venus',
    category: 'relationship',
    description: 'Life adjustment after marriage',
    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'CHANGES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (routine_shifts) AND (sleep_pattern_changes) THEN newlywed_adjustment_likely',
    confidence_threshold: 0.65,
    evidence_required: 3,
    false_positive_rate: 0.28,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "Your routine's evolving. What's new in your life?",
      follow_up_prompts: ["Did something change at home?"],
      internal_label: 'Newlywed adjustment',
      intervention_timing: 'When user discusses life changes'
    },
    urgency: 'low',
    sensitive: false
  },

  R007_ENGAGEMENT_ANNOUNCEMENT: {
    id: 'R007',
    name: 'Recent Engagement',
    planet: 'Venus',
    category: 'relationship',
    description: 'Positive life event - improved metrics',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_quality_up) THEN positive_relationship_event_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.25,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Something good is happening! What's new?",
      follow_up_prompts: ["Did something exciting happen?"],
      internal_label: 'Engagement or positive milestone',
      intervention_timing: 'When user seems happy'
    },
    urgency: 'low',
    sensitive: false
  },

  // DIVORCE PATTERNS
  R008_DIVORCE_INITIATION: {
    id: 'R008',
    name: 'Divorce Process Beginning',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Start of divorce proceedings',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 40, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_collapse) AND (routine_chaos) THEN divorce_initiation_likely',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.09,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "You're going through something really difficult. I'm here to support you.",
      follow_up_prompts: ["How can I help right now?"],
      internal_label: 'Divorce beginning',
      intervention_timing: 'When user shows severe stress'
    },
    urgency: 'critical',
    sensitive: true
  },

  R009_DIVORCE_WITH_CHILDREN: {
    id: 'R009',
    name: 'Divorce with Co-Parenting',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Divorce involving children',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 45, unit: 'percent', window: 21 }
    ],
    logic: 'IF (severe_stress) AND (sleep_devastated) AND (routine_shattered) THEN divorce_with_children_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "This is incredibly challenging. What do you need most right now?",
      follow_up_prompts: ["How are your kids handling things?"],
      internal_label: 'Divorce with children',
      intervention_timing: 'When user discusses family stress'
    },
    urgency: 'critical',
    sensitive: true
  },

  R010_AMICABLE_DIVORCE: {
    id: 'R010',
    name: 'Amicable Separation',
    planet: 'Venus',
    category: 'relationship',
    description: 'Peaceful divorce',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_moderate_drop) AND (routine_shifts) THEN amicable_divorce_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "You're navigating some changes. How's that going?",
      follow_up_prompts: ["Are you adjusting okay?"],
      internal_label: 'Amicable divorce',
      intervention_timing: 'When user discusses life transitions'
    },
    urgency: 'medium',
    sensitive: true
  },

  R011_DIVORCE_FINALIZATION_RELIEF: {
    id: 'R011',
    name: 'Post-Divorce Recovery',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Relief after toxic marriage ends',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_quality_improves) THEN divorce_relief_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "You seem like a weight's been lifted. What changed?",
      follow_up_prompts: ["How are you feeling about it?"],
      internal_label: 'Post-divorce relief',
      intervention_timing: 'When user discusses positive changes'
    },
    urgency: 'low',
    sensitive: true
  },

  // DATING & NEW RELATIONSHIPS
  R012_NEW_RELATIONSHIP_HONEYMOON: {
    id: 'R012',
    name: 'New Relationship Honeymoon Phase',
    planet: 'Venus',
    category: 'relationship',
    description: 'Exciting new relationship',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 8, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_improves) AND (activity_increases) THEN new_relationship_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "You seem energized lately! What's got you excited?",
      follow_up_prompts: ["Is there someone new in your life?"],
      internal_label: 'New relationship honeymoon',
      intervention_timing: 'When user seems happy and energized'
    },
    urgency: 'low',
    sensitive: false
  },

  R013_DATING_ANXIETY: {
    id: 'R013',
    name: 'Dating-Related Anxiety',
    planet: 'Mercury',
    category: 'relationship',
    description: 'Stress from dating',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (rhr_elevated) THEN dating_anxiety_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You seem a bit on edge. What's on your mind?",
      follow_up_prompts: ["Are you putting yourself out there socially?"],
      internal_label: 'Dating anxiety',
      intervention_timing: 'When user discusses social situations'
    },
    urgency: 'low',
    sensitive: false
  },

  R014_MOVING_IN_TOGETHER: {
    id: 'R014',
    name: 'Cohabitation Transition',
    planet: 'Venus',
    category: 'relationship',
    description: 'Moving in with partner',
    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'CHANGES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (routine_disruption) AND (sleep_pattern_shifts) THEN cohabitation_transition_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Your daily patterns are shifting. What's changing at home?",
      follow_up_prompts: ["Did you move recently?"],
      internal_label: 'Moving in with partner',
      intervention_timing: 'When user discusses living situation'
    },
    urgency: 'low',
    sensitive: false
  },

  R015_RELATIONSHIP_MILESTONE: {
    id: 'R015',
    name: 'Major Relationship Milestone',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Significant positive milestone',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_spike) AND (sleep_quality_improves) THEN relationship_milestone_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Something wonderful happened! Tell me about it!",
      follow_up_prompts: ["What are you celebrating?"],
      internal_label: 'Relationship milestone',
      intervention_timing: 'When user seems exceptionally happy'
    },
    urgency: 'low',
    sensitive: false
  },

  // FAMILY RELATIONSHIPS
  R016_FAMILY_CONFLICT: {
    id: 'R016',
    name: 'Family Relationship Strain',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Conflict with family',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 16, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN family_conflict_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [5, 21],
    silent_guidance: {
      discovery_question: "You seem stressed about something. What's weighing on you?",
      follow_up_prompts: ["How are things with your family?"],
      internal_label: 'Family relationship conflict',
      intervention_timing: 'When user mentions family or stress'
    },
    urgency: 'medium',
    sensitive: true
  },

  R017_LOSS_OF_FAMILY_MEMBER: {
    id: 'R017',
    name: 'Death of Family Member',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Grieving loss of family',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 28, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_collapses) AND (sleep_devastated) THEN family_loss_likely',
    confidence_threshold: 0.90,
    evidence_required: 3,
    false_positive_rate: 0.06,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "I can see you're going through something incredibly painful. I'm here.",
      follow_up_prompts: ["Do you want to talk about it?"],
      internal_label: 'Death of family member',
      intervention_timing: 'When user shows extreme grief'
    },
    urgency: 'critical',
    sensitive: true
  },

  R018_CARING_FOR_SICK_FAMILY: {
    id: 'R018',
    name: 'Family Caregiver Stress',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Caring for ill family member',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sleep_severely_disrupted) AND (hrv_chronic_drop) THEN caregiver_stress_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "You're carrying a heavy load. How can I help?",
      follow_up_prompts: ["Are you taking care of someone?"],
      internal_label: 'Family caregiver burden',
      intervention_timing: 'When user discusses family responsibilities'
    },
    urgency: 'high',
    sensitive: true
  },

  R019_FAMILY_ESTRANGEMENT: {
    id: 'R019',
    name: 'Family Estrangement',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Cutting ties with family',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN family_estrangement_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Sometimes the hardest decisions are about family. How are you processing this?",
      follow_up_prompts: ["Did you have to make a difficult choice?"],
      internal_label: 'Family estrangement',
      intervention_timing: 'When user discusses difficult family decisions'
    },
    urgency: 'high',
    sensitive: true
  },

  // LONG-DISTANCE & SEPARATION
  R020_LONG_DISTANCE_SEPARATION: {
    id: 'R020',
    name: 'Long-Distance Relationship Strain',
    planet: 'Neptune',
    category: 'relationship',
    description: 'Partner moving away',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN long_distance_strain_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Your rhythm seems off. Did something change with your partner?",
      follow_up_prompts: ["Are you doing long-distance now?"],
      internal_label: 'Long-distance relationship',
      intervention_timing: 'When user discusses relationships'
    },
    urgency: 'medium',
    sensitive: false
  },

  R021_PARTNER_TRAVEL_SEPARATION: {
    id: 'R021',
    name: 'Temporary Partner Separation',
    planet: 'Mercury',
    category: 'relationship',
    description: 'Partner traveling for work',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHANGES', threshold: 10, unit: 'percent', window: 3 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 8, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sleep_pattern_shifts) AND (routine_disruption) THEN temporary_separation_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [3, 21],
    silent_guidance: {
      discovery_question: "Your routine's been different. Is your partner away?",
      follow_up_prompts: ["How long will they be gone?"],
      internal_label: 'Partner travel',
      intervention_timing: 'When user mentions partner'
    },
    urgency: 'low',
    sensitive: false
  },

  R022_REUNION_AFTER_SEPARATION: {
    id: 'R022',
    name: 'Reunion After Long Separation',
    planet: 'Venus',
    category: 'relationship',
    description: 'Partner returning',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_quality_improves) THEN reunion_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Something good happened! Did someone come home?",
      follow_up_prompts: ["How does it feel to have them back?"],
      internal_label: 'Partner reunion',
      intervention_timing: 'When user seems happy'
    },
    urgency: 'low',
    sensitive: false
  },

  // PARENTING
  R023_NEW_PARENT_STRESS: {
    id: 'R023',
    name: 'New Parent Adjustment',
    planet: 'Moon',
    category: 'relationship',
    description: 'First-time parent stress',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sleep_devastated) AND (hrv_chronic_low) THEN new_parent_stress_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [14, 90],
    silent_guidance: {
      discovery_question: "Your body is telling me you're running on empty. New baby?",
      follow_up_prompts: ["How are you managing?"],
      internal_label: 'New parent exhaustion',
      intervention_timing: 'When user shows extreme sleep deprivation'
    },
    urgency: 'high',
    sensitive: false
  },

  R024_TEENAGE_PARENTING_STRESS: {
    id: 'R024',
    name: 'Parenting Teenager Stress',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Conflict with teenage children',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_sustained_drop) AND (sleep_quality_poor) THEN teen_parenting_stress_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "You seem worried about something ongoing. What's on your mind?",
      follow_up_prompts: ["How are things with your kids?"],
      internal_label: 'Teenage parenting stress',
      intervention_timing: 'When user discusses parenting'
    },
    urgency: 'medium',
    sensitive: true
  },

  R025_EMPTY_NEST_ADJUSTMENT: {
    id: 'R025',
    name: 'Empty Nest Transition',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Child leaving home',
    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (routine_shifts) AND (hrv_drops) THEN empty_nest_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "Your household dynamic seems different. Did someone move out?",
      follow_up_prompts: ["How are you adjusting?"],
      internal_label: 'Empty nest syndrome',
      intervention_timing: 'When user discusses kids'
    },
    urgency: 'medium',
    sensitive: false
  },

  R026_CO_PARENTING_CONFLICT: {
    id: 'R026',
    name: 'Co-Parenting Disagreement',
    planet: 'Mars',
    category: 'relationship',
    description: 'Conflict with ex over parenting',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (rhr_spikes) THEN coparenting_conflict_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're dealing with frustrating conflict. Want to talk?",
      follow_up_prompts: ["Is it about your kids?"],
      internal_label: 'Co-parenting conflict',
      intervention_timing: 'When user shows stress'
    },
    urgency: 'medium',
    sensitive: true
  },

  // RECONCILIATION
  R027_RELATIONSHIP_RECONCILIATION: {
    id: 'R027',
    name: 'Getting Back Together',
    planet: 'Venus',
    category: 'relationship',
    description: 'Reconciling with ex',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 16, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_quality_improves) THEN reconciliation_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Things seem to be looking up! What changed?",
      follow_up_prompts: ["Did you reconnect with someone?"],
      internal_label: 'Relationship reconciliation',
      intervention_timing: 'When user discusses relationships'
    },
    urgency: 'low',
    sensitive: false
  },

  R028_ON_AGAIN_OFF_AGAIN: {
    id: 'R028',
    name: 'Unstable Relationship Pattern',
    planet: 'Uranus',
    category: 'relationship',
    description: 'Cyclical breakup/makeup',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'routine_consistency', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (hrv_cycles) AND (sleep_cycles) THEN unstable_relationship_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "Your patterns have been really up and down. What's going on?",
      follow_up_prompts: ["Is your relationship stable?"],
      internal_label: 'On-again-off-again relationship',
      intervention_timing: 'When user shows cyclical patterns'
    },
    urgency: 'medium',
    sensitive: true
  },

  R029_REBUILDING_TRUST: {
    id: 'R029',
    name: 'Trust Rebuilding Process',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Working through betrayal',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DROPS', threshold: 8, unit: 'percent', window: 45 }
    ],
    logic: 'IF (hrv_slow_recovery) AND (sleep_slow_improvement) THEN trust_rebuilding_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "You're working through something difficult. How's that going?",
      follow_up_prompts: ["Are you rebuilding trust?"],
      internal_label: 'Trust rebuilding',
      intervention_timing: 'When user discusses relationship repair'
    },
    urgency: 'medium',
    sensitive: true
  },

  // COMPLEX SITUATIONS
  R030_INFIDELITY_DISCOVERY: {
    id: 'R030',
    name: 'Discovering Infidelity',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Discovering partner cheating',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 1 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 2 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 30, unit: 'percent', window: 3 }
    ],
    logic: 'IF (hrv_crashes_overnight) AND (rhr_severe_spike) THEN infidelity_discovery_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Something really difficult happened. I'm here if you need support.",
      follow_up_prompts: ["Do you want to talk about it?"],
      internal_label: 'Infidelity discovery',
      intervention_timing: 'When user shows emotional distress'
    },
    urgency: 'critical',
    sensitive: true
  },

  R031_AFFAIR_GUILT: {
    id: 'R031',
    name: 'Guilt from Infidelity',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Stress from having affair',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sleep_quality_chronic_poor) AND (hrv_sustained_low) THEN guilt_stress_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "Something seems to be weighing heavily on you. Want to talk?",
      follow_up_prompts: ["Are you dealing with guilt?"],
      internal_label: 'Infidelity guilt',
      intervention_timing: 'When user shows shame'
    },
    urgency: 'high',
    sensitive: true
  },

  R032_POLYAMORY_ADJUSTMENT: {
    id: 'R032',
    name: 'Polyamorous Relationship Adjustment',
    planet: 'Uranus',
    category: 'relationship',
    description: 'Transitioning to polyamory',
    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 22, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 14, unit: 'percent', window: 14 }
    ],
    logic: 'IF (routine_complexity) AND (hrv_adjustment_drop) THEN poly_adjustment_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "Your relationship dynamics seem to be evolving. How's that going?",
      follow_up_prompts: ["Are you navigating something new?"],
      internal_label: 'Polyamory adjustment',
      intervention_timing: 'When user discusses relationships'
    },
    urgency: 'low',
    sensitive: true
  },

  R033_DOMESTIC_VIOLENCE_VICTIM: {
    id: 'R033',
    name: 'Domestic Violence Pattern',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Repeated abuse pattern',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'CHRONIC_HIGH', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (hrv_chronically_suppressed) AND (sleep_chronically_poor) THEN domestic_violence_likely',
    confidence_threshold: 0.92,
    evidence_required: 3,
    false_positive_rate: 0.05,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "I'm noticing patterns that concern me. Are you safe?",
      follow_up_prompts: ["Do you need help or resources?"],
      internal_label: 'Domestic violence (urgent)',
      intervention_timing: 'When user shows chronic trauma'
    },
    urgency: 'critical',
    sensitive: true
  },

  R034_RELATIONSHIP_ULTIMATUM: {
    id: 'R034',
    name: 'Relationship Ultimatum Stress',
    planet: 'Mars',
    category: 'relationship',
    description: 'High-stakes decision point',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_acute_drop) AND (sleep_quality_drops) THEN ultimatum_stress_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're facing a big decision. What's on your mind?",
      follow_up_prompts: ["Are you at a crossroads?"],
      internal_label: 'Relationship ultimatum',
      intervention_timing: 'When user discusses major decisions'
    },
    urgency: 'high',
    sensitive: true
  },

  // PREGNANCY & FERTILITY
  R035_PREGNANCY_ANNOUNCEMENT: {
    id: 'R035',
    name: 'Positive Pregnancy Response',
    planet: 'Moon',
    category: 'relationship',
    description: 'Excitement from planned pregnancy',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHANGES', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_increases) THEN pregnancy_joy_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Something wonderful seems to be happening! What's new?",
      follow_up_prompts: ["Are you expecting?"],
      internal_label: 'Pregnancy announcement',
      intervention_timing: 'When user seems happy'
    },
    urgency: 'low',
    sensitive: false
  },

  R036_UNPLANNED_PREGNANCY_STRESS: {
    id: 'R036',
    name: 'Unplanned Pregnancy Stress',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Anxiety from unexpected pregnancy',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_crashes) THEN unplanned_pregnancy_stress_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You seem to be processing something big. What's happening?",
      follow_up_prompts: ["Did you get unexpected news?"],
      internal_label: 'Unplanned pregnancy stress',
      intervention_timing: 'When user shows acute stress'
    },
    urgency: 'high',
    sensitive: true
  },

  R037_FERTILITY_STRUGGLES: {
    id: 'R037',
    name: 'Infertility Treatment Stress',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Chronic stress from trying to conceive',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 60 },
      { behavior: 'restingHeartRate', operator: 'CHRONIC_HIGH', threshold: 10, unit: 'percent', window: 60 }
    ],
    logic: 'IF (hrv_chronically_suppressed) AND (sleep_cycles) THEN fertility_stress_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [60, 180],
    silent_guidance: {
      discovery_question: "You've been dealing with something ongoing. What's been tough?",
      follow_up_prompts: ["Are you trying to have a baby?"],
      internal_label: 'Fertility treatment stress',
      intervention_timing: 'When user discusses family planning'
    },
    urgency: 'medium',
    sensitive: true
  },

  R038_MISCARRIAGE_GRIEF: {
    id: 'R038',
    name: 'Pregnancy Loss',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Grief from miscarriage',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 26, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 24, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 32, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_collapses) THEN pregnancy_loss_likely',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [5, 21],
    silent_guidance: {
      discovery_question: "I can see you're grieving something profound. I'm so sorry.",
      follow_up_prompts: ["Do you want to talk about it?"],
      internal_label: 'Miscarriage',
      intervention_timing: 'When user shows grief'
    },
    urgency: 'critical',
    sensitive: true
  },

  R039_ADOPTION_PROCESS: {
    id: 'R039',
    name: 'Adoption Journey Stress',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Stress from adoption process',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 16, unit: 'percent', window: 60 },
      { behavior: 'restingHeartRate', operator: 'VOLATILE', threshold: 10, unit: 'percent', window: 60 }
    ],
    logic: 'IF (hrv_cycles) AND (sleep_cycles) THEN adoption_stress_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [60, 180],
    silent_guidance: {
      discovery_question: "You're on an emotional rollercoaster. What's the journey?",
      follow_up_prompts: ["Are you waiting for something big?"],
      internal_label: 'Adoption process',
      intervention_timing: 'When user discusses family planning'
    },
    urgency: 'medium',
    sensitive: false
  },

  // FRIEND RELATIONSHIPS
  R040_FRIENDSHIP_BREAKUP: {
    id: 'R040',
    name: 'Close Friendship Ending',
    planet: 'Venus',
    category: 'relationship',
    description: 'Loss of best friend',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 16, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN friendship_loss_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "It seems like you lost someone important. What happened?",
      follow_up_prompts: ["Did a friendship change?"],
      internal_label: 'Friendship ending',
      intervention_timing: 'When user discusses friendships'
    },
    urgency: 'medium',
    sensitive: true
  },

  R041_BETRAYAL_BY_FRIEND: {
    id: 'R041',
    name: 'Friend Betrayal',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Trust violation by friend',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 3 }
    ],
    logic: 'IF (hrv_acute_drop) AND (sleep_quality_crashes) THEN friend_betrayal_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "Someone you trusted hurt you. How are you processing that?",
      follow_up_prompts: ["What happened?"],
      internal_label: 'Friend betrayal',
      intervention_timing: 'When user shows acute pain'
    },
    urgency: 'high',
    sensitive: true
  },

  R042_NEW_CLOSE_FRIENDSHIP: {
    id: 'R042',
    name: 'Forming New Close Friendship',
    planet: 'Venus',
    category: 'relationship',
    description: 'Building meaningful friendship',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_improves) AND (activity_increases) THEN new_friendship_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "You seem more engaged lately! Made a new friend?",
      follow_up_prompts: ["Tell me about them!"],
      internal_label: 'New close friendship',
      intervention_timing: 'When user discusses relationships'
    },
    urgency: 'low',
    sensitive: false
  },

  R043_FRIEND_GROUP_CONFLICT: {
    id: 'R043',
    name: 'Social Group Drama',
    planet: 'Mars',
    category: 'relationship',
    description: 'Conflict within friend group',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN social_conflict_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Sounds like there's drama with friends. What's going on?",
      follow_up_prompts: ["How are you handling it?"],
      internal_label: 'Friend group conflict',
      intervention_timing: 'When user discusses social stress'
    },
    urgency: 'low',
    sensitive: false
  },

  R044_RECONNECTING_OLD_FRIEND: {
    id: 'R044',
    name: 'Old Friend Reconnection',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Positive reconnection with old friend',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_improves) AND (activity_up) THEN reconnection_likely',
    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.26,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Something nice happened! Did you reconnect with someone?",
      follow_up_prompts: ["Who was it?"],
      internal_label: 'Old friend reconnection',
      intervention_timing: 'When user discusses social events'
    },
    urgency: 'low',
    sensitive: false
  },

  // PET RELATIONSHIPS
  R045_PET_DEATH: {
    id: 'R045',
    name: 'Loss of Pet',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Grieving death of pet',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 18, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_disrupted) THEN pet_loss_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "I'm so sorry for your loss. Do you want to talk about them?",
      follow_up_prompts: ["What do you miss most?"],
      internal_label: 'Pet death',
      intervention_timing: 'When user shows grief'
    },
    urgency: 'high',
    sensitive: true
  },

  R046_NEW_PET_ADJUSTMENT: {
    id: 'R046',
    name: 'New Pet Adoption',
    planet: 'Venus',
    category: 'relationship',
    description: 'Routine adjustment from new pet',
    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'CHANGES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (routine_shifts) AND (activity_increases) THEN new_pet_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [7, 30],
    silent_guidance: {
      discovery_question: "Your routine changed! Did you get a new pet?",
      follow_up_prompts: ["Tell me about them!"],
      internal_label: 'New pet adoption',
      intervention_timing: 'When user discusses pets'
    },
    urgency: 'low',
    sensitive: false
  },

  R047_PET_ILLNESS_STRESS: {
    id: 'R047',
    name: 'Pet Health Crisis',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Stress from sick pet',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) THEN pet_illness_stress_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're worried about something. What's going on?",
      follow_up_prompts: ["Is your pet okay?"],
      internal_label: 'Pet illness stress',
      intervention_timing: 'When user discusses pets'
    },
    urgency: 'medium',
    sensitive: true
  },

  // ADVANCED/ANOMALY PATTERNS
  R048_GHOSTING_VICTIM: {
    id: 'R048',
    name: 'Being Ghosted',
    planet: 'Neptune',
    category: 'relationship',
    description: 'Partner suddenly cutting off contact',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 16, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 5 }
    ],
    logic: 'IF (hrv_acute_drop) AND (sleep_quality_crashes) THEN ghosting_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Someone disappeared on you. That's really confusing and hurtful.",
      follow_up_prompts: ["How are you making sense of it?"],
      internal_label: 'Being ghosted',
      intervention_timing: 'When user discusses confusion'
    },
    urgency: 'medium',
    sensitive: true
  },

  R049_STALKING_HARASSMENT: {
    id: 'R049',
    name: 'Stalking or Harassment',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Chronic fear from harassment',
    conditions: [
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 28, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'CHRONIC_HIGH', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (hrv_chronically_suppressed) AND (sleep_chronically_poor) THEN stalking_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "I'm concerned for your safety. Are you being threatened?",
      follow_up_prompts: ["Do you need help contacting authorities?"],
      internal_label: 'Stalking/harassment (urgent)',
      intervention_timing: 'When user shows chronic fear'
    },
    urgency: 'critical',
    sensitive: true
  },

  R050_ENGAGEMENT_BROKEN: {
    id: 'R050',
    name: 'Broken Engagement',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Called-off wedding',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 24, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 38, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_collapses) THEN broken_engagement_likely',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [5, 21],
    silent_guidance: {
      discovery_question: "This must be devastating. What happened with your wedding plans?",
      follow_up_prompts: ["How are you coping?"],
      internal_label: 'Broken engagement',
      intervention_timing: 'When user shows severe grief'
    },
    urgency: 'critical',
    sensitive: true
  },

  R051_PARTNER_INCARCERATION: {
    id: 'R051',
    name: 'Partner Incarceration',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Partner arrested or imprisoned',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 22, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 26, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_quality_collapses) THEN partner_incarceration_likely',
    confidence_threshold: 0.86,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [5, 21],
    silent_guidance: {
      discovery_question: "You're dealing with something really difficult. What's happening?",
      follow_up_prompts: ["Is your partner okay?"],
      internal_label: 'Partner incarceration',
      intervention_timing: 'When user shows trauma'
    },
    urgency: 'critical',
    sensitive: true
  },

  R052_PARTNER_MENTAL_HEALTH_CRISIS: {
    id: 'R052',
    name: 'Partner Mental Health Crisis',
    planet: 'Neptune',
    category: 'relationship',
    description: 'Partner experiencing severe episode',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 24, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_devastated) THEN partner_crisis_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're supporting someone through something serious. How are you holding up?",
      follow_up_prompts: ["Is your partner getting help?"],
      internal_label: 'Partner mental health crisis',
      intervention_timing: 'When user discusses partner health'
    },
    urgency: 'high',
    sensitive: true
  },

  R053_PARTNER_ADDICTION_DISCOVERY: {
    id: 'R053',
    name: 'Discovering Partner Addiction',
    planet: 'Pluto',
    category: 'relationship',
    description: 'Learning partner has addiction',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 24, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 16, unit: 'percent', window: 3 }
    ],
    logic: 'IF (hrv_crashes) AND (sleep_quality_collapses) THEN addiction_discovery_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [3, 14],
    silent_guidance: {
      discovery_question: "You found out something shocking. How are you processing it?",
      follow_up_prompts: ["What are you going to do?"],
      internal_label: 'Partner addiction discovery',
      intervention_timing: 'When user shows shock'
    },
    urgency: 'critical',
    sensitive: true
  },

  R054_RELATIONSHIP_ANNIVERSARY_STRESS: {
    id: 'R054',
    name: 'Difficult Anniversary',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Painful anniversary of event',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 16, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_acute_drop) AND (sleep_quality_drops) THEN difficult_anniversary_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [3, 7],
    silent_guidance: {
      discovery_question: "This time of year seems hard for you. What does it remind you of?",
      follow_up_prompts: ["Is this an anniversary of something painful?"],
      internal_label: 'Difficult anniversary',
      intervention_timing: 'When user shows cyclical grief'
    },
    urgency: 'medium',
    sensitive: true
  },

  R055_BLENDED_FAMILY_STRESS: {
    id: 'R055',
    name: 'Blended Family Adjustment',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Stress from combining families',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 21 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (hrv_sustained_drop) AND (routine_chaos) THEN blended_family_stress_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [21, 90],
    silent_guidance: {
      discovery_question: "Combining families is tough. How's everyone adjusting?",
      follow_up_prompts: ["What's been the hardest part?"],
      internal_label: 'Blended family stress',
      intervention_timing: 'When user discusses family'
    },
    urgency: 'medium',
    sensitive: true
  },

  R056_COMING_OUT_TO_FAMILY: {
    id: 'R056',
    name: 'Coming Out Stress',
    planet: 'Uranus',
    category: 'relationship',
    description: 'Revealing orientation/identity',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 14, unit: 'percent', window: 7 }
    ],
    logic: 'IF (hrv_severe_drop) AND (sleep_quality_crashes) THEN coming_out_stress_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You took a brave step recently. How did it go?",
      follow_up_prompts: ["How did your family react?"],
      internal_label: 'Coming out to family',
      intervention_timing: 'When user discusses identity'
    },
    urgency: 'high',
    sensitive: true
  },

  R057_RELATIONSHIP_THERAPY_PROGRESS: {
    id: 'R057',
    name: 'Couples Therapy Progress',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Positive improvement from counseling',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 45 },
      { behavior: 'routine_consistency', operator: 'GRADUALLY_IMPROVES', threshold: 18, unit: 'percent', window: 60 }
    ],
    logic: 'IF (hrv_slow_improvement) AND (sleep_quality_improves) THEN therapy_progress_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Things seem to be getting better. What's helping?",
      follow_up_prompts: ["Are you working on things together?"],
      internal_label: 'Relationship therapy progress',
      intervention_timing: 'When user discusses improvement'
    },
    urgency: 'low',
    sensitive: false
  },

  R058_HOLIDAY_FAMILY_STRESS: {
    id: 'R058',
    name: 'Holiday Family Dysfunction',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Stress from family gatherings',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 14, unit: 'percent', window: 5 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 5 }
    ],
    logic: 'IF (hrv_drops) AND (sleep_quality_drops) AROUND holidays THEN holiday_stress_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Family gatherings can be stressful. How are the holidays treating you?",
      follow_up_prompts: ["What's been difficult?"],
      internal_label: 'Holiday family stress',
      intervention_timing: 'When user discusses holidays'
    },
    urgency: 'low',
    sensitive: false
  },

  R059_REMARRIAGE_ADJUSTMENT: {
    id: 'R059',
    name: 'Remarriage After Divorce',
    planet: 'Jupiter',
    category: 'relationship',
    description: 'Getting married again',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (hrv_improves) AND (sleep_cycles) THEN remarriage_likely',
    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.24,
    detection_window: [14, 60],
    silent_guidance: {
      discovery_question: "Big changes in your relationship status! How are you feeling?",
      follow_up_prompts: ["Are you getting married again?"],
      internal_label: 'Remarriage after divorce',
      intervention_timing: 'When user discusses new marriage'
    },
    urgency: 'low',
    sensitive: false
  },

  R060_INFIDELITY_AFTERMATH: {
    id: 'R060',
    name: 'Recovering from Infidelity Together',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Couple working through affair aftermath',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 14, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 60 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DROPS', threshold: 10, unit: 'percent', window: 60 }
    ],
    logic: 'IF (hrv_cycles_but_improving) AND (sleep_slowly_improves) THEN infidelity_recovery_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [45, 120],
    silent_guidance: {
      discovery_question: "You're working through something really difficult together. How's the healing going?",
      follow_up_prompts: ["Are you both committed to rebuilding?"],
      internal_label: 'Infidelity recovery process',
      intervention_timing: 'When user discusses relationship repair'
    },
    urgency: 'medium',
    sensitive: true
  }
};
