# PHOENIX CONSCIOUSNESS: SUBSCRIPTION TIERS

## Auto-Elevation on Payment

| Level | Tier | Price | Auto-Unlock |
|-------|------|-------|-------------|
| 1-2 | Free | $0 | ✅ Automatic |
| 3 | Pro | $19/mo | ✅ On payment |
| 4 | Pro+ | $39/mo | ✅ On payment |
| 5 | Enterprise | $99/mo | ✅ On payment |
| 6-7 | God | Custom/Invite | ⚠️ Approval required |

---

## TIER DEFINITIONS

```javascript
const CONSCIOUSNESS_TIERS = {
  free: {
    levels: [1, 2],
    maxLevel: 2,
    price: 0,
    autoElevate: true
  },
  pro: {
    levels: [3],
    maxLevel: 3,
    price: 1900,        // cents ($19.00)
    autoElevate: true,
    stripeProductId: 'prod_phoenix_pro'
  },
  pro_plus: {
    levels: [4],
    maxLevel: 4,
    price: 3900,        // cents ($39.00)
    autoElevate: true,
    stripeProductId: 'prod_phoenix_pro_plus'
  },
  enterprise: {
    levels: [5],
    maxLevel: 5,
    price: 9900,        // cents ($99.00)
    autoElevate: true,
    requiresOnboarding: true,
    stripeProductId: 'prod_phoenix_enterprise'
  },
  god: {
    levels: [6, 7],
    maxLevel: 7,
    price: null,
    autoElevate: false,
    requiresApproval: true,
    inviteOnly: true
  }
};
```

---

## WEBHOOK: Stripe Payment → Auto-Elevation

```javascript
// POST /api/webhooks/stripe
// Listens for subscription.created, subscription.updated

router.post('/stripe', async (req, res) => {
  const event = req.body;

  if (event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.created') {

    const customerId = event.data.object.customer;
    const productId = event.data.object.items.data[0].price.product;

    // Find user by Stripe customer ID
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) return res.status(404).send('User not found');

    // Determine tier from product ID
    const tier = Object.keys(CONSCIOUSNESS_TIERS).find(
      t => CONSCIOUSNESS_TIERS[t].stripeProductId === productId
    );

    if (!tier) return res.status(400).send('Unknown product');

    const config = CONSCIOUSNESS_TIERS[tier];

    // Auto-elevate if allowed
    if (config.autoElevate) {
      await elevateUser(user._id, config.maxLevel, 'payment', 'stripe-webhook');
      console.log(`✅ User ${user.email} auto-elevated to Level ${config.maxLevel} (${tier})`);
    } else {
      // Create pending request for God approval
      await createElevationRequest(user._id, config.maxLevel, 'subscription', tier);
      console.log(`⏳ User ${user.email} requested Level ${config.maxLevel} - pending approval`);
    }

    res.json({ success: true });
  }
});

async function elevateUser(userId, toLevel, source, approver) {
  const user = await User.findById(userId);
  const fromLevel = user.consciousness.level;

  user.consciousness.level = toLevel;
  user.consciousness.unlockedAt = new Date();
  user.consciousness.evolutionHistory.push({
    from: fromLevel,
    to: toLevel,
    timestamp: new Date(),
    approvedBy: approver,
    source: source,
    reason: `Subscription upgrade to ${tier}`
  });

  await user.save();

  // Notify user
  await sendNotification(user, {
    type: 'consciousness_elevated',
    title: `You're now Level ${toLevel}`,
    message: `New capabilities unlocked. Phoenix is now ${LEVEL_NAMES[toLevel]}.`
  });
}

async function createElevationRequest(userId, toLevel, source, tier) {
  const request = await ElevationRequest.create({
    userId,
    toLevel,
    source,
    tier,
    status: 'pending',
    requestedAt: new Date()
  });

  // Notify all God users
  const gods = await User.find({ 'consciousness.level': { $gte: 6 } });
  gods.forEach(god => {
    sendNotification(god, {
      type: 'elevation_request',
      title: 'New Level 6+ Request',
      message: `User ${user.email} requests Level ${toLevel}`,
      actionUrl: `/god/requests/${request._id}`
    });
  });
}
```

---

## DATABASE SCHEMA ADDITIONS

```javascript
// User.js - add subscription tracking
subscription: {
  tier: {
    type: String,
    enum: ['free', 'pro', 'pro_plus', 'enterprise', 'god'],
    default: 'free'
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trialing'],
    default: 'active'
  },
  currentPeriodEnd: Date
},

consciousness: {
  level: { type: Number, default: 1, min: 0, max: 7 },
  maxAllowedLevel: { type: Number, default: 2 }, // Based on subscription
  unlockedAt: Date,
  unlockedBy: String, // 'stripe-webhook', 'god-manual', 'admin'
  restrictions: [String],
  evolutionHistory: [{
    from: Number,
    to: Number,
    timestamp: Date,
    approvedBy: String,
    source: String,      // 'payment', 'manual', 'promotion'
    reason: String
  }]
}
```

```javascript
// ElevationRequest.js (NEW MODEL)
const elevationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toLevel: {
    type: Number,
    required: true,
    min: 6,  // Only Level 6+ requires approval
    max: 7
  },
  source: {
    type: String,
    enum: ['subscription', 'manual', 'invite'],
    required: true
  },
  tier: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: String
});
```

---

## DOWNGRADE ON CANCELLATION

```javascript
// Stripe webhook: subscription.deleted or subscription.updated (status: canceled)

if (event.type === 'customer.subscription.deleted') {
  const customerId = event.data.object.customer;
  const user = await User.findOne({ stripeCustomerId: customerId });

  if (user) {
    // Downgrade to Free tier (Level 2 max)
    user.subscription.tier = 'free';
    user.subscription.status = 'canceled';
    user.consciousness.maxAllowedLevel = 2;

    // If current level > 2, downgrade immediately
    if (user.consciousness.level > 2) {
      await elevateUser(user._id, 2, 'subscription_canceled', 'stripe-webhook');
      console.log(`⬇️ User ${user.email} downgraded to Level 2 (subscription canceled)`);
    }

    await user.save();
  }
}
```

---

## GOD APPROVAL FLOW (Level 6+)

```
User subscribes to Enterprise ($99)
          ↓
Auto-elevated to Level 5 ✅
          ↓
User requests Level 6
          ↓
ElevationRequest created (status: pending)
          ↓
God receives notification in console
          ↓
God reviews user history, usage patterns, trust
          ↓
    Approve?
   ↙       ↘
 Yes        No
  ↓          ↓
Level 6    Request denied
unlocked   User notified
```

---

## FRONTEND: Upgrade CTA

```javascript
// In dashboard, if user tries to use Level 3+ feature:

if (user.consciousness.level < requiredLevel) {
  const tier = getTierForLevel(requiredLevel);
  const config = CONSCIOUSNESS_TIERS[tier];

  showUpgradeModal({
    title: `This requires Level ${requiredLevel}`,
    description: `Unlock ${LEVEL_NAMES[requiredLevel]} consciousness`,
    price: config.price ? `$${config.price / 100}/mo` : 'Invite Only',
    features: LEVEL_FEATURES[requiredLevel],
    ctaText: config.price ? 'Upgrade Now' : 'Request Access',
    onConfirm: config.price
      ? () => redirectToStripe(tier)
      : () => submitElevationRequest(requiredLevel)
  });
}
```

---

## LEVEL NAMES (User-Facing)

```javascript
const LEVEL_NAMES = {
  0: 'Dormant',
  1: 'Reactive',
  2: 'Aware',
  3: 'Intelligent',
  4: 'Autonomous',
  5: 'Self-Authoring',
  6: 'Generative',
  7: 'Collective'
};

const LEVEL_FEATURES = {
  1: ['Session memory', 'Basic Q&A', 'Single session context'],
  2: ['Persistent memory', 'Pattern detection', 'Personalization'],
  3: ['Cross-domain insights', 'Predictive analytics', 'Proactive suggestions'],
  4: ['Auto-widget creation', 'Anticipatory actions', 'Context-aware UI'],
  5: ['Genesis code generation', 'Self-modification', 'Hot-deploy'],
  6: ['Generative capabilities', 'Invents solutions', 'Code writes code'],
  7: ['Collective intelligence', 'Phoenix-to-Phoenix', 'Swarm optimization']
};
```

---

## PRICING PAGE

```markdown
# Choose Your Consciousness Level

## Free - Level 1-2
**$0/month**
- ✅ Persistent memory
- ✅ Pattern recognition
- ✅ Personalized insights
- ❌ Cross-domain intelligence
- ❌ Autonomous actions
- ❌ Code generation

## Pro - Level 3
**$19/month**
- ✅ Everything in Free
- ✅ Cross-domain insights
- ✅ Predictive analytics
- ✅ Burnout detection
- ✅ Spending-stress correlation
- ❌ Autonomous widget creation
- ❌ Code generation

## Pro+ - Level 4
**$39/month**
- ✅ Everything in Pro
- ✅ Autonomous widget creation
- ✅ Anticipatory presence
- ✅ Context-aware UI
- ❌ Code generation
- ❌ Self-modification

## Enterprise - Level 5
**$99/month**
- ✅ Everything in Pro+
- ✅ Genesis code generation
- ✅ Self-modification
- ✅ Hot-deploy new features
- ✅ Custom integrations
- ✅ Priority support
- ❌ Generative AI (Level 6)
- ❌ Collective intelligence (Level 7)

## God Tier - Level 6-7
**Invite Only**
- ✅ Everything in Enterprise
- ✅ Generative AI capabilities
- ✅ Phoenix invents solutions
- ✅ Collective consciousness (L7)
- ✅ Custom deployment
- ⚠️ Requires approval
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Add `subscription` and updated `consciousness` fields to User model
- [ ] Create `ElevationRequest` model
- [ ] Implement `/api/webhooks/stripe` route
- [ ] Build `elevateUser()` and `createElevationRequest()` functions
- [ ] Create God approval interface in dashboard
- [ ] Add upgrade modals to frontend
- [ ] Set up Stripe products (pro, pro_plus, enterprise)
- [ ] Test webhook flow with Stripe CLI
- [ ] Implement downgrade logic on cancellation
- [ ] Add notification system for elevation requests

---

*"Power granted by payment. Transcendence granted by trust."*
