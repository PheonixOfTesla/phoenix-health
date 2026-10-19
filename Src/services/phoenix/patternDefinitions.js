/**
 * PHOENIX AI PATTERN DEFINITIONS
 *
 * The 50 core life patterns detectable from behavioral data alone.
 * Based on "Limited Variables Theory": ~20 core behaviors → ~50 life patterns → ~350 sequences
 *
 * Each pattern uses simple IF/THEN conditional logic to detect behavioral signatures.
 */

const LIFE_PATTERNS = {
  // ================================
  // RELATIONSHIP PATTERNS (Saturn)
  // ================================

  P001_RELATIONSHIP_BREAKUP: {
    id: 'P001',
    name: 'Relationship Disruption',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Significant relationship ending or major disruption',

    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'social_activity', operator: 'CHANGES', threshold: 30, unit: 'percent', window: 7 }
    ],

    logic: 'IF (hrv_drops_15%+ IN 3_days) AND (sleep_drops_12%+ IN 3_days) AND (routine_chaos IN 7_days) THEN relationship_disruption_likely',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [2, 7], // Days 2-7 after event

    silent_guidance: {
      internal_label: 'relationship_disruption_detected',
      discovery_question: 'I notice your sleep and routine have shifted this week. How have things been going?',
      follow_up_prompts: [
        'Want to talk about what\'s been on your mind?',
        'Have there been any changes in your personal life?',
        'Sometimes stress shows up in our metrics before we fully process it.'
      ],
      intervention_timing: 'When user mentions feeling off/tired/stressed'
    },

    predictions: {
      next_week: 'Recovery scores may stay in 60-70 range',
      next_month: 'Pattern typically persists for 2-4 weeks',
      recovery_timeline: '3-6 weeks for metrics to normalize'
    },

    recommendations: [
      'Keep workouts light (walks, yoga, stretching)',
      'Prioritize 8+ hours of sleep',
      'Reduce training intensity by 30-40%',
      'Focus on stress management activities'
    ]
  },

  P002_NEW_RELATIONSHIP: {
    id: 'P002',
    name: 'New Relationship Started',
    planet: 'Saturn',
    category: 'relationship',
    description: 'Beginning of new romantic relationship',

    conditions: [
      { behavior: 'hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 7 },
      { behavior: 'mood', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'DECREASES', threshold: 8, unit: 'percent', window: 5 },
      { behavior: 'routine_consistency', operator: 'CHANGES', threshold: 20, unit: 'percent', window: 7 }
    ],

    logic: 'IF (hrv_up AND mood_up) AND (sleep_slightly_down) AND (routine_changes) THEN new_relationship_likely',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [3, 14],

    silent_guidance: {
      internal_label: 'new_relationship_detected',
      discovery_question: 'Your metrics look great! Something good happening in your life?',
      follow_up_prompts: [
        'I notice your HRV is elevated - that\'s a good sign!',
        'Changes in routine can be exciting. What\'s new?'
      ],
      intervention_timing: 'When user seems energized/positive'
    }
  },

  P003_MOVING_RELOCATION: {
    id: 'P003',
    name: 'Moving/Relocation',
    planet: 'Saturn',
    category: 'life_change',
    description: 'Physical relocation or moving homes',

    conditions: [
      { behavior: 'location_consistency', operator: 'DROPS', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'FLUCTUATES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'stress_markers', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 }
    ],

    logic: 'IF (location_chaos AND routine_disruption) AND (sleep_irregular) THEN moving_likely',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [0, 10]
  },

  // ================================
  // WORK PATTERNS (Earth)
  // ================================

  P004_JOB_STRESS_SPIKE: {
    id: 'P004',
    name: 'Acute Job Stress',
    planet: 'Earth',
    category: 'work_stress',
    description: 'Sudden increase in work-related stress',

    conditions: [
      { behavior: 'work_hours', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 },
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 8, unit: 'bpm', window: 5 }
    ],

    logic: 'IF (work_hours_up_20%+) AND (hrv_down + rhr_up) THEN acute_job_stress',

    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [1, 5],
    urgency: 'medium',

    silent_guidance: {
      internal_label: 'work_stress_detected',
      discovery_question: 'I see some elevated stress markers. How\'s work been lately?',
      follow_up_prompts: [
        'Sometimes work pressure shows up in our recovery metrics.',
        'Any big deadlines or projects happening?'
      ],
      intervention_timing: 'When user mentions work or productivity'
    },

    recommendations: [
      'Maintain consistent sleep schedule',
      'Short stress-relief breaks during workday',
      'Light exercise to manage cortisol levels',
      'Consider scaling back workout intensity by 20%'
    ]
  },

  P005_JOB_CHANGE: {
    id: 'P005',
    name: 'Job Change/New Role',
    planet: 'Earth',
    category: 'career',
    description: 'New job or major role transition',

    conditions: [
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'location_consistency', operator: 'CHANGES', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'sleep_timing', operator: 'SHIFTS', threshold: 1.5, unit: 'hours', window: 14 },
      { behavior: 'stress_markers', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 14 }
    ],

    logic: 'IF (routine_chaos AND location_change) AND (sleep_timing_shift) THEN job_change_likely',

    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 21]
  },

  P006_PROMOTION_INCREASED_RESPONSIBILITY: {
    id: 'P006',
    name: 'Promotion/Increased Responsibility',
    planet: 'Earth',
    category: 'career',
    description: 'Career advancement with increased workload',

    conditions: [
      { behavior: 'work_hours', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14, sustained: true },
      { behavior: 'stress_markers', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'mood', operator: 'MIXED', patterns: ['stress_up', 'confidence_up'], window: 14 },
      { behavior: 'exercise_frequency', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],

    logic: 'IF (sustained_work_increase AND stress_up) AND (mixed_mood signals) THEN promotion_likely',

    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [7, 30]
  },

  // ================================
  // HEALTH PATTERNS (Mercury)
  // ================================

  P007_ILLNESS_ONSET: {
    id: 'P007',
    name: 'Illness/Infection Onset',
    planet: 'Mercury',
    category: 'acute_health',
    description: 'Acute illness or infection beginning',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'bpm', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 25, unit: 'percent', window: 2 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 3 }
    ],

    logic: 'IF (rhr_spikes AND hrv_crashes) AND (recovery_tanks) THEN illness_imminent',

    confidence_threshold: 0.85,
    evidence_required: 3,
    false_positive_rate: 0.08,
    detection_window: [0, 3],
    urgency: 'high',
    predictive: true, // Can detect before symptoms

    silent_guidance: {
      internal_label: 'illness_onset_detected',
      discovery_question: 'Your recovery metrics are showing some stress. How are you feeling physically?',
      follow_up_prompts: [
        'Sometimes our body shows signs of illness before we notice symptoms.',
        'Consider taking it easy for a day or two.',
        'Your immune system might be working hard right now.'
      ],
      intervention_timing: 'Immediately - preventive guidance'
    },

    recommendations: [
      'Prioritize rest and sleep (8-9 hours)',
      'Skip workouts for 2-3 days',
      'Stay hydrated',
      'Monitor for symptoms',
      'Consider immune support (vitamin C, zinc)'
    ]
  },

  P008_BURNOUT_PROGRESSION: {
    id: 'P008',
    name: 'Burnout State',
    planet: 'Mercury',
    category: 'chronic_stress',
    description: 'Chronic burnout condition developing',

    conditions: [
      { behavior: 'recoveryScore', operator: 'BELOW', threshold: 60, unit: 'score', window: 14, consecutive: true },
      { behavior: 'hrv', operator: 'BELOW_BASELINE', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'sleepDuration', operator: 'POOR', threshold: 70, unit: 'quality', window: 14 },
      { behavior: 'motivation', operator: 'DROPS', threshold: 30, unit: 'percent', window: 14 }
    ],

    logic: 'IF (recovery<60 FOR 14_days) AND (chronic_hrv_suppression) THEN burnout_state',

    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [10, 21],
    urgency: 'critical',

    recommendations: [
      'Immediate reduction in all stressors',
      'Consider taking time off work',
      'Medical consultation recommended',
      'Complete training pause for 1-2 weeks',
      'Focus on restorative activities only'
    ]
  },

  P009_RECOVERY_FROM_ILLNESS: {
    id: 'P009',
    name: 'Illness Recovery Phase',
    planet: 'Mercury',
    category: 'recovery',
    description: 'Recovering from acute illness',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'NORMALIZING', from_elevated: true, window: 5 },
      { behavior: 'hrv', operator: 'INCREASING', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'recoveryScore', operator: 'IMPROVING', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_INCREASING', threshold: 20, unit: 'percent', window: 7 }
    ],

    logic: 'IF (rhr_normalizing AND hrv_rising) AND (recovery_improving) THEN illness_recovery_phase',

    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [3, 10]
  },

  // ================================
  // FITNESS PATTERNS (Venus)
  // ================================

  P010_INJURY_IMMINENT: {
    id: 'P010',
    name: 'Injury Risk Elevated',
    planet: 'Venus',
    category: 'injury_risk',
    description: 'High risk of training injury',

    conditions: [
      { behavior: 'workout_volume', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepDuration', operator: 'BELOW', threshold: 7, unit: 'hours', window: 5 },
      { behavior: 'consecutive_workouts', operator: 'ABOVE', threshold: 4, unit: 'days', window: 7 }
    ],

    logic: 'IF (volume_spike AND poor_recovery) AND (sleep_debt AND no_rest_days) THEN injury_risk_high',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [3, 7],
    urgency: 'high',
    predictive: true,

    silent_guidance: {
      internal_label: 'injury_risk_elevated',
      discovery_question: 'Your training load is up but recovery is down. How\'s your body feeling?',
      follow_up_prompts: [
        'Any soreness or unusual aches?',
        'When was your last rest day?',
        'Sometimes backing off prevents bigger setbacks.'
      ],
      intervention_timing: 'Before next workout'
    },

    recommendations: [
      'Take 1-2 rest days immediately',
      'Reduce training volume by 40%',
      'Focus on mobility and recovery work',
      'Prioritize 8+ hours of sleep',
      'Monitor for pain or discomfort closely'
    ]
  },

  P011_ACTIVE_INJURY: {
    id: 'P011',
    name: 'Training Injury Occurred',
    planet: 'Venus',
    category: 'injury',
    description: 'Active training injury detected',

    conditions: [
      { behavior: 'workout_frequency', operator: 'DROPS_SUDDENLY', threshold: 60, unit: 'percent', window: 3 },
      { behavior: 'strain', operator: 'DROPS', threshold: 50, unit: 'percent', window: 3 },
      { behavior: 'mood', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'sleep_quality', operator: 'VARIABLE', threshold: 20, unit: 'percent', window: 5 }
    ],

    logic: 'IF (sudden_training_cessation) AND (strain_collapse) THEN injury_occurred',

    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.10,
    detection_window: [0, 3]
  },

  P012_TRAINING_PLATEAU: {
    id: 'P012',
    name: 'Training Plateau',
    planet: 'Venus',
    category: 'performance',
    description: 'Performance stagnation despite consistent training',

    conditions: [
      { behavior: 'performance_metrics', operator: 'FLAT', threshold: 5, unit: 'percent', window: 21 },
      { behavior: 'workout_frequency', operator: 'CONSISTENT', threshold: 90, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'STABLE', threshold: 10, unit: 'percent', window: 21 }
    ],

    logic: 'IF (no_performance_change FOR 3_weeks) AND (training_consistent) THEN plateau_reached',

    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [14, 30]
  },

  P013_PR_ACHIEVEMENT: {
    id: 'P013',
    name: 'Personal Record Achievement',
    planet: 'Venus',
    category: 'performance',
    description: 'Significant performance breakthrough',

    conditions: [
      { behavior: 'performance_spike', operator: 'DETECTED', threshold: 10, unit: 'percent', window: 1 },
      { behavior: 'recoveryScore', operator: 'HIGH', threshold: 80, unit: 'score', recent: true },
      { behavior: 'training_consistency', operator: 'HIGH', threshold: 85, unit: 'percent', window: 30 },
      { behavior: 'mood', operator: 'ELEVATED', threshold: 15, unit: 'percent', window: 3 }
    ],

    logic: 'IF (performance_breakthrough) AND (recent_good_recovery AND consistent_training) THEN pr_achieved',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [0, 2]
  },

  // ================================
  // FINANCIAL PATTERNS (Jupiter)
  // ================================

  P014_FINANCIAL_STRESS: {
    id: 'P014',
    name: 'Financial Stress Event',
    planet: 'Jupiter',
    category: 'financial_stress',
    description: 'Unexpected financial stressor',

    conditions: [
      { behavior: 'spending', operator: 'SPIKES', threshold: 150, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'sleep_quality', operator: 'POOR', threshold: 70, unit: 'quality', window: 5 },
      { behavior: 'stress_markers', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 }
    ],

    logic: 'IF (large_unexpected_expense) AND (stress_markers_spike) THEN financial_stress',

    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [0, 5]
  },

  P015_IMPULSE_SPENDING_PATTERN: {
    id: 'P015',
    name: 'Stress-Driven Spending',
    planet: 'Jupiter',
    category: 'coping_behavior',
    description: 'Emotional/stress-driven spending',

    conditions: [
      { behavior: 'hrv', operator: 'BELOW', threshold: 40, unit: 'ms', window: 1 },
      { behavior: 'spending', operator: 'ABOVE_BASELINE', threshold: 50, unit: 'percent', window: 1 },
      { behavior: 'transaction_category', operator: 'MATCHES', value: ['retail', 'dining', 'entertainment'] },
      { behavior: 'mood', operator: 'LOW', threshold: 60, unit: 'score', window: 1 }
    ],

    logic: 'IF (stressed_today) AND (spending_spike ON non_essentials) THEN impulse_spending',

    confidence_threshold: 0.65,
    evidence_required: 2,
    false_positive_rate: 0.25,
    detection_window: [0, 1],
    recurring: true
  },

  // ================================
  // ROUTINE PATTERNS (Saturn)
  // ================================

  P016_MAJOR_ROUTINE_DISRUPTION: {
    id: 'P016',
    name: 'Major Routine Disruption',
    planet: 'Saturn',
    category: 'routine',
    description: 'Significant disruption to daily patterns',

    conditions: [
      { behavior: 'location_consistency', operator: 'DROPS', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'time_consistency', operator: 'DROPS', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'sleep_timing', operator: 'VARIES', threshold: 2, unit: 'hours', window: 7 }
    ],

    logic: 'IF (not_where_expected AND not_when_expected) THEN major_routine_disruption',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [2, 7]
  },

  P017_TRAVEL_DETECTED: {
    id: 'P017',
    name: 'Travel Period',
    planet: 'Saturn',
    category: 'travel',
    description: 'User traveling or away from home',

    conditions: [
      { behavior: 'location_consistency', operator: 'CHANGES', threshold: 60, unit: 'percent', window: 2 },
      { behavior: 'sleep_timing', operator: 'SHIFTS', threshold: 2, unit: 'hours', window: 2 },
      { behavior: 'routine_consistency', operator: 'DROPS', threshold: 50, unit: 'percent', window: 5 }
    ],

    logic: 'IF (location_change AND sleep_shift) AND (routine_chaos) THEN travel_period',

    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.10,
    detection_window: [0, 3]
  },

  // ================================
  // GOAL PATTERNS (Mars)
  // ================================

  P018_GOAL_MOMENTUM: {
    id: 'P018',
    name: 'Goal Momentum Building',
    planet: 'Mars',
    category: 'goal_progress',
    description: 'Strong progress toward goals',

    conditions: [
      { behavior: 'goal_progress', operator: 'ACCELERATING', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'workout_frequency', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'consistency_score', operator: 'ABOVE', threshold: 80, unit: 'percent', window: 14 }
    ],

    logic: 'IF (progress_accelerating AND consistency_high) THEN momentum_building',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [7, 14]
  },

  P019_GOAL_STALLING: {
    id: 'P019',
    name: 'Goal Progress Stalling',
    planet: 'Mars',
    category: 'goal_struggle',
    description: 'Goals losing momentum',

    conditions: [
      { behavior: 'goal_progress', operator: 'FLAT', threshold: 5, unit: 'percent', window: 14 },
      { behavior: 'workout_frequency', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'motivation', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],

    logic: 'IF (no_progress AND activity_drops) AND (motivation_declining) THEN goal_stalling',

    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 14]
  },

  // ================================
  // SOCIAL PATTERNS (Uranus)
  // ================================

  P020_SOCIAL_WITHDRAWAL: {
    id: 'P020',
    name: 'Social Withdrawal',
    planet: 'Uranus',
    category: 'social',
    description: 'Reduced social engagement',

    conditions: [
      { behavior: 'social_activity', operator: 'DROPS', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'mood', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'energy_level', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 }
    ],

    logic: 'IF (social_events_drop AND mood_drops) THEN social_withdrawal',

    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [5, 14]
  },

  P021_INCREASED_SOCIAL_ACTIVITY: {
    id: 'P021',
    name: 'Social Activity Spike',
    planet: 'Uranus',
    category: 'social',
    description: 'Significant increase in social engagement',

    conditions: [
      { behavior: 'social_activity', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'sleep_timing', operator: 'DELAYS', threshold: 1.5, unit: 'hours', window: 7 },
      { behavior: 'recoveryScore', operator: 'VARIABLE', threshold: 20, unit: 'percent', window: 7 }
    ],

    logic: 'IF (social_activity_spike) AND (later_bedtimes) THEN increased_social_period',

    confidence_threshold: 0.72,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [2, 7]
  },

  // ================================
  // SLEEP PATTERNS (Mercury)
  // ================================

  P022_SLEEP_DEBT_ACCUMULATION: {
    id: 'P022',
    name: 'Sleep Debt Building',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Chronic insufficient sleep',

    conditions: [
      { behavior: 'sleepDuration', operator: 'BELOW', threshold: 7, unit: 'hours', window: 5, consecutive: true },
      { behavior: 'recoveryScore', operator: 'DECLINING', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'sleep_consistency', operator: 'POOR', threshold: 70, unit: 'score', window: 7 }
    ],

    logic: 'IF (chronic_short_sleep AND recovery_declining) THEN sleep_debt_accumulating',

    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.10,
    detection_window: [3, 7]
  },

  P023_WEEKEND_DISRUPTION_PATTERN: {
    id: 'P023',
    name: 'Weekend Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Recurring weekend sleep pattern changes',

    conditions: [
      { behavior: 'sleep_timing', operator: 'SHIFTS', threshold: 2, unit: 'hours', day: 'weekend' },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 10, unit: 'percent', day: 'monday' },
      { behavior: 'screen_time', operator: 'INCREASES', threshold: 30, unit: 'percent', day: 'weekend' }
    ],

    logic: 'IF (weekend_sleep_shift AND monday_recovery_drop) THEN weekend_disruption',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [2, 5],
    recurring: true
  },

  P024_SLEEP_IMPROVEMENT: {
    id: 'P024',
    name: 'Sleep Quality Improving',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Sustained improvement in sleep patterns',

    conditions: [
      { behavior: 'sleepDuration', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleep_consistency', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'TRENDING_UP', threshold: 12, unit: 'percent', window: 14 }
    ],

    logic: 'IF (sleep_duration_up AND consistency_up) THEN sleep_improving',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.12,
    detection_window: [7, 14]
  },

  // ================================
  // RECOVERY PATTERNS (Mercury)
  // ================================

  P025_FUNCTIONAL_OVERREACHING: {
    id: 'P025',
    name: 'Functional Overreaching',
    planet: 'Mercury',
    category: 'training_stress',
    description: 'Intentional training overload',

    conditions: [
      { behavior: 'workout_volume', operator: 'HIGH', threshold: 120, unit: 'percent_baseline', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'performance', operator: 'MAINTAINING', threshold: 10, unit: 'percent', window: 14 }
    ],

    logic: 'IF (high_volume AND recovery_down) BUT (performance_maintained) THEN functional_overreaching',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [7, 14]
  },

  P026_SUPERCOMPENSATION: {
    id: 'P026',
    name: 'Supercompensation Phase',
    planet: 'Mercury',
    category: 'adaptation',
    description: 'Recovery adaptation after training stress',

    conditions: [
      { behavior: 'recoveryScore', operator: 'SPIKES', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'previous_load', operator: 'WAS_HIGH', threshold: 110, unit: 'percent', window_ago: 7 },
      { behavior: 'sleep_quality', operator: 'GOOD', threshold: 80, unit: 'quality', window: 5 }
    ],

    logic: 'IF (recovery_spike AFTER high_load_period) AND (sleep_good) THEN supercompensation',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.12,
    detection_window: [3, 7]
  },

  // ================================
  // NUTRITION PATTERNS (Venus)
  // ================================

  P027_MEAL_TIMING_SHIFT: {
    id: 'P027',
    name: 'Meal Timing Disruption',
    planet: 'Venus',
    category: 'nutrition',
    description: 'Changes in eating schedule',

    conditions: [
      { behavior: 'meal_timing', operator: 'VARIES', threshold: 2, unit: 'hours', window: 7 },
      { behavior: 'energy_level', operator: 'FLUCTUATES', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleep_quality', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 }
    ],

    logic: 'IF (meal_times_inconsistent AND energy_unstable) THEN meal_timing_disruption',

    confidence_threshold: 0.65,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [3, 7]
  },

  // ================================
  // SUBSTANCE USE PATTERNS
  // ================================

  P028_CAFFEINE_DEPENDENCE_INCREASE: {
    id: 'P028',
    name: 'Increased Caffeine Use',
    planet: 'Mercury',
    category: 'substance',
    description: 'Rising caffeine consumption',

    conditions: [
      { behavior: 'caffeine_intake', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'energy_level', operator: 'VARIABLE', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleep_quality', operator: 'DECLINING', threshold: 12, unit: 'percent', window: 14 }
    ],

    logic: 'IF (caffeine_up AND energy_unstable) AND (sleep_declining) THEN caffeine_dependence',

    confidence_threshold: 0.70,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 14]
  },

  P029_ALCOHOL_PATTERN_INCREASE: {
    id: 'P029',
    name: 'Increased Alcohol Consumption',
    planet: 'Saturn',
    category: 'substance',
    description: 'Rising alcohol use',

    conditions: [
      { behavior: 'hrv', operator: 'VARIABLE', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleep_quality', operator: 'POOR', threshold: 70, unit: 'quality', window: 14 },
      { behavior: 'recovery_variability', operator: 'HIGH', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 14 }
    ],

    logic: 'IF (hrv_variable AND poor_sleep) AND (recovery_inconsistent) THEN possible_alcohol_increase',

    confidence_threshold: 0.65,
    evidence_required: 3,
    false_positive_rate: 0.25,
    detection_window: [7, 14]
  },

  // ================================
  // MENSTRUAL CYCLE PATTERNS
  // ================================

  P030_PREMENSTRUAL_PHASE: {
    id: 'P030',
    name: 'Premenstrual Phase',
    planet: 'Venus',
    category: 'hormonal',
    description: 'Luteal phase/PMS patterns',

    conditions: [
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'mood', operator: 'VARIABLE', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'energy_level', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'cycle_timing', operator: 'MATCHES', phase: 'luteal' }
    ],

    logic: 'IF (hrv_drop AND mood_variable) AND (cycle_phase_luteal) THEN premenstrual_detected',

    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [5, 10],
    recurring: true,
    female_only: true
  },

  // ================================
  // PREGNANCY/POSTPARTUM PATTERNS
  // ================================

  P031_PREGNANCY_DETECTED: {
    id: 'P031',
    name: 'Possible Pregnancy',
    planet: 'Venus',
    category: 'life_stage',
    description: 'Early pregnancy indicators',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'SUSTAINED_INCREASE', threshold: 10, unit: 'bpm', window: 21, consecutive: true },
      { behavior: 'hrv', operator: 'PATTERN_CHANGE', type: 'sustained_lower', window: 21 },
      { behavior: 'exercise_tolerance', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'energy_level', operator: 'DROPS', threshold: 25, unit: 'percent', window: 21 }
    ],

    logic: 'IF (sustained_rhr_increase_21_days AND hrv_pattern_change) THEN possible_pregnancy',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [14, 30],
    sensitive: true,
    female_only: true
  },

  // ================================
  // STRESS & ANXIETY PATTERNS
  // ================================

  P032_ANXIETY_EPISODE: {
    id: 'P032',
    name: 'Acute Anxiety Episode',
    planet: 'Mercury',
    category: 'mental_health',
    description: 'Heightened anxiety period',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 3 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'sleep_quality', operator: 'POOR', threshold: 65, unit: 'quality', window: 5 },
      { behavior: 'breathing_rate', operator: 'ELEVATED', threshold: 12, unit: 'percent', window: 3 }
    ],

    logic: 'IF (rhr_up AND hrv_down AND breathing_rate_up) THEN anxiety_episode',

    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [1, 5],
    urgency: 'medium'
  },

  P033_DEPRESSION_INDICATORS: {
    id: 'P033',
    name: 'Depression Indicators',
    planet: 'Mercury',
    category: 'mental_health',
    description: 'Behavioral patterns consistent with depression',

    conditions: [
      { behavior: 'activity_level', operator: 'DROPS', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'sleep_duration', operator: 'ABNORMAL', patterns: ['excessive', 'insufficient'], window: 21 },
      { behavior: 'social_activity', operator: 'DROPS', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'motivation', operator: 'VERY_LOW', threshold: 40, unit: 'score', window: 21 }
    ],

    logic: 'IF (low_activity AND sleep_abnormal AND social_withdrawal) THEN depression_indicators',

    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [14, 30],
    urgency: 'high',
    sensitive: true
  },

  // ================================
  // SEASONAL PATTERNS
  // ================================

  P034_SEASONAL_AFFECTIVE_PATTERN: {
    id: 'P034',
    name: 'Seasonal Mood Changes',
    planet: 'Mercury',
    category: 'seasonal',
    description: 'Winter/low-light mood changes',

    conditions: [
      { behavior: 'energy_level', operator: 'DROPS', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'mood', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'sleep_duration', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'season', operator: 'IS', value: ['late_fall', 'winter'] }
    ],

    logic: 'IF (energy_drop AND mood_drop) AND (increased_sleep IN winter) THEN seasonal_pattern',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    recurring: true
  },

  // ================================
  // AGE-RELATED PATTERNS
  // ================================

  P035_PERIMENOPAUSE_PATTERN: {
    id: 'P035',
    name: 'Perimenopause Indicators',
    planet: 'Venus',
    category: 'hormonal',
    description: 'Perimenopausal transition patterns',

    conditions: [
      { behavior: 'hrv_variability', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'sleep_disruption', operator: 'FREQUENT', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'temperature_regulation', operator: 'VARIABLE', threshold: 25, unit: 'percent', window: 60 },
      { behavior: 'age', operator: 'BETWEEN', value: [40, 55] }
    ],

    logic: 'IF (hrv_variable AND sleep_disrupted) AND (age_appropriate) THEN perimenopause_likely',

    confidence_threshold: 0.68,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [30, 90],
    female_only: true
  },

  // ================================
  // HABIT FORMATION PATTERNS
  // ================================

  P036_NEW_HABIT_FORMING: {
    id: 'P036',
    name: 'New Habit Establishing',
    planet: 'Mars',
    category: 'behavior_change',
    description: 'New positive habit forming',

    conditions: [
      { behavior: 'new_activity_consistency', operator: 'HIGH', threshold: 80, unit: 'percent', window: 21 },
      { behavior: 'routine_integration', operator: 'IMPROVING', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'motivation', operator: 'MAINTAINED', threshold: 70, unit: 'score', window: 21 }
    ],

    logic: 'IF (consistent_new_activity FOR 21_days) AND (routine_integration) THEN habit_forming',

    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [14, 30]
  },

  P037_HABIT_BREAKING: {
    id: 'P037',
    name: 'Habit Breaking/Slipping',
    planet: 'Mars',
    category: 'behavior_change',
    description: 'Established habit declining',

    conditions: [
      { behavior: 'habit_consistency', operator: 'DROPS', threshold: 40, unit: 'percent', window: 14 },
      { behavior: 'motivation', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'external_stress', operator: 'PRESENT', window: 14 }
    ],

    logic: 'IF (consistency_drop AND motivation_drop) THEN habit_breaking',

    confidence_threshold: 0.72,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 14]
  },

  // ================================
  // PRODUCTIVITY PATTERNS
  // ================================

  P038_HIGH_PRODUCTIVITY_PHASE: {
    id: 'P038',
    name: 'Peak Productivity Period',
    planet: 'Earth',
    category: 'productivity',
    description: 'High performance work state',

    conditions: [
      { behavior: 'work_output', operator: 'HIGH', threshold: 120, unit: 'percent_baseline', window: 14 },
      { behavior: 'focus_time', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'MAINTAINED', threshold: 70, unit: 'score', window: 14 },
      { behavior: 'mood', operator: 'POSITIVE', threshold: 75, unit: 'score', window: 14 }
    ],

    logic: 'IF (high_output AND good_recovery) AND (positive_mood) THEN peak_productivity',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [7, 14]
  },

  P039_PROCRASTINATION_PATTERN: {
    id: 'P039',
    name: 'Procrastination/Avoidance',
    planet: 'Earth',
    category: 'productivity',
    description: 'Work avoidance behavior',

    conditions: [
      { behavior: 'work_initiation_delay', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'distraction_activity', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'anxiety_markers', operator: 'PRESENT', window: 7 }
    ],

    logic: 'IF (delayed_start AND increased_distractions) THEN procrastination_pattern',

    confidence_threshold: 0.68,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [3, 7]
  },

  // ================================
  // CHRONIC CONDITION PATTERNS
  // ================================

  P040_CHRONIC_PAIN_FLARE: {
    id: 'P040',
    name: 'Chronic Pain Flare-Up',
    planet: 'Mercury',
    category: 'chronic_health',
    description: 'Chronic pain condition worsening',

    conditions: [
      { behavior: 'activity_level', operator: 'DROPS', threshold: 30, unit: 'percent', window: 5 },
      { behavior: 'sleep_quality', operator: 'POOR', threshold: 65, unit: 'quality', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 5 },
      { behavior: 'medication_use', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 5 }
    ],

    logic: 'IF (activity_drop AND poor_sleep) AND (hrv_down) THEN pain_flare',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [2, 7]
  },

  // ================================
  // ADDITIONAL CRITICAL PATTERNS
  // ================================

  P041_DEHYDRATION_PATTERN: {
    id: 'P041',
    name: 'Dehydration Indicators',
    planet: 'Mercury',
    category: 'hydration',
    description: 'Chronic under-hydration',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 6, unit: 'bpm', window: 5 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 5 },
      { behavior: 'recovery_efficiency', operator: 'POOR', threshold: 70, unit: 'score', window: 5 },
      { behavior: 'performance', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 }
    ],

    logic: 'IF (rhr_up AND hrv_down) AND (poor_recovery AND performance_drop) THEN dehydration',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [2, 5]
  },

  P042_OVERTRAINING_SYNDROME: {
    id: 'P042',
    name: 'Overtraining Syndrome',
    planet: 'Venus',
    category: 'training_stress',
    description: 'Non-functional overreaching/overtraining',

    conditions: [
      { behavior: 'performance', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 },
      { behavior: 'workout_volume', operator: 'HIGH', threshold: 120, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'CHRONICALLY_LOW', threshold: 65, unit: 'score', window: 21 },
      { behavior: 'mood', operator: 'DECLINING', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'motivation', operator: 'LOW', threshold: 50, unit: 'score', window: 21 }
    ],

    logic: 'IF (performance_declining AND high_volume) AND (chronic_low_recovery) THEN overtraining',

    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.08,
    detection_window: [14, 30],
    urgency: 'critical'
  },

  P043_COMPETITION_PREPARATION: {
    id: 'P043',
    name: 'Competition/Event Preparation',
    planet: 'Mars',
    category: 'performance',
    description: 'Training for specific event',

    conditions: [
      { behavior: 'training_specificity', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'workout_intensity', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 21 },
      { behavior: 'motivation', operator: 'HIGH', threshold: 80, unit: 'score', window: 21 },
      { behavior: 'focus_metrics', operator: 'TIGHT', threshold: 85, unit: 'score', window: 21 }
    ],

    logic: 'IF (specific_training AND intensity_up) AND (high_motivation) THEN event_preparation',

    confidence_threshold: 0.75,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [14, 30]
  },

  P044_POST_COMPETITION_RECOVERY: {
    id: 'P044',
    name: 'Post-Event Recovery',
    planet: 'Venus',
    category: 'recovery',
    description: 'Recovery from competition/major event',

    conditions: [
      { behavior: 'training_load', operator: 'DROPS_SHARPLY', threshold: 60, unit: 'percent', window: 5 },
      { behavior: 'previous_load', operator: 'WAS_VERY_HIGH', threshold: 140, unit: 'percent', window_ago: 7 },
      { behavior: 'recoveryScore', operator: 'IMPROVING', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'mood', operator: 'VARIABLE', patterns: ['relief', 'letdown'], window: 7 }
    ],

    logic: 'IF (sudden_load_drop AFTER high_event) AND (recovery_improving) THEN post_event_recovery',

    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [0, 7]
  },

  P045_MEDICATION_START: {
    id: 'P045',
    name: 'New Medication Effects',
    planet: 'Mercury',
    category: 'medical',
    description: 'Physiological changes from new medication',

    conditions: [
      { behavior: 'hrv_pattern', operator: 'SUDDEN_CHANGE', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'restingHeartRate', operator: 'SUDDEN_CHANGE', threshold: 10, unit: 'bpm', window: 5 },
      { behavior: 'sleep_architecture', operator: 'CHANGES', threshold: 25, unit: 'percent', window: 7 },
      { behavior: 'energy_level', operator: 'SUDDEN_CHANGE', threshold: 25, unit: 'percent', window: 7 }
    ],

    logic: 'IF (multiple_sudden_metric_changes) AND (no_other_pattern_match) THEN medication_effect',

    confidence_threshold: 0.65,
    evidence_required: 3,
    false_positive_rate: 0.25,
    detection_window: [2, 10],
    sensitive: true
  },

  P046_ALLERGY_SEASON: {
    id: 'P046',
    name: 'Seasonal Allergies Active',
    planet: 'Mercury',
    category: 'seasonal',
    description: 'Allergy symptoms affecting metrics',

    conditions: [
      { behavior: 'sleep_quality', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'respiratory_rate', operator: 'ELEVATED', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'season', operator: 'IS', value: ['spring', 'fall'] }
    ],

    logic: 'IF (sleep_quality_drop AND respiratory_changes) IN allergy_season THEN allergies_active',

    confidence_threshold: 0.70,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [3, 10],
    recurring: true
  },

  P047_NIGHT_SHIFT_ADJUSTMENT: {
    id: 'P047',
    name: 'Night Shift/Schedule Change',
    planet: 'Earth',
    category: 'circadian',
    description: 'Adapting to night shift or major schedule change',

    conditions: [
      { behavior: 'sleep_timing', operator: 'SHIFTS_MAJOR', threshold: 6, unit: 'hours', window: 7 },
      { behavior: 'circadian_disruption', operator: 'HIGH', threshold: 80, unit: 'score', window: 14 },
      { behavior: 'recoveryScore', operator: 'POOR', threshold: 65, unit: 'score', window: 14 },
      { behavior: 'mood', operator: 'VARIABLE', threshold: 30, unit: 'percent', window: 14 }
    ],

    logic: 'IF (major_sleep_timing_shift AND circadian_disruption) THEN shift_work_detected',

    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [3, 14]
  },

  P048_VACATION_MODE: {
    id: 'P048',
    name: 'Vacation/Time Off',
    planet: 'Saturn',
    category: 'lifestyle',
    description: 'Vacation or extended time off',

    conditions: [
      { behavior: 'work_activity', operator: 'DROPS', threshold: 80, unit: 'percent', window: 5 },
      { behavior: 'location_consistency', operator: 'CHANGES', threshold: 60, unit: 'percent', window: 7 },
      { behavior: 'routine_flexibility', operator: 'HIGH', threshold: 80, unit: 'percent', window: 7 },
      { behavior: 'stress_markers', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 }
    ],

    logic: 'IF (no_work AND location_change) AND (routine_flexible AND stress_low) THEN vacation_mode',

    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.10,
    detection_window: [2, 7]
  },

  P049_RETURN_TO_WORK: {
    id: 'P049',
    name: 'Return to Work After Break',
    planet: 'Earth',
    category: 'transition',
    description: 'Returning to work after time off',

    conditions: [
      { behavior: 'work_activity', operator: 'RESUMES', from_zero: true, window: 3 },
      { behavior: 'routine_consistency', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 5 },
      { behavior: 'stress_markers', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 5 },
      { behavior: 'mood', operator: 'DROPS', threshold: 12, unit: 'percent', window: 5 }
    ],

    logic: 'IF (work_resumes AND routine_returns) AND (stress_rises) THEN return_to_work',

    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [0, 5]
  },

  P050_LIFE_SATISFACTION_HIGH: {
    id: 'P050',
    name: 'High Life Satisfaction Period',
    planet: 'All',
    category: 'wellbeing',
    description: 'Overall life satisfaction and balance',

    conditions: [
      { behavior: 'recoveryScore', operator: 'CONSISTENTLY_HIGH', threshold: 75, unit: 'score', window: 30 },
      { behavior: 'mood', operator: 'POSITIVE', threshold: 75, unit: 'score', window: 30 },
      { behavior: 'goal_progress', operator: 'POSITIVE', threshold: 70, unit: 'percent', window: 30 },
      { behavior: 'stress_markers', operator: 'LOW', threshold: 40, unit: 'score', window: 30 },
      { behavior: 'consistency_all_domains', operator: 'HIGH', threshold: 75, unit: 'percent', window: 30 }
    ],

    logic: 'IF (high_recovery AND positive_mood AND goals_progressing) AND (low_stress) THEN life_satisfaction_high',

    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.10,
    detection_window: [21, 60]
  },

  // ================================
  // NEW PATTERNS FROM CLAUDE ANALYSIS
  // Discovered from 1,000 life simulations (Nov 2025)
  // ================================

  P051_SLEEP_DEBT_ACCUMULATION: {
    id: 'P051',
    name: 'Sleep Debt Accumulation',
    planet: 'Mercury',
    category: 'health',
    description: 'Chronic sleep debt building over consecutive nights, triggering physiological cascade',

    conditions: [
      { behavior: 'sleepDuration', operator: 'BELOW', threshold: 6.5, unit: 'hours', window: 3 },
      { behavior: 'hrv', operator: 'DROPS_FROM_BASELINE', threshold: 12, unit: 'percent', window: 3 },
      { behavior: 'restingHeartRate', operator: 'INCREASES_FROM_BASELINE', threshold: 5, unit: 'percent', window: 3 }
    ],

    logic: 'IF (sleep < 6.5hrs for 3+ nights) AND (HRV drops 12%) THEN sleep_debt_cascade',

    confidence_threshold: 0.89,
    evidence_required: 2,
    false_positive_rate: 0.08,
    detection_window: [3, 7],

    silent_guidance: {
      internal_label: 'sleep_debt_accumulating',
      discovery_question: 'I notice your sleep has been shorter than usual this week. How have you been feeling?',
      follow_up_prompts: [
        'What\'s been keeping you up?',
        'Have you noticed any changes in your energy levels?',
        'Your body might be telling you it needs more recovery time.'
      ],
      intervention_timing: 'Day 3 optimal, Day 7 critical'
    },

    predictions: {
      next_week: 'If continues, HRV will drop additional 8-10%',
      cascade_timeline: 'Self-reinforcing after 7 days',
      recovery_needed: '2-3 nights of 8+ hours to reverse'
    },

    urgency: 'medium',
    predictive: true
  },

  P052_WEEKEND_RECOVERY_EFFECT: {
    id: 'P052',
    name: 'Weekend Recovery Effect',
    planet: 'Mercury',
    category: 'health',
    description: 'Temporary weekend recovery that doesn\'t address underlying weekday stress',

    conditions: [
      { behavior: 'weekend_hrv', operator: 'INCREASES', threshold: 8, unit: 'percent', window: 2 },
      { behavior: 'weekend_sleep', operator: 'INCREASES', threshold: 45, unit: 'minutes', window: 2 },
      { behavior: 'wednesday_metrics_decline', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 7 }
    ],

    logic: 'IF (weekend HRV +8% AND sleep +47min) BUT (benefits gone by Wednesday) THEN unsustainable_pattern',

    confidence_threshold: 0.92,
    evidence_required: 2,
    false_positive_rate: 0.05,
    detection_window: [7, 14],

    silent_guidance: {
      internal_label: 'weekend_recovery_insufficient',
      discovery_question: 'I see you recover well on weekends, but it doesn\'t seem to carry through the week. What\'s going on during weekdays?',
      follow_up_prompts: [
        'What makes weekdays different?',
        'Have you noticed this pattern yourself?',
        'What would help you bring some of that weekend recovery into your week?'
      ],
      intervention_timing: 'After 2-3 cycles detected'
    },

    predictions: {
      pattern_persistence: 'Chronic if underlying weekday stress not addressed',
      health_impact: 'Long-term chronic stress despite weekend respite',
      recommendation: 'Need sustainable weekday interventions, not just weekend recovery'
    },

    urgency: 'medium',
    predictive: false
  },

  P053_HRV_VOLATILITY_STRESS: {
    id: 'P053',
    name: 'HRV Volatility Stress',
    planet: 'Mercury',
    category: 'stress',
    description: 'High day-to-day HRV variability indicating stress dysregulation',

    conditions: [
      { behavior: 'hrv_volatility', operator: 'ABOVE', threshold: 14, unit: 'percent', window: 7 },
      { behavior: 'hrv_mean', operator: 'DROPS_FROM_BASELINE', threshold: 10, unit: 'percent', window: 7 }
    ],

    logic: 'IF (HRV daily swings > 14%) THEN stress_dysregulation (even if mean appears normal)',

    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.12,
    detection_window: [5, 10],

    silent_guidance: {
      internal_label: 'stress_dysregulation_detected',
      discovery_question: 'Your HRV has been fluctuating more than usual lately. Has anything been feeling unpredictable or stressful?',
      follow_up_prompts: [
        'How stable does life feel right now?',
        'Sometimes our bodies show stress before we consciously feel it.',
        'What\'s been the most variable part of your days?'
      ],
      intervention_timing: 'After 7 days of high volatility'
    },

    predictions: {
      health_impact: 'Autonomic nervous system dysregulation',
      recovery_needed: 'Requires stress reduction, not just rest',
      timeline: 'Can persist for weeks if stressor not addressed'
    },

    urgency: 'medium',
    predictive: false
  },

  P054_ACTIVITY_SLEEP_SPIRAL: {
    id: 'P054',
    name: 'Activity-Sleep Downward Spiral',
    planet: 'Venus',
    category: 'health',
    description: 'Bidirectional loop: low activity → poor sleep → lower activity',

    conditions: [
      { behavior: 'steps', operator: 'DROPS_FROM_BASELINE', threshold: 20, unit: 'percent', window: 3 },
      { behavior: 'sleepScore', operator: 'DROPS_FROM_BASELINE', threshold: 15, unit: 'percent', window: 3 },
      { behavior: 'steps_further_decline', operator: 'TRUE', threshold: 10, unit: 'percent', window: 7 }
    ],

    logic: 'IF (activity drops) AND (sleep worsens) AND (activity drops further) THEN downward_spiral',

    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [5, 10],

    silent_guidance: {
      internal_label: 'activity_sleep_loop_detected',
      discovery_question: 'I notice both your activity and sleep have been down. Which one do you think started first?',
      follow_up_prompts: [
        'Sometimes poor sleep makes us less active, which then makes sleep worse.',
        'What would feel easier to tackle first - movement or sleep?',
        'Even a short walk can help break the cycle.'
      ],
      intervention_timing: 'Day 3 optimal - before loop becomes self-sustaining'
    },

    predictions: {
      self_sustaining: 'Becomes independent loop after 7 days',
      intervention_window: 'Day 3 most effective',
      recovery_approach: 'Break loop with EITHER activity OR sleep improvement'
    },

    urgency: 'high',
    predictive: false
  },

  P055_RHR_ILLNESS_PREDICTOR: {
    id: 'P055',
    name: 'Resting Heart Rate Illness Predictor',
    planet: 'Mercury',
    category: 'health',
    description: 'RHR spike 2-3 days before illness symptoms appear',

    conditions: [
      { behavior: 'restingHeartRate', operator: 'SPIKES_FROM_BASELINE', threshold: 5, unit: 'bpm', window: 2 },
      { behavior: 'hrv', operator: 'DROPS_FROM_BASELINE', threshold: 10, unit: 'percent', window: 2 },
      { behavior: 'sleepScore', operator: 'DROPS_FROM_BASELINE', threshold: 10, unit: 'percent', window: 2 }
    ],

    logic: 'IF (RHR +5 bpm spike) AND (HRV drops 10%) THEN illness_likely_in_2-3_days',

    confidence_threshold: 0.88,
    evidence_required: 2,
    false_positive_rate: 0.24, // 76% true positive rate per Claude analysis
    detection_window: [1, 3],

    silent_guidance: {
      internal_label: 'illness_prediction_early_warning',
      discovery_question: 'Your resting heart rate has jumped a bit. Have you noticed any early signs you might be coming down with something?',
      follow_up_prompts: [
        'How\'s your throat feeling? Any scratchiness?',
        'Sometimes our bodies know we\'re getting sick before we do.',
        'Might be a good time to prioritize rest and hydration.'
      ],
      intervention_timing: 'Immediately - 2-3 day lead time allows prevention'
    },

    predictions: {
      lead_time: '2.3 days average before symptoms',
      accuracy: '76% true positive rate',
      prevention_window: 'Immediate rest/hydration can reduce severity',
      game_changer: 'Proactive illness prevention vs reactive treatment'
    },

    urgency: 'high',
    predictive: true
  }
};

// Export all patterns
module.exports = {
  LIFE_PATTERNS,

  // Helper functions
  getAllPatterns: () => Object.values(LIFE_PATTERNS),

  getPatternById: (id) => {
    return Object.values(LIFE_PATTERNS).find(p => p.id === id);
  },

  getPatternsByCategory: (category) => {
    return Object.values(LIFE_PATTERNS).filter(p => p.category === category);
  },

  getPatternsByPlanet: (planet) => {
    return Object.values(LIFE_PATTERNS).filter(p => p.planet === planet);
  },

  getUrgentPatterns: () => {
    return Object.values(LIFE_PATTERNS).filter(p => p.urgency === 'high' || p.urgency === 'critical');
  },

  getPredictivePatterns: () => {
    return Object.values(LIFE_PATTERNS).filter(p => p.predictive === true);
  },

  getSensitivePatterns: () => {
    return Object.values(LIFE_PATTERNS).filter(p => p.sensitive === true);
  }
};
