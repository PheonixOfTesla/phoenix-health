/**
 * BUSINESS CONTROLLER
 *
 * API endpoints for business management features.
 * Integrates with CustomTracker system and business templates.
 */

const { businessTrackers, industryTemplates } = require('../templates/businessTrackers');
const businessCommandProcessor = require('../services/voice/businessCommandProcessor');
const CustomTracker = require('../models/phoenix/CustomTracker');
const CustomTrackerEntry = require('../models/CustomTrackerEntry');
const SavedWidget = require('../models/phoenix/SavedWidget');

/**
 * @route   GET /api/business/templates
 * @desc    Get available business tracker templates
 * @access  Private
 */
exports.getTemplates = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        trackers: Object.keys(businessTrackers).map(key => ({
          key,
          name: businessTrackers[key].name,
          icon: businessTrackers[key].icon,
          description: businessTrackers[key].description,
          category: businessTrackers[key].category
        })),
        industries: Object.keys(industryTemplates).map(key => ({
          key,
          name: industryTemplates[key].name,
          icon: industryTemplates[key].icon,
          description: industryTemplates[key].description,
          trackers: industryTemplates[key].trackers
        }))
      }
    });
  } catch (error) {
    console.error('[Business Controller] Get templates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/setup/:industry
 * @desc    Set up business tracking for a specific industry
 * @access  Private
 */
exports.setupIndustry = async (req, res) => {
  try {
    const { industry } = req.params;
    const userId = req.user.id;

    const template = industryTemplates[industry];
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Industry template not found'
      });
    }

    // Install all trackers
    const installedTrackers = [];
    for (const trackerKey of template.trackers) {
      const trackerTemplate = businessTrackers[trackerKey];

      const existing = await CustomTracker.findOne({
        userId,
        name: trackerTemplate.name
      });

      if (!existing) {
        const tracker = await CustomTracker.create({
          userId,
          name: trackerTemplate.name,
          category: trackerTemplate.category,
          icon: trackerTemplate.icon,
          description: trackerTemplate.description,
          fields: trackerTemplate.fields,
          widgetConfig: trackerTemplate.widgetConfig,
          isTemplate: false,
          createdFrom: trackerKey
        });
        installedTrackers.push(tracker);
      } else {
        installedTrackers.push(existing);
      }
    }

    // Create business dashboard widget
    const dashboard = await SavedWidget.create({
      userId,
      name: 'Business Dashboard',
      type: 'business-dashboard',
      category: 'business',
      icon: '📊',
      description: `${template.name} dashboard`,
      config: {
        industry,
        sections: ['revenue', 'orders', 'invoices', 'clients'],
        refreshInterval: 60000
      },
      position: { x: 0, y: 0, width: 12, height: 6 },
      isVisible: true
    });

    res.json({
      success: true,
      message: `${template.name} setup complete!`,
      data: {
        industry,
        trackers: installedTrackers,
        dashboard
      }
    });
  } catch (error) {
    console.error('[Business Controller] Setup industry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/business/dashboard
 * @desc    Get business dashboard statistics
 * @access  Private
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = {
      revenue: { thisMonth: 0, total: 0 },
      orders: { active: 0, completed: 0, total: 0 },
      invoices: { outstanding: 0, outstandingAmount: 0, paid: 0 },
      clients: { total: 0, active: 0, needsFollowup: 0 },
      inventory: { lowStock: 0, total: 0 }
    };

    // Get Orders
    const orderTracker = await CustomTracker.findOne({ userId, name: 'Orders & Projects' });
    if (orderTracker) {
      const orders = await CustomTrackerEntry.find({ userId, trackerId: orderTracker._id });

      stats.orders.total = orders.length;
      stats.orders.active = orders.filter(o =>
        ['Confirmed', 'In Progress'].includes(o.data.status)
      ).length;
      stats.orders.completed = orders.filter(o => o.data.status === 'Complete').length;

      // Revenue
      const completed = orders.filter(o => o.data.status === 'Complete');
      stats.revenue.total = completed.reduce((sum, o) =>
        sum + (parseFloat(o.data.revenue) || 0), 0
      );

      const thisMonth = completed.filter(o => {
        const date = new Date(o.data.event_date || o.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      stats.revenue.thisMonth = thisMonth.reduce((sum, o) =>
        sum + (parseFloat(o.data.revenue) || 0), 0
      );
    }

    // Get Invoices
    const invoiceTracker = await CustomTracker.findOne({ userId, name: 'Invoices & Billing' });
    if (invoiceTracker) {
      const invoices = await CustomTrackerEntry.find({ userId, trackerId: invoiceTracker._id });

      const outstanding = invoices.filter(i => ['Sent', 'Overdue'].includes(i.data.status));
      stats.invoices.outstanding = outstanding.length;
      stats.invoices.outstandingAmount = outstanding.reduce((sum, i) =>
        sum + (parseFloat(i.data.amount) || 0), 0
      );

      stats.invoices.paid = invoices.filter(i => i.data.status === 'Paid').length;
    }

    // Get Clients
    const clientTracker = await CustomTracker.findOne({ userId, name: 'Client Database' });
    if (clientTracker) {
      const clients = await CustomTrackerEntry.find({ userId, trackerId: clientTracker._id });

      stats.clients.total = clients.length;
      stats.clients.active = clients.filter(c => c.data.status === 'Active').length;
      stats.clients.needsFollowup = clients.filter(c => {
        const nextFollowup = new Date(c.data.next_followup);
        return nextFollowup < new Date();
      }).length;
    }

    // Get Inventory
    const inventoryTracker = await CustomTracker.findOne({ userId, name: 'Inventory & Stock' });
    if (inventoryTracker) {
      const items = await CustomTrackerEntry.find({ userId, trackerId: inventoryTracker._id });

      stats.inventory.total = items.length;
      stats.inventory.lowStock = items.filter(i =>
        (i.data.quantity || 0) <= (i.data.reorder_point || 0)
      ).length;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Business Controller] Get dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/voice-command
 * @desc    Process voice command for business operations
 * @access  Private
 */
exports.processVoiceCommand = async (req, res) => {
  try {
    const { transcript, context } = req.body;
    const userId = req.user.id;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    // Check if it's a business command
    if (!businessCommandProcessor.isBusinessCommand(transcript)) {
      return res.json({
        success: false,
        error: 'Not a business command',
        handled: false
      });
    }

    // Process the command
    const result = await businessCommandProcessor.processCommand(userId, transcript, context);

    if (!result) {
      return res.json({
        success: false,
        error: 'Could not process business command',
        handled: false
      });
    }

    res.json(result);
  } catch (error) {
    console.error('[Business Controller] Voice command error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/business/clients
 * @desc    Get all clients
 * @access  Private
 */
exports.getClients = async (req, res) => {
  try {
    const userId = req.user.id;

    const clientTracker = await CustomTracker.findOne({ userId, name: 'Client Database' });
    if (!clientTracker) {
      return res.json({ success: true, data: [] });
    }

    const clients = await CustomTrackerEntry.find({
      userId,
      trackerId: clientTracker._id
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: clients });
  } catch (error) {
    console.error('[Business Controller] Get clients error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/business/orders
 * @desc    Get all orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority } = req.query || {};

    const orderTracker = await CustomTracker.findOne({ userId, name: 'Orders & Projects' });
    if (!orderTracker) {
      return res.json({ success: true, data: [] });
    }

    let filter = { userId, trackerId: orderTracker._id };
    if (status) filter['data.status'] = status;
    if (priority) filter['data.priority'] = priority;

    const orders = await CustomTrackerEntry.find(filter).sort({ 'data.due_date': 1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[Business Controller] Get orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/business/invoices
 * @desc    Get all invoices
 * @access  Private
 */
exports.getInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query || {};

    const invoiceTracker = await CustomTracker.findOne({ userId, name: 'Invoices & Billing' });
    if (!invoiceTracker) {
      return res.json({ success: true, data: [] });
    }

    let filter = { userId, trackerId: invoiceTracker._id };
    if (status) filter['data.status'] = status;

    const invoices = await CustomTrackerEntry.find(filter).sort({ 'data.due_date': 1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('[Business Controller] Get invoices error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   GET /api/business/inventory
 * @desc    Get all inventory items
 * @access  Private
 */
exports.getInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lowStock } = req.query;

    const inventoryTracker = await CustomTracker.findOne({ userId, name: 'Inventory & Stock' });
    if (!inventoryTracker) {
      return res.json({ success: true, data: [] });
    }

    const items = await CustomTrackerEntry.find({
      userId,
      trackerId: inventoryTracker._id
    }).sort({ 'data.item_name': 1 });

    let filtered = items;
    if (lowStock === 'true') {
      filtered = items.filter(i =>
        (i.data.quantity || 0) <= (i.data.reorder_point || 0)
      );
    }

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('[Business Controller] Get inventory error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/clients
 * @desc    Create a new client
 * @access  Private
 */
exports.createClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const clientData = req.body;

    // Find or create Client Database tracker
    let clientTracker = await CustomTracker.findOne({ userId, name: 'Client Database' });

    if (!clientTracker) {
      // Create the tracker if it doesn't exist
      const template = businessTrackers['client_database'];
      clientTracker = await CustomTracker.create({
        userId,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        fields: template.fields,
        widgetConfig: template.widgetConfig,
        isTemplate: false,
        createdFrom: 'client_database'
      });
    }

    // Create client entry
    const client = await CustomTrackerEntry.create({
      userId,
      trackerId: clientTracker._id,
      data: clientData
    });

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('[Business Controller] Create client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   PUT /api/business/clients/:id
 * @desc    Update a client
 * @access  Private
 */
exports.updateClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const client = await CustomTrackerEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set: { data: updates } },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('[Business Controller] Update client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   DELETE /api/business/clients/:id
 * @desc    Delete a client
 * @access  Private
 */
exports.deleteClient = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const client = await CustomTrackerEntry.findOneAndDelete({ _id: id, userId });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('[Business Controller] Delete client error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/orders
 * @desc    Create a new order
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    let orderTracker = await CustomTracker.findOne({ userId, name: 'Orders & Projects' });

    if (!orderTracker) {
      const template = businessTrackers['orders_projects'];
      orderTracker = await CustomTracker.create({
        userId,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        fields: template.fields,
        widgetConfig: template.widgetConfig,
        isTemplate: false,
        createdFrom: 'orders_projects'
      });
    }

    const order = await CustomTrackerEntry.create({
      userId,
      trackerId: orderTracker._id,
      data: orderData
    });

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[Business Controller] Create order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   PUT /api/business/orders/:id
 * @desc    Update an order
 * @access  Private
 */
exports.updateOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const order = await CustomTrackerEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set: { data: updates } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('[Business Controller] Update order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   DELETE /api/business/orders/:id
 * @desc    Delete an order
 * @access  Private
 */
exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await CustomTrackerEntry.findOneAndDelete({ _id: id, userId });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('[Business Controller] Delete order error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/invoices
 * @desc    Create a new invoice
 * @access  Private
 */
exports.createInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const invoiceData = req.body;

    let invoiceTracker = await CustomTracker.findOne({ userId, name: 'Invoices & Billing' });

    if (!invoiceTracker) {
      const template = businessTrackers['invoices_billing'];
      invoiceTracker = await CustomTracker.create({
        userId,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        fields: template.fields,
        widgetConfig: template.widgetConfig,
        isTemplate: false,
        createdFrom: 'invoices_billing'
      });
    }

    const invoice = await CustomTrackerEntry.create({
      userId,
      trackerId: invoiceTracker._id,
      data: invoiceData
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[Business Controller] Create invoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   PUT /api/business/invoices/:id
 * @desc    Update an invoice
 * @access  Private
 */
exports.updateInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const invoice = await CustomTrackerEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set: { data: updates } },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[Business Controller] Update invoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   DELETE /api/business/invoices/:id
 * @desc    Delete an invoice
 * @access  Private
 */
exports.deleteInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const invoice = await CustomTrackerEntry.findOneAndDelete({ _id: id, userId });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error) {
    console.error('[Business Controller] Delete invoice error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   POST /api/business/inventory
 * @desc    Create a new inventory item
 * @access  Private
 */
exports.createInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemData = req.body;

    let inventoryTracker = await CustomTracker.findOne({ userId, name: 'Inventory & Stock' });

    if (!inventoryTracker) {
      const template = businessTrackers['inventory_stock'];
      inventoryTracker = await CustomTracker.create({
        userId,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        fields: template.fields,
        widgetConfig: template.widgetConfig,
        isTemplate: false,
        createdFrom: 'inventory_stock'
      });
    }

    const item = await CustomTrackerEntry.create({
      userId,
      trackerId: inventoryTracker._id,
      data: itemData
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[Business Controller] Create inventory item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   PUT /api/business/inventory/:id
 * @desc    Update an inventory item
 * @access  Private
 */
exports.updateInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const item = await CustomTrackerEntry.findOneAndUpdate(
      { _id: id, userId },
      { $set: { data: updates } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[Business Controller] Update inventory item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @route   DELETE /api/business/inventory/:id
 * @desc    Delete an inventory item
 * @access  Private
 */
exports.deleteInventoryItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await CustomTrackerEntry.findOneAndDelete({ _id: id, userId });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }

    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    console.error('[Business Controller] Delete inventory item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = exports;
