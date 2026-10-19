// Lifestyle Patterns - 50 patterns covering habits, routines, hobbies, travel, self-care, spirituality, purpose, identity
// Pattern IDs: LIFE001-LIFE050

module.exports = {
  // Healthy Habits & Routines (10 patterns)
  LIFE001_MORNING_ROUTINE_ESTABLISHED: {
    id: 'LIFE001',
    name: 'Morning Routine Established',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Consistent morning ritual',
    conditions: [
      { behavior: 'wakeTimeConsistency', operator: 'IMPROVES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'morningActivity', operator: 'CONSISTENT', threshold: 80, unit: 'percent', window: 21 }
    ],
    logic: 'IF (consistent_wake) AND (routine_habits) THEN morning_routine',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Got a solid morning routine going?",
      follow_up_prompts: ["Consistency breeds success!"],
      internal_label: 'Morning routine',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE002_EXERCISE_HABIT_FORMING: {
    id: 'LIFE002',
    name: 'Exercise Habit Forming',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular exercise becoming habit',
    conditions: [
      { behavior: 'activeMinutes', operator: 'GRADUALLY_IMPROVES', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'exerciseFrequency', operator: 'INCREASES', threshold: 3, unit: 'days_per_week', window: 30 }
    ],
    logic: 'IF (increasing_activity) AND (consistency) THEN exercise_habit',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Exercise becoming a habit?",
      follow_up_prompts: ["Takes 66 days to form a habit. Keep going!"],
      internal_label: 'Exercise habit',
      intervention_timing: 'Positive reinforcement'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE003_MEDITATION_PRACTICE_START: {
    id: 'LIFE003',
    name: 'Starting Meditation Practice',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Beginning mindfulness routine',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DECREASES', threshold: 5, unit: 'bpm', window: 30 }
    ],
    logic: 'IF (parasympathetic_improvement) AND (new_practice) THEN meditation_start',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Started meditating?",
      follow_up_prompts: ["Meditation changes your nervous system. Powerful stuff!"],
      internal_label: 'Meditation start',
      intervention_timing: 'When practice begins'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE004_HEALTHY_EATING_SHIFT: {
    id: 'LIFE004',
    name: 'Healthy Eating Shift',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Diet improvement',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (overall_improvement) AND (nutrition_change) THEN diet_shift',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Eating healthier?",
      follow_up_prompts: ["Food is medicine. Your body is responding!"],
      internal_label: 'Diet improvement',
      intervention_timing: 'When changes detected'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE005_QUITTING_SMOKING: {
    id: 'LIFE005',
    name: 'Quitting Smoking',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Smoking cessation',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'DROPS', threshold: 8, unit: 'bpm', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (cardiovascular_improvement) AND (withdrawal) THEN smoking_cessation',
    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [14, 45],
    silent_guidance: {
      discovery_question: "Quit smoking?",
      follow_up_prompts: ["Huge! Your body is already healing."],
      internal_label: 'Smoking cessation',
      intervention_timing: 'Immediate support'
    },
    urgency: 'high',
    sensitive: false
  },

  LIFE006_HYDRATION_IMPROVEMENT: {
    id: 'LIFE006',
    name: 'Hydration Improvement',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Drinking more water',
    conditions: [
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 14 }
    ],
    logic: 'IF (hydration_markers) AND (improvement) THEN better_hydration',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Drinking more water?",
      follow_up_prompts: ["Hydration affects everything!"],
      internal_label: 'Hydration',
      intervention_timing: 'When detected'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE007_ALCOHOL_MODERATION: {
    id: 'LIFE007',
    name: 'Alcohol Moderation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Reducing alcohol consumption',
    conditions: [
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sleep_improvement) AND (reduced_drinking) THEN alcohol_reduction',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Cutting back on drinking?",
      follow_up_prompts: ["Your sleep and recovery scores show it!"],
      internal_label: 'Alcohol moderation',
      intervention_timing: 'Positive reinforcement'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE008_SCREEN_TIME_REDUCTION: {
    id: 'LIFE008',
    name: 'Screen Time Reduction',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Less device usage',
    conditions: [
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'bedtime', operator: 'EARLIER', threshold: 30, unit: 'minutes', window: 21 }
    ],
    logic: 'IF (earlier_sleep) AND (better_quality) THEN screen_reduction',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Using your phone less before bed?",
      follow_up_prompts: ["Blue light reduction helps sleep!"],
      internal_label: 'Screen reduction',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE009_STRETCHING_ROUTINE: {
    id: 'LIFE009',
    name: 'Stretching/Yoga Routine',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular flexibility practice',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 21 }
    ],
    logic: 'IF (flexibility_practice) AND (parasympathetic_boost) THEN stretching_routine',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Started stretching or yoga?",
      follow_up_prompts: ["Flexibility work is underrated!"],
      internal_label: 'Stretching routine',
      intervention_timing: 'When practice starts'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE010_JOURNALING_HABIT: {
    id: 'LIFE010',
    name: 'Journaling Habit',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular journaling practice',
    conditions: [
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 21 }
    ],
    logic: 'IF (emotional_processing) AND (stress_reduction) THEN journaling',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Journaling regularly?",
      follow_up_prompts: ["Writing processes emotions. Powerful practice!"],
      internal_label: 'Journaling',
      intervention_timing: 'When habit forms'
    },
    urgency: 'low',
    sensitive: false
  },

  // Hobbies & Passion (8 patterns)
  LIFE011_NEW_HOBBY_START: {
    id: 'LIFE011',
    name: 'Starting New Hobby',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Engaging new interest',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 21 }
    ],
    logic: 'IF (new_activity) AND (engagement) THEN new_hobby',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Picked up a new hobby?",
      follow_up_prompts: ["What is it? Hobbies add meaning!"],
      internal_label: 'New hobby',
      intervention_timing: 'When started'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE012_CREATIVE_PROJECT_IMMERSION: {
    id: 'LIFE012',
    name: 'Creative Project Immersion',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Deep in creative work',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 60, unit: 'minutes', window: 14 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (creative_absorption) AND (time_distortion) THEN creative_flow',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Deep into a creative project?",
      follow_up_prompts: ["Flow state is powerful but don't forget to sleep!"],
      internal_label: 'Creative immersion',
      intervention_timing: 'During project'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE013_LEARNING_NEW_SKILL: {
    id: 'LIFE013',
    name: 'Learning New Skill',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Skill acquisition phase',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (cognitive_engagement) AND (growth) THEN skill_learning',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Learning something new?",
      follow_up_prompts: ["Growth mindset in action!"],
      internal_label: 'Skill learning',
      intervention_timing: 'During learning'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE014_MUSICAL_PRACTICE: {
    id: 'LIFE014',
    name: 'Musical Practice Routine',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular music practice',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'CONSISTENT', threshold: 75, unit: 'percent', window: 30 }
    ],
    logic: 'IF (music_practice) AND (consistency) THEN musical_routine',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Practicing music regularly?",
      follow_up_prompts: ["Music is therapeutic!"],
      internal_label: 'Music practice',
      intervention_timing: 'When routine forms'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE015_READING_HABIT: {
    id: 'LIFE015',
    name: 'Reading Habit Forming',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular reading practice',
    conditions: [
      { behavior: 'bedtime', operator: 'EARLIER', threshold: 30, unit: 'minutes', window: 21 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 21 }
    ],
    logic: 'IF (reading_before_bed) AND (better_sleep) THEN reading_habit',
    confidence_threshold: 0.73,
    evidence_required: 2,
    false_positive_rate: 0.23,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Reading before bed?",
      follow_up_prompts: ["Better than scrolling!"],
      internal_label: 'Reading habit',
      intervention_timing: 'When habit forms'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE016_GARDENING_PRACTICE: {
    id: 'LIFE016',
    name: 'Gardening Hobby',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular gardening',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 30 }
    ],
    logic: 'IF (outdoor_activity) AND (grounding) THEN gardening',
    confidence_threshold: 0.72,
    evidence_required: 2,
    false_positive_rate: 0.24,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Gardening?",
      follow_up_prompts: ["Dirt therapy is real!"],
      internal_label: 'Gardening',
      intervention_timing: 'Seasonal'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE017_COOKING_ENTHUSIASM: {
    id: 'LIFE017',
    name: 'Cooking/Baking Interest',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'New cooking passion',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 21 }
    ],
    logic: 'IF (culinary_engagement) AND (creative_outlet) THEN cooking_hobby',
    confidence_threshold: 0.71,
    evidence_required: 2,
    false_positive_rate: 0.25,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Into cooking lately?",
      follow_up_prompts: ["Cooking is creative and nourishing!"],
      internal_label: 'Cooking hobby',
      intervention_timing: 'When interest emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE018_PHOTOGRAPHY_PASSION: {
    id: 'LIFE018',
    name: 'Photography Hobby',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Photo enthusiast',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'outdoorTime', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 30 }
    ],
    logic: 'IF (exploration) AND (creative_output) THEN photography',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Taking lots of photos?",
      follow_up_prompts: ["Photography gets you out exploring!"],
      internal_label: 'Photography',
      intervention_timing: 'When hobby emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  // Travel & Adventure (6 patterns)
  LIFE019_VACATION_RECOVERY: {
    id: 'LIFE019',
    name: 'Post-Vacation Recovery',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Returning from vacation',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (post_travel) AND (adjustment) THEN vacation_recovery',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Back from vacation?",
      follow_up_prompts: ["Post-vacation blues are real. Be gentle with yourself."],
      internal_label: 'Vacation recovery',
      intervention_timing: 'First week back'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE020_PRE_VACATION_STRESS: {
    id: 'LIFE020',
    name: 'Pre-Vacation Stress',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Travel prep anxiety',
    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (pre_travel) AND (preparation_stress) THEN vacation_anxiety',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Stressed about upcoming trip?",
      follow_up_prompts: ["Pre-travel anxiety is common. Lists help!"],
      internal_label: 'Pre-vacation stress',
      intervention_timing: 'Week before travel'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE021_ACTIVE_VACATION: {
    id: 'LIFE021',
    name: 'Active Vacation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Adventure travel',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'steps', operator: 'SPIKE', threshold: 60, unit: 'percent', window: 7 }
    ],
    logic: 'IF (extreme_activity) AND (travel_timing) THEN active_vacation',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "On an adventure trip?",
      follow_up_prompts: ["Active vacations are exhausting but awesome!"],
      internal_label: 'Active vacation',
      intervention_timing: 'During trip'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE022_RELAXATION_VACATION: {
    id: 'LIFE022',
    name: 'Relaxation Vacation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Rest and recovery trip',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (deep_rest) AND (vacation_timing) THEN relaxation_trip',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "On a relaxing vacation?",
      follow_up_prompts: ["Rest is productive! Enjoy it."],
      internal_label: 'Relaxation vacation',
      intervention_timing: 'During trip'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE023_BUSINESS_TRAVEL_STRESS: {
    id: 'LIFE023',
    name: 'Business Travel Fatigue',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Work travel exhaustion',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 7 }
    ],
    logic: 'IF (travel_fatigue) AND (work_context) THEN business_travel',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Business travel wearing you down?",
      follow_up_prompts: ["Work travel is exhausting. Prioritize sleep!"],
      internal_label: 'Business travel',
      intervention_timing: 'During travel'
    },
    urgency: 'medium',
    sensitive: false
  },

  LIFE024_LONG_TERM_TRAVEL: {
    id: 'LIFE024',
    name: 'Long-Term Travel/Nomad Life',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Extended travel period',
    conditions: [
      { behavior: 'sleepSchedule', operator: 'VOLATILE', threshold: 90, unit: 'minutes', window: 30 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (prolonged_displacement) AND (nomadic_pattern) THEN long_travel',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Traveling long-term?",
      follow_up_prompts: ["Digital nomad life is freedom and chaos!"],
      internal_label: 'Long-term travel',
      intervention_timing: 'Extended period'
    },
    urgency: 'low',
    sensitive: false
  },

  // Self-Care & Wellness (8 patterns)
  LIFE025_SPA_SELF_CARE: {
    id: 'LIFE025',
    name: 'Spa/Self-Care Day',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Intentional self-care',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 15, unit: 'percent', window: 1 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 2 }
    ],
    logic: 'IF (relaxation_event) AND (recovery_boost) THEN self_care',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Spa day or self-care time?",
      follow_up_prompts: ["You deserve it!"],
      internal_label: 'Self-care',
      intervention_timing: 'After event'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE026_BURNOUT_RECOVERY: {
    id: 'LIFE026',
    name: 'Burnout Recovery Period',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Recovering from burnout',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 2, unit: 'hours', window: 30 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (rest_period) AND (gradual_healing) THEN burnout_recovery',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Taking time to recover from burnout?",
      follow_up_prompts: ["Burnout recovery takes time. Be patient."],
      internal_label: 'Burnout recovery',
      intervention_timing: 'Recovery period'
    },
    urgency: 'medium',
    sensitive: true
  },

  LIFE027_DIGITAL_DETOX: {
    id: 'LIFE027',
    name: 'Digital Detox',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Unplugging from tech',
    conditions: [
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (tech_break) AND (nervous_system_recovery) THEN digital_detox',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Taking a break from screens?",
      follow_up_prompts: ["Digital detox is restorative!"],
      internal_label: 'Digital detox',
      intervention_timing: 'During detox'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE028_NATURE_IMMERSION: {
    id: 'LIFE028',
    name: 'Nature Immersion',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Extended time outdoors',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (outdoor_time) AND (grounding) THEN nature_therapy',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Spending lots of time in nature?",
      follow_up_prompts: ["Nature therapy is powerful!"],
      internal_label: 'Nature immersion',
      intervention_timing: 'During outdoor period'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE029_MASSAGE_THERAPY: {
    id: 'LIFE029',
    name: 'Regular Massage Therapy',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Bodywork practice',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (bodywork) AND (parasympathetic_activation) THEN massage_therapy',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Getting regular massages?",
      follow_up_prompts: ["Bodywork is healthcare!"],
      internal_label: 'Massage therapy',
      intervention_timing: 'When routine established'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE030_SABBATICAL_START: {
    id: 'LIFE030',
    name: 'Sabbatical Beginning',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Extended break from work',
    conditions: [
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 90, unit: 'minutes', window: 14 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 }
    ],
    logic: 'IF (work_cessation) AND (unstructured_time) THEN sabbatical',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "On sabbatical?",
      follow_up_prompts: ["Sabbaticals are for exploration and rest. Enjoy!"],
      internal_label: 'Sabbatical',
      intervention_timing: 'Start of break'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE031_STAYCATION: {
    id: 'LIFE031',
    name: 'Staycation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Time off at home',
    conditions: [
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 60, unit: 'minutes', window: 7 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 }
    ],
    logic: 'IF (time_off) AND (no_travel) THEN staycation',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Staycation week?",
      follow_up_prompts: ["Sometimes staying home is the best vacation!"],
      internal_label: 'Staycation',
      intervention_timing: 'During break'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE032_WELLNESS_RETREAT: {
    id: 'LIFE032',
    name: 'Wellness Retreat',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Dedicated wellness program',
    conditions: [
      { behavior: 'hrv', operator: 'SPIKE', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (intensive_wellness) AND (dramatic_improvement) THEN retreat',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "At a wellness retreat?",
      follow_up_prompts: ["Immersive wellness experiences transform!"],
      internal_label: 'Wellness retreat',
      intervention_timing: 'During retreat'
    },
    urgency: 'low',
    sensitive: false
  },

  // Spirituality & Purpose (8 patterns)
  LIFE033_SPIRITUAL_AWAKENING: {
    id: 'LIFE033',
    name: 'Spiritual Awakening',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Spiritual transformation',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (identity_shift) AND (spiritual_emergence) THEN awakening',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Going through a spiritual shift?",
      follow_up_prompts: ["Spiritual awakenings are destabilizing and beautiful."],
      internal_label: 'Spiritual awakening',
      intervention_timing: 'During emergence'
    },
    urgency: 'medium',
    sensitive: true
  },

  LIFE034_RELIGIOUS_PRACTICE_DEEPENING: {
    id: 'LIFE034',
    name: 'Deepening Religious Practice',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Increased faith engagement',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (spiritual_practice) AND (wellbeing_improvement) THEN faith_deepening',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Faith practice deepening?",
      follow_up_prompts: ["Spiritual practice brings peace."],
      internal_label: 'Faith deepening',
      intervention_timing: 'During deepening'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE035_EXISTENTIAL_CRISIS: {
    id: 'LIFE035',
    name: 'Existential Crisis',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Meaning and purpose questioning',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (meaning_crisis) AND (psychological_distress) THEN existential_crisis',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Questioning the meaning of it all?",
      follow_up_prompts: ["Existential crises hurt but lead to growth."],
      internal_label: 'Existential crisis',
      intervention_timing: 'During crisis'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE036_PURPOSE_DISCOVERY: {
    id: 'LIFE036',
    name: 'Purpose Discovery',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Finding life purpose',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 22, unit: 'percent', window: 30 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (meaning_found) AND (engagement_surge) THEN purpose_discovery',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Found your purpose?",
      follow_up_prompts: ["Purpose changes everything!"],
      internal_label: 'Purpose discovery',
      intervention_timing: 'When discovered'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE037_VOLUNTEER_ENGAGEMENT: {
    id: 'LIFE037',
    name: 'Volunteer Work Engagement',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Service to others',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 21 }
    ],
    logic: 'IF (service) AND (purpose_fulfillment) THEN volunteering',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Volunteering somewhere?",
      follow_up_prompts: ["Service is good for the soul!"],
      internal_label: 'Volunteering',
      intervention_timing: 'When engagement starts'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE038_GRATITUDE_PRACTICE: {
    id: 'LIFE038',
    name: 'Gratitude Practice',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Regular gratitude ritual',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 30 }
    ],
    logic: 'IF (positive_psychology) AND (sustained_improvement) THEN gratitude_practice',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Practicing gratitude daily?",
      follow_up_prompts: ["Gratitude rewires your brain!"],
      internal_label: 'Gratitude practice',
      intervention_timing: 'When practice forms'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE039_PHILOSOPHICAL_STUDY: {
    id: 'LIFE039',
    name: 'Philosophical Study',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Engaging with philosophy',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (intellectual_engagement) AND (meaning_seeking) THEN philosophy',
    confidence_threshold: 0.72,
    evidence_required: 2,
    false_positive_rate: 0.24,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Diving into philosophy?",
      follow_up_prompts: ["Philosophy helps us live examined lives."],
      internal_label: 'Philosophy study',
      intervention_timing: 'During study'
    },
    urgency: 'low',
    sensitive: false
  },

  LIFE040_PSYCHEDELIC_INTEGRATION: {
    id: 'LIFE040',
    name: 'Psychedelic Experience Integration',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Processing psychedelic journey',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (consciousness_shift) AND (integration_process) THEN psychedelic_integration',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Integrating a psychedelic experience?",
      follow_up_prompts: ["Integration is where the real work happens."],
      internal_label: 'Psychedelic integration',
      intervention_timing: 'Post-journey'
    },
    urgency: 'medium',
    sensitive: true
  },

  // Identity & Life Transitions (10 patterns)
  LIFE041_QUARTER_LIFE_CRISIS: {
    id: 'LIFE041',
    name: 'Quarter-Life Crisis',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Early adult identity crisis',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 28, unit: 'percent', window: 30 }
    ],
    logic: 'IF (20s_30s) AND (direction_questioning) THEN quarter_life_crisis',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Questioning your life direction?",
      follow_up_prompts: ["Quarter-life crises are painful but productive."],
      internal_label: 'Quarter-life crisis',
      intervention_timing: 'During crisis'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE042_MIDLIFE_TRANSITION: {
    id: 'LIFE042',
    name: 'Midlife Transition',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Midlife reassessment',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 60 }
    ],
    logic: 'IF (midlife) AND (reevaluation) THEN midlife_transition',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Midlife reevaluation happening?",
      follow_up_prompts: ["Midlife transitions are opportunities for reinvention."],
      internal_label: 'Midlife transition',
      intervention_timing: 'During transition'
    },
    urgency: 'medium',
    sensitive: true
  },

  LIFE043_GENDER_IDENTITY_EXPLORATION: {
    id: 'LIFE043',
    name: 'Gender Identity Exploration',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Gender journey',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 30, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 28, unit: 'percent', window: 45 }
    ],
    logic: 'IF (identity_questioning) AND (gender_exploration) THEN gender_journey',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Exploring your gender identity?",
      follow_up_prompts: ["Gender exploration is brave. You deserve support."],
      internal_label: 'Gender exploration',
      intervention_timing: 'During exploration'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE044_SEXUAL_ORIENTATION_DISCOVERY: {
    id: 'LIFE044',
    name: 'Sexual Orientation Discovery',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Orientation realization',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 30 }
    ],
    logic: 'IF (identity_realization) AND (orientation) THEN coming_out_process',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Discovering your orientation?",
      follow_up_prompts: ["Your authentic self deserves to exist."],
      internal_label: 'Orientation discovery',
      intervention_timing: 'During discovery'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE045_CAREER_IDENTITY_SHIFT: {
    id: 'LIFE045',
    name: 'Career Identity Shift',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Professional identity change',
    conditions: [
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (professional_transition) AND (identity_reconstruction) THEN career_identity_shift',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Redefining yourself professionally?",
      follow_up_prompts: ["Career isn't who you are, but transitions still shake identity."],
      internal_label: 'Career identity',
      intervention_timing: 'During transition'
    },
    urgency: 'medium',
    sensitive: false
  },

  LIFE046_BECOMING_PARENT_IDENTITY: {
    id: 'LIFE046',
    name: 'Parent Identity Formation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Becoming a parent',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 3, unit: 'hours', window: 30 },
      { behavior: 'activeMinutes', operator: 'VOLATILE', threshold: 35, unit: 'percent', window: 30 }
    ],
    logic: 'IF (new_parent) AND (identity_shift) THEN parent_identity',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [21, 60],
    silent_guidance: {
      discovery_question: "Adjusting to being a parent?",
      follow_up_prompts: ["Parenthood rewrites your identity. It's massive."],
      internal_label: 'Parent identity',
      intervention_timing: 'New parent period'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE047_EMPTY_NEST_IDENTITY: {
    id: 'LIFE047',
    name: 'Empty Nest Identity Shift',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Redefining self post-kids',
    conditions: [
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 22, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'VOLATILE', threshold: 20, unit: 'percent', window: 45 }
    ],
    logic: 'IF (kids_leaving) AND (identity_reconstruction) THEN empty_nest_identity',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Who are you now that kids are gone?",
      follow_up_prompts: ["Empty nest is about rediscovering yourself."],
      internal_label: 'Empty nest identity',
      intervention_timing: 'After kids leave'
    },
    urgency: 'medium',
    sensitive: true
  },

  LIFE048_DISABILITY_ACCEPTANCE: {
    id: 'LIFE048',
    name: 'Disability Identity Acceptance',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Accepting disability identity',
    conditions: [
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 60 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 18, unit: 'percent', window: 60 }
    ],
    logic: 'IF (disability) AND (acceptance_process) THEN disability_acceptance',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Coming to terms with disability?",
      follow_up_prompts: ["Disability is an identity. Acceptance takes time."],
      internal_label: 'Disability acceptance',
      intervention_timing: 'Acceptance journey'
    },
    urgency: 'medium',
    sensitive: true
  },

  LIFE049_SOBRIETY_IDENTITY: {
    id: 'LIFE049',
    name: 'Sober Identity Formation',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Building sober self',
    conditions: [
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sobriety) AND (identity_building) THEN sober_identity',
    confidence_threshold: 0.84,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Building your sober identity?",
      follow_up_prompts: ["Sobriety isn't just quitting. It's becoming someone new."],
      internal_label: 'Sober identity',
      intervention_timing: 'Recovery journey'
    },
    urgency: 'high',
    sensitive: true
  },

  LIFE050_CULTURAL_RECONNECTION: {
    id: 'LIFE050',
    name: 'Cultural Identity Reconnection',
    planet: 'Mars',
    category: 'lifestyle',
    description: 'Reconnecting with heritage',
    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 45 }
    ],
    logic: 'IF (cultural_exploration) AND (belonging_found) THEN cultural_reconnection',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Reconnecting with your cultural roots?",
      follow_up_prompts: ["Cultural reconnection is healing!"],
      internal_label: 'Cultural reconnection',
      intervention_timing: 'During reconnection'
    },
    urgency: 'low',
    sensitive: false
  }
};
