/**
 * BUSINESS TRACKER TEMPLATES
 *
 * Pre-configured tracker templates that transform Phoenix into a business OS.
 * Leverages existing CustomTracker infrastructure for maximum compatibility.
 *
 * Each template defines fields, validation, and widget configuration.
 * Voice commands can reference these templates to set up business tracking instantly.
 */

const businessTrackers = {
  /**
   * CLIENT DATABASE TRACKER
   * CRM functionality - track all clients/customers
   */
  clientTracker: {
    name: 'Client Database',
    category: 'business',
    icon: '👥',
    description: 'Track clients, contacts, and customer relationships',
    fields: [
      {
        name: 'client_name',
        type: 'text',
        required: true,
        label: 'Client Name',
        placeholder: 'Sarah Thompson'
      },
      {
        name: 'email',
        type: 'email',
        label: 'Email Address',
        placeholder: 'sarah@example.com'
      },
      {
        name: 'phone',
        type: 'phone',
        label: 'Phone Number',
        placeholder: '+1 (555) 123-4567'
      },
      {
        name: 'company',
        type: 'text',
        label: 'Company',
        placeholder: 'Acme Corp'
      },
      {
        name: 'status',
        type: 'select',
        options: ['Lead', 'Active', 'Inactive', 'Churned'],
        default: 'Lead',
        label: 'Status'
      },
      {
        name: 'lifetime_value',
        type: 'currency',
        label: 'Lifetime Value',
        placeholder: '0.00'
      },
      {
        name: 'last_contact',
        type: 'date',
        label: 'Last Contact Date'
      },
      {
        name: 'next_followup',
        type: 'date',
        label: 'Next Follow-up'
      },
      {
        name: 'tags',
        type: 'tags',
        label: 'Tags',
        placeholder: 'VIP, Referral, Wholesale'
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Notes',
        placeholder: 'Client preferences, special requests, etc.'
      }
    ],
    widgetConfig: {
      displayType: 'table',
      defaultColumns: ['client_name', 'status', 'lifetime_value', 'last_contact', 'next_followup'],
      sortBy: 'last_contact',
      sortOrder: 'desc',
      filters: ['status', 'tags'],
      actions: ['view', 'edit', 'email', 'call', 'delete'],
      quickActions: [
        { label: 'Email Client', action: 'email', icon: '📧' },
        { label: 'Schedule Call', action: 'calendar', icon: '📞' },
        { label: 'Add Note', action: 'quick-note', icon: '📝' }
      ],
      alerts: [
        {
          condition: 'next_followup < today',
          message: 'Follow-up overdue',
          color: 'red'
        },
        {
          condition: 'last_contact > 30 days ago',
          message: 'No contact in 30+ days',
          color: 'orange'
        }
      ]
    },
    voiceCommands: {
      create: ['add client', 'new client', 'create client'],
      query: ['show clients', 'list clients', 'who are my clients'],
      filter: ['show active clients', 'show leads', 'clients needing followup']
    }
  },

  /**
   * ORDER MANAGEMENT TRACKER
   * Track projects, orders, jobs, or service requests
   */
  orderTracker: {
    name: 'Orders & Projects',
    category: 'business',
    icon: '📦',
    description: 'Manage orders, projects, and service requests',
    fields: [
      {
        name: 'order_id',
        type: 'auto-increment',
        prefix: 'ORD-',
        label: 'Order ID'
      },
      {
        name: 'client',
        type: 'reference',
        linkedTo: 'clientTracker',
        required: true,
        label: 'Client',
        searchable: true
      },
      {
        name: 'title',
        type: 'text',
        required: true,
        label: 'Order Title',
        placeholder: 'Wedding Catering for 150 guests'
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        placeholder: 'Detailed requirements and notes'
      },
      {
        name: 'event_date',
        type: 'datetime',
        label: 'Event Date & Time'
      },
      {
        name: 'due_date',
        type: 'date',
        label: 'Due Date'
      },
      {
        name: 'status',
        type: 'select',
        options: ['Quote', 'Confirmed', 'In Progress', 'Complete', 'Cancelled'],
        default: 'Quote',
        label: 'Status'
      },
      {
        name: 'priority',
        type: 'select',
        options: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium',
        label: 'Priority'
      },
      {
        name: 'revenue',
        type: 'currency',
        label: 'Revenue',
        placeholder: '0.00'
      },
      {
        name: 'cost',
        type: 'currency',
        label: 'Total Cost',
        placeholder: '0.00'
      },
      {
        name: 'margin',
        type: 'calculated',
        formula: '((revenue - cost) / revenue) * 100',
        format: 'percentage',
        label: 'Profit Margin'
      },
      {
        name: 'assigned_to',
        type: 'text',
        label: 'Assigned To',
        placeholder: 'Team member name'
      },
      {
        name: 'tags',
        type: 'tags',
        label: 'Tags',
        placeholder: 'Wedding, Corporate, Vegan'
      }
    ],
    widgetConfig: {
      displayType: 'kanban',
      columns: ['Quote', 'Confirmed', 'In Progress', 'Complete'],
      cardFields: ['title', 'client', 'event_date', 'revenue'],
      sortBy: 'event_date',
      sortOrder: 'asc',
      filters: ['status', 'priority', 'assigned_to'],
      actions: ['view', 'edit', 'duplicate', 'invoice', 'delete'],
      colorCode: {
        field: 'priority',
        colors: {
          'Low': '#4CAF50',
          'Medium': '#2196F3',
          'High': '#FF9800',
          'Urgent': '#F44336'
        }
      },
      alerts: [
        {
          condition: 'due_date < 7 days',
          message: 'Due within 7 days',
          color: 'orange'
        },
        {
          condition: 'due_date < today',
          message: 'OVERDUE',
          color: 'red'
        },
        {
          condition: 'margin < 20',
          message: 'Low margin',
          color: 'yellow'
        }
      ]
    },
    voiceCommands: {
      create: ['add order', 'new order', 'create order', 'new project'],
      query: ['show orders', 'list orders', 'what orders do i have'],
      filter: ['show active orders', 'orders due this week', 'urgent orders']
    }
  },

  /**
   * INVOICE TRACKER
   * Track invoices, payments, and billing
   */
  invoiceTracker: {
    name: 'Invoices & Billing',
    category: 'business',
    icon: '💰',
    description: 'Manage invoices, payments, and billing',
    fields: [
      {
        name: 'invoice_number',
        type: 'auto-increment',
        prefix: 'INV-',
        label: 'Invoice #'
      },
      {
        name: 'client',
        type: 'reference',
        linkedTo: 'clientTracker',
        required: true,
        label: 'Client'
      },
      {
        name: 'order',
        type: 'reference',
        linkedTo: 'orderTracker',
        label: 'Related Order'
      },
      {
        name: 'amount',
        type: 'currency',
        required: true,
        label: 'Invoice Amount'
      },
      {
        name: 'issued_date',
        type: 'date',
        default: 'today',
        label: 'Issue Date'
      },
      {
        name: 'due_date',
        type: 'date',
        label: 'Due Date'
      },
      {
        name: 'paid_date',
        type: 'date',
        label: 'Date Paid'
      },
      {
        name: 'status',
        type: 'select',
        options: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
        default: 'Draft',
        label: 'Status'
      },
      {
        name: 'payment_method',
        type: 'select',
        options: ['Cash', 'Check', 'Credit Card', 'Bank Transfer', 'PayPal', 'Venmo'],
        label: 'Payment Method'
      },
      {
        name: 'notes',
        type: 'textarea',
        label: 'Notes'
      }
    ],
    widgetConfig: {
      displayType: 'table',
      defaultColumns: ['invoice_number', 'client', 'amount', 'due_date', 'status'],
      sortBy: 'due_date',
      sortOrder: 'asc',
      filters: ['status', 'payment_method'],
      actions: ['view', 'edit', 'send', 'download', 'mark-paid', 'delete'],
      quickActions: [
        { label: 'Send Invoice', action: 'email-invoice', icon: '📧' },
        { label: 'Mark as Paid', action: 'mark-paid', icon: '✅' },
        { label: 'Download PDF', action: 'download-pdf', icon: '📄' }
      ],
      colorCode: {
        field: 'status',
        colors: {
          'Draft': '#9E9E9E',
          'Sent': '#2196F3',
          'Paid': '#4CAF50',
          'Overdue': '#F44336',
          'Cancelled': '#757575'
        }
      },
      alerts: [
        {
          condition: 'status == "Sent" AND due_date < today',
          action: 'update-status',
          newStatus: 'Overdue'
        },
        {
          condition: 'status == "Overdue"',
          message: 'Payment overdue',
          color: 'red'
        }
      ],
      summaryCards: [
        { label: 'Total Outstanding', calculation: 'SUM(amount WHERE status IN ["Sent", "Overdue"])', format: 'currency' },
        { label: 'Total Paid This Month', calculation: 'SUM(amount WHERE status="Paid" AND paid_date >= start_of_month)', format: 'currency' },
        { label: 'Overdue Invoices', calculation: 'COUNT(* WHERE status="Overdue")', format: 'number' }
      ]
    },
    voiceCommands: {
      create: ['create invoice', 'new invoice', 'invoice client'],
      query: ['show invoices', 'list invoices', 'outstanding invoices'],
      filter: ['show overdue invoices', 'invoices paid this month']
    }
  },

  /**
   * INVENTORY TRACKER
   * Track products, supplies, or inventory items
   */
  inventoryTracker: {
    name: 'Inventory & Stock',
    category: 'business',
    icon: '📦',
    description: 'Manage inventory, supplies, and stock levels',
    fields: [
      {
        name: 'item_name',
        type: 'text',
        required: true,
        label: 'Item Name',
        placeholder: 'Chicken Breast'
      },
      {
        name: 'sku',
        type: 'text',
        label: 'SKU/Code',
        placeholder: 'CHKN-001'
      },
      {
        name: 'category',
        type: 'select',
        options: ['Protein', 'Vegetables', 'Dairy', 'Pantry', 'Beverage', 'Supplies'],
        label: 'Category'
      },
      {
        name: 'quantity',
        type: 'number',
        required: true,
        label: 'Current Quantity',
        placeholder: '0'
      },
      {
        name: 'unit',
        type: 'select',
        options: ['lbs', 'kg', 'oz', 'g', 'units', 'gallons', 'liters', 'cases'],
        default: 'units',
        label: 'Unit of Measure'
      },
      {
        name: 'cost_per_unit',
        type: 'currency',
        label: 'Cost per Unit',
        placeholder: '0.00'
      },
      {
        name: 'reorder_point',
        type: 'number',
        label: 'Reorder Point',
        placeholder: '10'
      },
      {
        name: 'supplier',
        type: 'text',
        label: 'Supplier',
        placeholder: 'Restaurant Depot'
      },
      {
        name: 'supplier_contact',
        type: 'phone',
        label: 'Supplier Phone'
      },
      {
        name: 'last_ordered',
        type: 'date',
        label: 'Last Order Date'
      },
      {
        name: 'location',
        type: 'text',
        label: 'Storage Location',
        placeholder: 'Walk-in Freezer'
      }
    ],
    widgetConfig: {
      displayType: 'table',
      defaultColumns: ['item_name', 'quantity', 'unit', 'reorder_point', 'supplier'],
      sortBy: 'item_name',
      sortOrder: 'asc',
      filters: ['category', 'supplier'],
      actions: ['view', 'edit', 'adjust-quantity', 'reorder', 'delete'],
      quickActions: [
        { label: 'Adjust Quantity', action: 'adjust-qty', icon: '➕' },
        { label: 'Reorder Now', action: 'reorder', icon: '🛒' },
        { label: 'View History', action: 'history', icon: '📊' }
      ],
      alerts: [
        {
          condition: 'quantity <= reorder_point',
          message: 'REORDER NEEDED',
          color: 'red',
          action: 'highlight'
        },
        {
          condition: 'quantity <= (reorder_point * 1.2)',
          message: 'Low stock',
          color: 'orange'
        }
      ],
      summaryCards: [
        { label: 'Items Low Stock', calculation: 'COUNT(* WHERE quantity <= reorder_point)', format: 'number' },
        { label: 'Total Inventory Value', calculation: 'SUM(quantity * cost_per_unit)', format: 'currency' },
        { label: 'Items in Stock', calculation: 'COUNT(* WHERE quantity > 0)', format: 'number' }
      ]
    },
    voiceCommands: {
      create: ['add inventory item', 'new item', 'add stock'],
      query: ['show inventory', 'list inventory', 'what inventory do i have'],
      filter: ['show low stock', 'items needing reorder']
    }
  },

  /**
   * TIME TRACKING
   * For consultants, freelancers, agencies
   */
  timeTracker: {
    name: 'Time Tracking',
    category: 'business',
    icon: '⏱️',
    description: 'Track billable hours and time spent on projects',
    fields: [
      {
        name: 'client',
        type: 'reference',
        linkedTo: 'clientTracker',
        required: true,
        label: 'Client'
      },
      {
        name: 'project',
        type: 'reference',
        linkedTo: 'orderTracker',
        label: 'Project'
      },
      {
        name: 'date',
        type: 'date',
        default: 'today',
        label: 'Date'
      },
      {
        name: 'start_time',
        type: 'time',
        label: 'Start Time'
      },
      {
        name: 'end_time',
        type: 'time',
        label: 'End Time'
      },
      {
        name: 'duration',
        type: 'calculated',
        formula: 'end_time - start_time',
        format: 'hours',
        label: 'Duration (hrs)'
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Work Description'
      },
      {
        name: 'hourly_rate',
        type: 'currency',
        label: 'Hourly Rate'
      },
      {
        name: 'billable_amount',
        type: 'calculated',
        formula: 'duration * hourly_rate',
        format: 'currency',
        label: 'Billable Amount'
      },
      {
        name: 'billable',
        type: 'checkbox',
        default: true,
        label: 'Billable?'
      },
      {
        name: 'invoiced',
        type: 'checkbox',
        default: false,
        label: 'Invoiced?'
      }
    ],
    widgetConfig: {
      displayType: 'table',
      defaultColumns: ['date', 'client', 'duration', 'description', 'billable_amount', 'invoiced'],
      sortBy: 'date',
      sortOrder: 'desc',
      filters: ['client', 'billable', 'invoiced'],
      actions: ['view', 'edit', 'duplicate', 'invoice', 'delete'],
      summaryCards: [
        { label: 'This Week Hours', calculation: 'SUM(duration WHERE date >= start_of_week)', format: 'hours' },
        { label: 'Unbilled Amount', calculation: 'SUM(billable_amount WHERE billable=true AND invoiced=false)', format: 'currency' },
        { label: 'This Month Revenue', calculation: 'SUM(billable_amount WHERE invoiced=true AND date >= start_of_month)', format: 'currency' }
      ]
    },
    voiceCommands: {
      create: ['log time', 'track time', 'add hours'],
      query: ['show time entries', 'hours this week', 'unbilled time']
    }
  }
};

/**
 * INDUSTRY BUNDLES
 * Pre-configured sets of trackers for specific industries
 */
const industryTemplates = {
  catering: {
    name: 'Catering Business',
    icon: '🍽️',
    description: 'Complete business management for catering companies',
    trackers: ['clientTracker', 'orderTracker', 'inventoryTracker', 'invoiceTracker'],
    widgets: ['business-dashboard', 'revenue-tracker', 'order-calendar']
  },

  consulting: {
    name: 'Consulting Practice',
    icon: '💼',
    description: 'Client and project management for consultants',
    trackers: ['clientTracker', 'orderTracker', 'timeTracker', 'invoiceTracker'],
    widgets: ['business-dashboard', 'time-summary', 'revenue-tracker']
  },

  freelance: {
    name: 'Freelance Business',
    icon: '💻',
    description: 'Project and time tracking for freelancers',
    trackers: ['clientTracker', 'orderTracker', 'timeTracker', 'invoiceTracker'],
    widgets: ['business-dashboard', 'time-summary', 'income-tracker']
  },

  retail: {
    name: 'Retail Store',
    icon: '🏪',
    description: 'Inventory and sales management',
    trackers: ['clientTracker', 'inventoryTracker', 'orderTracker', 'invoiceTracker'],
    widgets: ['business-dashboard', 'inventory-alerts', 'sales-tracker']
  },

  coaching: {
    name: 'Coaching Practice',
    icon: '🎯',
    description: 'Client management and session tracking',
    trackers: ['clientTracker', 'orderTracker', 'timeTracker', 'invoiceTracker'],
    widgets: ['business-dashboard', 'client-progress', 'revenue-tracker']
  }
};

module.exports = {
  businessTrackers,
  industryTemplates
};
