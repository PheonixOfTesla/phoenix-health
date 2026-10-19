/**
 * CalDAV SERVICE - Universal Calendar Connector
 * Works with Google Calendar, iCloud, Outlook, any CalDAV provider
 */

const { DAVClient } = require('tsdav');

// Provider CalDAV endpoints
const PROVIDERS = {
    'gmail.com': 'https://apidata.googleusercontent.com/caldav/v2',
    'googlemail.com': 'https://apidata.googleusercontent.com/caldav/v2',
    'icloud.com': 'https://caldav.icloud.com',
    'me.com': 'https://caldav.icloud.com',
    'outlook.com': 'https://outlook.office365.com/caldav',
    'hotmail.com': 'https://outlook.office365.com/caldav',
    'yahoo.com': 'https://caldav.calendar.yahoo.com'
};

class CalDAVService {
    constructor() {
        this.clients = new Map(); // userId -> client
    }

    /**
     * Get CalDAV server URL for email domain
     */
    getProviderUrl(email) {
        const domain = email.split('@')[1]?.toLowerCase();
        return PROVIDERS[domain] || null;
    }

    /**
     * Connect to CalDAV server
     */
    async connect(userId, email, password) {
        const serverUrl = this.getProviderUrl(email);

        if (!serverUrl) {
            throw new Error(`CalDAV not supported for ${email.split('@')[1]}`);
        }

        try {
            const client = new DAVClient({
                serverUrl,
                credentials: {
                    username: email,
                    password: password
                },
                authMethod: 'Basic',
                defaultAccountType: 'caldav'
            });

            await client.login();

            this.clients.set(userId, { client, email });
            return { success: true };
        } catch (err) {
            throw new Error(`CalDAV connection failed: ${err.message}`);
        }
    }

    /**
     * Get all calendars
     */
    async getCalendars(userId) {
        const conn = this.clients.get(userId);
        if (!conn) throw new Error('Not connected');

        const calendars = await conn.client.fetchCalendars();
        return calendars.map(cal => ({
            url: cal.url,
            displayName: cal.displayName,
            description: cal.description,
            color: cal.calendarColor,
            ctag: cal.ctag
        }));
    }

    /**
     * Get events from calendar
     */
    async getEvents(userId, calendarUrl, startDate, endDate) {
        const conn = this.clients.get(userId);
        if (!conn) throw new Error('Not connected');

        // Default: past month to next month
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const events = await conn.client.fetchCalendarObjects({
            calendar: { url: calendarUrl },
            timeRange: {
                start: start.toISOString(),
                end: end.toISOString()
            }
        });

        return events.map(event => this.parseVEvent(event));
    }

    /**
     * Get all events from all calendars
     */
    async getAllEvents(userId, startDate, endDate) {
        const calendars = await this.getCalendars(userId);
        const allEvents = [];

        for (const cal of calendars) {
            try {
                const events = await this.getEvents(userId, cal.url, startDate, endDate);
                allEvents.push(...events.map(e => ({ ...e, calendar: cal.displayName })));
            } catch (err) {
                console.warn(`[CalDAV] Failed to fetch from ${cal.displayName}:`, err.message);
            }
        }

        // Sort by start date
        allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        return allEvents;
    }

    /**
     * Create event
     */
    async createEvent(userId, calendarUrl, event) {
        const conn = this.clients.get(userId);
        if (!conn) throw new Error('Not connected');

        const vcalendar = this.createVEvent(event);

        const result = await conn.client.createCalendarObject({
            calendar: { url: calendarUrl },
            filename: `${Date.now()}.ics`,
            iCalString: vcalendar
        });

        return { success: true, url: result.url };
    }

    /**
     * Update event
     */
    async updateEvent(userId, eventUrl, event) {
        const conn = this.clients.get(userId);
        if (!conn) throw new Error('Not connected');

        const vcalendar = this.createVEvent(event);

        await conn.client.updateCalendarObject({
            calendarObject: { url: eventUrl, data: vcalendar }
        });

        return { success: true };
    }

    /**
     * Delete event
     */
    async deleteEvent(userId, eventUrl) {
        const conn = this.clients.get(userId);
        if (!conn) throw new Error('Not connected');

        await conn.client.deleteCalendarObject({
            calendarObject: { url: eventUrl }
        });

        return { success: true };
    }

    /**
     * Parse iCalendar VEVENT to JSON
     */
    parseVEvent(calObject) {
        const data = calObject.data || '';

        const getValue = (key) => {
            const regex = new RegExp(`${key}[^:]*:(.*)`, 'i');
            const match = data.match(regex);
            return match ? match[1].trim() : '';
        };

        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle both datetime and date-only formats
            if (dateStr.includes('T')) {
                return new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
            }
            return new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
        };

        return {
            url: calObject.url,
            uid: getValue('UID'),
            title: getValue('SUMMARY'),
            description: getValue('DESCRIPTION'),
            location: getValue('LOCATION'),
            start: parseDate(getValue('DTSTART'))?.toISOString(),
            end: parseDate(getValue('DTEND'))?.toISOString(),
            allDay: !getValue('DTSTART').includes('T')
        };
    }

    /**
     * Create iCalendar VEVENT string
     */
    createVEvent(event) {
        const uid = event.uid || `${Date.now()}@phoenix`;
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const formatDate = (date, allDay) => {
            const d = new Date(date);
            if (allDay) {
                return d.toISOString().split('T')[0].replace(/-/g, '');
            }
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const dtstart = event.allDay
            ? `DTSTART;VALUE=DATE:${formatDate(event.start, true)}`
            : `DTSTART:${formatDate(event.start, false)}`;

        const dtend = event.allDay
            ? `DTEND;VALUE=DATE:${formatDate(event.end, true)}`
            : `DTEND:${formatDate(event.end, false)}`;

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Phoenix//Calendar//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
${dtstart}
${dtend}
SUMMARY:${event.title || 'Untitled'}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;
    }

    /**
     * Disconnect user
     */
    disconnect(userId) {
        this.clients.delete(userId);
    }

    /**
     * Check if connected
     */
    isConnected(userId) {
        return this.clients.has(userId);
    }
}

// Singleton
module.exports = new CalDAVService();
