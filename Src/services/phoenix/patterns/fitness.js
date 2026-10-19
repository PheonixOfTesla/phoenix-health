/**
 * PHOENIX AI - FITNESS & ATHLETIC LIFE PATTERNS (60 PATTERNS)
 *
 * Planet: Mars (Physical Activity, Athletic Performance)
 * Category: fitness
 *
 * Covers:
 * - Training cycles & periodization
 * - Race preparation & competition
 * - Overtraining & recovery
 * - New fitness programs
 * - Athletic goals & milestones
 * - Gym membership changes
 * - Training plateaus
 * - Athletic injuries
 * - Plus variants and anomalies
 */

module.exports = {

  // ==================== TRAINING CYCLES (8 patterns) ====================

  F001_NEW_TRAINING_PROGRAM: {
    id: 'F001',
    name: 'New Training Program Start',
    planet: 'Mars',
    category: 'fitness',
    description: 'Beginning structured fitness program',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'steps', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 }
    ],
    logic: 'IF (sudden_activity_increase) AND (adaptation_stress) THEN new_program_likely',
    confidence_threshold: 0.82,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "You're suddenly way more active! Did you start a new fitness program?",
      follow_up_prompts: ["How's your body adjusting?"],
      internal_label: 'New training program',
      intervention_timing: 'When user mentions new routine or fitness'
    },
    urgency: 'low',
    sensitive: false
  },

  F002_TRAINING_INTENSIFICATION: {
    id: 'F002',
    name: 'Training Volume Increase',
    planet: 'Mars',
    category: 'fitness',
    description: 'Ramping up training intensity or volume',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'strain', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 }
    ],
    logic: 'IF (progressive_overload) AND (accumulated_fatigue) THEN intensification_phase_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're pushing harder lately. Training for something?",
      follow_up_prompts: ["Are you being careful not to overdo it?"],
      internal_label: 'Training intensification',
      intervention_timing: 'When user mentions training or goals'
    },
    urgency: 'low',
    sensitive: false
  },

  F003_TAPER_WEEK: {
    id: 'F003',
    name: 'Pre-Competition Taper',
    planet: 'Mars',
    category: 'fitness',
    description: 'Reducing volume before race/event',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'baseline_was_high', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (athlete_reduces_volume) AND (recovery_improves) THEN taper_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "You're tapering! Race coming up?",
      follow_up_prompts: ["When's the event?"],
      internal_label: 'Pre-competition taper',
      intervention_timing: 'When user mentions race or event'
    },
    urgency: 'low',
    sensitive: false
  },

  F004_RECOVERY_WEEK: {
    id: 'F004',
    name: 'Planned Recovery Week',
    planet: 'Mars',
    category: 'fitness',
    description: 'Scheduled deload/recovery period',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 10, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 7 }
    ],
    logic: 'IF (planned_rest) AND (recovery_markers_improve) THEN recovery_week_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "Taking a recovery week? Smart move.",
      follow_up_prompts: ["How's your body feeling?"],
      internal_label: 'Recovery week',
      intervention_timing: 'When user mentions rest or recovery'
    },
    urgency: 'low',
    sensitive: false
  },

  F005_BASE_BUILDING: {
    id: 'F005',
    name: 'Aerobic Base Building Phase',
    planet: 'Mars',
    category: 'fitness',
    description: 'Low-intensity high-volume training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DECREASES', threshold: 8, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (high_volume_low_intensity) AND (aerobic_adaptation) THEN base_building_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're putting in consistent volume. Building your base?",
      follow_up_prompts: ["What's your goal for this phase?"],
      internal_label: 'Base building',
      intervention_timing: 'When user mentions training plan'
    },
    urgency: 'low',
    sensitive: false
  },

  F006_PEAK_TRAINING_WEEK: {
    id: 'F006',
    name: 'Peak Training Volume Week',
    planet: 'Mars',
    category: 'fitness',
    description: 'Highest volume week in training cycle',
    conditions: [
      { behavior: 'activeMinutes', operator: 'PEAK_HIGH', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'strain', operator: 'PEAK_HIGH', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (maximum_training_load) AND (accumulated_fatigue) THEN peak_week_likely',
    confidence_threshold: 0.83,
    evidence_required: 4,
    false_positive_rate: 0.12,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "This is your biggest training week yet. How are you holding up?",
      follow_up_prompts: ["Make sure you recover after this!"],
      internal_label: 'Peak training week',
      intervention_timing: 'When user mentions being tired or training'
    },
    urgency: 'medium',
    sensitive: false
  },

  F007_OFF_SEASON: {
    id: 'F007',
    name: 'Off-Season Training',
    planet: 'Mars',
    category: 'fitness',
    description: 'Reduced structured training between seasons',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'activity_pattern', operator: 'BECOMES_IRREGULAR', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 12, unit: 'percent', window: 21 }
    ],
    logic: 'IF (reduced_structured_activity) AND (irregular_pattern) THEN off_season_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Taking a break from structured training?",
      follow_up_prompts: ["When do you start building again?"],
      internal_label: 'Off-season',
      intervention_timing: 'When user mentions break or season ending'
    },
    urgency: 'low',
    sensitive: false
  },

  F008_RETURN_TO_TRAINING: {
    id: 'F008',
    name: 'Return to Training After Break',
    planet: 'Mars',
    category: 'fitness',
    description: 'Resuming exercise after time off',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'steps', operator: 'INCREASES', threshold: 45, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'baseline_was_low', operator: 'PREVIOUS_30_DAYS', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (sudden_restart) AND (previous_inactivity) THEN return_to_training_likely',
    confidence_threshold: 0.80,
    evidence_required: 4,
    false_positive_rate: 0.14,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Back to training after a break? Take it easy!",
      follow_up_prompts: ["How does it feel to be back?"],
      internal_label: 'Return to training',
      intervention_timing: 'When user mentions starting again'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== RACE PREP & COMPETITION (8 patterns) ====================

  F009_MARATHON_TRAINING: {
    id: 'F009',
    name: 'Marathon Training Cycle',
    planet: 'Mars',
    category: 'fitness',
    description: '12-16 week marathon preparation',
    conditions: [
      { behavior: 'steps', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 60 },
      { behavior: 'weekly_long_run', operator: 'PATTERN_PRESENT', threshold: 1, unit: 'boolean', window: 60 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 12, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sustained_high_volume) AND (weekly_long_runs) THEN marathon_training_likely',
    confidence_threshold: 0.84,
    evidence_required: 4,
    false_positive_rate: 0.11,
    detection_window: [30, 90],
    silent_guidance: {
      discovery_question: "Training for a marathon? That's impressive!",
      follow_up_prompts: ["When's race day?"],
      internal_label: 'Marathon training',
      intervention_timing: 'When user mentions running or marathon'
    },
    urgency: 'low',
    sensitive: false
  },

  F010_RACE_DAY: {
    id: 'F010',
    name: 'Race Day Event',
    planet: 'Mars',
    category: 'fitness',
    description: 'Day of competitive endurance event',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 100, unit: 'percent', window: 1 },
      { behavior: 'steps', operator: 'SPIKE', threshold: 120, unit: 'percent', window: 1 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 15, unit: 'percent', window: 2 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 2 }
    ],
    logic: 'IF (extreme_single_day_effort) AND (post_event_fatigue) THEN race_day_likely',
    confidence_threshold: 0.87,
    evidence_required: 4,
    false_positive_rate: 0.09,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Was that race day?! How'd it go?",
      follow_up_prompts: ["Congrats on finishing!"],
      internal_label: 'Race day',
      intervention_timing: 'When user mentions race or event'
    },
    urgency: 'low',
    sensitive: false
  },

  F011_POST_RACE_RECOVERY: {
    id: 'F011',
    name: 'Post-Race Recovery Period',
    planet: 'Mars',
    category: 'fitness',
    description: 'Recovery after endurance event',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 14 }
    ],
    logic: 'IF (post_peak_rest) AND (recovery_trajectory) THEN post_race_recovery_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Taking time to recover after the race?",
      follow_up_prompts: ["How sore are you?"],
      internal_label: 'Post-race recovery',
      intervention_timing: 'When user mentions recovery or race'
    },
    urgency: 'low',
    sensitive: false
  },

  F012_TRIATHLON_TRAINING: {
    id: 'F012',
    name: 'Triathlon Training',
    planet: 'Mars',
    category: 'fitness',
    description: 'Multi-sport training with high volume',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 45, unit: 'percent', window: 45 },
      { behavior: 'strain', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 45 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 45 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 45 }
    ],
    logic: 'IF (very_high_training_load) AND (multi_sport_pattern) THEN triathlon_training_likely',
    confidence_threshold: 0.81,
    evidence_required: 4,
    false_positive_rate: 0.13,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Training for a triathlon? That's hardcore!",
      follow_up_prompts: ["Which distance?"],
      internal_label: 'Triathlon training',
      intervention_timing: 'When user mentions triathlon or training'
    },
    urgency: 'low',
    sensitive: false
  },

  F013_CYCLING_EVENT_PREP: {
    id: 'F013',
    name: 'Cycling Event Preparation',
    planet: 'Mars',
    category: 'fitness',
    description: 'Training for century ride or bike race',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 30 },
      { behavior: 'long_ride_pattern', operator: 'WEEKLY', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (high_volume_endurance) AND (weekly_long_rides) THEN cycling_event_prep_likely',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Training for a big ride?",
      follow_up_prompts: ["How many miles?"],
      internal_label: 'Cycling event prep',
      intervention_timing: 'When user mentions cycling or event'
    },
    urgency: 'low',
    sensitive: false
  },

  F014_CROSSFIT_COMPETITION: {
    id: 'F014',
    name: 'CrossFit Competition Prep',
    planet: 'Mars',
    category: 'fitness',
    description: 'High-intensity competition training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'strain', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'VOLATILE', threshold: 18, unit: 'percent', window: 21 }
    ],
    logic: 'IF (high_intensity_training) AND (high_variability) THEN crossfit_comp_prep_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Prepping for a CrossFit comp?",
      follow_up_prompts: ["What movements are you working on?"],
      internal_label: 'CrossFit competition',
      intervention_timing: 'When user mentions CrossFit or competition'
    },
    urgency: 'low',
    sensitive: false
  },

  F015_POWERLIFTING_MEET: {
    id: 'F015',
    name: 'Powerlifting Meet Prep',
    planet: 'Mars',
    category: 'fitness',
    description: 'Peaking for strength competition',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CHANGES_PATTERN', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 21 }
    ],
    logic: 'IF (strength_training_stress) AND (peaking_phase) THEN powerlifting_meet_prep_likely',
    confidence_threshold: 0.72,
    evidence_required: 3,
    false_positive_rate: 0.21,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Getting ready for a meet?",
      follow_up_prompts: ["What are your goal lifts?"],
      internal_label: 'Powerlifting meet prep',
      intervention_timing: 'When user mentions lifting or meet'
    },
    urgency: 'low',
    sensitive: false
  },

  F016_OBSTACLE_RACE: {
    id: 'F016',
    name: 'Obstacle Race Training',
    planet: 'Mars',
    category: 'fitness',
    description: 'Spartan/Tough Mudder preparation',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'strain', operator: 'ELEVATED', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'variety_in_activities', operator: 'HIGH', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (mixed_modality_training) AND (high_volume) THEN obstacle_race_training_likely',
    confidence_threshold: 0.73,
    evidence_required: 3,
    false_positive_rate: 0.20,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Training for an obstacle race?",
      follow_up_prompts: ["Which one?"],
      internal_label: 'Obstacle race training',
      intervention_timing: 'When user mentions OCR or Spartan'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== OVERTRAINING & BURNOUT (6 patterns) ====================

  F017_OVERTRAINING_SYNDROME: {
    id: 'F017',
    name: 'Overtraining Syndrome',
    planet: 'Mars',
    category: 'fitness',
    description: 'Chronic overtraining with performance decline',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 45 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 45 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 12, unit: 'percent', window: 45 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 45 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_POOR', threshold: 25, unit: 'percent', window: 45 }
    ],
    logic: 'IF (chronic_high_load) AND (failed_adaptation) THEN overtraining_confirmed',
    confidence_threshold: 0.87,
    evidence_required: 5,
    false_positive_rate: 0.09,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You're not recovering. This looks like overtraining. You need rest.",
      follow_up_prompts: ["Have you talked to your coach?"],
      internal_label: 'Overtraining syndrome',
      intervention_timing: 'Immediate - when pattern detected'
    },
    urgency: 'critical',
    sensitive: true
  },

  F018_FUNCTIONAL_OVERREACHING: {
    id: 'F018',
    name: 'Functional Overreaching',
    planet: 'Mars',
    category: 'fitness',
    description: 'Temporary overload with planned recovery',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'recovery_week_follows', operator: 'WITHIN', threshold: 7, unit: 'days', window: 21 }
    ],
    logic: 'IF (short_term_overload) AND (planned_recovery) THEN functional_overreaching_likely',
    confidence_threshold: 0.78,
    evidence_required: 4,
    false_positive_rate: 0.16,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "You're overreaching—hope you have recovery planned!",
      follow_up_prompts: ["When's your deload week?"],
      internal_label: 'Functional overreaching',
      intervention_timing: 'When user mentions hard training block'
    },
    urgency: 'medium',
    sensitive: false
  },

  F019_TRAINING_BURNOUT: {
    id: 'F019',
    name: 'Training Burnout',
    planet: 'Mars',
    category: 'fitness',
    description: 'Loss of motivation and sudden stop',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 45 },
      { behavior: 'activeMinutes', operator: 'SUDDEN_DROP', threshold: 60, unit: 'percent', window: 50 },
      { behavior: 'pattern_stops', operator: 'ABRUPTLY', threshold: 1, unit: 'boolean', window: 50 }
    ],
    logic: 'IF (high_training_volume) THEN (sudden_cessation) THEN burnout_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "You stopped training suddenly. Feeling burned out?",
      follow_up_prompts: ["Do you need a break from structured training?"],
      internal_label: 'Training burnout',
      intervention_timing: 'When user mentions quitting or being done'
    },
    urgency: 'high',
    sensitive: true
  },

  F020_INADEQUATE_RECOVERY: {
    id: 'F020',
    name: 'Chronic Inadequate Recovery',
    planet: 'Mars',
    category: 'fitness',
    description: 'Not enough rest between sessions',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 18, unit: 'percent', window: 30 }
    ],
    logic: 'IF (consistent_training) AND (never_recovering) THEN inadequate_recovery_confirmed',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're never fully recovering. You need more rest days.",
      follow_up_prompts: ["When was your last true rest week?"],
      internal_label: 'Inadequate recovery',
      intervention_timing: 'When user mentions fatigue or performance decline'
    },
    urgency: 'high',
    sensitive: true
  },

  F021_RHABDOMYOLYSIS_RISK: {
    id: 'F021',
    name: 'Extreme Overexertion (Rhabdo Risk)',
    planet: 'Mars',
    category: 'fitness',
    description: 'Dangerous acute overexertion',
    conditions: [
      { behavior: 'activeMinutes', operator: 'EXTREME_SPIKE', threshold: 200, unit: 'percent', window: 1 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 30, unit: 'percent', window: 2 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 50, unit: 'percent', window: 2 },
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 2 }
    ],
    logic: 'IF (extreme_single_session) AND (severe_physiological_stress) THEN rhabdo_risk_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "That workout was extreme. Watch for dark urine or severe muscle pain—that's rhabdo.",
      follow_up_prompts: ["Go to the ER if you have symptoms."],
      internal_label: 'Rhabdomyolysis risk',
      intervention_timing: 'Immediate - critical warning'
    },
    urgency: 'critical',
    sensitive: true
  },

  F022_PEAKING_TOO_EARLY: {
    id: 'F022',
    name: 'Peaking Too Early',
    planet: 'Mars',
    category: 'fitness',
    description: 'Peak form arrived before target event',
    conditions: [
      { behavior: 'recoveryScore', operator: 'PEAK_HIGH', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'PEAK_HIGH', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'activeMinutes', operator: 'DROPPING', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (peak_fitness_form) AND (race_still_weeks_away) THEN peaked_too_early_likely',
    confidence_threshold: 0.74,
    evidence_required: 3,
    false_positive_rate: 0.19,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "You're in peak form now, but isn't your race still a few weeks away?",
      follow_up_prompts: ["You might need to adjust your taper."],
      internal_label: 'Peaked too early',
      intervention_timing: 'When user mentions race timing'
    },
    urgency: 'medium',
    sensitive: false
  },

  // ==================== FITNESS MILESTONES (8 patterns) ====================

  F023_FIRST_5K: {
    id: 'F023',
    name: 'First 5K Race',
    planet: 'Mars',
    category: 'fitness',
    description: 'Completing first structured running event',
    conditions: [
      { behavior: 'steps', operator: 'SPIKE', threshold: 60, unit: 'percent', window: 1 },
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 50, unit: 'percent', window: 1 },
      { behavior: 'baseline_moderate', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (moderate_athlete) AND (first_race_effort) THEN first_5k_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Did you run your first 5K? That's awesome!",
      follow_up_prompts: ["How'd it feel?"],
      internal_label: 'First 5K',
      intervention_timing: 'When user mentions race or running'
    },
    urgency: 'low',
    sensitive: false
  },

  F024_PR_ACHIEVEMENT: {
    id: 'F024',
    name: 'Personal Record Achievement',
    planet: 'Mars',
    category: 'fitness',
    description: 'Breaking personal best in event',
    conditions: [
      { behavior: 'activeMinutes', operator: 'SPIKE', threshold: 70, unit: 'percent', window: 1 },
      { behavior: 'strain', operator: 'SPIKE', threshold: 60, unit: 'percent', window: 1 },
      { behavior: 'recovery_needed', operator: 'HIGH', threshold: 1, unit: 'boolean', window: 3 }
    ],
    logic: 'IF (maximum_effort_day) AND (deep_recovery_needed) THEN pr_attempt_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "That was a huge effort! Did you PR?",
      follow_up_prompts: ["Congrats!"],
      internal_label: 'PR achievement',
      intervention_timing: 'When user mentions PR or race'
    },
    urgency: 'low',
    sensitive: false
  },

  F025_WEIGHT_LOSS_MILESTONE: {
    id: 'F025',
    name: 'Fitness-Driven Weight Loss',
    planet: 'Mars',
    category: 'fitness',
    description: 'Significant weight loss through exercise',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 40, unit: 'percent', window: 60 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DECREASES', threshold: 10, unit: 'percent', window: 60 },
      { behavior: 'hrv', operator: 'GRADUALLY_IMPROVES', threshold: 12, unit: 'percent', window: 60 }
    ],
    logic: 'IF (sustained_activity) AND (cardiovascular_improvement) THEN weight_loss_progress_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Your fitness markers are improving! Making progress on your goals?",
      follow_up_prompts: ["How do you feel?"],
      internal_label: 'Weight loss milestone',
      intervention_timing: 'When user mentions weight or progress'
    },
    urgency: 'low',
    sensitive: true
  },

  F026_CONSISTENCY_STREAK: {
    id: 'F026',
    name: 'Training Consistency Streak',
    planet: 'Mars',
    category: 'fitness',
    description: '30+ days of consistent training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'CONSISTENT', threshold: 90, unit: 'percent', window: 30 },
      { behavior: 'daily_activity', operator: 'NO_GAPS', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (unbroken_training_streak FOR 30_days) THEN consistency_milestone_achieved',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.10,
    detection_window: [30, 45],
    silent_guidance: {
      discovery_question: "You've been incredibly consistent! 30+ days straight!",
      follow_up_prompts: ["What's keeping you motivated?"],
      internal_label: 'Consistency streak',
      intervention_timing: 'When celebrating milestone'
    },
    urgency: 'low',
    sensitive: false
  },

  F027_BODY_RECOMPOSITION: {
    id: 'F027',
    name: 'Body Recomposition Progress',
    planet: 'Mars',
    category: 'fitness',
    description: 'Building muscle while losing fat',
    conditions: [
      { behavior: 'activeMinutes', operator: 'ELEVATED', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'strength_training_pattern', operator: 'CONSISTENT', threshold: 1, unit: 'boolean', window: 60 },
      { behavior: 'restingHeartRate', operator: 'GRADUALLY_DECREASES', threshold: 8, unit: 'percent', window: 60 },
      { behavior: 'recoveryScore', operator: 'STABLE_HIGH', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (consistent_resistance_training) AND (improving_fitness) THEN recomp_progress_likely',
    confidence_threshold: 0.76,
    evidence_required: 4,
    false_positive_rate: 0.18,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Your body composition is changing! Seeing results in the mirror?",
      follow_up_prompts: ["What's your training split?"],
      internal_label: 'Body recomposition',
      intervention_timing: 'When user mentions gains or progress'
    },
    urgency: 'low',
    sensitive: false
  },

  F028_ENDURANCE_BREAKTHROUGH: {
    id: 'F028',
    name: 'Endurance Capacity Breakthrough',
    planet: 'Mars',
    category: 'fitness',
    description: 'Significant aerobic improvement',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 30 },
      { behavior: 'restingHeartRate', operator: 'DECREASES', threshold: 10, unit: 'percent', window: 30 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 15, unit: 'percent', window: 30 }
    ],
    logic: 'IF (capacity_expansion) AND (cardiovascular_adaptation) THEN endurance_breakthrough_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Your endurance just leveled up! What changed?",
      follow_up_prompts: ["Can you feel the difference?"],
      internal_label: 'Endurance breakthrough',
      intervention_timing: 'When user mentions feeling stronger'
    },
    urgency: 'low',
    sensitive: false
  },

  F029_STRENGTH_PLATEAU_BREAK: {
    id: 'F029',
    name: 'Strength Plateau Breakthrough',
    planet: 'Mars',
    category: 'fitness',
    description: 'Breaking through training plateau',
    conditions: [
      { behavior: 'strain', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'previous_plateau', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 45 }
    ],
    logic: 'IF (new_training_stress) AND (previous_stagnation) THEN plateau_break_likely',
    confidence_threshold: 0.73,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Looks like you broke through that plateau!",
      follow_up_prompts: ["What did you change?"],
      internal_label: 'Plateau breakthrough',
      intervention_timing: 'When user mentions progress'
    },
    urgency: 'low',
    sensitive: false
  },

  F030_MOBILITY_IMPROVEMENT: {
    id: 'F030',
    name: 'Flexibility/Mobility Improvement',
    planet: 'Mars',
    category: 'fitness',
    description: 'Dedicated stretching/mobility work',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 30 },
      { behavior: 'recovery_focused_activity', operator: 'PATTERN_PRESENT', threshold: 1, unit: 'boolean', window: 30 },
      { behavior: 'hrv', operator: 'IMPROVES', threshold: 10, unit: 'percent', window: 30 }
    ],
    logic: 'IF (recovery_work_increase) AND (stress_reduction) THEN mobility_focus_likely',
    confidence_threshold: 0.71,
    evidence_required: 3,
    false_positive_rate: 0.22,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Are you doing more mobility work? Your recovery looks better.",
      follow_up_prompts: ["What's your routine?"],
      internal_label: 'Mobility improvement',
      intervention_timing: 'When user mentions stretching or yoga'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== GYM & PROGRAM CHANGES (6 patterns) ====================

  F031_NEW_GYM_MEMBERSHIP: {
    id: 'F031',
    name: 'New Gym Membership',
    planet: 'Mars',
    category: 'fitness',
    description: 'Joining gym with motivation spike',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'activity_pattern', operator: 'BECOMES_REGULAR', threshold: 1, unit: 'boolean', window: 14 },
      { behavior: 'previous_baseline_low', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (sudden_structured_activity) AND (previously_inactive) THEN new_gym_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Did you join a gym? Great decision!",
      follow_up_prompts: ["What's your routine?"],
      internal_label: 'New gym membership',
      intervention_timing: 'When user mentions gym or starting fitness'
    },
    urgency: 'low',
    sensitive: false
  },

  F032_GYM_ATTENDANCE_FADE: {
    id: 'F032',
    name: 'Gym Attendance Decline',
    planet: 'Mars',
    category: 'fitness',
    description: 'New Year\'s resolution fade',
    conditions: [
      { behavior: 'activeMinutes', operator: 'GRADUALLY_DECLINES', threshold: 40, unit: 'percent', window: 45 },
      { behavior: 'previous_spike', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (initial_enthusiasm) THEN (gradual_dropout) THEN gym_fade_likely',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Gym visits dropping off? What's getting in the way?",
      follow_up_prompts: ["Want to talk about what would help?"],
      internal_label: 'Gym attendance decline',
      intervention_timing: 'When user mentions struggling with consistency'
    },
    urgency: 'medium',
    sensitive: true
  },

  F033_PERSONAL_TRAINER_START: {
    id: 'F033',
    name: 'Personal Trainer Hired',
    planet: 'Mars',
    category: 'fitness',
    description: 'Beginning coached training program',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 7 },
      { behavior: 'activity_pattern', operator: 'BECOMES_STRUCTURED', threshold: 1, unit: 'boolean', window: 14 },
      { behavior: 'consistent_schedule', operator: 'PATTERN_PRESENT', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (structured_programming_emerges) AND (consistent_schedule) THEN trainer_hired_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Did you start working with a trainer?",
      follow_up_prompts: ["How's it going?"],
      internal_label: 'Personal trainer start',
      intervention_timing: 'When user mentions trainer or coaching'
    },
    urgency: 'low',
    sensitive: false
  },

  F034_GROUP_FITNESS_CLASS: {
    id: 'F034',
    name: 'Group Fitness Class Routine',
    planet: 'Mars',
    category: 'fitness',
    description: 'Regular class attendance (spin, HIIT, yoga)',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'weekly_schedule_pattern', operator: 'CONSISTENT', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (regular_class_attendance) AND (consistent_timing) THEN group_fitness_routine_likely',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Taking group fitness classes?",
      follow_up_prompts: ["Which ones do you like?"],
      internal_label: 'Group fitness routine',
      intervention_timing: 'When user mentions classes'
    },
    urgency: 'low',
    sensitive: false
  },

  F035_PROGRAM_HOPPING: {
    id: 'F035',
    name: 'Program Hopping',
    planet: 'Mars',
    category: 'fitness',
    description: 'Frequently switching training programs',
    conditions: [
      { behavior: 'activity_pattern', operator: 'HIGHLY_VOLATILE', threshold: 35, unit: 'percent', window: 60 },
      { behavior: 'multiple_starts_stops', operator: 'PATTERN_PRESENT', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (frequent_program_changes) AND (lack_of_consistency) THEN program_hopping_likely',
    confidence_threshold: 0.72,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "You keep switching programs. What are you looking for?",
      follow_up_prompts: ["Maybe stick with one for 12 weeks?"],
      internal_label: 'Program hopping',
      intervention_timing: 'When user mentions not seeing results'
    },
    urgency: 'medium',
    sensitive: true
  },

  F036_WORKOUT_APP_START: {
    id: 'F036',
    name: 'Fitness App Program Start',
    planet: 'Mars',
    category: 'fitness',
    description: 'Starting structured app-based training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'daily_consistency', operator: 'HIGH', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (sudden_structured_start) AND (app_based_pattern) THEN fitness_app_start_likely',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Using a fitness app?",
      follow_up_prompts: ["Which one?"],
      internal_label: 'Fitness app start',
      intervention_timing: 'When user mentions app or program'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== ACTIVITY PATTERNS (6 patterns) ====================

  F037_WALKING_HABIT: {
    id: 'F037',
    name: 'Daily Walking Habit',
    planet: 'Mars',
    category: 'fitness',
    description: 'Consistent daily walking routine',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'daily_walking', operator: 'CONSISTENT', threshold: 90, unit: 'percent', window: 21 }
    ],
    logic: 'IF (daily_step_increase) AND (unbroken_pattern) THEN walking_habit_established',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.12,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You're walking a lot more! What changed?",
      follow_up_prompts: ["How does it feel?"],
      internal_label: 'Walking habit',
      intervention_timing: 'When user mentions walking'
    },
    urgency: 'low',
    sensitive: false
  },

  F038_RUNNING_BASE: {
    id: 'F038',
    name: 'Running Base Building',
    planet: 'Mars',
    category: 'fitness',
    description: 'Establishing consistent running practice',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'running_pattern', operator: '3_5_DAYS_WEEKLY', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (regular_running) AND (sustainable_frequency) THEN running_base_building_likely',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Building a running base?",
      follow_up_prompts: ["What's your goal?"],
      internal_label: 'Running base building',
      intervention_timing: 'When user mentions running'
    },
    urgency: 'low',
    sensitive: false
  },

  F039_CYCLING_COMMUTE: {
    id: 'F039',
    name: 'Bike Commuting',
    planet: 'Mars',
    category: 'fitness',
    description: 'Regular cycling for transportation',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'weekday_pattern', operator: 'CONSISTENT', threshold: 1, unit: 'boolean', window: 21 },
      { behavior: 'weekend_different', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (weekday_activity_spike) AND (weekend_baseline) THEN bike_commute_likely',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Are you biking to work?",
      follow_up_prompts: ["How far is your commute?"],
      internal_label: 'Bike commuting',
      intervention_timing: 'When user mentions cycling or commute'
    },
    urgency: 'low',
    sensitive: false
  },

  F040_WEEKEND_WARRIOR: {
    id: 'F040',
    name: 'Weekend Warrior Pattern',
    planet: 'Mars',
    category: 'fitness',
    description: 'Inactive during week, intense on weekends',
    conditions: [
      { behavior: 'weekday_activity', operator: 'LOW', threshold: 1, unit: 'boolean', window: 21 },
      { behavior: 'weekend_activity', operator: 'SPIKES', threshold: 100, unit: 'percent', window: 21 }
    ],
    logic: 'IF (sedentary_weekdays) AND (intense_weekends) THEN weekend_warrior_pattern',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.13,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "You go hard on weekends but rest during the week. Classic weekend warrior!",
      follow_up_prompts: ["Be careful—that's injury prone."],
      internal_label: 'Weekend warrior',
      intervention_timing: 'When user mentions weekend activities'
    },
    urgency: 'medium',
    sensitive: false
  },

  F041_ACTIVE_COMMUTE: {
    id: 'F041',
    name: 'Active Commute Start',
    planet: 'Mars',
    category: 'fitness',
    description: 'Walking or running to work',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 14 },
      { behavior: 'weekday_pattern', operator: 'CONSISTENT', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (weekday_step_increase) AND (consistent_timing) THEN active_commute_likely',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Walking or running to work now?",
      follow_up_prompts: ["That's a great habit!"],
      internal_label: 'Active commute',
      intervention_timing: 'When user mentions commute'
    },
    urgency: 'low',
    sensitive: false
  },

  F042_DOG_WALKING: {
    id: 'F042',
    name: 'New Dog Walking Routine',
    planet: 'Mars',
    category: 'fitness',
    description: 'Increased activity from dog ownership',
    conditions: [
      { behavior: 'steps', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'daily_walks', operator: '2_3_TIMES_DAILY', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (regular_short_walks) AND (multiple_daily) THEN dog_walking_pattern_likely',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Did you get a dog? Your step count is way up!",
      follow_up_prompts: ["What breed?"],
      internal_label: 'Dog walking routine',
      intervention_timing: 'When user mentions dog or pet'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== SEASONAL & ENVIRONMENTAL (6 patterns) ====================

  F043_WINTER_TRAINING_DECLINE: {
    id: 'F043',
    name: 'Winter Activity Decline',
    planet: 'Mars',
    category: 'fitness',
    description: 'Reduced outdoor activity in cold months',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'steps', operator: 'DROPS', threshold: 25, unit: 'percent', window: 30 },
      { behavior: 'season', operator: 'WINTER', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (activity_decline) AND (winter_months) THEN seasonal_decline_likely',
    confidence_threshold: 0.79,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Winter slowing you down?",
      follow_up_prompts: ["What about indoor alternatives?"],
      internal_label: 'Winter decline',
      intervention_timing: 'When user mentions cold or winter'
    },
    urgency: 'low',
    sensitive: false
  },

  F044_SPRING_TRAINING_RAMP: {
    id: 'F044',
    name: 'Spring Training Ramp-Up',
    planet: 'Mars',
    category: 'fitness',
    description: 'Increased outdoor activity as weather improves',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'steps', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'season', operator: 'SPRING', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (activity_surge) AND (spring_months) THEN seasonal_ramp_likely',
    confidence_threshold: 0.80,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Spring energy hitting! Getting outside more?",
      follow_up_prompts: ["What are you training for?"],
      internal_label: 'Spring training ramp',
      intervention_timing: 'When user mentions weather improving'
    },
    urgency: 'low',
    sensitive: false
  },

  F045_HEAT_TRAINING_ADAPTATION: {
    id: 'F045',
    name: 'Heat Acclimatization',
    planet: 'Mars',
    category: 'fitness',
    description: 'Training in hot weather adaptation',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 10, unit: 'percent', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 12, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 },
      { behavior: 'season', operator: 'SUMMER', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (heat_stress_pattern) AND (summer_training) THEN heat_adaptation_likely',
    confidence_threshold: 0.77,
    evidence_required: 4,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Training in the heat is tough! Stay hydrated.",
      follow_up_prompts: ["Are you adjusting your pacing?"],
      internal_label: 'Heat adaptation',
      intervention_timing: 'When user mentions heat or summer training'
    },
    urgency: 'medium',
    sensitive: false
  },

  F046_ALTITUDE_TRAINING: {
    id: 'F046',
    name: 'Altitude Training Camp',
    planet: 'Mars',
    category: 'fitness',
    description: 'Training at elevation',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'INCREASES', threshold: 12, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 10 },
      { behavior: 'activeMinutes', operator: 'MAINTAINED', threshold: 1, unit: 'boolean', window: 10 }
    ],
    logic: 'IF (physiological_stress) AND (continued_training) THEN altitude_training_likely',
    confidence_threshold: 0.79,
    evidence_required: 4,
    false_positive_rate: 0.15,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Training at altitude?",
      follow_up_prompts: ["How high up are you?"],
      internal_label: 'Altitude training',
      intervention_timing: 'When user mentions elevation or mountains'
    },
    urgency: 'low',
    sensitive: false
  },

  F047_VACATION_DETRAINING: {
    id: 'F047',
    name: 'Vacation Detraining',
    planet: 'Mars',
    category: 'fitness',
    description: 'Fitness decline during extended break',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 60, unit: 'percent', window: 14 },
      { behavior: 'steps', operator: 'DROPS', threshold: 50, unit: 'percent', window: 14 },
      { behavior: 'consistent_low_activity', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (extended_inactivity) AND (vacation_context) THEN detraining_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "On vacation? Enjoy the rest!",
      follow_up_prompts: ["You'll bounce back when you're ready."],
      internal_label: 'Vacation detraining',
      intervention_timing: 'When user mentions vacation or travel'
    },
    urgency: 'low',
    sensitive: false
  },

  F048_OUTDOOR_SEASON_START: {
    id: 'F048',
    name: 'Outdoor Training Season Start',
    planet: 'Mars',
    category: 'fitness',
    description: 'Transitioning from indoor to outdoor training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'activity_variety', operator: 'INCREASES', threshold: 1, unit: 'boolean', window: 14 },
      { behavior: 'season', operator: 'SPRING_OR_SUMMER', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (activity_increase) AND (outdoor_context) THEN outdoor_season_start_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Finally getting outside to train?",
      follow_up_prompts: ["How's it feel compared to indoor?"],
      internal_label: 'Outdoor season start',
      intervention_timing: 'When user mentions outdoor training'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== ATHLETIC INJURIES & RECOVERY (8 patterns) ====================

  F049_RUNNERS_KNEE: {
    id: 'F049',
    name: 'Runner\'s Knee (PFPS)',
    planet: 'Mars',
    category: 'fitness',
    description: 'Patellofemoral pain syndrome',
    conditions: [
      { behavior: 'steps', operator: 'GRADUALLY_DECLINES', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'activeMinutes', operator: 'GRADUALLY_DECLINES', threshold: 35, unit: 'percent', window: 21 },
      { behavior: 'runner_profile', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (runner) AND (gradual_activity_decline) THEN runners_knee_likely',
    confidence_threshold: 0.76,
    evidence_required: 3,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Your running dropped off. Knee bothering you?",
      follow_up_prompts: ["Have you seen a PT?"],
      internal_label: 'Runner\'s knee',
      intervention_timing: 'When user mentions knee pain'
    },
    urgency: 'medium',
    sensitive: false
  },

  F050_SHIN_SPLINTS: {
    id: 'F050',
    name: 'Shin Splints',
    planet: 'Mars',
    category: 'fitness',
    description: 'Medial tibial stress syndrome',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 50, unit: 'percent', window: 7 },
      { behavior: 'recent_volume_increase', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (recent_running_increase) THEN (sudden_stop) THEN shin_splints_likely',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Shin splints? That's tough.",
      follow_up_prompts: ["Did you ramp up too fast?"],
      internal_label: 'Shin splints',
      intervention_timing: 'When user mentions shin pain'
    },
    urgency: 'medium',
    sensitive: false
  },

  F051_PLANTAR_FASCIITIS: {
    id: 'F051',
    name: 'Plantar Fasciitis',
    planet: 'Mars',
    category: 'fitness',
    description: 'Heel and arch pain limiting activity',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 45, unit: 'percent', window: 14 },
      { behavior: 'pain_pattern', operator: 'MORNING_WORSE', threshold: 1, unit: 'boolean', window: 14 }
    ],
    logic: 'IF (reduced_walking) AND (morning_pain_pattern) THEN plantar_fasciitis_likely',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Foot pain? That sounds like plantar fasciitis.",
      follow_up_prompts: ["Are you stretching and icing?"],
      internal_label: 'Plantar fasciitis',
      intervention_timing: 'When user mentions foot or heel pain'
    },
    urgency: 'medium',
    sensitive: false
  },

  F052_ACHILLES_TENDINOPATHY: {
    id: 'F052',
    name: 'Achilles Tendinopathy',
    planet: 'Mars',
    category: 'fitness',
    description: 'Achilles tendon overuse injury',
    conditions: [
      { behavior: 'steps', operator: 'DROPS', threshold: 55, unit: 'percent', window: 10 },
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 50, unit: 'percent', window: 10 },
      { behavior: 'runner_or_athlete', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (athlete) AND (sudden_mobility_loss) THEN achilles_issue_likely',
    confidence_threshold: 0.78,
    evidence_required: 3,
    false_positive_rate: 0.16,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Achilles bothering you? That's serious—see a doctor.",
      follow_up_prompts: ["Are you resting it?"],
      internal_label: 'Achilles tendinopathy',
      intervention_timing: 'When user mentions Achilles or calf pain'
    },
    urgency: 'high',
    sensitive: false
  },

  F053_IT_BAND_SYNDROME: {
    id: 'F053',
    name: 'IT Band Syndrome',
    planet: 'Mars',
    category: 'fitness',
    description: 'Iliotibial band friction syndrome',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 45, unit: 'percent', window: 14 },
      { behavior: 'runner_profile', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (runner) AND (lateral_knee_pain_pattern) THEN itb_syndrome_likely',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Outside of your knee hurting? Classic IT band.",
      follow_up_prompts: ["Are you foam rolling?"],
      internal_label: 'IT band syndrome',
      intervention_timing: 'When user mentions knee pain while running'
    },
    urgency: 'medium',
    sensitive: false
  },

  F054_ROTATOR_CUFF_STRAIN: {
    id: 'F054',
    name: 'Rotator Cuff Strain',
    planet: 'Mars',
    category: 'fitness',
    description: 'Shoulder injury from lifting or overhead work',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 35, unit: 'percent', window: 10 },
      { behavior: 'upper_body_training_stops', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 10 }
    ],
    logic: 'IF (strength_athlete) AND (upper_body_cessation) THEN rotator_cuff_likely',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [7, 14],
    silent_guidance: {
      discovery_question: "Shoulder injury? Rotator cuff?",
      follow_up_prompts: ["Have you seen a PT?"],
      internal_label: 'Rotator cuff strain',
      intervention_timing: 'When user mentions shoulder pain'
    },
    urgency: 'medium',
    sensitive: false
  },

  F055_STRESS_FRACTURE: {
    id: 'F055',
    name: 'Stress Fracture',
    planet: 'Mars',
    category: 'fitness',
    description: 'Bone stress injury requiring complete rest',
    conditions: [
      { behavior: 'activeMinutes', operator: 'DROPS', threshold: 80, unit: 'percent', window: 7 },
      { behavior: 'steps', operator: 'DROPS', threshold: 85, unit: 'percent', window: 7 },
      { behavior: 'athlete_profile', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (high_volume_athlete) AND (complete_sudden_stop) THEN stress_fracture_likely',
    confidence_threshold: 0.82,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [5, 10],
    silent_guidance: {
      discovery_question: "You stopped completely. Stress fracture?",
      follow_up_prompts: ["That needs real rest—don't rush back."],
      internal_label: 'Stress fracture',
      intervention_timing: 'When user mentions bone injury'
    },
    urgency: 'high',
    sensitive: true
  },

  F056_MUSCLE_STRAIN_RECOVERY: {
    id: 'F056',
    name: 'Muscle Strain Recovery',
    planet: 'Mars',
    category: 'fitness',
    description: 'Gradual return from pulled muscle',
    conditions: [
      { behavior: 'activeMinutes', operator: 'GRADUALLY_INCREASES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'previous_injury_pattern', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 30 }
    ],
    logic: 'IF (post_injury) AND (gradual_return) THEN muscle_strain_recovery_likely',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Recovering from that strain? Take it slow.",
      follow_up_prompts: ["How does it feel?"],
      internal_label: 'Muscle strain recovery',
      intervention_timing: 'When user mentions injury recovery'
    },
    urgency: 'low',
    sensitive: false
  },

  // ==================== ADVANCED & ANOMALIES (4 patterns) ====================

  F057_CROSSTRAINING: {
    id: 'F057',
    name: 'Cross-Training for Injury Prevention',
    planet: 'Mars',
    category: 'fitness',
    description: 'Adding variety to prevent overuse',
    conditions: [
      { behavior: 'activity_variety', operator: 'INCREASES', threshold: 40, unit: 'percent', window: 21 },
      { behavior: 'total_volume_maintained', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 21 }
    ],
    logic: 'IF (increased_variety) AND (maintained_volume) THEN crosstraining_strategy_likely',
    confidence_threshold: 0.73,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Mixing up your training? Smart for injury prevention.",
      follow_up_prompts: ["What new activities are you trying?"],
      internal_label: 'Cross-training',
      intervention_timing: 'When user mentions variety or injury prevention'
    },
    urgency: 'low',
    sensitive: false
  },

  F058_COMEBACK_FROM_LAYOFF: {
    id: 'F058',
    name: 'Comeback After Long Layoff',
    planet: 'Mars',
    category: 'fitness',
    description: 'Returning to training after extended break',
    conditions: [
      { behavior: 'inactivity_period', operator: 'DURATION', threshold: 90, unit: 'days', window: 120 },
      { behavior: 'activeMinutes', operator: 'INCREASES', threshold: 50, unit: 'percent', window: 14 }
    ],
    logic: 'IF (90_day_layoff) THEN (training_restart) THEN comeback_attempt_likely',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Back after a long break! Be patient with yourself.",
      follow_up_prompts: ["How does it feel?"],
      internal_label: 'Comeback from layoff',
      intervention_timing: 'When user mentions starting again'
    },
    urgency: 'low',
    sensitive: false
  },

  F059_PERFORMANCE_DECLINE: {
    id: 'F059',
    name: 'Unexplained Performance Decline',
    planet: 'Mars',
    category: 'fitness',
    description: 'Drop in performance despite training',
    conditions: [
      { behavior: 'activeMinutes', operator: 'MAINTAINED', threshold: 1, unit: 'boolean', window: 30 },
      { behavior: 'hrv', operator: 'CHRONIC_LOW', threshold: 15, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 20, unit: 'percent', window: 30 }
    ],
    logic: 'IF (training_maintained) AND (declining_markers) THEN performance_decline_concern',
    confidence_threshold: 0.77,
    evidence_required: 3,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "You're training but not improving. Might be overtraining or health issue.",
      follow_up_prompts: ["Have you seen a doctor?"],
      internal_label: 'Performance decline',
      intervention_timing: 'When user mentions frustration or decline'
    },
    urgency: 'high',
    sensitive: true
  },

  F060_COUCH_TO_5K: {
    id: 'F060',
    name: 'Couch to 5K Program',
    planet: 'Mars',
    category: 'fitness',
    description: 'Structured beginner running program',
    conditions: [
      { behavior: 'activeMinutes', operator: 'GRADUALLY_INCREASES', threshold: 50, unit: 'percent', window: 56 },
      { behavior: 'running_pattern', operator: 'PROGRESSIVE', threshold: 1, unit: 'boolean', window: 56 },
      { behavior: 'baseline_low', operator: 'TRUE', threshold: 1, unit: 'boolean', window: 60 }
    ],
    logic: 'IF (sedentary_baseline) AND (8_week_running_progression) THEN c25k_program_likely',
    confidence_threshold: 0.81,
    evidence_required: 3,
    false_positive_rate: 0.13,
    detection_window: [30, 60],
    silent_guidance: {
      discovery_question: "Doing Couch to 5K? That's awesome!",
      follow_up_prompts: ["What week are you on?"],
      internal_label: 'Couch to 5K',
      intervention_timing: 'When user mentions C25K or beginner running'
    },
    urgency: 'low',
    sensitive: false
  }

};
