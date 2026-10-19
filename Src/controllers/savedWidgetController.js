/**
 * SAVED WIDGET CONTROLLER
 * Handles CRUD operations for persisted widgets
 * Manages user's custom widget library
 */

const SavedWidget = require('../models/phoenix/SavedWidget');
const BehaviorPattern = require('../models/phoenix/BehaviorPattern');
const consciousMind = require('../services/gemini/consciousMind');
const widgetTemplates = require('../services/phoenix/widgetTemplates');

/**
 * Create new saved widget
 * POST /api/widgets
 */
exports.createWidget = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            widgetId,
            widgetName,
            widgetType,
            html,
            actions,
            data,
            trackingFields,
            config,
            generation,
            tags,
            notes
        } = req.body;

        

        // Check if widget already exists
        const existing = await SavedWidget.findOne({ widgetId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Widget with this ID already exists'
            });
        }

        const widget = new SavedWidget({
            userId,
            widgetId,
            widgetName,
            widgetType: widgetType || 'custom_tracker',
            html,
            actions: actions || {},
            data: data || {},
            trackingFields: trackingFields || [],
            config: config || {},
            generation: generation || {
                source: 'manual',
                generatedBy: 'manual',
                generatedAt: new Date()
            },
            tags: tags || [],
            notes: notes || ''
        });

        await widget.save();

        

        res.status(201).json({
            success: true,
            message: 'Widget created successfully',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Create error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Generate widget from AI request
 * POST /api/widgets/generate
 */
exports.generateWidget = async (req, res) => {
    try {
        const userId = req.user.id;
        const { request, source = 'ai_text' } = req.body;

        

        // Generate widget using Gemini
        const generatedWidget = await consciousMind.generateCustomWidget(request, {
            userId
        });

        // Save generated widget
        const widget = new SavedWidget({
            userId,
            widgetId: generatedWidget.widgetId,
            widgetName: generatedWidget.widgetName,
            widgetType: 'ai_generated',
            html: generatedWidget.html,
            actions: generatedWidget.actions || {},
            data: generatedWidget.data || {},
            trackingFields: generatedWidget.trackingFields || [],
            generation: {
                source,
                originalRequest: request,
                generatedBy: 'gemini',
                generatedAt: new Date()
            }
        });

        await widget.save();

        

        res.status(201).json({
            success: true,
            message: 'Widget generated successfully',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Generate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all widgets for user
 * GET /api/widgets
 */
exports.getAllWidgets = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            includeArchived = false,
            type,
            tag,
            search
        } = req.query;

        

        let query = { userId };

        // Filter archived
        if (!includeArchived) {
            query['state.archived'] = false;
        }

        // Filter by type
        if (type) {
            query.widgetType = type;
        }

        // Filter by tag
        if (tag) {
            query.tags = tag;
        }

        // Search
        if (search) {
            query.$or = [
                { widgetName: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const widgets = await SavedWidget.find(query)
            .sort({ 'state.pinned': -1, 'config.priority': 1, createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                widgets,
                total: widgets.length
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Get all error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get widgets',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get enabled widgets for interface
 * GET /api/widgets/enabled
 */
exports.getEnabledWidgets = async (req, res) => {
    try {
        const userId = req.user.id;

        const widgets = await SavedWidget.getEnabledWidgets(userId);

        res.json({
            success: true,
            data: {
                widgets,
                total: widgets.length
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Get enabled error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get enabled widgets',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get single widget
 * GET /api/widgets/:widgetId
 */
exports.getWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        res.json({
            success: true,
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Get widget error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update widget
 * PUT /api/widgets/:widgetId
 */
exports.updateWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'widgetName', 'html', 'actions', 'data', 'trackingFields',
            'config', 'tags', 'notes'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                widget[field] = updates[field];
            }
        });

        await widget.save();

        

        res.json({
            success: true,
            message: 'Widget updated successfully',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Toggle widget enabled state
 * POST /api/widgets/:widgetId/toggle
 */
exports.toggleWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        await widget.toggleEnabled();

        

        res.json({
            success: true,
            message: `Widget ${widget.state.enabled ? 'enabled' : 'disabled'}`,
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Toggle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Pin/unpin widget
 * POST /api/widgets/:widgetId/pin
 */
exports.pinWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        await widget.togglePinned();

        

        res.json({
            success: true,
            message: `Widget ${widget.state.pinned ? 'pinned' : 'unpinned'}`,
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Pin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to pin widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Archive widget
 * POST /api/widgets/:widgetId/archive
 */
exports.archiveWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        await widget.archive();

        

        res.json({
            success: true,
            message: 'Widget archived',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Archive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Restore archived widget
 * POST /api/widgets/:widgetId/restore
 */
exports.restoreWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        await widget.restore();

        

        res.json({
            success: true,
            message: 'Widget restored',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Restore error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete widget permanently
 * DELETE /api/widgets/:widgetId
 */
exports.deleteWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOneAndDelete({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        

        res.json({
            success: true,
            message: 'Widget deleted permanently'
        });

    } catch (error) {
        console.error('[SavedWidget] Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete widget',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Record widget usage
 * POST /api/widgets/:widgetId/use
 */
exports.recordUsage = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const widget = await SavedWidget.findOne({ widgetId, userId });

        if (!widget) {
            return res.status(404).json({
                success: false,
                message: 'Widget not found'
            });
        }

        await widget.recordUsage();

        res.json({
            success: true,
            message: 'Usage recorded',
            data: {
                usage: widget.usage
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Record usage error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record usage',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user widget statistics
 * GET /api/widgets/stats
 */
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await SavedWidget.getUserWidgetStats(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[SavedWidget] Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get inactive widgets
 * GET /api/widgets/inactive
 */
exports.getInactiveWidgets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const widgets = await SavedWidget.getInactiveWidgets(userId, parseInt(days));

        res.json({
            success: true,
            data: {
                widgets,
                total: widgets.length,
                daysCutoff: parseInt(days)
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Get inactive error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get inactive widgets',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all widget templates
 * GET /api/widgets/templates
 */
exports.getAllTemplates = async (req, res) => {
    try {
        const templates = widgetTemplates.getAllTemplates();

        res.json({
            success: true,
            data: {
                templates,
                total: templates.length,
                categories: widgetTemplates.getCategories()
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get templates',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get templates by category
 * GET /api/widgets/templates/category/:category
 */
exports.getTemplatesByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const templates = widgetTemplates.getTemplatesByCategory(category);

        res.json({
            success: true,
            data: {
                category,
                templates,
                total: templates.length
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Get templates by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get templates',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Search widget templates
 * GET /api/widgets/templates/search?q=query
 */
exports.searchTemplates = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query required'
            });
        }

        const templates = widgetTemplates.searchTemplates(q);

        res.json({
            success: true,
            data: {
                query: q,
                templates,
                total: templates.length
            }
        });

    } catch (error) {
        console.error('[SavedWidget] Search templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search templates',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Create widget from template
 * POST /api/widgets/from-template/:templateId
 */
exports.createFromTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id;
        const customizations = req.body;

        

        // Create widget from template
        const widgetData = widgetTemplates.createWidgetFromTemplate(templateId, customizations);

        // Save to database
        const widget = new SavedWidget({
            ...widgetData,
            userId
        });

        await widget.save();

        

        res.status(201).json({
            success: true,
            message: 'Widget created from template',
            data: widget.toClientJSON()
        });

    } catch (error) {
        console.error('[SavedWidget] Create from template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create widget from template',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;
