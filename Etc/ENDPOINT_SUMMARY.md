# PHOENIX AI BACKEND - ENDPOINT SUMMARY

**Total Endpoints**: 376
**Last Updated**: November 9, 2025
**Base URL**: `https://api.phoenixai.com` (or your deployment URL)

---

## Table of Contents

1. [Authentication & User Management](#auth-routes) (10 endpoints)
2. [User Management](#user-routes) (11 endpoints)
3. [Mercury - Health & Wearables](#mercury-routes) (38 endpoints)
4. [Venus - Fitness & Training](#venus-routes) (88 endpoints)
5. [Earth - Calendar & Energy](#earth-routes) (11 endpoints)
6. [Mars - Goals & Habits](#mars-routes) (18 endpoints)
7. [Jupiter - Finance](#jupiter-routes) (16 endpoints)
8. [Saturn - Legacy Planning](#saturn-routes) (12 endpoints)
9. [Neptune - Mindfulness & Dreams](#neptune-routes) (10 endpoints)
10. [Uranus - Analytics & Innovation](#uranus-routes) (10 endpoints)
11. [Phoenix - AI Intelligence](#phoenix-routes) (81 endpoints)
12. [Phoenix Voice - Voice AI](#phoenix-voice-routes) (2 endpoints)
13. [Butler - Automation Services](#butler-routes) (11 endpoints)
14. [Interface - Conscious Mind](#interface-routes) (6 endpoints)
15. [Universal - Natural Language](#universal-routes) (3 endpoints)
16. [Subscriptions](#subscription-routes) (5 endpoints)
17. [SMS Verification](#sms-verification-routes) (4 endpoints)
18. [Twilio Webhooks](#twilio-webhooks-routes) (10 endpoints)
19. [TTS - Text-to-Speech](#tts-routes) (4 endpoints)
20. [Whisper - Speech-to-Text](#whisper-routes) (2 endpoints)
21. [Custom Tracker](#custom-tracker-routes) (6 endpoints)

---

<a name="auth-routes"></a>
## File: auth.js (10 endpoints)

### Authentication & User Management

**Base Path**: `/api/auth`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/register` | Register new user account | No |
| POST | `/api/auth/login` | User login, receive JWT token | No |
| POST | `/api/auth/reset-password` | Request password reset code | No |
| PUT | `/api/auth/reset-password/:resetToken` | Reset password using reset code | No |
| GET | `/api/auth/me` | Get current user information from token | Yes |
| PUT | `/api/auth/me` | Update user preferences (onboarding data) | Yes |
| PUT | `/api/auth/change-password` | Change password for logged-in user | Yes |
| POST | `/api/auth/logout` | Logout (client-side token deletion) | Yes |
| POST | `/api/auth/verify-email` | Send email verification | Yes |
| GET | `/api/auth/docs` | API documentation | No |

---

<a name="user-routes"></a>
## File: user.js (11 endpoints)

### User Profile & Client Management

**Base Path**: `/api/users`

| Method | Path | Description | Auth Required | Roles |
|--------|------|-------------|---------------|-------|
| GET | `/api/users/docs` | User API documentation | No | - |
| GET | `/api/users/profile` | Get current user profile | Yes | Any |
| PUT | `/api/users/profile` | Update current user profile | Yes | Any |
| GET | `/api/users` | List all users | Yes | Any |
| POST | `/api/users` | Create new user | Yes | admin, owner |
| GET | `/api/users/specialist/:specialistId/clients` | Get clients by specialist | Yes | Any |
| POST | `/api/users/assign-client` | Assign client to specialist | Yes | admin, owner, specialist |
| POST | `/api/users/unassign-client` | Unassign client from specialist | Yes | admin, owner, specialist |
| GET | `/api/users/:id` | Get user by ID | Yes | Any |
| PUT | `/api/users/:id` | Update user by ID | Yes | admin, owner |
| DELETE | `/api/users/:id` | Delete user by ID | Yes | admin, owner |

---

<a name="mercury-routes"></a>
## File: mercury.js (38 endpoints)

### Health, Wearables, Biometrics, Sleep, Recovery

**Base Path**: `/api/mercury`
**Total Endpoints**: 38

#### Biometric Analysis (10 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/mercury/biometrics/dexa` | Get DEXA scan simulation | Yes |
| GET | `/api/mercury/biometrics/composition` | Get body composition analysis | Yes |
| GET | `/api/mercury/biometrics/metabolic` | Get metabolic rate analysis | Yes |
| POST | `/api/mercury/biometrics/metabolic/calculate` | Calculate metabolic rate | Yes |
| GET | `/api/mercury/biometrics/ratios` | Get health ratios and assessments | Yes |
| GET | `/api/mercury/biometrics/visceral-fat` | Get visceral fat analysis | Yes |
| GET | `/api/mercury/biometrics/bone-density` | Get bone density analysis | Yes |
| GET | `/api/mercury/biometrics/hydration` | Get hydration status | Yes |
| GET | `/api/mercury/biometrics/trends` | Get biometric trends over time | Yes |
| GET | `/api/mercury/biometrics/correlations` | Get biometric correlations | Yes |

#### Wearable Device Management (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mercury/devices/:provider/connect` | Connect wearable device | Yes |
| POST | `/api/mercury/devices/:provider/exchange` | Exchange OAuth token | Yes |
| GET | `/api/mercury/devices/:provider/callback` | OAuth callback handler | No |
| GET | `/api/mercury/devices` | Get all connected devices | Yes |
| DELETE | `/api/mercury/devices/:provider` | Disconnect device | Yes |
| POST | `/api/mercury/devices/:provider/sync` | Manually sync device data | Yes |
| POST | `/api/mercury/webhook/:provider` | Webhook handler for device updates | No |

#### Wearable Data & Fusion (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/mercury/data` | Get aggregated wearable data | Yes |
| GET | `/api/mercury/data/raw` | Get raw wearable data | Yes |
| POST | `/api/mercury/data/manual` | Manual data entry | Yes |
| GET | `/api/mercury/insights` | Get AI-powered insights | Yes |

#### HRV & Heart Rate (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/mercury/biometrics/hrv` | Get HRV analysis | Yes |
| GET | `/api/mercury/biometrics/hrv/deep-analysis` | Get deep HRV analysis | Yes |
| GET | `/api/mercury/biometrics/heart-rate` | Get heart rate analysis | Yes |
| GET | `/api/mercury/biometrics/readiness` | Get readiness score | Yes |

#### Sleep Analysis (3 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/mercury/sleep` | Get sleep data | Yes |
| GET | `/api/mercury/sleep/analysis` | Get sleep analysis | Yes |
| GET | `/api/mercury/sleep/recommendations` | Get sleep recommendations | Yes |

#### Recovery Scoring (11 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/mercury/recovery/latest` | Get latest recovery score | Yes |
| GET | `/api/mercury/recovery/history` | Get recovery history | Yes |
| POST | `/api/mercury/recovery/calculate` | Recalculate recovery score | Yes |
| GET | `/api/mercury/recovery/trends` | Get recovery trends | Yes |
| GET | `/api/mercury/recovery/prediction` | Get recovery prediction | Yes |
| GET | `/api/mercury/recovery/protocols` | Get recovery protocols | Yes |
| GET | `/api/mercury/recovery/debt` | Get recovery debt | Yes |
| GET | `/api/mercury/recovery/overtraining-risk` | Get overtraining risk assessment | Yes |
| GET | `/api/mercury/recovery/training-load` | Get training load analysis | Yes |
| GET | `/api/mercury/recovery/insights` | Get recovery insights | Yes |
| GET | `/api/mercury/recovery/dashboard` | Get recovery dashboard | Yes |

---

<a name="venus-routes"></a>
## File: venus.js (88 endpoints)

### Fitness & Training Intelligence

**Base Path**: `/api/venus`
**Total Endpoints**: 88

#### Workout Tracking (8 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/workouts/start` | Start new workout | Yes |
| POST | `/api/venus/workouts/:workoutId/exercise` | Log exercise in workout | Yes |
| POST | `/api/venus/workouts/:id/complete` | Complete workout | Yes |
| GET | `/api/venus/workouts` | Get workout history | Yes |
| GET | `/api/venus/workouts/active` | Get active workout | Yes |
| GET | `/api/venus/workouts/:id` | Get specific workout | Yes |
| PUT | `/api/venus/workouts/:id` | Update workout | Yes |
| DELETE | `/api/venus/workouts/:id` | Delete workout | Yes |

#### Workout Intelligence (13 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/workouts/recommend` | Get AI workout recommendations | Yes |
| GET | `/api/venus/workouts/similar` | Get similar workouts | Yes |
| GET | `/api/venus/workouts/templates/library` | Get workout templates library | Yes |
| POST | `/api/venus/workouts/templates/create` | Create workout template | Yes |
| GET | `/api/venus/workouts/form-analysis` | Get form analysis | Yes |
| POST | `/api/venus/workouts/form-check` | Check exercise form | Yes |
| GET | `/api/venus/workouts/effectiveness` | Get workout effectiveness analysis | Yes |
| GET | `/api/venus/workouts/compare` | Compare workouts | Yes |
| GET | `/api/venus/workouts/intensity-zones` | Get intensity zones | Yes |
| GET | `/api/venus/workouts/volume-progression` | Get volume progression | Yes |
| GET | `/api/venus/workouts/deload-planning` | Plan deload week | Yes |
| POST | `/api/venus/workouts/periodization` | Generate periodization plan | Yes |
| GET | `/api/venus/workouts/optimal-window` | Get optimal training window | Yes |

#### Quantum Workouts (8 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/quantum/generate` | Generate quantum workout | Yes |
| GET | `/api/venus/quantum/history` | Get quantum workout history | Yes |
| GET | `/api/venus/quantum/effectiveness` | Analyze quantum effectiveness | Yes |
| GET | `/api/venus/quantum/plateau-detection` | Detect training plateaus | Yes |
| GET | `/api/venus/quantum/settings` | Get quantum settings | Yes |
| PUT | `/api/venus/quantum/settings` | Update quantum settings | Yes |
| GET | `/api/venus/quantum/chaos-metrics` | Get chaos metrics | Yes |
| POST | `/api/venus/quantum/regenerate-seeds` | Regenerate quantum seeds | Yes |

#### Exercise Library (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/venus/exercises` | Get all exercises | Yes |
| GET | `/api/venus/exercises/search` | Search exercises | Yes |
| GET | `/api/venus/exercises/:id` | Get specific exercise | Yes |
| GET | `/api/venus/exercises/:id/alternatives` | Get exercise alternatives | Yes |
| POST | `/api/venus/exercises` | Create custom exercise | Yes |
| POST | `/api/venus/exercises/recommend` | Get exercise recommendations | Yes |

#### Progressive Overload (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/venus/progress/overload` | Get progressive overload analysis | Yes |
| POST | `/api/venus/progress/1rm` | Calculate one-rep max | Yes |
| GET | `/api/venus/progress/standards` | Get strength standards | Yes |
| GET | `/api/venus/progress/records` | Get personal records | Yes |

#### Nutrition Logging (10 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/nutrition/log` | Log meal | Yes |
| GET | `/api/venus/nutrition/logs` | Get nutrition logs | Yes |
| PUT | `/api/venus/nutrition/logs/:id` | Update meal | Yes |
| DELETE | `/api/venus/nutrition/logs/:id` | Delete meal | Yes |
| GET | `/api/venus/nutrition/macros` | Get macro summary | Yes |
| POST | `/api/venus/nutrition/targets` | Set macro targets | Yes |
| POST | `/api/venus/nutrition/targets/calculate` | Calculate macro targets | Yes |
| GET | `/api/venus/nutrition/insights` | Get nutrition insights | Yes |
| POST | `/api/venus/nutrition/water` | Track water intake | Yes |
| GET | `/api/venus/nutrition/water` | Get water tracking data | Yes |

#### AI Meal Planning (8 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/nutrition/meal-plan/generate` | Generate AI meal plan | Yes |
| POST | `/api/venus/nutrition/photo-analyze` | Analyze food photo | Yes |
| POST | `/api/venus/nutrition/barcode-scan` | Scan food barcode | Yes |
| POST | `/api/venus/nutrition/recipe-suggest` | Get recipe suggestions | Yes |
| GET | `/api/venus/nutrition/meal-prep` | Get meal prep plans | Yes |
| POST | `/api/venus/nutrition/meal-prep/plan` | Create meal prep plan | Yes |
| GET | `/api/venus/nutrition/restaurants` | Analyze restaurant options | Yes |
| POST | `/api/venus/nutrition/restaurants/analyze` | Get restaurant recommendations | Yes |

#### Supplement Tracking (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/supplements/log` | Log supplement | Yes |
| GET | `/api/venus/supplements` | Get supplement log | Yes |
| GET | `/api/venus/supplements/interactions` | Check supplement interactions | Yes |
| POST | `/api/venus/supplements/stack-builder` | Build supplement stack | Yes |

#### Body Measurements (9 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/body/measurements` | Log body measurement | Yes |
| GET | `/api/venus/body/measurements` | Get body measurements | Yes |
| GET | `/api/venus/body/composition` | Get body composition analysis | Yes |
| POST | `/api/venus/body/photos` | Upload progress photo | Yes |
| GET | `/api/venus/body/photos` | Get progress photos | Yes |
| GET | `/api/venus/body/photos/compare` | Compare progress photos | Yes |
| GET | `/api/venus/body/recomp-analysis` | Get recomp analysis | Yes |
| GET | `/api/venus/body/muscle-symmetry` | Get muscle symmetry analysis | Yes |
| GET | `/api/venus/body/fat-distribution` | Get fat distribution analysis | Yes |

#### Performance Testing (7 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/venus/performance/tests` | Create performance test | Yes |
| POST | `/api/venus/performance/tests/:id/results` | Record test results | Yes |
| GET | `/api/venus/performance/tests` | Get performance tests | Yes |
| GET | `/api/venus/performance/benchmarks` | Get performance benchmarks | Yes |
| GET | `/api/venus/performance/standards` | Get detailed strength standards | Yes |
| GET | `/api/venus/performance/percentile` | Get performance percentile | Yes |
| GET | `/api/venus/performance/predictions` | Get performance predictions | Yes |

#### Social Features (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/venus/social/feed` | Get social feed | Yes |
| POST | `/api/venus/social/share` | Share workout | Yes |
| GET | `/api/venus/social/challenges` | Get challenges | Yes |
| POST | `/api/venus/social/challenges/join` | Join challenge | Yes |
| GET | `/api/venus/social/friends` | Get friends list | Yes |
| POST | `/api/venus/social/friends/add` | Add friend | Yes |

#### Injury Risk & Prevention (5 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/venus/injury-risk/assessment` | Get injury risk assessment | Yes |
| GET | `/api/venus/injury-risk/history` | Get injury history | Yes |
| POST | `/api/venus/injury-risk/report` | Report injury | Yes |
| GET | `/api/venus/injury-risk/prevention` | Get prevention protocols | Yes |
| GET | `/api/venus/injury-risk/rehab-protocols` | Get rehab protocols | Yes |

---

<a name="earth-routes"></a>
## File: earth.js (11 endpoints)

### Calendar Integration & Energy Management

**Base Path**: `/api/earth`

#### Calendar Integration (7 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/earth/calendar/connect/:provider` | Connect calendar provider | Yes |
| POST | `/api/earth/calendar/callback` | Handle calendar OAuth callback | Yes |
| GET | `/api/earth/calendar/events` | Get calendar events | Yes |
| POST | `/api/earth/calendar/events` | Create calendar event | Yes |
| GET | `/api/earth/calendar/energy-map` | Get energy-optimized schedule | Yes |
| GET | `/api/earth/calendar/conflicts` | Detect calendar conflicts | Yes |
| POST | `/api/earth/calendar/sync` | Sync calendar | Yes |

#### Energy Tracking (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/earth/energy/pattern` | Get energy pattern | Yes |
| POST | `/api/earth/energy/log` | Log energy level | Yes |
| GET | `/api/earth/energy/optimal-times` | Get optimal meeting times | Yes |
| GET | `/api/earth/energy/prediction` | Predict energy levels | Yes |

---

<a name="mars-routes"></a>
## File: mars.js (18 endpoints)

### Goals, Habits, Milestones, Progress Tracking

**Base Path**: `/api/mars`
**Total Endpoints**: 18

#### Goal Management (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mars/goals` | Create new goal | Yes |
| GET | `/api/mars/goals` | Get all goals for user | Yes |
| GET | `/api/mars/goals/:id` | Get single goal by ID | Yes |
| PUT | `/api/mars/goals/:id` | Update goal | Yes |
| DELETE | `/api/mars/goals/:id` | Delete goal | Yes |
| POST | `/api/mars/goals/:id/complete` | Mark goal as complete | Yes |

#### AI Goal Generation (3 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mars/goals/generate-smart` | Generate SMART goal from vague input | Yes |
| POST | `/api/mars/goals/suggest` | Get personalized goal suggestions | Yes |
| GET | `/api/mars/goals/templates` | Get goal templates | Yes |

#### Progress Tracking (5 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mars/goals/:id/progress` | Log progress update | Yes |
| GET | `/api/mars/goals/:id/progress` | Get progress history for goal | Yes |
| GET | `/api/mars/progress/velocity` | Get progress velocity | Yes |
| GET | `/api/mars/progress/predictions` | Get ML-based progress predictions | Yes |
| GET | `/api/mars/progress/bottlenecks` | Get bottleneck analysis | Yes |

#### Milestones (2 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mars/goals/:id/milestones` | Create milestone for goal | Yes |
| POST | `/api/mars/milestones/:id/complete` | Complete milestone | Yes |

#### Habits (2 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/mars/habits` | Create habit | Yes |
| POST | `/api/mars/habits/:id/log` | Log habit completion | Yes |

---

<a name="jupiter-routes"></a>
## File: jupiter.js (16 endpoints)

### Finance System - Banking, Budgets, Transactions

**Base Path**: `/api/jupiter`
**Total Endpoints**: 16

#### Plaid Integration (2 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/jupiter/link-token` | Create Plaid link token | Yes |
| POST | `/api/jupiter/exchange-token` | Exchange Plaid public token | Yes |

#### Bank Accounts (3 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/jupiter/accounts` | Get all connected bank accounts | Yes |
| DELETE | `/api/jupiter/account/:id` | Disconnect bank account | Yes |
| POST | `/api/jupiter/sync/:accountId` | Manually sync account transactions | Yes |

#### Transactions (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/jupiter/transactions` | Get all transactions with filters | Yes |
| GET | `/api/jupiter/transactions/date-range` | Get transactions by date range | Yes |
| GET | `/api/jupiter/transactions/category/:category` | Get transactions by category | Yes |
| PUT | `/api/jupiter/transactions/:id` | Update/recategorize transaction | Yes |
| GET | `/api/jupiter/transactions/recurring` | Detect recurring transactions | Yes |
| GET | `/api/jupiter/spending-patterns` | Analyze spending patterns | Yes |

#### Budgets (5 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/jupiter/budgets` | Create new budget | Yes |
| GET | `/api/jupiter/budgets` | Get all active budgets | Yes |
| PUT | `/api/jupiter/budgets/:id` | Update budget | Yes |
| DELETE | `/api/jupiter/budgets/:id` | Delete budget | Yes |
| GET | `/api/jupiter/budgets/alerts` | Get budget overspending alerts | Yes |

---

<a name="saturn-routes"></a>
## File: saturn.js (12 endpoints)

### Legacy Planning, Mortality Awareness, Quarterly Reviews

**Base Path**: `/api/saturn`
**Total Endpoints**: 12

#### Legacy Vision Routes (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/saturn/vision` | Create or update legacy vision | Yes |
| GET | `/api/saturn/vision` | Get user's legacy vision | Yes |
| PUT | `/api/saturn/vision/life-areas` | Update life area scores | Yes |
| POST | `/api/saturn/vision/legacy-goal` | Add a legacy goal | Yes |
| GET | `/api/saturn/mortality` | Get mortality data (days remaining) | Yes |
| PUT | `/api/saturn/vision/review` | Update last reviewed date | Yes |

#### Quarterly Review Routes (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/saturn/quarterly` | Create quarterly review | Yes |
| GET | `/api/saturn/quarterly` | Get user's quarterly reviews | Yes |
| GET | `/api/saturn/quarterly/latest` | Get latest quarterly review | Yes |
| PUT | `/api/saturn/quarterly/:id` | Update quarterly review | Yes |
| GET | `/api/saturn/quarterly/trend` | Get satisfaction trend over time | Yes |
| GET | `/api/saturn/quarterly/compare/:q1/:q2` | Compare two quarters | Yes |

---

<a name="neptune-routes"></a>
## File: neptune.js (10 endpoints)

### Mindfulness & Dreams - Mental Wellness

**Base Path**: `/api/neptune`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/neptune/meditation/sessions` | Get meditation sessions | Yes |
| POST | `/api/neptune/meditation/log` | Log meditation session | Yes |
| GET | `/api/neptune/meditation/stats` | Get meditation statistics | Yes |
| GET | `/api/neptune/dreams/log` | Get dream log | Yes |
| POST | `/api/neptune/dreams/record` | Record dream | Yes |
| GET | `/api/neptune/dreams/analysis` | Analyze dreams | Yes |
| GET | `/api/neptune/mindfulness/score` | Get mindfulness score | Yes |
| POST | `/api/neptune/mindfulness/exercise` | Log mindfulness exercise | Yes |
| GET | `/api/neptune/stress/levels` | Get stress levels | Yes |
| GET | `/api/neptune/mental/wellness` | Get mental wellness report | Yes |

---

<a name="uranus-routes"></a>
## File: uranus.js (10 endpoints)

### Innovation & Learning - Analytics/Insights

**Base Path**: `/api/uranus`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/uranus/insights` | Get insights | Yes |
| GET | `/api/uranus/insights/trends` | Get trends | Yes |
| GET | `/api/uranus/insights/predictions` | Get predictions | Yes |
| GET | `/api/uranus/analytics/performance` | Get performance analytics | Yes |
| GET | `/api/uranus/analytics/patterns` | Get patterns | Yes |
| POST | `/api/uranus/learning/log` | Log learning activity | Yes |
| GET | `/api/uranus/learning/progress` | Get learning progress | Yes |
| GET | `/api/uranus/innovation/suggestions` | Get innovation suggestions | Yes |
| POST | `/api/uranus/data/export` | Export data | Yes |
| GET | `/api/uranus/reports/generate` | Generate report | Yes |

---

<a name="phoenix-routes"></a>
## File: phoenix.js (81 endpoints)

### AI Butler & Intelligence System

**Base Path**: `/api/phoenix`
**Total Endpoints**: 81

#### A. AI Companion (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/companion/chat` | Chat with Phoenix AI | Yes |
| GET | `/api/phoenix/companion/history` | Get chat history | Yes |
| DELETE | `/api/phoenix/companion/history` | Clear chat history | Yes |
| GET | `/api/phoenix/companion/context` | Get conversation context | Yes |
| GET | `/api/phoenix/companion/personality` | Get personality settings | Yes |
| PUT | `/api/phoenix/companion/personality` | Update personality settings | Yes |

#### B. Correlation Engine (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/phoenix/patterns` | Get correlation patterns | Yes |
| POST | `/api/phoenix/patterns/analyze` | Analyze new patterns | Yes |
| GET | `/api/phoenix/patterns/realtime` | Get realtime patterns | Yes |
| PUT | `/api/phoenix/patterns/:id/validate` | Validate pattern | Yes |
| DELETE | `/api/phoenix/patterns/:id` | Delete pattern | Yes |
| GET | `/api/phoenix/insights` | Get AI insights | Yes |

#### C. Prediction Engine (10 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/phoenix/predictions` | Get all predictions | Yes |
| GET | `/api/phoenix/predictions/active` | Get active predictions | Yes |
| GET | `/api/phoenix/predictions/:id` | Get prediction by ID | Yes |
| POST | `/api/phoenix/predictions/request/:type` | Request new prediction | Yes |
| PUT | `/api/phoenix/predictions/:id/outcome` | Record prediction outcome | Yes |
| GET | `/api/phoenix/predictions/accuracy` | Get prediction accuracy metrics | Yes |
| GET | `/api/phoenix/predictions/forecast` | Get forecast | Yes |
| GET | `/api/phoenix/predictions/optimal-window` | Get optimal action window | Yes |
| GET | `/api/phoenix/predictions/burnout-risk` | Get burnout risk prediction | Yes |
| GET | `/api/phoenix/predictions/weight-change` | Get weight prediction | Yes |

#### D. Intervention Engine (9 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/phoenix/interventions` | Get all interventions | Yes |
| GET | `/api/phoenix/interventions/active` | Get active interventions | Yes |
| GET | `/api/phoenix/interventions/pending` | Get pending interventions | Yes |
| POST | `/api/phoenix/interventions/:id/acknowledge` | Acknowledge intervention | Yes |
| PUT | `/api/phoenix/interventions/:id/outcome` | Record intervention outcome | Yes |
| GET | `/api/phoenix/interventions/stats` | Get intervention statistics | Yes |
| GET | `/api/phoenix/interventions/history` | Get intervention history | Yes |
| POST | `/api/phoenix/interventions/settings` | Configure intervention settings | Yes |
| POST | `/api/phoenix/interventions/request` | Request manual intervention | Yes |

#### E. Intelligence Engine (8 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/phoenix/intelligence` | Get intelligence overview | Yes |
| POST | `/api/phoenix/intelligence/analyze` | Trigger analysis | Yes |
| GET | `/api/phoenix/intelligence/insights` | Get AI insights | Yes |
| POST | `/api/phoenix/intelligence/query` | Natural language query | Yes |
| GET | `/api/phoenix/intelligence/summary` | Get daily summary | Yes |
| POST | `/api/phoenix/intelligence/deep-dive` | Get deep dive analysis | Yes |
| GET | `/api/phoenix/intelligence/recommendations` | Get recommendations | Yes |
| POST | `/api/phoenix/intelligence/auto-optimize` | Auto-optimize settings | Yes |

#### F. Voice AI (4 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/voice/session` | Create voice session | Yes |
| DELETE | `/api/phoenix/voice/session` | End voice session | Yes |
| GET | `/api/phoenix/voice/transcriptions` | Get transcriptions | Yes |
| GET | `/api/phoenix/voice/history` | Get voice history | Yes |

#### G. ML & Learning (7 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/ml/train` | Train ML model | Yes |
| GET | `/api/phoenix/ml/models` | Get ML models | Yes |
| GET | `/api/phoenix/ml/training-status` | Get training status | Yes |
| POST | `/api/phoenix/behavior/track` | Track behavior | Yes |
| GET | `/api/phoenix/behavior/patterns` | Get behavior patterns | Yes |
| GET | `/api/phoenix/behavior/insights` | Get behavior insights | Yes |
| GET | `/api/phoenix/behavior/:type` | Get behavior by type | Yes |

#### H. Butler Actions (31 endpoints)

**Reservations (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/reservation` | Make restaurant reservation | Yes |
| GET | `/api/phoenix/butler/reservations` | Get reservation history | Yes |

**Food Ordering (3 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/food` | Order food delivery | Yes |
| GET | `/api/phoenix/butler/food/history` | Get food order history | Yes |
| POST | `/api/phoenix/butler/food/reorder` | Reorder previous meal | Yes |

**Rides (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/ride` | Book ride (Uber/Lyft) | Yes |
| GET | `/api/phoenix/butler/rides` | Get ride history | Yes |

**Phone Calls (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/call` | Make phone call | Yes |
| GET | `/api/phoenix/butler/calls` | Get call history | Yes |

**SMS/Text Messages (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/sms` | Send SMS message | Yes |
| GET | `/api/phoenix/butler/sms` | Get SMS history | Yes |

**Email (3 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/email` | Send email | Yes |
| GET | `/api/phoenix/butler/emails` | Get email history | Yes |
| POST | `/api/phoenix/butler/email/reply` | Reply to email | Yes |

**Calendar (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/calendar` | Manage calendar | Yes |
| POST | `/api/phoenix/butler/calendar/optimize` | Optimize calendar | Yes |

**Web Automation (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/search` | Search web | Yes |
| POST | `/api/phoenix/butler/web-task` | Perform web task | Yes |

**Summarization (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/summarize` | Summarize content | Yes |
| POST | `/api/phoenix/butler/summarize/batch` | Batch summarize content | Yes |

**Task Automation (3 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/butler/automate` | Create automation | Yes |
| GET | `/api/phoenix/butler/automations` | Get automations | Yes |
| DELETE | `/api/phoenix/butler/automations/:id` | Delete automation | Yes |

**Budget Management (2 endpoints)**

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/phoenix/butler/budget` | Get budget information | Yes |
| PUT | `/api/phoenix/butler/budget` | Update budget | Yes |

---

<a name="phoenix-voice-routes"></a>
## File: phoenixVoice.js (2 endpoints)

### Conversational AI for Voice Interface

**Base Path**: `/api/phoenix/voice`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/voice/chat` | Voice conversational AI | Yes |
| GET | `/api/phoenix/voice/personalities` | List available personalities | No |

---

<a name="butler-routes"></a>
## File: butler.js (11 endpoints)

### Butler Puppeteer Automation Services

**Base Path**: `/api/butler`

#### Credential Management (3 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/butler/credentials/:service` | Store encrypted credentials | Yes |
| GET | `/api/butler/credentials` | Get connected services | Yes |
| DELETE | `/api/butler/credentials/:service` | Remove credentials | Yes |

#### Service Automation (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/butler/uber/book` | Book Uber ride | Yes |
| POST | `/api/butler/lyft/book` | Book Lyft ride | Yes |
| POST | `/api/butler/opentable/reserve` | Make OpenTable reservation | Yes |
| POST | `/api/butler/doordash/order` | Order from DoorDash | Yes |
| POST | `/api/butler/ubereats/order` | Order from Uber Eats | Yes |

#### Action History (2 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/butler/actions` | Get butler action history | Yes |
| GET | `/api/butler/actions/:actionId` | Get specific action status | Yes |

---

<a name="interface-routes"></a>
## File: interface.js (6 endpoints)

### Conscious Mind - Interface Orchestration

**Base Path**: `/api/interface`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/interface/orchestrate` | Main consciousness orchestration | Yes |
| POST | `/api/interface/interaction` | Log user interaction | Yes |
| GET | `/api/interface/preferences` | Get user preferences | Yes |
| PUT | `/api/interface/preferences` | Update user preferences | Yes |
| PUT | `/api/interface/priorities/:day` | Update day-specific priorities | Yes |
| GET | `/api/interface/analytics` | Get engagement analytics | Yes |

---

<a name="universal-routes"></a>
## File: universal.js (3 endpoints)

### Universal Natural Language Processing

**Base Path**: `/api/phoenix/universal`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/phoenix/universal` | Process any natural language request | Yes |
| GET | `/api/phoenix/universal/examples` | Get example requests | Yes |
| GET | `/api/phoenix/universal/context` | Get current user context | Yes |

---

<a name="subscription-routes"></a>
## File: subscription.js (5 endpoints)

### Stripe Subscription Management

**Base Path**: `/api/subscription`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/subscription/checkout` | Create checkout session | Yes |
| POST | `/api/subscription/webhook` | Stripe webhook handler | No |
| GET | `/api/subscription/status` | Get subscription status | Yes |
| POST | `/api/subscription/cancel` | Cancel subscription | Yes |
| POST | `/api/subscription/portal` | Create customer portal session | Yes |

---

<a name="sms-verification-routes"></a>
## File: sms-verification.js (4 endpoints)

### Twilio Verify API for Phone Verification

**Base Path**: `/api/sms-verification`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/sms-verification/send-verification` | Send verification code | No |
| POST | `/api/sms-verification/verify-code` | Verify code | Yes |
| POST | `/api/sms-verification/resend-code` | Resend verification code | No |
| GET | `/api/sms-verification/status` | Check service status | No |

---

<a name="twilio-webhooks-routes"></a>
## File: twilioWebhooks.js (10 endpoints)

### Twilio Webhooks - Voice & SMS Status Updates

**Base Path**: `/api/webhooks/twilio`

#### Voice Webhooks (6 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/webhooks/twilio/voice` | Handle incoming voice calls | No |
| POST | `/api/webhooks/twilio/voice/twiml/:sessionId` | Generate TwiML for call | No |
| POST | `/api/webhooks/twilio/voice/gather/:sessionId` | Handle speech input | No |
| POST | `/api/webhooks/twilio/voice/status/:sessionId` | Handle call status updates | No |
| POST | `/api/webhooks/twilio/voice/recording/:sessionId` | Handle recording completion | No |

#### SMS Webhooks (3 endpoints)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/webhooks/twilio/sms` | Handle incoming SMS | No |
| POST | `/api/webhooks/twilio/sms/status/:actionId` | Handle SMS status updates | No |
| POST | `/api/webhooks/twilio/sms/incoming` | Handle incoming SMS (alias) | No |

#### Health Check (1 endpoint)

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/webhooks/twilio/health` | Webhook health check | No |

---

<a name="tts-routes"></a>
## File: tts.js (4 endpoints)

### Text-to-Speech - Full Language & Voice Support

**Base Path**: `/api/tts`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/tts/generate` | Convert text to speech | No |
| GET | `/api/tts/voices` | Get available voices | No |
| GET | `/api/tts/languages` | Get available languages | No |
| GET | `/api/tts/status` | Check service status | No |

**Supported Voices**: alloy, echo (British butler), fable, onyx, nova, shimmer
**Supported Languages**: 37+ languages including English, Spanish, French, German, Japanese, Chinese

---

<a name="whisper-routes"></a>
## File: whisper.js (2 endpoints)

### Speech-to-Text using OpenAI Whisper

**Base Path**: `/api/whisper`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/whisper/transcribe` | Convert speech to text | No |
| GET | `/api/whisper/status` | Check service status | No |

**Supported Audio Formats**: webm, wav, mp3, mpeg, mp4, ogg
**Max File Size**: 25MB

---

<a name="custom-tracker-routes"></a>
## File: customTracker.js (6 endpoints)

### Generic API for AI-Generated Tracking Widgets

**Base Path**: `/api/custom-tracker`

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/custom-tracker/:widgetId/log` | Log entry for custom tracker | Yes |
| POST | `/api/custom-tracker/:widgetId/:actionName` | Execute custom action | Yes |
| GET | `/api/custom-tracker/:widgetId/history` | Get history for tracker | Yes |
| GET | `/api/custom-tracker/:widgetId/stats` | Get statistics for tracker | Yes |
| DELETE | `/api/custom-tracker/:widgetId/entry/:entryId` | Delete entry from tracker | Yes |
| GET | `/api/custom-tracker/user/all` | Get all custom trackers for user | Yes |

---

## SUMMARY BY CATEGORY

### Core Systems (31 endpoints)
- **Authentication**: 10 endpoints (auth.js)
- **User Management**: 11 endpoints (user.js)
- **Subscriptions**: 5 endpoints (subscription.js)
- **SMS Verification**: 4 endpoints (sms-verification.js)
- **Status**: 1 endpoint (twilio health check)

### Planetary Systems (183 endpoints)
- **Mercury (Health)**: 38 endpoints
- **Venus (Fitness)**: 88 endpoints
- **Earth (Calendar)**: 11 endpoints
- **Mars (Goals)**: 18 endpoints
- **Jupiter (Finance)**: 16 endpoints
- **Saturn (Legacy)**: 12 endpoints

### Additional Planets (20 endpoints)
- **Neptune (Mindfulness)**: 10 endpoints
- **Uranus (Analytics)**: 10 endpoints

### AI Systems (123 endpoints)
- **Phoenix AI**: 81 endpoints (main AI engine)
- **Phoenix Voice**: 2 endpoints (voice interface)
- **Butler Automation**: 11 endpoints (puppeteer services)
- **Interface (Conscious Mind)**: 6 endpoints (orchestration)
- **Universal NL**: 3 endpoints (natural language)
- **Custom Tracker**: 6 endpoints (dynamic widgets)
- **TTS**: 4 endpoints (text-to-speech)
- **Whisper**: 2 endpoints (speech-to-text)
- **Twilio Webhooks**: 10 endpoints (voice/SMS)

---

## AUTHENTICATION

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get your token by calling `POST /api/auth/login` with valid credentials.

---

## ERROR HANDLING

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

---

## RATE LIMITING

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Webhook endpoints**: No rate limiting (signature verified)

---

## VERSIONING

Current API Version: **v1.0**

All endpoints are prefixed with `/api/`

---

## SUPPORT

For API support, documentation, or questions:
- Email: support@phoenixai.com
- Documentation: https://docs.phoenixai.com
- Status Page: https://status.phoenixai.com

---

**Generated**: November 9, 2025
**Total Endpoints**: 376
**Files Analyzed**: 21 route files
