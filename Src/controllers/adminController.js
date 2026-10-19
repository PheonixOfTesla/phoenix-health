/**
 * ADMIN CONTROLLER - Platform Owner Dashboard
 * Full analytics, user management, and system control
 * Includes: PATF Referral Income, Coach Management, Earnings Overview
 */

const User = require('../models/User');
const Earnings = require('../models/Earnings');
const ButlerAction = require('../models/phoenix/ButlerAction');

/**
 * GET /api/admin/analytics
 * Full platform analytics for owner
 */
exports.getAnalytics = async (req, res) => {
    try {
        // Verify owner/engineer role
        if (!req.user.roles.includes('owner') && !req.user.roles.includes('engineer')) {
            return res.status(403).json({
                success: false,
                error: 'Owner access required'
            });
        }

        // Get user stats
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const newUsersThisWeek = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Get subscription stats
        const subscriptionStats = await User.aggregate([
            {
                $group: {
                    _id: '$subscription.plan',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get Butler action stats
        const totalButlerActions = await ButlerAction.countDocuments();
        const butlerActionsToday = await ButlerAction.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });
        const butlerRevenue = await ButlerAction.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$metadata.actualCost' }
                }
            }
        ]);

        // Get platform breakdown
        const platformStats = await User.aggregate([
            {
                $group: {
                    _id: '$platform',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            analytics: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    newToday: newUsersToday,
                    newThisWeek: newUsersThisWeek,
                    newThisMonth: newUsersThisMonth
                },
                subscriptions: subscriptionStats.reduce((acc, s) => {
                    acc[s._id || 'free'] = s.count;
                    return acc;
                }, {}),
                butler: {
                    totalActions: totalButlerActions,
                    actionsToday: butlerActionsToday,
                    revenue: butlerRevenue[0]?.total || 0
                },
                platforms: platformStats.reduce((acc, p) => {
                    acc[p._id || 'web'] = p.count;
                    return acc;
                }, {}),
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('[AdminController] Analytics error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/users
 * List all users with filters
 */
exports.getUsers = async (req, res) => {
    try {
        if (!req.user.roles.includes('owner') && !req.user.roles.includes('engineer')) {
            return res.status(403).json({
                success: false,
                error: 'Owner access required'
            });
        }

        const { page = 1, limit = 50, search, role, plan } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.roles = role;
        if (plan) query['subscription.plan'] = plan;

        const users = await User.find(query)
            .select('name email roles subscription platform createdAt lastActive')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[AdminController] Get users error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/users/:id/roles
 * Update user roles
 */
exports.updateUserRoles = async (req, res) => {
    try {
        if (!req.user.roles.includes('owner') && !req.user.roles.includes('engineer')) {
            return res.status(403).json({
                success: false,
                error: 'Owner access required'
            });
        }

        const { roles } = req.body;
        const validRoles = ['client', 'specialist', 'admin', 'owner', 'engineer'];

        if (!roles || !roles.every(r => validRoles.includes(r))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid roles'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { roles },
            { new: true }
        ).select('name email roles');

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('[AdminController] Update roles error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/admin/system/command
 * Execute system commands (owner only)
 */
exports.executeCommand = async (req, res) => {
    try {
        if (!req.user.roles.includes('owner')) {
            return res.status(403).json({
                success: false,
                error: 'Owner access required'
            });
        }

        const { command, target, data } = req.body;

        let result;

        switch (command) {
            case 'clear_cache':
                // Clear any caches
                result = { message: 'Cache cleared' };
                break;

            case 'broadcast':
                // Send notification to all users
                result = { message: `Broadcast sent: ${data.message}` };
                break;

            case 'update_user':
                // Update any user field
                const user = await User.findByIdAndUpdate(target, data, { new: true });
                result = { user };
                break;

            case 'delete_user':
                await User.findByIdAndDelete(target);
                result = { message: 'User deleted' };
                break;

            case 'system_stats':
                result = {
                    memory: process.memoryUsage(),
                    uptime: process.uptime(),
                    nodeVersion: process.version
                };
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Unknown command'
                });
        }

        res.json({
            success: true,
            command,
            result,
            executedBy: req.user.email,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('[AdminController] Command error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/admin/bootstrap-owner
 * One-time setup to make first owner (requires secret)
 */
exports.bootstrapOwner = async (req, res) => {
    try {
        const { email, secret } = req.body;

        // Verify bootstrap secret
        if (secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
            return res.status(403).json({
                success: false,
                error: 'Invalid bootstrap secret'
            });
        }

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            {
                roles: ['client', 'admin', 'owner', 'engineer'],
                'subscription.plan': 'owner',
                'subscription.status': 'active',
                emailVerified: true,
                phoneVerified: true
            },
            { new: true }
        ).select('name email roles subscription emailVerified phoneVerified');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Owner bootstrapped successfully',
            user
        });

    } catch (error) {
        console.error('[AdminController] Bootstrap error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================================
// EARNINGS / PATF REFERRAL INCOME ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/earnings
 * All earners with their balances, lifetime totals
 * Supports pagination and filtering by earnerType
 */
exports.getAllEarnings = async (req, res) => {
    try {
        const { page = 1, limit = 50, earnerType } = req.query;

        const query = {};
        if (earnerType) query.earnerType = earnerType;

        const earnings = await Earnings.find(query)
            .populate('userId', 'name email phone')
            .sort({ 'lifetime.total': -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Earnings.countDocuments(query);

        // Calculate platform totals
        const platformTotals = await Earnings.aggregate([
            {
                $group: {
                    _id: null,
                    totalBalance: { $sum: '$balance' },
                    totalLifetime: { $sum: '$lifetime.total' },
                    totalReferralEarnings: { $sum: '$lifetime.fromReferrals' },
                    totalCoachingEarnings: { $sum: '$lifetime.fromCoaching' },
                    totalWithdrawn: { $sum: '$lifetime.withdrawn' }
                }
            }
        ]);

        res.json({
            success: true,
            earnings,
            platformTotals: platformTotals[0] || {
                totalBalance: 0,
                totalLifetime: 0,
                totalReferralEarnings: 0,
                totalCoachingEarnings: 0,
                totalWithdrawn: 0
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[AdminController] Get all earnings error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/earnings/summary
 * Platform-wide earnings stats
 */
exports.getEarningsSummary = async (req, res) => {
    try {
        // Earnings by type
        const byType = await Earnings.aggregate([
            {
                $group: {
                    _id: '$earnerType',
                    count: { $sum: 1 },
                    totalBalance: { $sum: '$balance' },
                    totalLifetime: { $sum: '$lifetime.total' },
                    totalReferrals: { $sum: '$referralStats.totalReferrals' }
                }
            }
        ]);

        // Top earners
        const topEarners = await Earnings.find()
            .populate('userId', 'name email')
            .sort({ 'lifetime.total': -1 })
            .limit(10)
            .lean();

        // Recent transactions (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentActivity = await Earnings.aggregate([
            { $unwind: '$transactions' },
            { $match: { 'transactions.createdAt': { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$transactions.type',
                    count: { $sum: 1 },
                    total: { $sum: '$transactions.amount' }
                }
            }
        ]);

        // Total platform earnings
        const platformTotals = await Earnings.aggregate([
            {
                $group: {
                    _id: null,
                    totalEarners: { $sum: 1 },
                    totalBalance: { $sum: '$balance' },
                    totalLifetime: { $sum: '$lifetime.total' },
                    totalWithdrawn: { $sum: '$lifetime.withdrawn' },
                    totalReferrals: { $sum: '$referralStats.totalReferrals' }
                }
            }
        ]);

        res.json({
            success: true,
            summary: {
                byType: byType.reduce((acc, t) => {
                    acc[t._id] = {
                        count: t.count,
                        totalBalance: t.totalBalance,
                        totalLifetime: t.totalLifetime,
                        totalReferrals: t.totalReferrals
                    };
                    return acc;
                }, {}),
                topEarners: topEarners.map(e => ({
                    userId: e.userId?._id,
                    name: e.userId?.name,
                    email: e.userId?.email,
                    earnerType: e.earnerType,
                    balance: e.balance,
                    lifetime: e.lifetime.total
                })),
                recentActivity: recentActivity.reduce((acc, a) => {
                    acc[a._id] = { count: a.count, total: a.total };
                    return acc;
                }, {}),
                platform: platformTotals[0] || {
                    totalEarners: 0,
                    totalBalance: 0,
                    totalLifetime: 0,
                    totalWithdrawn: 0,
                    totalReferrals: 0
                },
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('[AdminController] Earnings summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/earnings/:userId
 * Full earnings detail for a specific user
 */
exports.getUserEarnings = async (req, res) => {
    try {
        const { userId } = req.params;

        const earnings = await Earnings.findOne({ userId })
            .populate('userId', 'name email phone roles coachApplication')
            .populate('transactions.referredUserId', 'name email')
            .lean();

        if (!earnings) {
            return res.status(404).json({
                success: false,
                error: 'Earnings record not found for this user'
            });
        }

        // Get referred users
        const referredUsers = await User.find({ referredBy: userId })
            .select('name email createdAt')
            .lean();

        res.json({
            success: true,
            earnings,
            referredUsers,
            stats: {
                totalTransactions: earnings.transactions.length,
                totalReferredUsers: referredUsers.length
            }
        });

    } catch (error) {
        console.error('[AdminController] Get user earnings error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/admin/coaches/income
 * All coaches with their coaching earnings
 */
exports.getCoachIncome = async (req, res) => {
    try {
        const { page = 1, limit = 50, subscriptionTier } = req.query;

        // Find all coaches
        const coachQuery = {
            'coachApplication.status': 'approved'
        };

        const coaches = await User.find(coachQuery)
            .select('name email phone coachApplication createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(coachQuery);

        // Get earnings for each coach
        const coachIds = coaches.map(c => c._id);
        const earningsRecords = await Earnings.find({
            userId: { $in: coachIds },
            earnerType: 'coach'
        }).lean();

        const earningsMap = earningsRecords.reduce((acc, e) => {
            acc[e.userId.toString()] = e;
            return acc;
        }, {});

        // Combine coach info with earnings
        const coachesWithIncome = coaches.map(coach => ({
            ...coach,
            earnings: earningsMap[coach._id.toString()] || {
                balance: 0,
                lifetime: { total: 0, fromCoaching: 0, fromReferrals: 0 },
                referralStats: { totalReferrals: 0 }
            }
        }));

        // Calculate totals
        const totals = await Earnings.aggregate([
            { $match: { earnerType: 'coach' } },
            {
                $group: {
                    _id: null,
                    totalCoaches: { $sum: 1 },
                    totalCoachingIncome: { $sum: '$lifetime.fromCoaching' },
                    totalReferralIncome: { $sum: '$lifetime.fromReferrals' },
                    totalBalance: { $sum: '$balance' }
                }
            }
        ]);

        res.json({
            success: true,
            coaches: coachesWithIncome,
            totals: totals[0] || {
                totalCoaches: 0,
                totalCoachingIncome: 0,
                totalReferralIncome: 0,
                totalBalance: 0
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[AdminController] Get coach income error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================================
// COACH APPLICATION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/coach-applications
 * Returns all users with pending coach applications
 */
exports.getPendingApplications = async (req, res) => {
    try {
        const { status = 'pending', page = 1, limit = 50 } = req.query;

        const query = {
            'coachApplication.status': status
        };

        const applications = await User.find(query)
            .select('name email phone coachApplication createdAt')
            .sort({ 'coachApplication.appliedAt': -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(query);

        // Get counts by status
        const statusCounts = await User.aggregate([
            {
                $match: {
                    'coachApplication.status': { $ne: 'none' }
                }
            },
            {
                $group: {
                    _id: '$coachApplication.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            applications,
            statusCounts: statusCounts.reduce((acc, s) => {
                acc[s._id] = s.count;
                return acc;
            }, {}),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('[AdminController] Get pending applications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/admin/coach-applications/:userId/approve
 * Approves a coach application
 */
exports.approveCoach = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.coachApplication?.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'No pending application for this user'
            });
        }

        // Generate referral code
        const referralCode = await Earnings.generateReferralCode(userId);

        // Update user
        user.coachApplication.status = 'approved';
        user.coachApplication.reviewedAt = new Date();
        user.coachApplication.reviewedBy = req.user._id;
        user.referralCode = referralCode;

        // Add coach role if not already present
        if (!user.roles.includes('specialist')) {
            user.roles.push('specialist');
        }

        await user.save();

        // Create earnings record
        let earnings = await Earnings.findOne({ userId });
        if (!earnings) {
            earnings = new Earnings({
                userId,
                earnerType: 'coach',
                referralCode
            });
            await earnings.save();
        } else {
            earnings.earnerType = 'coach';
            earnings.referralCode = referralCode;
            await earnings.save();
        }

        res.json({
            success: true,
            message: 'Coach application approved',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                referralCode,
                coachApplication: user.coachApplication
            },
            earnings: {
                _id: earnings._id,
                referralCode: earnings.referralCode,
                earnerType: earnings.earnerType
            }
        });

    } catch (error) {
        console.error('[AdminController] Approve coach error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * POST /api/admin/coach-applications/:userId/reject
 * Rejects a coach application
 */
exports.rejectCoach = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        if (user.coachApplication?.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'No pending application for this user'
            });
        }

        // Update user
        user.coachApplication.status = 'rejected';
        user.coachApplication.reviewedAt = new Date();
        user.coachApplication.reviewedBy = req.user._id;
        user.coachApplication.rejectionReason = reason || 'Application did not meet requirements';

        await user.save();

        res.json({
            success: true,
            message: 'Coach application rejected',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                coachApplication: user.coachApplication
            }
        });

    } catch (error) {
        console.error('[AdminController] Reject coach error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
