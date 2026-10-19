/**
 * CONVERSATION ENHANCER SERVICE
 * Improves JARVIS conversation flow and widget reveal timing
 * Makes interactions feel more natural and contextually aware
 */

const SavedWidget = require('../../models/phoenix/SavedWidget');
const CustomTrackerEntry = require('../../models/CustomTrackerEntry');

/**
 * Analyze conversation context to determine widget reveal timing
 * Widgets should appear organically during conversation, not upfront
 */
async function determineWidgetRevealTiming(userQuery, userId, conversationHistory = []) {
    const analysis = {
        shouldRevealWidget: false,
        widgetType: null,
        revealTiming: null, // 'immediate', 'after_response', 'contextual'
        relevantWidgets: [],
        reason: null
    };

    try {
        // Check if query is tracking-related
        const trackingKeywords = [
            'track', 'log', 'record', 'monitor', 'count', 'measure',
            'how many', 'did i', 'have i', 'should i', 'remind me'
        ];

        const isTrackingQuery = trackingKeywords.some(keyword =>
            userQuery.toLowerCase().includes(keyword)
        );

        if (isTrackingQuery) {
            // Find existing relevant widgets
            const relevantWidgets = await SavedWidget.find({
                userId,
                'state.enabled': true,
                $or: [
                    { widgetName: { $regex: new RegExp(userQuery, 'i') } },
                    { tags: { $regex: new RegExp(userQuery, 'i') } },
                    { notes: { $regex: new RegExp(userQuery, 'i') } }
                ]
            }).limit(3).lean();

            if (relevantWidgets.length > 0) {
                // User has existing widgets - reveal them contextually
                analysis.shouldRevealWidget = true;
                analysis.widgetType = 'existing';
                analysis.revealTiming = 'contextual';
                analysis.relevantWidgets = relevantWidgets;
                analysis.reason = 'Found existing widgets matching query';
            } else {
                // No existing widgets - offer to create one
                analysis.shouldRevealWidget = true;
                analysis.widgetType = 'new';
                analysis.revealTiming = 'after_response';
                analysis.reason = 'Query suggests need for new tracking widget';
            }
        }

        // Check conversation history for context
        if (conversationHistory.length > 0) {
            const recentMessages = conversationHistory.slice(-3);
            const hasDiscussedTracking = recentMessages.some(msg =>
                msg.content && trackingKeywords.some(kw =>
                    msg.content.toLowerCase().includes(kw)
                )
            );

            if (hasDiscussedTracking && !analysis.shouldRevealWidget) {
                // Conversation is about tracking but no widget yet
                analysis.shouldRevealWidget = true;
                analysis.widgetType = 'suggested';
                analysis.revealTiming = 'contextual';
                analysis.reason = 'Conversation context suggests tracking need';
            }
        }

        return analysis;

    } catch (error) {
        console.error('[ConversationEnhancer] Widget reveal analysis error:', error);
        return analysis;
    }
}

/**
 * Generate contextual widget keyboard options
 * Shows quick actions based on conversation context
 */
async function generateWidgetKeyboard(userId, context) {
    const keyboard = {
        quickActions: [],
        suggestedTemplates: [],
        recentWidgets: []
    };

    try {
        // Get user's most recent widgets
        const recentWidgets = await SavedWidget.find({
            userId,
            'state.enabled': true
        })
        .sort({ 'usage.lastUsed': -1 })
        .limit(3)
        .lean();

        keyboard.recentWidgets = recentWidgets.map(w => ({
            widgetId: w.widgetId,
            widgetName: w.widgetName,
            action: 'open',
            label: `📊 ${w.widgetName}`
        }));

        // Context-based quick actions
        if (context.timeContext === 'morning') {
            keyboard.quickActions.push(
                { action: 'log_mood', label: '😊 Log Morning Mood' },
                { action: 'log_water', label: '💧 Log Water' },
                { action: 'view_goals', label: '🎯 View Today\'s Goals' }
            );
        } else if (context.timeContext === 'evening') {
            keyboard.quickActions.push(
                { action: 'review_day', label: '📝 Review Day' },
                { action: 'log_gratitude', label: '🙏 Gratitude Entry' },
                { action: 'check_tomorrow', label: '📅 Tomorrow\'s Plan' }
            );
        }

        // Suggest templates based on what user doesn't have yet
        const userWidgetTypes = recentWidgets.map(w => w.widgetType);
        const missingTemplates = [
            { id: 'water_intake', label: '💧 Water Tracker', type: 'health' },
            { id: 'mood_tracker', label: '😊 Mood Tracker', type: 'mental_health' },
            { id: 'habit_tracker', label: '✓ Habit Tracker', type: 'productivity' }
        ].filter(t => !userWidgetTypes.includes(t.type));

        keyboard.suggestedTemplates = missingTemplates.slice(0, 3);

        return keyboard;

    } catch (error) {
        console.error('[ConversationEnhancer] Keyboard generation error:', error);
        return keyboard;
    }
}

/**
 * Enhance JARVIS response with contextual awareness
 * Makes responses more natural and conversational
 */
function enhanceJarvisResponse(response, context, widgetAnalysis) {
    const enhanced = {
        message: response,
        tone: 'helpful', // 'helpful', 'encouraging', 'analytical', 'casual'
        showWidget: widgetAnalysis.shouldRevealWidget,
        widgetRevealStyle: widgetAnalysis.revealTiming,
        suggestedActions: [],
        followUp: null
    };

    try {
        // Add personality based on context
        if (context.timeContext === 'morning') {
            if (!response.toLowerCase().includes('good morning')) {
                enhanced.message = `Good morning! ${response}`;
            }
            enhanced.tone = 'encouraging';
        } else if (context.timeContext === 'evening') {
            enhanced.tone = 'casual';
        }

        // Add follow-up question if widget should be revealed
        if (widgetAnalysis.shouldRevealWidget) {
            if (widgetAnalysis.widgetType === 'new') {
                enhanced.followUp = "Would you like me to create a custom tracker for this?";
                enhanced.suggestedActions.push({
                    label: 'Yes, create tracker',
                    action: 'create_widget',
                    value: context.userQuery
                });
            } else if (widgetAnalysis.widgetType === 'existing') {
                enhanced.followUp = `I found ${widgetAnalysis.relevantWidgets.length} tracker(s) that might help.`;
                enhanced.suggestedActions = widgetAnalysis.relevantWidgets.map(w => ({
                    label: `Open ${w.widgetName}`,
                    action: 'open_widget',
                    value: w.widgetId
                }));
            }
        }

        // Add encouragement based on recent activity
        if (context.recentActivity && context.recentActivity.length > 0) {
            const streak = context.recentActivity.filter(a => a.completed).length;
            if (streak >= 3) {
                enhanced.tone = 'encouraging';
                enhanced.message += ` You're on a ${streak}-day streak, keep it up!`;
            }
        }

        return enhanced;

    } catch (error) {
        console.error('[ConversationEnhancer] Response enhancement error:', error);
        return { message: response, tone: 'helpful' };
    }
}

/**
 * Get conversation suggestions based on user history
 * Helps guide conversation in useful directions
 */
async function getConversationSuggestions(userId) {
    const suggestions = [];

    try {
        // Check if user has logged anything recently
        const recentEntries = await CustomTrackerEntry.find({ userId })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        if (recentEntries.length === 0) {
            suggestions.push({
                type: 'prompt',
                message: 'Try saying: "Track my water intake" or "Log my mood"',
                priority: 'high'
            });
        }

        // Check for inactive widgets
        const inactiveWidgets = await SavedWidget.find({
            userId,
            'usage.daysSinceLastUse': { $gt: 7 },
            'state.archived': false
        }).limit(3).lean();

        if (inactiveWidgets.length > 0) {
            suggestions.push({
                type: 'reminder',
                message: `You haven't used your ${inactiveWidgets[0].widgetName} in a while`,
                priority: 'medium',
                action: 'open_widget',
                widgetId: inactiveWidgets[0].widgetId
            });
        }

        // Check for pattern insights
        // (This would integrate with Claude's pattern detection)
        // suggestions.push({ type: 'insight', message: '...', priority: 'low' });

        return suggestions;

    } catch (error) {
        console.error('[ConversationEnhancer] Suggestions error:', error);
        return [];
    }
}

module.exports = {
    determineWidgetRevealTiming,
    generateWidgetKeyboard,
    enhanceJarvisResponse,
    getConversationSuggestions
};
