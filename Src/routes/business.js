/**
 * BUSINESS ROUTES
 *
 * API routes for business management functionality
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const businessController = require('../controllers/businessController');

// Get available templates
router.get('/templates', protect, businessController.getTemplates);

// Set up industry-specific business tracking
router.post('/setup/:industry', protect, businessController.setupIndustry);

// Get business dashboard
router.get('/dashboard', protect, businessController.getDashboard);

// Process voice command
router.post('/voice-command', protect, businessController.processVoiceCommand);

// Get clients
router.get('/clients', protect, businessController.getClients);

// Get orders
router.get('/orders', protect, businessController.getOrders);

// Get invoices
router.get('/invoices', protect, businessController.getInvoices);

// Get inventory
router.get('/inventory', protect, businessController.getInventory);

// Create client
router.post('/clients', protect, businessController.createClient);

// Update client
router.put('/clients/:id', protect, businessController.updateClient);

// Delete client
router.delete('/clients/:id', protect, businessController.deleteClient);

// Create order
router.post('/orders', protect, businessController.createOrder);

// Update order
router.put('/orders/:id', protect, businessController.updateOrder);

// Delete order
router.delete('/orders/:id', protect, businessController.deleteOrder);

// Create invoice
router.post('/invoices', protect, businessController.createInvoice);

// Update invoice
router.put('/invoices/:id', protect, businessController.updateInvoice);

// Delete invoice
router.delete('/invoices/:id', protect, businessController.deleteInvoice);

// Create inventory item
router.post('/inventory', protect, businessController.createInventoryItem);

// Update inventory item
router.put('/inventory/:id', protect, businessController.updateInventoryItem);

// Delete inventory item
router.delete('/inventory/:id', protect, businessController.deleteInventoryItem);

module.exports = router;
