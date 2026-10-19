/**
 * BUSINESS COMMAND PROCESSOR
 *
 * Processes voice commands related to business operations.
 * Integrates with existing CustomTracker system and business templates.
 *
 * Handles:
 * - Client management (add, query, update)
 * - Order management (create, track, update)
 * - Invoice generation and tracking
 * - Inventory management
 * - Time tracking
 * - Business analytics queries
 */

const { businessTrackers, industryTemplates } = require('../../templates/businessTrackers');
const CustomTracker = require('../../models/phoenix/CustomTracker');
const CustomTrackerEntry = require('../../models/CustomTrackerEntry');
const SavedWidget = require('../../models/phoenix/SavedWidget');

class BusinessCommandProcessor {
  /**
   * Detect if a voice command is business-related
   */
  isBusinessCommand(transcript) {
    const businessKeywords = [
      'client', 'customer', 'order', 'project', 'invoice', 'billing',
      'inventory', 'stock', 'supplier', 'payment', 'revenue', 'profit',
      'business', 'catering', 'consulting', 'freelance', 'hours', 'time tracking'
    ];

    const lowerTranscript = transcript.toLowerCase();
    return businessKeywords.some(keyword => lowerTranscript.includes(keyword));
  }

  /**
   * Process business-related voice command
   */
  async processCommand(userId, transcript, context = {}) {
    const lowerTranscript = transcript.toLowerCase();

    // Setup commands
    if (this.isSetupCommand(lowerTranscript)) {
      return await this.handleSetup(userId, lowerTranscript);
    }

    // Client commands
    if (this.isClientCommand(lowerTranscript)) {
      return await this.handleClientCommand(userId, lowerTranscript, context);
    }

    // Order commands
    if (this.isOrderCommand(lowerTranscript)) {
      return await this.handleOrderCommand(userId, lowerTranscript, context);
    }

    // Invoice commands
    if (this.isInvoiceCommand(lowerTranscript)) {
      return await this.handleInvoiceCommand(userId, lowerTranscript, context);
    }

    // Inventory commands
    if (this.isInventoryCommand(lowerTranscript)) {
      return await this.handleInventoryCommand(userId, lowerTranscript, context);
    }

    // Analytics/Query commands
    if (this.isAnalyticsCommand(lowerTranscript)) {
      return await this.handleAnalyticsCommand(userId, lowerTranscript, context);
    }

    // Didn't match any business command
    return null;
  }

  /**
   * SETUP COMMANDS
   * "Set up my catering business", "Start consulting tracker"
   */
  isSetupCommand(transcript) {
    return transcript.match(/set\s?up|start|initialize|create\s+(my\s+)?(catering|consulting|freelance|retail|coaching)\s+(business|practice)?/i);
  }

  async handleSetup(userId, transcript) {
    // Detect industry
    let industry = null;
    for (const [key, template] of Object.entries(industryTemplates)) {
      if (transcript.includes(key)) {
        industry = key;
        break;
      }
    }

    if (!industry) {
      return {
        success: false,
        message: "I can set up tracking for catering, consulting, freelance, retail, or coaching businesses. Which would you like?",
        requiresInput: true
      };
    }

    const template = industryTemplates[industry];

    // Install all trackers for this industry
    const installedTrackers = [];
    for (const trackerKey of template.trackers) {
      const trackerTemplate = businessTrackers[trackerKey];

      // Check if tracker already exists
      const existing = await CustomTracker.findOne({ userId, name: trackerTemplate.name });
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
        installedTrackers.push(tracker.name);
      }
    }

    // Create business dashboard widget
    await this.createBusinessDashboard(userId, industry);

    return {
      success: true,
      message: `${template.name} set up complete! Installed ${installedTrackers.length} trackers: ${installedTrackers.join(', ')}. Say "show business dashboard" to see everything.`,
      action: 'business_setup_complete',
      data: {
        industry,
        trackers: installedTrackers,
        widgets: template.widgets
      }
    };
  }

  /**
   * CLIENT COMMANDS
   * "Add client Sarah Thompson", "Show all clients", "Who needs follow-up"
   */
  isClientCommand(transcript) {
    return transcript.match(/client|customer/i);
  }

  async handleClientCommand(userId, transcript, context) {
    // Get or create client tracker
    const clientTracker = await this.getOrCreateTracker(userId, 'clientTracker');

    // ADD CLIENT: "Add client Sarah Thompson, email sarah@example.com"
    if (transcript.match(/add|new|create/i)) {
      const extracted = this.extractClientData(transcript);

      const entry = await CustomTrackerEntry.create({
        userId,
        trackerId: clientTracker._id,
        data: extracted,
        source: 'voice'
      });

      return {
        success: true,
        message: `Added ${extracted.client_name || 'new client'} to your client database.`,
        action: 'client_added',
        data: entry
      };
    }

    // QUERY CLIENTS: "Show clients", "List all clients"
    if (transcript.match(/show|list|display/i)) {
      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: clientTracker._id
      }).sort({ createdAt: -1 }).limit(20);

      return {
        success: true,
        message: `You have ${entries.length} clients. Showing on screen.`,
        action: 'display_clients',
        data: {
          tracker: clientTracker,
          entries: entries
        },
        widget: {
          type: 'client-list',
          data: entries
        }
      };
    }

    // FILTER: "Who needs follow-up", "Show leads"
    if (transcript.match(/need.*follow|overdue|pending/i)) {
      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: clientTracker._id,
        'data.next_followup': { $lt: new Date() }
      });

      const clientNames = entries.map(e => e.data.client_name).filter(Boolean).join(', ');

      return {
        success: true,
        message: entries.length > 0
          ? `${entries.length} clients need follow-up: ${clientNames}`
          : "All clients are up to date!",
        action: 'display_clients',
        data: { entries },
        widget: {
          type: 'client-list',
          filter: 'followup-needed',
          data: entries
        }
      };
    }

    return null;
  }

  /**
   * ORDER COMMANDS
   * "Add order for Sarah", "Show active orders", "What's due this week"
   */
  isOrderCommand(transcript) {
    return transcript.match(/order|project|job|booking/i);
  }

  async handleOrderCommand(userId, transcript, context) {
    const orderTracker = await this.getOrCreateTracker(userId, 'orderTracker');

    // ADD ORDER
    if (transcript.match(/add|new|create|book/i)) {
      const extracted = this.extractOrderData(transcript);

      const entry = await CustomTrackerEntry.create({
        userId,
        trackerId: orderTracker._id,
        data: extracted,
        source: 'voice'
      });

      return {
        success: true,
        message: `Order created: ${extracted.title || 'New order'}. Status: ${extracted.status || 'Quote'}.`,
        action: 'order_added',
        data: entry
      };
    }

    // QUERY ORDERS
    if (transcript.match(/show|list|what|display/i)) {
      let filter = {};

      // Status filters
      if (transcript.match(/active|current|in progress/i)) {
        filter['data.status'] = { $in: ['Confirmed', 'In Progress'] };
      }
      if (transcript.match(/complete|done|finished/i)) {
        filter['data.status'] = 'Complete';
      }

      // Time filters
      if (transcript.match(/this week|next 7 days/i)) {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filter['data.due_date'] = { $lte: weekFromNow };
      }

      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: orderTracker._id,
        ...filter
      }).sort({ 'data.due_date': 1 }).limit(20);

      return {
        success: true,
        message: `You have ${entries.length} orders. Displaying now.`,
        action: 'display_orders',
        data: { entries },
        widget: {
          type: 'order-kanban',
          data: entries
        }
      };
    }

    return null;
  }

  /**
   * INVOICE COMMANDS
   * "Create invoice for TechCorp", "Show outstanding invoices"
   */
  isInvoiceCommand(transcript) {
    return transcript.match(/invoice|bill|payment/i);
  }

  async handleInvoiceCommand(userId, transcript, context) {
    const invoiceTracker = await this.getOrCreateTracker(userId, 'invoiceTracker');

    // CREATE INVOICE
    if (transcript.match(/create|send|generate|new/i)) {
      const extracted = this.extractInvoiceData(transcript);

      const entry = await CustomTrackerEntry.create({
        userId,
        trackerId: invoiceTracker._id,
        data: {
          ...extracted,
          issued_date: new Date(),
          status: 'Draft'
        },
        source: 'voice'
      });

      return {
        success: true,
        message: `Invoice created for ${extracted.amount ? '$' + extracted.amount : 'TBD'}. Status: Draft.`,
        action: 'invoice_created',
        data: entry
      };
    }

    // QUERY INVOICES
    if (transcript.match(/show|list|outstanding|overdue|unpaid/i)) {
      let filter = {};

      if (transcript.match(/outstanding|unpaid/i)) {
        filter['data.status'] = { $in: ['Sent', 'Overdue'] };
      }
      if (transcript.match(/overdue/i)) {
        filter['data.status'] = 'Overdue';
      }
      if (transcript.match(/paid/i)) {
        filter['data.status'] = 'Paid';
      }

      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: invoiceTracker._id,
        ...filter
      }).sort({ 'data.due_date': 1 });

      const totalOutstanding = entries
        .filter(e => ['Sent', 'Overdue'].includes(e.data.status))
        .reduce((sum, e) => sum + (parseFloat(e.data.amount) || 0), 0);

      return {
        success: true,
        message: `${entries.length} invoices found. Total outstanding: $${totalOutstanding.toFixed(2)}.`,
        action: 'display_invoices',
        data: { entries, totalOutstanding },
        widget: {
          type: 'invoice-list',
          data: entries
        }
      };
    }

    return null;
  }

  /**
   * INVENTORY COMMANDS
   * "Show low stock", "Add 50 pounds of chicken"
   */
  isInventoryCommand(transcript) {
    return transcript.match(/inventory|stock|supplies|reorder/i);
  }

  async handleInventoryCommand(userId, transcript, context) {
    const inventoryTracker = await this.getOrCreateTracker(userId, 'inventoryTracker');

    // ADD INVENTORY ITEM
    if (transcript.match(/add|new/i)) {
      const extracted = this.extractInventoryData(transcript);

      const entry = await CustomTrackerEntry.create({
        userId,
        trackerId: inventoryTracker._id,
        data: extracted,
        source: 'voice'
      });

      return {
        success: true,
        message: `Added ${extracted.item_name || 'item'} to inventory.`,
        action: 'inventory_added',
        data: entry
      };
    }

    // QUERY INVENTORY
    if (transcript.match(/show|list|what|check/i)) {
      let filter = {};

      // Low stock filter
      if (transcript.match(/low|reorder|need/i)) {
        const entries = await CustomTrackerEntry.find({
          userId,
          trackerId: inventoryTracker._id
        });

        const lowStock = entries.filter(e =>
          (e.data.quantity || 0) <= (e.data.reorder_point || 0)
        );

        const itemList = lowStock.map(e => e.data.item_name).join(', ');

        return {
          success: true,
          message: lowStock.length > 0
            ? `${lowStock.length} items need reordering: ${itemList}`
            : "All inventory levels are good!",
          action: 'display_inventory',
          data: { entries: lowStock },
          widget: {
            type: 'inventory-alerts',
            data: lowStock
          }
        };
      }

      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: inventoryTracker._id
      }).sort({ 'data.item_name': 1 });

      return {
        success: true,
        message: `${entries.length} items in inventory.`,
        action: 'display_inventory',
        data: { entries },
        widget: {
          type: 'inventory-table',
          data: entries
        }
      };
    }

    return null;
  }

  /**
   * ANALYTICS COMMANDS
   * "What's my revenue this month", "Show business dashboard"
   */
  isAnalyticsCommand(transcript) {
    return transcript.match(/revenue|profit|dashboard|analytics|performance|summary/i);
  }

  async handleAnalyticsCommand(userId, transcript, context) {
    // Revenue query
    if (transcript.match(/revenue|income|sales/i)) {
      const orderTracker = await CustomTracker.findOne({ userId, name: 'Orders & Projects' });
      if (!orderTracker) {
        return {
          success: false,
          message: "No business tracking set up yet. Say 'set up my business' to get started."
        };
      }

      const entries = await CustomTrackerEntry.find({
        userId,
        trackerId: orderTracker._id,
        'data.status': 'Complete'
      });

      const totalRevenue = entries.reduce((sum, e) => sum + (parseFloat(e.data.revenue) || 0), 0);
      const thisMonth = entries.filter(e => {
        const date = new Date(e.data.event_date || e.createdAt);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const monthRevenue = thisMonth.reduce((sum, e) => sum + (parseFloat(e.data.revenue) || 0), 0);

      return {
        success: true,
        message: `This month: $${monthRevenue.toFixed(2)} from ${thisMonth.length} completed orders. Total all-time: $${totalRevenue.toFixed(2)}.`,
        action: 'show_revenue',
        data: {
          monthRevenue,
          totalRevenue,
          ordersThisMonth: thisMonth.length,
          totalOrders: entries.length
        }
      };
    }

    // Dashboard request
    if (transcript.match(/dashboard|overview|summary/i)) {
      const stats = await this.getBusinessStats(userId);

      return {
        success: true,
        message: `Business dashboard loaded. ${stats.activeOrders} active orders, ${stats.outstandingInvoices} outstanding invoices totaling $${stats.outstandingAmount}.`,
        action: 'show_business_dashboard',
        data: stats,
        widget: {
          type: 'business-dashboard',
          data: stats
        }
      };
    }

    return null;
  }

  /**
   * HELPER: Get or create a tracker from template
   */
  async getOrCreateTracker(userId, trackerKey) {
    const template = businessTrackers[trackerKey];
    if (!template) return null;

    let tracker = await CustomTracker.findOne({ userId, name: template.name });

    if (!tracker) {
      tracker = await CustomTracker.create({
        userId,
        name: template.name,
        category: template.category,
        icon: template.icon,
        description: template.description,
        fields: template.fields,
        widgetConfig: template.widgetConfig,
        createdFrom: trackerKey
      });
    }

    return tracker;
  }

  /**
   * HELPER: Extract client data from voice transcript
   */
  extractClientData(transcript) {
    const data = {};

    // Name extraction
    const nameMatch = transcript.match(/(?:client|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameMatch) data.client_name = nameMatch[1];

    // Email extraction
    const emailMatch = transcript.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (emailMatch) data.email = emailMatch[1];

    // Phone extraction
    const phoneMatch = transcript.match(/(?:phone|number)\s*([\d\s\-\(\)]+)/);
    if (phoneMatch) data.phone = phoneMatch[1].trim();

    // Company extraction
    const companyMatch = transcript.match(/(?:company|business)\s+([A-Z][a-zA-Z\s]+)/);
    if (companyMatch) data.company = companyMatch[1];

    // Status
    data.status = 'Lead'; // Default for new clients
    data.last_contact = new Date();

    return data;
  }

  /**
   * HELPER: Extract order data from voice transcript
   */
  extractOrderData(transcript) {
    const data = {};

    // Title extraction
    const titleMatch = transcript.match(/order\s+(?:for\s+)?(.+?)(?:\s+for\s+|\s+at\s+|\s+on\s+|$)/);
    if (titleMatch) data.title = titleMatch[1];

    // Revenue extraction
    const moneyMatch = transcript.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (moneyMatch) data.revenue = parseFloat(moneyMatch[1].replace(',', ''));

    // Status
    data.status = 'Quote'; // Default
    data.priority = 'Medium';

    return data;
  }

  /**
   * HELPER: Extract invoice data from voice transcript
   */
  extractInvoiceData(transcript) {
    const data = {};

    // Amount extraction
    const moneyMatch = transcript.match(/\$?([\d,]+(?:\.\d{2})?)/);
    if (moneyMatch) data.amount = parseFloat(moneyMatch[1].replace(',', ''));

    // Client name
    const clientMatch = transcript.match(/(?:for|to)\s+([A-Z][a-zA-Z\s]+)/);
    if (clientMatch) data.client = clientMatch[1];

    return data;
  }

  /**
   * HELPER: Extract inventory data from voice transcript
   */
  extractInventoryData(transcript) {
    const data = {};

    // Quantity and unit
    const qtyMatch = transcript.match(/([\d.]+)\s*(lbs|pounds|kg|kilos|units|gallons|liters|oz|ounces)/i);
    if (qtyMatch) {
      data.quantity = parseFloat(qtyMatch[1]);
      data.unit = qtyMatch[2].toLowerCase();
    }

    // Item name
    const itemMatch = transcript.match(/(?:add|of)\s+([\w\s]+?)(?:\s+to\s+inventory|$)/i);
    if (itemMatch) data.item_name = itemMatch[1].trim();

    return data;
  }

  /**
   * HELPER: Get comprehensive business statistics
   */
  async getBusinessStats(userId) {
    const stats = {
      activeOrders: 0,
      completedOrders: 0,
      outstandingInvoices: 0,
      outstandingAmount: 0,
      totalRevenue: 0,
      clientCount: 0,
      lowStockItems: 0
    };

    // Orders
    const orderTracker = await CustomTracker.findOne({ userId, name: 'Orders & Projects' });
    if (orderTracker) {
      const orders = await CustomTrackerEntry.find({ userId, trackerId: orderTracker._id });
      stats.activeOrders = orders.filter(o => ['Confirmed', 'In Progress'].includes(o.data.status)).length;
      stats.completedOrders = orders.filter(o => o.data.status === 'Complete').length;
      stats.totalRevenue = orders
        .filter(o => o.data.status === 'Complete')
        .reduce((sum, o) => sum + (parseFloat(o.data.revenue) || 0), 0);
    }

    // Invoices
    const invoiceTracker = await CustomTracker.findOne({ userId, name: 'Invoices & Billing' });
    if (invoiceTracker) {
      const invoices = await CustomTrackerEntry.find({ userId, trackerId: invoiceTracker._id });
      const outstanding = invoices.filter(i => ['Sent', 'Overdue'].includes(i.data.status));
      stats.outstandingInvoices = outstanding.length;
      stats.outstandingAmount = outstanding.reduce((sum, i) => sum + (parseFloat(i.data.amount) || 0), 0);
    }

    // Clients
    const clientTracker = await CustomTracker.findOne({ userId, name: 'Client Database' });
    if (clientTracker) {
      stats.clientCount = await CustomTrackerEntry.countDocuments({ userId, trackerId: clientTracker._id });
    }

    // Inventory
    const inventoryTracker = await CustomTracker.findOne({ userId, name: 'Inventory & Stock' });
    if (inventoryTracker) {
      const items = await CustomTrackerEntry.find({ userId, trackerId: inventoryTracker._id });
      stats.lowStockItems = items.filter(i => (i.data.quantity || 0) <= (i.data.reorder_point || 0)).length;
    }

    return stats;
  }

  /**
   * HELPER: Create business dashboard widget
   */
  async createBusinessDashboard(userId, industry) {
    const existing = await SavedWidget.findOne({ userId, name: 'Business Dashboard' });
    if (existing) return existing;

    return await SavedWidget.create({
      userId,
      name: 'Business Dashboard',
      type: 'business-dashboard',
      category: 'business',
      icon: '📊',
      description: 'Overview of your business performance',
      config: {
        industry,
        sections: ['revenue', 'orders', 'invoices', 'clients', 'inventory'],
        refreshInterval: 60000 // 1 minute
      },
      position: { x: 0, y: 0, width: 12, height: 6 },
      isVisible: true
    });
  }
}

module.exports = new BusinessCommandProcessor();
