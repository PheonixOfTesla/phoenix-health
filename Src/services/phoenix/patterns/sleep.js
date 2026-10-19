// Sleep Patterns - 40 patterns covering insomnia, sleep disorders, circadian rhythm, sleep quality, recovery
// Pattern IDs: SLP001-SLP040

module.exports = {
  // Insomnia & Sleep Deprivation (10 patterns)
  SLP001_ACUTE_INSOMNIA: {
    id: 'SLP001',
    name: 'Acute Insomnia Episode',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Sudden onset insomnia',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 3, unit: 'hours', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 40, unit: 'percent', window: 7 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (severe_sleep_loss) AND (acute) THEN insomnia_episode',
    confidence_threshold: 0.87,
    evidence_required: 3,
    false_positive_rate: 0.12,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Having trouble sleeping?",
      follow_up_prompts: ["Insomnia is brutal. What's on your mind?"],
      internal_label: 'Acute insomnia',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'high',
    sensitive: true
  },

  SLP002_CHRONIC_INSOMNIA: {
    id: 'SLP002',
    name: 'Chronic Insomnia',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Long-term sleep difficulty',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_LOW', threshold: 2, unit: 'hours', window: 30 },
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'recoveryScore', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 }
    ],
    logic: 'IF (sustained_sleep_deprivation) THEN chronic_insomnia',
    confidence_threshold: 0.90,
    evidence_required: 3,
    false_positive_rate: 0.09,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Sleep has been bad for weeks. Have you seen a doctor?",
      follow_up_prompts: ["Chronic insomnia needs treatment. Sleep clinic?"],
      internal_label: 'Chronic insomnia',
      intervention_timing: 'Urgent medical referral'
    },
    urgency: 'critical',
    sensitive: true
  },

  SLP003_SLEEP_ANXIETY: {
    id: 'SLP003',
    name: 'Sleep Anxiety Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Anxiety about sleeping',
    conditions: [
      { behavior: 'restingHeartRate', operator: 'BEDTIME_SPIKE', threshold: 12, unit: 'bpm', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (bedtime_anxiety) AND (sleep_dread) THEN sleep_anxiety',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Anxious about sleep itself?",
      follow_up_prompts: ["Sleep anxiety creates a vicious cycle. CBT-I helps."],
      internal_label: 'Sleep anxiety',
      intervention_timing: 'Evening patterns'
    },
    urgency: 'high',
    sensitive: true
  },

  SLP004_STRESS_INDUCED_INSOMNIA: {
    id: 'SLP004',
    name: 'Stress-Induced Insomnia',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Stress preventing sleep',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 2, unit: 'hours', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 10, unit: 'bpm', window: 14 },
      { behavior: 'hrv', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (stress_physiology) AND (sleep_loss) THEN stress_insomnia',
    confidence_threshold: 0.84,
    evidence_required: 3,
    false_positive_rate: 0.14,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Stress keeping you up at night?",
      follow_up_prompts: ["Racing thoughts at bedtime? Try journaling before bed."],
      internal_label: 'Stress insomnia',
      intervention_timing: 'When stress detected'
    },
    urgency: 'high',
    sensitive: false
  },

  SLP005_REVENGE_BEDTIME_PROCRASTINATION: {
    id: 'SLP005',
    name: 'Revenge Bedtime Procrastination',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Staying up to reclaim time',
    conditions: [
      { behavior: 'sleepDuration', operator: 'DROPS', threshold: 90, unit: 'minutes', window: 14 },
      { behavior: 'bedtime', operator: 'DELAYS', threshold: 2, unit: 'hours', window: 14 }
    ],
    logic: 'IF (late_bedtime) AND (intentional) THEN revenge_sleep',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Staying up late because it's your only 'me time'?",
      follow_up_prompts: ["Revenge bedtime procrastination is real but hurts you."],
      internal_label: 'Revenge sleep',
      intervention_timing: 'Late bedtime pattern'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP006_SLEEP_DEPRIVATION_CRASH: {
    id: 'SLP006',
    name: 'Sleep Deprivation Crash',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Extreme exhaustion collapse',
    conditions: [
      { behavior: 'sleepDuration', operator: 'SPIKE', threshold: 4, unit: 'hours', window: 1 },
      { behavior: 'recoveryScore', operator: 'EXTREME_LOW', threshold: 40, unit: 'percent', window: 3 }
    ],
    logic: 'IF (sleep_debt_payback) AND (crash) THEN deprivation_crash',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [1, 5],
    silent_guidance: {
      discovery_question: "Finally crashed and slept forever?",
      follow_up_prompts: ["Your body demanded payment on sleep debt."],
      internal_label: 'Sleep crash',
      intervention_timing: 'After crash sleep'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP007_CAFFEINE_SLEEP_DISRUPTION: {
    id: 'SLP007',
    name: 'Caffeine Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Caffeine preventing sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 7 },
      { behavior: 'sleepLatency', operator: 'INCREASES', threshold: 30, unit: 'minutes', window: 7 }
    ],
    logic: 'IF (delayed_sleep_onset) AND (caffeine) THEN caffeine_insomnia',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Too much caffeine?",
      follow_up_prompts: ["Cut off caffeine by 2pm for better sleep."],
      internal_label: 'Caffeine disruption',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP008_SCREEN_TIME_SLEEP_LOSS: {
    id: 'SLP008',
    name: 'Screen Time Sleep Loss',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Blue light/screens delaying sleep',
    conditions: [
      { behavior: 'bedtime', operator: 'DELAYS', threshold: 90, unit: 'minutes', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 18, unit: 'percent', window: 14 }
    ],
    logic: 'IF (late_bedtime) AND (screen_exposure) THEN screen_insomnia',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Scrolling before bed?",
      follow_up_prompts: ["Blue light suppresses melatonin. Put the phone down!"],
      internal_label: 'Screen sleep loss',
      intervention_timing: 'Evening behavior'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP009_SUNDAY_NIGHT_INSOMNIA: {
    id: 'SLP009',
    name: 'Sunday Night Insomnia',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Weekly pre-work anxiety',
    conditions: [
      { behavior: 'sleepQuality', operator: 'WEEKLY_DROP_SUNDAY', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'sleepLatency', operator: 'WEEKLY_INCREASE_SUNDAY', threshold: 45, unit: 'minutes', window: 14 }
    ],
    logic: 'IF (sunday_pattern) AND (work_anxiety) THEN sunday_insomnia',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Can't sleep Sunday nights?",
      follow_up_prompts: ["Sunday scaries are real. Anxiety about Monday?"],
      internal_label: 'Sunday insomnia',
      intervention_timing: 'Sunday evenings'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP010_MEDICATION_SLEEP_SIDE_EFFECT: {
    id: 'SLP010',
    name: 'Medication Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Medication affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 },
      { behavior: 'sleepArchitecture', operator: 'DISRUPTED', threshold: 25, unit: 'percent', window: 7 }
    ],
    logic: 'IF (recent_medication) AND (sleep_change) THEN med_disruption',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Started a new medication recently?",
      follow_up_prompts: ["Tell your doctor about sleep side effects."],
      internal_label: 'Med sleep disruption',
      intervention_timing: 'After med change'
    },
    urgency: 'medium',
    sensitive: true
  },

  // Sleep Disorders (8 patterns)
  SLP011_SLEEP_APNEA_PATTERN: {
    id: 'SLP011',
    name: 'Sleep Apnea Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Breathing disruption during sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 35, unit: 'percent', window: 30 },
      { behavior: 'oxygenDesaturation', operator: 'FREQUENT', threshold: 10, unit: 'events', window: 1 },
      { behavior: 'restingHeartRate', operator: 'NIGHTTIME_SPIKES', threshold: 15, unit: 'bpm', window: 30 }
    ],
    logic: 'IF (oxygen_drops) AND (poor_sleep) THEN apnea_likely',
    confidence_threshold: 0.88,
    evidence_required: 3,
    false_positive_rate: 0.11,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Waking up gasping or snoring loudly?",
      follow_up_prompts: ["Sleep apnea is dangerous. Get a sleep study!"],
      internal_label: 'Sleep apnea',
      intervention_timing: 'Urgent medical referral'
    },
    urgency: 'critical',
    sensitive: true
  },

  SLP012_RESTLESS_LEG_SYNDROME: {
    id: 'SLP012',
    name: 'Restless Leg Syndrome',
    planet: 'Mercury',
    category: 'sleep',
    description: 'RLS preventing sleep',
    conditions: [
      { behavior: 'sleepLatency', operator: 'INCREASES', threshold: 60, unit: 'minutes', window: 14 },
      { behavior: 'movementDuringSleep', operator: 'EXCESSIVE', threshold: 40, unit: 'percent', window: 14 }
    ],
    logic: 'IF (delayed_onset) AND (leg_movement) THEN RLS',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Legs feel restless at bedtime?",
      follow_up_prompts: ["RLS is treatable. Talk to your doctor."],
      internal_label: 'RLS',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'medium',
    sensitive: true
  },

  SLP013_NARCOLEPSY_PATTERN: {
    id: 'SLP013',
    name: 'Narcolepsy Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Excessive daytime sleepiness',
    conditions: [
      { behavior: 'daytimeSleepiness', operator: 'EXTREME', threshold: 8, unit: 'epworth', window: 14 },
      { behavior: 'sleepAttacks', operator: 'FREQUENT', threshold: 3, unit: 'per_week', window: 14 }
    ],
    logic: 'IF (uncontrollable_sleep) AND (daytime) THEN narcolepsy_likely',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Falling asleep uncontrollably during the day?",
      follow_up_prompts: ["That's not normal tiredness. See a sleep specialist."],
      internal_label: 'Narcolepsy',
      intervention_timing: 'Urgent referral'
    },
    urgency: 'critical',
    sensitive: true
  },

  SLP014_SLEEPWALKING_PATTERN: {
    id: 'SLP014',
    name: 'Sleepwalking Episodes',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Parasomnia activity',
    conditions: [
      { behavior: 'movementDuringSleep', operator: 'EXTREME', threshold: 60, unit: 'percent', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 7 }
    ],
    logic: 'IF (excessive_movement) AND (amnesia) THEN sleepwalking',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Sleepwalking?",
      follow_up_prompts: ["Parasomnias can be dangerous. See a sleep doctor."],
      internal_label: 'Sleepwalking',
      intervention_timing: 'When reported'
    },
    urgency: 'high',
    sensitive: true
  },

  SLP015_NIGHT_TERRORS: {
    id: 'SLP015',
    name: 'Night Terrors Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Intense sleep terror episodes',
    conditions: [
      { behavior: 'heartRate', operator: 'NIGHTTIME_SPIKES', threshold: 40, unit: 'bpm', window: 7 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 35, unit: 'percent', window: 7 }
    ],
    logic: 'IF (terror_arousal) AND (intense_fear) THEN night_terrors',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Waking up terrified in the night?",
      follow_up_prompts: ["Night terrors are different from nightmares. See a specialist."],
      internal_label: 'Night terrors',
      intervention_timing: 'When episodes occur'
    },
    urgency: 'high',
    sensitive: true
  },

  SLP016_REM_SLEEP_DISORDER: {
    id: 'SLP016',
    name: 'REM Sleep Behavior Disorder',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Acting out dreams',
    conditions: [
      { behavior: 'REMMovement', operator: 'EXCESSIVE', threshold: 50, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 28, unit: 'percent', window: 14 }
    ],
    logic: 'IF (REM_without_paralysis) AND (dream_enactment) THEN RBD',
    confidence_threshold: 0.86,
    evidence_required: 2,
    false_positive_rate: 0.13,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Acting out dreams physically?",
      follow_up_prompts: ["RBD can be serious. Sleep study needed."],
      internal_label: 'REM disorder',
      intervention_timing: 'Urgent evaluation'
    },
    urgency: 'critical',
    sensitive: true
  },

  SLP017_HYPERSOMNIA: {
    id: 'SLP017',
    name: 'Hypersomnia Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Excessive sleep need',
    conditions: [
      { behavior: 'sleepDuration', operator: 'CHRONIC_HIGH', threshold: 3, unit: 'hours', window: 30 },
      { behavior: 'daytimeSleepiness', operator: 'HIGH', threshold: 6, unit: 'epworth', window: 30 }
    ],
    logic: 'IF (oversleeping) AND (still_tired) THEN hypersomnia',
    confidence_threshold: 0.84,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Sleeping 10+ hours but still exhausted?",
      follow_up_prompts: ["Hypersomnia isn't laziness. It's a disorder."],
      internal_label: 'Hypersomnia',
      intervention_timing: 'Medical evaluation'
    },
    urgency: 'high',
    sensitive: true
  },

  SLP018_PERIODIC_LIMB_MOVEMENT: {
    id: 'SLP018',
    name: 'Periodic Limb Movement Disorder',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Repetitive limb movements',
    conditions: [
      { behavior: 'movementDuringSleep', operator: 'PERIODIC', threshold: 15, unit: 'per_hour', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (rhythmic_movement) AND (sleep_fragmentation) THEN PLMD',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Legs jerking during sleep?",
      follow_up_prompts: ["PLMD disrupts sleep. Treatable condition."],
      internal_label: 'PLMD',
      intervention_timing: 'Sleep study recommended'
    },
    urgency: 'medium',
    sensitive: true
  },

  // Circadian Rhythm (8 patterns)
  SLP019_DELAYED_SLEEP_PHASE: {
    id: 'SLP019',
    name: 'Delayed Sleep Phase Syndrome',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Natural night owl pattern',
    conditions: [
      { behavior: 'bedtime', operator: 'CHRONIC_LATE', threshold: 3, unit: 'hours', window: 30 },
      { behavior: 'waketime', operator: 'CHRONIC_LATE', threshold: 3, unit: 'hours', window: 30 }
    ],
    logic: 'IF (consistent_late_schedule) AND (circadian_mismatch) THEN DSPS',
    confidence_threshold: 0.83,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Can't fall asleep before 2am consistently?",
      follow_up_prompts: ["DSPS is a real circadian disorder, not laziness."],
      internal_label: 'DSPS',
      intervention_timing: 'When pattern identified'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP020_ADVANCED_SLEEP_PHASE: {
    id: 'SLP020',
    name: 'Advanced Sleep Phase Syndrome',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Early to bed, early to rise',
    conditions: [
      { behavior: 'bedtime', operator: 'CHRONIC_EARLY', threshold: 3, unit: 'hours', window: 30 },
      { behavior: 'waketime', operator: 'CHRONIC_EARLY', threshold: 3, unit: 'hours', window: 30 }
    ],
    logic: 'IF (early_schedule) AND (circadian_advance) THEN ASPS',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Asleep by 8pm, up at 4am?",
      follow_up_prompts: ["ASPS is common in older adults."],
      internal_label: 'ASPS',
      intervention_timing: 'If causing problems'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP021_SHIFT_WORK_DISORDER: {
    id: 'SLP021',
    name: 'Shift Work Sleep Disorder',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Night shift sleep problems',
    conditions: [
      { behavior: 'sleepQuality', operator: 'CHRONIC_LOW', threshold: 30, unit: 'percent', window: 30 },
      { behavior: 'sleepSchedule', operator: 'IRREGULAR', threshold: 4, unit: 'hours_variance', window: 30 }
    ],
    logic: 'IF (shift_work) AND (circadian_disruption) THEN SWSD',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Working nights messing up your sleep?",
      follow_up_prompts: ["SWSD is hard. Light therapy and melatonin can help."],
      internal_label: 'Shift work disorder',
      intervention_timing: 'During shift work'
    },
    urgency: 'high',
    sensitive: false
  },

  SLP022_JET_LAG_RECOVERY: {
    id: 'SLP022',
    name: 'Jet Lag Recovery',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Time zone adjustment',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 5 },
      { behavior: 'sleepSchedule', operator: 'SHIFTED', threshold: 6, unit: 'hours', window: 5 }
    ],
    logic: 'IF (travel) AND (time_zone_change) THEN jet_lag',
    confidence_threshold: 0.88,
    evidence_required: 2,
    false_positive_rate: 0.11,
    detection_window: [3, 10],
    silent_guidance: {
      discovery_question: "Jet lagged from travel?",
      follow_up_prompts: ["Rule of thumb: 1 day per time zone to adjust."],
      internal_label: 'Jet lag',
      intervention_timing: 'Post-travel'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP023_DAYLIGHT_SAVING_ADJUSTMENT: {
    id: 'SLP023',
    name: 'Daylight Saving Time Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'DST affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 7 },
      { behavior: 'wakeDifficulty', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 7 }
    ],
    logic: 'IF (DST_timing) AND (adjustment_difficulty) THEN DST_disruption',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [5, 14],
    silent_guidance: {
      discovery_question: "Daylight saving time messing with you?",
      follow_up_prompts: ["Takes about a week to adjust. Be patient."],
      internal_label: 'DST disruption',
      intervention_timing: 'Spring/fall DST'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP024_WEEKEND_CATCH_UP_SLEEP: {
    id: 'SLP024',
    name: 'Weekend Sleep Catch-Up',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Social jet lag pattern',
    conditions: [
      { behavior: 'weekendSleepDuration', operator: 'EXCEEDS_WEEKDAY', threshold: 2, unit: 'hours', window: 14 },
      { behavior: 'mondayDifficulty', operator: 'HIGH', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (weekend_oversleep) AND (monday_struggle) THEN social_jet_lag',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [7, 21],
    silent_guidance: {
      discovery_question: "Sleeping way more on weekends?",
      follow_up_prompts: ["Social jet lag is real. Try to keep consistent schedule."],
      internal_label: 'Social jet lag',
      intervention_timing: 'Weekly pattern'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP025_SEASONAL_SLEEP_CHANGE: {
    id: 'SLP025',
    name: 'Seasonal Sleep Pattern Change',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Sleep changing with seasons',
    conditions: [
      { behavior: 'sleepDuration', operator: 'SEASONAL_INCREASE', threshold: 90, unit: 'minutes', window: 30 },
      { behavior: 'waketime', operator: 'SEASONAL_DELAY', threshold: 60, unit: 'minutes', window: 30 }
    ],
    logic: 'IF (winter) AND (increased_sleep_need) THEN seasonal_pattern',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Sleeping more in winter?",
      follow_up_prompts: ["Totally normal. Humans naturally sleep more in winter."],
      internal_label: 'Seasonal sleep',
      intervention_timing: 'Seasonal transitions'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP026_NON_24_SLEEP_WAKE_DISORDER: {
    id: 'SLP026',
    name: 'Non-24-Hour Sleep-Wake Disorder',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Circadian rhythm longer than 24h',
    conditions: [
      { behavior: 'bedtime', operator: 'DAILY_DRIFT', threshold: 60, unit: 'minutes', window: 30 },
      { behavior: 'sleepSchedule', operator: 'PROGRESSIVE_DELAY', threshold: 8, unit: 'hours', window: 30 }
    ],
    logic: 'IF (free_running_rhythm) AND (progressive_delay) THEN non_24',
    confidence_threshold: 0.86,
    evidence_required: 2,
    false_positive_rate: 0.13,
    detection_window: [21, 45],
    silent_guidance: {
      discovery_question: "Sleep time drifting later each day?",
      follow_up_prompts: ["Non-24 is serious. See a sleep specialist."],
      internal_label: 'Non-24 disorder',
      intervention_timing: 'Urgent referral'
    },
    urgency: 'critical',
    sensitive: true
  },

  // Sleep Quality & Recovery (14 patterns)
  SLP027_ALCOHOL_SLEEP_DISRUPTION: {
    id: 'SLP027',
    name: 'Alcohol Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Alcohol fragmenting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 30, unit: 'percent', window: 1 },
      { behavior: 'REMSleep', operator: 'DROPS', threshold: 40, unit: 'percent', window: 1 }
    ],
    logic: 'IF (alcohol_consumption) AND (REM_suppression) THEN alcohol_disruption',
    confidence_threshold: 0.82,
    evidence_required: 2,
    false_positive_rate: 0.15,
    detection_window: [1, 3],
    silent_guidance: {
      discovery_question: "Drinking affecting your sleep?",
      follow_up_prompts: ["Alcohol helps you fall asleep but ruins sleep quality."],
      internal_label: 'Alcohol sleep disruption',
      intervention_timing: 'After drinking'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP028_SLEEP_QUALITY_IMPROVEMENT: {
    id: 'SLP028',
    name: 'Sleep Quality Improving',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Better sleep pattern',
    conditions: [
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 25, unit: 'percent', window: 21 },
      { behavior: 'recoveryScore', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (consistent_improvement) THEN sleep_improving',
    confidence_threshold: 0.81,
    evidence_required: 2,
    false_positive_rate: 0.16,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Sleep getting better?",
      follow_up_prompts: ["Great! What's been helping?"],
      internal_label: 'Sleep improving',
      intervention_timing: 'When improvement detected'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP029_PERFECT_SLEEP_STREAK: {
    id: 'SLP029',
    name: 'Perfect Sleep Streak',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Consistent excellent sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'STABLE_HIGH', threshold: 90, unit: 'percent', window: 14 },
      { behavior: 'recoveryScore', operator: 'STABLE_HIGH', threshold: 85, unit: 'percent', window: 14 }
    ],
    logic: 'IF (sustained_excellence) THEN perfect_sleep',
    confidence_threshold: 0.88,
    evidence_required: 2,
    false_positive_rate: 0.11,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Sleeping like a baby lately!",
      follow_up_prompts: ["Keep doing whatever you're doing!"],
      internal_label: 'Perfect sleep',
      intervention_timing: 'Celebration'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP030_OVERTRAINING_SLEEP_IMPACT: {
    id: 'SLP030',
    name: 'Overtraining Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Too much exercise hurting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 },
      { behavior: 'restingHeartRate', operator: 'ELEVATED', threshold: 8, unit: 'bpm', window: 14 },
      { behavior: 'activeMinutes', operator: 'CHRONIC_HIGH', threshold: 50, unit: 'percent', window: 14 }
    ],
    logic: 'IF (excessive_training) AND (sleep_degradation) THEN overtraining',
    confidence_threshold: 0.83,
    evidence_required: 3,
    false_positive_rate: 0.15,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Training a lot but sleeping worse?",
      follow_up_prompts: ["Overtraining disrupts sleep. Take a rest day."],
      internal_label: 'Overtraining sleep',
      intervention_timing: 'When pattern emerges'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP031_HOT_SLEEPER_PATTERN: {
    id: 'SLP031',
    name: 'Hot Sleeper Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Temperature affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'nightSweats', operator: 'FREQUENT', threshold: 5, unit: 'per_week', window: 14 }
    ],
    logic: 'IF (temperature_disruption) AND (sweating) THEN hot_sleeper',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Waking up hot and sweaty?",
      follow_up_prompts: ["Cool bedroom helps. 65-68°F is optimal."],
      internal_label: 'Hot sleeper',
      intervention_timing: 'When reported'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP032_NOISE_SLEEP_DISRUPTION: {
    id: 'SLP032',
    name: 'Noise Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Environmental noise waking',
    conditions: [
      { behavior: 'sleepFragmentation', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'awakenings', operator: 'FREQUENT', threshold: 5, unit: 'per_night', window: 14 }
    ],
    logic: 'IF (frequent_waking) AND (noise_correlation) THEN noise_disruption',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Noise waking you up?",
      follow_up_prompts: ["White noise or earplugs can help."],
      internal_label: 'Noise disruption',
      intervention_timing: 'When pattern identified'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP033_PARTNER_SLEEP_DISRUPTION: {
    id: 'SLP033',
    name: 'Partner Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Partner affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 22, unit: 'percent', window: 14 },
      { behavior: 'movementAwakenings', operator: 'FREQUENT', threshold: 4, unit: 'per_night', window: 14 }
    ],
    logic: 'IF (partnered_sleep) AND (disruption_correlation) THEN partner_disruption',
    confidence_threshold: 0.74,
    evidence_required: 2,
    false_positive_rate: 0.22,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Partner disrupting your sleep?",
      follow_up_prompts: ["Separate blankets or even separate beds can help!"],
      internal_label: 'Partner disruption',
      intervention_timing: 'When identified'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP034_SLEEP_HYGIENE_IMPROVEMENT: {
    id: 'SLP034',
    name: 'Sleep Hygiene Improving',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Better sleep habits forming',
    conditions: [
      { behavior: 'bedtimeConsistency', operator: 'IMPROVES', threshold: 30, unit: 'percent', window: 21 },
      { behavior: 'sleepQuality', operator: 'GRADUALLY_IMPROVES', threshold: 20, unit: 'percent', window: 21 }
    ],
    logic: 'IF (consistent_schedule) AND (improving_quality) THEN better_hygiene',
    confidence_threshold: 0.79,
    evidence_required: 2,
    false_positive_rate: 0.18,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Being more consistent with bedtime?",
      follow_up_prompts: ["Sleep hygiene matters! Keep it up."],
      internal_label: 'Hygiene improving',
      intervention_timing: 'Positive reinforcement'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP035_NAPPING_PATTERN: {
    id: 'SLP035',
    name: 'Daytime Napping Pattern',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Regular nap habit',
    conditions: [
      { behavior: 'daytimeSleep', operator: 'REGULAR', threshold: 30, unit: 'minutes', window: 14 },
      { behavior: 'nightSleepQuality', operator: 'STABLE', threshold: 10, unit: 'percent', window: 14 }
    ],
    logic: 'IF (beneficial_napping) AND (no_night_disruption) THEN healthy_napping',
    confidence_threshold: 0.75,
    evidence_required: 2,
    false_positive_rate: 0.21,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Power napping during the day?",
      follow_up_prompts: ["20-30 minute naps can be great!"],
      internal_label: 'Healthy napping',
      intervention_timing: 'When pattern observed'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP036_NAPPING_DISRUPTING_NIGHT: {
    id: 'SLP036',
    name: 'Naps Disrupting Night Sleep',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Naps preventing night sleep',
    conditions: [
      { behavior: 'daytimeSleep', operator: 'EXCESSIVE', threshold: 90, unit: 'minutes', window: 14 },
      { behavior: 'nightSleepQuality', operator: 'DROPS', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (long_naps) AND (night_disruption) THEN problematic_napping',
    confidence_threshold: 0.80,
    evidence_required: 2,
    false_positive_rate: 0.17,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Long naps making night sleep harder?",
      follow_up_prompts: ["Limit naps to 20-30 minutes before 3pm."],
      internal_label: 'Nap disruption',
      intervention_timing: 'When pattern identified'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP037_MEDITATION_SLEEP_IMPROVEMENT: {
    id: 'SLP037',
    name: 'Meditation Improving Sleep',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Mindfulness helping sleep',
    conditions: [
      { behavior: 'sleepLatency', operator: 'DECREASES', threshold: 20, unit: 'minutes', window: 21 },
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 18, unit: 'percent', window: 21 }
    ],
    logic: 'IF (meditation_practice) AND (sleep_improvement) THEN meditation_benefit',
    confidence_threshold: 0.77,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [14, 30],
    silent_guidance: {
      discovery_question: "Meditation helping your sleep?",
      follow_up_prompts: ["Mindfulness is proven to improve sleep!"],
      internal_label: 'Meditation benefit',
      intervention_timing: 'Positive reinforcement'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP038_WEIGHTED_BLANKET_BENEFIT: {
    id: 'SLP038',
    name: 'Weighted Blanket Improving Sleep',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Deep pressure therapy helping',
    conditions: [
      { behavior: 'sleepQuality', operator: 'INCREASES', threshold: 20, unit: 'percent', window: 14 },
      { behavior: 'anxietyDuringSleep', operator: 'DECREASES', threshold: 25, unit: 'percent', window: 14 }
    ],
    logic: 'IF (weighted_blanket_use) AND (improvement) THEN weighted_benefit',
    confidence_threshold: 0.76,
    evidence_required: 2,
    false_positive_rate: 0.20,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Weighted blanket helping?",
      follow_up_prompts: ["Deep pressure therapy works for many people!"],
      internal_label: 'Weighted blanket',
      intervention_timing: 'After implementation'
    },
    urgency: 'low',
    sensitive: false
  },

  SLP039_SLEEP_TRACKER_ANXIETY: {
    id: 'SLP039',
    name: 'Sleep Tracker Causing Anxiety',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Orthosomnia pattern',
    conditions: [
      { behavior: 'sleepAnxiety', operator: 'INCREASES', threshold: 30, unit: 'percent', window: 14 },
      { behavior: 'sleepQuality', operator: 'DROPS', threshold: 15, unit: 'percent', window: 14 }
    ],
    logic: 'IF (tracker_obsession) AND (worsening_sleep) THEN orthosomnia',
    confidence_threshold: 0.78,
    evidence_required: 2,
    false_positive_rate: 0.19,
    detection_window: [10, 21],
    silent_guidance: {
      discovery_question: "Stressing about your sleep scores?",
      follow_up_prompts: ["Orthosomnia is real. Take a break from tracking!"],
      internal_label: 'Orthosomnia',
      intervention_timing: 'When identified'
    },
    urgency: 'medium',
    sensitive: false
  },

  SLP040_PREGNANCY_SLEEP_DISRUPTION: {
    id: 'SLP040',
    name: 'Pregnancy Sleep Disruption',
    planet: 'Mercury',
    category: 'sleep',
    description: 'Pregnancy affecting sleep',
    conditions: [
      { behavior: 'sleepQuality', operator: 'GRADUAL_DECLINE', threshold: 30, unit: 'percent', window: 60 },
      { behavior: 'awakenings', operator: 'INCREASES', threshold: 4, unit: 'per_night', window: 60 }
    ],
    logic: 'IF (pregnancy) AND (progressive_worsening) THEN pregnancy_insomnia',
    confidence_threshold: 0.85,
    evidence_required: 2,
    false_positive_rate: 0.14,
    detection_window: [45, 90],
    silent_guidance: {
      discovery_question: "Pregnancy making sleep impossible?",
      follow_up_prompts: ["Third trimester sleep is brutal. Pregnancy pillow helps!"],
      internal_label: 'Pregnancy sleep',
      intervention_timing: 'During pregnancy'
    },
    urgency: 'medium',
    sensitive: true
  }
};
