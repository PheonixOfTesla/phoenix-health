/**
 * ADMIN ROUTES - Platform Owner Dashboard
 * Includes: Analytics, User Management, Earnings/PATF, Coach Applications
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Bootstrap owner (one-time setup - no auth required)
router.post('/bootstrap-owner', adminController.bootstrapOwner);

// ============================================================================
// All routes below require authentication + admin role
// ============================================================================
router.use(protect);
router.use(admin);

// Core Admin
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.put('/users/:id/roles', adminController.updateUserRoles);
router.post('/system/command', adminController.executeCommand);

// Earnings / PATF Referral Income
router.get('/earnings', adminController.getAllEarnings);
router.get('/earnings/summary', adminController.getEarningsSummary);
router.get('/earnings/:userId', adminController.getUserEarnings);

// Coach Income
router.get('/coaches/income', adminController.getCoachIncome);

// Coach Applications
router.get('/coach-applications', adminController.getPendingApplications);
router.post('/coach-applications/:userId/approve', adminController.approveCoach);
router.post('/coach-applications/:userId/reject', adminController.rejectCoach);

module.exports = router;
