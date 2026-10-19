/**
 * COACH CONTROLLER - User-facing coach features
 * Handles coach applications and coach-specific functionality
 */

const User = require('../models/User');

/**
 * POST /api/coach/apply
 * Submit a coach application
 */
exports.applyToBeCoach = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            experience,
            certifications,
            specialty,
            bio,
            socialMedia,
            website
        } = req.body;

        // Validate required fields
        if (!experience || !specialty) {
            return res.status(400).json({
                success: false,
                error: 'Experience and specialty are required'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if already applied or approved
        if (user.coachApplication?.status === 'pending') {
            return res.status(400).json({
                success: false,
                error: 'You already have a pending application',
                applicationStatus: 'pending',
                appliedAt: user.coachApplication.appliedAt
            });
        }

        if (user.coachApplication?.status === 'approved') {
            return res.status(400).json({
                success: false,
                error: 'You are already an approved coach',
                applicationStatus: 'approved'
            });
        }

        // Check if user is already a specialist/coach
        if (user.roles.includes('specialist')) {
            return res.status(400).json({
                success: false,
                error: 'You already have coach privileges'
            });
        }

        // Submit application
        user.coachApplication = {
            status: 'pending',
            appliedAt: new Date(),
            applicationData: {
                experience,
                certifications: certifications || '',
                specialty,
                bio: bio || '',
                socialMedia: socialMedia || '',
                website: website || ''
            }
        };

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Coach application submitted successfully',
            application: {
                status: user.coachApplication.status,
                appliedAt: user.coachApplication.appliedAt,
                applicationData: user.coachApplication.applicationData
            }
        });

    } catch (error) {
        console.error('[CoachController] Apply error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * GET /api/coach/application-status
 * Check current application status
 */
exports.getApplicationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .select('coachApplication roles referralCode')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const isCoach = user.roles.includes('specialist');

        res.json({
            success: true,
            isCoach,
            application: user.coachApplication || { status: 'none' },
            referralCode: isCoach ? user.referralCode : null
        });

    } catch (error) {
        console.error('[CoachController] Get status error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * PUT /api/coach/application
 * Update a pending application
 */
exports.updateApplication = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            experience,
            certifications,
            specialty,
            bio,
            socialMedia,
            website
        } = req.body;

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
                error: 'Can only update pending applications'
            });
        }

        // Update application data
        user.coachApplication.applicationData = {
            experience: experience || user.coachApplication.applicationData.experience,
            certifications: certifications !== undefined ? certifications : user.coachApplication.applicationData.certifications,
            specialty: specialty || user.coachApplication.applicationData.specialty,
            bio: bio !== undefined ? bio : user.coachApplication.applicationData.bio,
            socialMedia: socialMedia !== undefined ? socialMedia : user.coachApplication.applicationData.socialMedia,
            website: website !== undefined ? website : user.coachApplication.applicationData.website
        };

        await user.save();

        res.json({
            success: true,
            message: 'Application updated successfully',
            application: user.coachApplication
        });

    } catch (error) {
        console.error('[CoachController] Update application error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
