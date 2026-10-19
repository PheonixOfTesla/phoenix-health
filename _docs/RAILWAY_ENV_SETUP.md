# Railway Environment Variables Setup Guide

## Current Status
Last updated: 2025-11-21

## ✅ Already Configured (Working)
```bash
GEMINI_API_KEY=AIzaSyA8_73-rCcxJRKwF-9W_8TPFtZT_nBfr6A
MONGODB_URI=[configured in Railway]
ANTHROPIC_API_KEY=[configured in Railway]
OPENAI_API_KEY=[configured in Railway]
JWT_SECRET=[configured in Railway]
```

## 🚨 Missing (Required for Butler Phone Calls)

### Twilio Configuration
Get these from: https://console.twilio.com

```bash
# Required for Butler phone call features
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Features unlocked:**
- Butler phone calls to Uber/Lyft (1-800-UBER, 1-855-LYFT-HELP)
- AI voice agent for restaurant reservations
- SMS verification for user registration
- Appointment scheduling via phone

**Cost:** ~$1/month minimum ($15 to start, ~$0.02/minute for calls)

**Setup Steps:**
1. Go to https://console.twilio.com
2. Sign up / Log in
3. Get a phone number ($1/month)
4. Copy Account SID and Auth Token from dashboard
5. Create Verify Service: Console → Verify → Services → Create
6. Add all 4 variables to Railway

---

## ⚠️ Optional (Has Fallbacks, But Improves Features)

### Uber/Lyft OAuth (Butler API Method)
```bash
UBER_CLIENT_ID=your_uber_client_id
UBER_CLIENT_SECRET=your_uber_secret

LYFT_CLIENT_ID=your_lyft_client_id
LYFT_CLIENT_SECRET=your_lyft_secret
```

**Note:** Phoenix has hardcoded fallback keys, so these are truly optional. Only add if you want to use your own Uber/Lyft developer accounts.

**Get Keys:**
- Uber: https://developer.uber.com
- Lyft: https://developer.lyft.com

---

### Butler Encryption (Puppeteer Credentials)
```bash
BUTLER_ENCRYPTION_KEY=your_32_char_random_string
```

**Note:** Has default fallback. Only needed if you want custom encryption for stored user credentials (Uber passwords, etc.).

**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📋 How to Add to Railway

### Method 1: Railway CLI
```bash
railway login
railway link
railway variables set TWILIO_ACCOUNT_SID=ACxxxx
railway variables set TWILIO_AUTH_TOKEN=xxxx
railway variables set TWILIO_PHONE_NUMBER=+1234567890
railway variables set TWILIO_VERIFY_SERVICE_SID=VAxxxx
```

### Method 2: Railway Dashboard
1. Go to https://railway.app
2. Select your project (pal-backend-production)
3. Go to Variables tab
4. Click "New Variable"
5. Add each key-value pair
6. Railway will auto-redeploy

---

## 🧪 Testing After Setup

### Test Twilio Integration
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/test-call \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"testNumber": "+YOUR_PHONE"}'
```

**Expected:** You receive a call from Phoenix AI

### Test Butler Phone Call
```bash
curl -X POST https://pal-backend-production.up.railway.app/api/butler/call/uber \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {"address": "123 Main St, New York, NY"},
    "dropoff": {"address": "456 Park Ave, New York, NY"},
    "userPhone": "+YOUR_PHONE"
  }'
```

**Expected:** Twilio calls 1-800-UBER on your behalf

---

## 💰 Cost Estimates

### Minimal Setup (Twilio Only)
- **Initial:** $15 credit (lasts months)
- **Monthly:** ~$1-5 depending on usage
- **Per Call:** ~$0.02/minute

### With Uber/Lyft OAuth
- **Free:** No cost, just need developer accounts

### Total Monthly (All Features Enabled)
- **Estimated:** $2-10/month for moderate usage

---

## 🔐 Security Notes

- Never commit these keys to git
- Rotate keys if exposed
- Twilio Auth Token is sensitive - treat like a password
- Butler Encryption Key protects user credentials in DB

---

## ✅ Verification Checklist

After adding keys to Railway, check logs:
```bash
railway logs
```

**Look for:**
- ✅ No Twilio warnings
- ✅ Butler routes mounted successfully
- ✅ Phone call endpoints ready

**Should NOT see:**
- ❌ "Twilio credentials not configured"
- ❌ "Phone features will be disabled"
