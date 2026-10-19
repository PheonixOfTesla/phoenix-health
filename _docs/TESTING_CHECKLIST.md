# Phoenix Pre-Deployment Testing Checklist

**Goal:** Verify all critical features work seamlessly before public launch

**Estimated Time:** 3 hours
**Prerequisites:** Railway deployed, Twilio configured, test user account

---

## Setup Phase (15 min)

### ✅ Environment Variables
- [ ] Add Twilio keys to Railway (see RAILWAY_ENV_SETUP.md)
- [ ] Verify OpenAI API key is valid and has quota
- [ ] Check Railway logs for successful startup
- [ ] Confirm TTS shows "32/32 instant responses" (not "0/32")

### ✅ Test User Setup
```bash
# Register test account
POST https://pal-backend-production.up.railway.app/api/auth/register
Body: {
  "email": "test@phoenixtest.com",
  "password": "TestPass123!",
  "name": "Phoenix Tester"
}

# Save the token for all subsequent tests
TOKEN="eyJhbGciOi..."
```

---

## Phase 2: Voice-Based Logging Tests (30 min)

**Test Method:** Use POST /api/phoenix/universal OR POST /api/interface/orchestrate

### Venus (Fitness & Nutrition)

**Test 1: Workout Generation**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I want a fat ass"}'
```
- [ ] Routes to Venus
- [ ] Generates glute-focused workout
- [ ] Returns conversational response (not robotic)
- [ ] Workout data structured properly

**Test 2: Workout Logging**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "I just did 5 sets of squats at 225 pounds for 8 reps"}'
```
- [ ] Extracts: exercise=squats, weight=225, reps=8, sets=5
- [ ] Saves to MongoDB (check Workout collection)
- [ ] Response confirms logging

**Test 3: Nutrition Tracking**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Track my protein intake - I had 30 grams at breakfast"}'
```
- [ ] Creates nutrition entry
- [ ] Tracks macros (30g protein)
- [ ] Adds to daily total

---

### Mercury (Health & Biometrics)

**Test 4: Recovery Check**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "How is my recovery today?"}'
```
- [ ] Shows HRV score (if available)
- [ ] Shows sleep data (if available)
- [ ] Gives recovery recommendation
- [ ] Handles missing data gracefully (no "0% recovery" for new users)

**Test 5: Readiness Check**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "Should I train today?"}'
```
- [ ] Analyzes recovery + recent training load
- [ ] Gives actionable yes/no recommendation
- [ ] Explains reasoning

---

### Mars (Goals & Habits)

**Test 6: Habit Creation**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to wake up at 6am every day"}'
```
- [ ] Creates habit tracker
- [ ] Sets target: "Wake up at 6am"
- [ ] Adds to user's active habits

**Test 7: Goal Progress**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show my goal progress"}'
```
- [ ] Lists active goals
- [ ] Shows completion percentage
- [ ] Motivational response

---

### Jupiter (Finance)

**Test 8: Spending Analysis**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Where am I overspending?"}'
```
- [ ] Analyzes transaction categories
- [ ] Identifies highest spend categories
- [ ] Compares to budget (if set)

**Test 9: Transaction Logging**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "I spent $50 on groceries at Whole Foods"}'
```
- [ ] Creates transaction entry
- [ ] Amount: $50
- [ ] Category: Groceries
- [ ] Merchant: Whole Foods

---

### Earth (Calendar & Energy)

**Test 10: Schedule Query**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is on my schedule today?"}'
```
- [ ] Shows upcoming events (if calendar connected)
- [ ] Handles empty calendar gracefully
- [ ] Conversational response

**Test 11: Energy Optimization**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/phoenix/universal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "When should I schedule my meeting?"}'
```
- [ ] Suggests optimal time based on energy curve
- [ ] Explains reasoning (morning person vs night owl)
- [ ] Checks for conflicts

---

### Custom Widget Creation

**Test 12: Dynamic Widget**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "Track my water intake"}'
```
- [ ] Generates custom water tracker widget
- [ ] Returns HTML + actions
- [ ] Widget ID created: "water-intake" or similar

**Test 13: Log to Custom Widget**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/custom-tracker/water-intake/log \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": 8, "note": "8 oz glass", "metadata": {"ounces": 8}}'
```
- [ ] Entry saved to CustomTrackerEntry collection
- [ ] Timestamp recorded
- [ ] Stats updated

**Test 14: Widget Stats**
```bash
curl -X GET https://pal-backend-production.up.railway.app/api/custom-tracker/water-intake/stats \
  -H "Authorization: Bearer $TOKEN"
```
- [ ] Returns total entries
- [ ] Shows average value
- [ ] Calculates streak (if daily)

---

## Phase 3: Butler Services Tests (45 min)

### Price Estimation (No API Keys Required)

**Test 15: Uber Price Estimate**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/estimate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "uber",
    "pickup": {"lat": 40.7128, "lng": -74.0060},
    "dropoff": {"lat": 40.7580, "lng": -73.9855},
    "rideType": "uberX"
  }'
```
- [ ] Returns estimated price ($15-25)
- [ ] Shows ETA (5-10 min)
- [ ] Distance calculated
- [ ] Formula-based (not real API)

---

### Twilio Phone Calls (Requires Twilio Keys)

**Test 16: Test Call**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/test-call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testNumber": "+YOUR_PHONE_NUMBER"}'
```
- [ ] Receive call on your phone
- [ ] Hear Phoenix AI voice
- [ ] Call logs to ButlerAction collection

**Test 17: Uber via Phone Call**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/call/uber \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"address": "123 Main St, New York, NY"},
    "dropoff": {"address": "456 Park Ave, New York, NY"},
    "userPhone": "+YOUR_PHONE_NUMBER"
  }'
```
- [ ] Twilio calls 1-800-UBER (1-800-823-7666)
- [ ] AI voice agent speaks your request
- [ ] Call recording saved
- [ ] You get callback with confirmation

---

### Puppeteer Automation (Requires User Credentials)

**Test 18: Store Uber Credentials**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/credentials/uber \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-uber-email@example.com",
    "password": "your-uber-password"
  }'
```
- [ ] Credentials encrypted and stored
- [ ] Returns success message
- [ ] ButlerCredential document created

**Test 19: Book Uber via Puppeteer**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/uber/book \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": "123 Main St, New York, NY 10001",
    "destination": "456 Park Ave, New York, NY 10022",
    "rideType": "UberX"
  }'
```
- [ ] Puppeteer opens headless Chrome
- [ ] Logs into Uber with stored credentials
- [ ] Selects pickup and destination
- [ ] Books ride
- [ ] Returns confirmation + screenshot
- [ ] ButlerAction saved with "completed" status

**Test 20: OpenTable Reservation**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/opentable/reserve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Carbone",
    "location": "New York, NY",
    "partySize": 4,
    "date": "2025-12-15",
    "time": "20:00"
  }'
```
- [ ] Searches OpenTable for restaurant
- [ ] Finds availability
- [ ] Makes reservation
- [ ] Confirmation screenshot captured

---

## Phase 4: Conversation Context Tests (20 min)

**Test 21: Multi-Turn Conversation**
```bash
# Turn 1
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "I want to lose 10 pounds"}'

# Turn 2 (immediately after)
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "How long will it take?"}'

# Turn 3
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "Track my weight today at 185 pounds"}'
```
- [ ] Turn 2: Phoenix remembers "10 pounds" goal
- [ ] Turn 3: Phoenix links 185 to target weight
- [ ] VoiceSession stores all 3 turns
- [ ] Context maintained across turns

**Test 22: Fact Extraction**
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "My birthday is June 15th and my favorite movies are Inception and Interstellar"}'
```
- [ ] UserProfile updated with birthday: "06-15"
- [ ] favorites.movies: ["Inception", "Interstellar"]
- [ ] Saved permanently (check UserProfile collection)
- [ ] Phoenix acknowledges facts learned

**Test 23: Cross-Domain Context**
```bash
# Venus: Log workout
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "I just did a heavy leg workout"}'

# Mercury: Check recovery (should reference workout)
curl -X POST https://pal-backend-production.up.railway.app/api/interface/orchestrate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voiceQuery": "Should I train again tomorrow?"}'
```
- [ ] Phoenix references recent leg workout
- [ ] Recommends recovery day
- [ ] Cross-domain data loaded (Venus → Mercury)

---

## Phase 7: End-to-End User Journey (30 min)

**Complete Flow: Morning Routine → Workout → Recovery → Butler Task**

```bash
# Step 1: Morning check-in
POST /api/interface/orchestrate
Body: {"voiceQuery": "Hey Phoenix, how's my recovery?"}
Expected: Recovery analysis based on sleep/HRV

# Step 2: Workout recommendation
POST /api/phoenix/universal
Body: {"message": "Should I work out today?"}
Expected: Recommendation based on recovery score

# Step 3: Generate workout
POST /api/phoenix/universal
Body: {"message": "Give me a leg workout"}
Expected: Glute-focused workout generated

# Step 4: Log workout completion
POST /api/interface/orchestrate
Body: {"voiceQuery": "I just finished that workout - 45 minutes, 5 exercises"}
Expected: Workout saved to Venus

# Step 5: Link to goal
POST /api/phoenix/universal
Body: {"message": "Track this toward my fitness goal"}
Expected: Workout linked to active Mars goal

# Step 6: Order post-workout meal
POST /api/butler/call/ubereats (or Puppeteer if credentials stored)
Body: {"restaurant": "Sweetgreen", "order": "Harvest Bowl"}
Expected: Food ordered via Butler

# Step 7: Schedule recovery
POST /api/phoenix/universal
Body: {"message": "When should I schedule my next workout?"}
Expected: Earth analyzes calendar + energy → suggests time
```

**Success Criteria:**
- [ ] All 7 steps complete without errors
- [ ] Data logged across 4 planets (Mercury, Venus, Mars, Earth)
- [ ] Butler executes real task (food order)
- [ ] Context maintained throughout journey
- [ ] Total time: <5 minutes

---

## Success Metrics

### Critical (Must Pass)
- [ ] Voice logging works on all 5 planets (Venus, Mercury, Mars, Jupiter, Earth)
- [ ] Conversation context maintained across turns
- [ ] Custom widgets generate dynamically
- [ ] Butler price estimation works
- [ ] At least 1 Butler method works (Twilio OR Puppeteer)

### Important (Should Pass)
- [ ] TTS pre-generation: 32/32 responses cached
- [ ] User facts extraction and storage
- [ ] Cross-domain data loading (e.g., Venus → Mercury)
- [ ] End-to-end journey completes

### Nice to Have
- [ ] All 3 Butler methods working (API + Twilio + Puppeteer)
- [ ] Saturn legacy features (currently stubbed - OK to skip)
- [ ] Real wearable data integration (can test with mocks)

---

## Deployment Readiness Checklist

After completing all tests:

- [ ] TTS instant responses: 32/32 cached
- [ ] No API quota errors in logs
- [ ] Twilio phone calls working (if enabled)
- [ ] At least 1 Butler booking method works
- [ ] Voice logging tested on 5 planets
- [ ] Custom widgets create and log successfully
- [ ] Conversation memory persists across sessions
- [ ] User facts extract and save properly
- [ ] End-to-end journey completes in <5 min
- [ ] No critical bugs found
- [ ] Performance: Average response time <3s

**Estimated Time to MVP:** 2-4 hours (after all tests pass)

---

## Next Steps After Testing

1. Document any bugs found with severity ratings
2. Create GitHub issues for P0/P1 bugs
3. Set up UptimeRobot to keep Railway warm (5-min pings)
4. Configure production monitoring (Sentry, LogRocket, etc.)
5. Prepare marketing materials (demos, screenshots)
6. Soft launch to 10-20 beta testers
7. Collect feedback for 1 week
8. Fix critical feedback items
9. Public launch! 🚀
