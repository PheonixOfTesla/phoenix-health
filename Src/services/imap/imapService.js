/**
 * IMAP SERVICE - Universal Email Connector
 * Works with Gmail, Outlook, Yahoo, iCloud, any IMAP provider
 *
 * No OAuth needed - uses App Passwords for major providers
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { encrypt, decrypt } = require('../encryption');

// Provider configurations
const PROVIDERS = {
    'gmail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'googlemail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'outlook.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'hotmail.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'live.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'icloud.com': { host: 'imap.mail.me.com', port: 993, tls: true },
    'me.com': { host: 'imap.mail.me.com', port: 993, tls: true },
    'aol.com': { host: 'imap.aol.com', port: 993, tls: true },
    'protonmail.com': { host: '127.0.0.1', port: 1143, tls: false }, // ProtonMail Bridge
    'proton.me': { host: '127.0.0.1', port: 1143, tls: false }
};

class ImapService {
    constructor() {
        this.connections = new Map(); // userId -> connection
    }

    /**
     * Get IMAP config for email domain
     */
    getProviderConfig(email) {
        const domain = email.split('@')[1]?.toLowerCase();
        return PROVIDERS[domain] || {
            // Default: try standard IMAP
            host: `imap.${domain}`,
            port: 993,
            tls: true
        };
    }

    /**
     * Test connection with credentials
     */
    async testConnection(email, password) {
        return new Promise((resolve, reject) => {
            const config = this.getProviderConfig(email);

            const imap = new Imap({
                user: email,
                password: password,
                host: config.host,
                port: config.port,
                tls: config.tls,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 10000,
                authTimeout: 10000
            });

            imap.once('ready', () => {
                imap.end();
                resolve({ success: true, provider: config.host });
            });

            imap.once('error', (err) => {
                reject({ success: false, error: err.message });
            });

            imap.connect();
        });
    }

    /**
     * Connect and cache connection for user
     */
    async connect(userId, email, password) {
        const config = this.getProviderConfig(email);

        return new Promise((resolve, reject) => {
            const imap = new Imap({
                user: email,
                password: password,
                host: config.host,
                port: config.port,
                tls: config.tls,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 10000,
                authTimeout: 10000
            });

            imap.once('ready', () => {
                this.connections.set(userId, { imap, email, config });
                resolve({ success: true });
            });

            imap.once('error', (err) => {
                reject({ success: false, error: err.message });
            });

            imap.once('end', () => {
                this.connections.delete(userId);
            });

            imap.connect();
        });
    }

    /**
     * Get emails from inbox
     */
    async getEmails(userId, folder = 'INBOX', limit = 50) {
        const conn = this.connections.get(userId);
        if (!conn) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            conn.imap.openBox(folder, true, (err, box) => {
                if (err) return reject(err);

                const total = box.messages.total;
                const start = Math.max(1, total - limit + 1);

                if (total === 0) {
                    return resolve([]);
                }

                const emails = [];
                const fetch = conn.imap.seq.fetch(`${start}:${total}`, {
                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                    struct: true
                });

                fetch.on('message', (msg, seqno) => {
                    const email = { seqno };

                    msg.on('body', (stream, info) => {
                        let buffer = '';
                        stream.on('data', chunk => buffer += chunk.toString('utf8'));
                        stream.on('end', () => {
                            if (info.which.includes('HEADER')) {
                                const parsed = Imap.parseHeader(buffer);
                                email.from = parsed.from?.[0] || '';
                                email.to = parsed.to?.[0] || '';
                                email.subject = parsed.subject?.[0] || '(No Subject)';
                                email.date = parsed.date?.[0] || new Date().toISOString();
                            } else {
                                // Clean up MIME headers from snippet
                                let clean = buffer
                                    .replace(/--[a-zA-Z0-9_-]+/g, '') // Remove MIME boundaries
                                    .replace(/Content-Type:[^\n]+/gi, '')
                                    .replace(/Content-Transfer-Encoding:[^\n]+/gi, '')
                                    .replace(/Content-Disposition:[^\n]+/gi, '')
                                    .replace(/charset="[^"]+"/gi, '')
                                    .replace(/base64/gi, '')
                                    .replace(/quoted-printable/gi, '')
                                    .replace(/=\r?\n/g, '') // Remove soft line breaks
                                    .replace(/=[0-9A-F]{2}/gi, '') // Remove encoded chars
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                email.snippet = clean.substring(0, 150) || '(No preview)';
                            }
                        });
                    });

                    msg.once('attributes', (attrs) => {
                        email.uid = attrs.uid;
                        email.flags = attrs.flags;
                        email.unread = !attrs.flags.includes('\\Seen');
                    });

                    msg.once('end', () => {
                        emails.push(email);
                    });
                });

                fetch.once('error', reject);
                fetch.once('end', () => {
                    // Sort by date descending
                    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
                    resolve(emails);
                });
            });
        });
    }

    /**
     * Get full email by UID
     */
    async getEmail(userId, uid, folder = 'INBOX') {
        const conn = this.connections.get(userId);
        if (!conn) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            conn.imap.openBox(folder, true, (err) => {
                if (err) return reject(err);

                const fetch = conn.imap.fetch(uid, { bodies: '' });

                fetch.on('message', (msg) => {
                    msg.on('body', (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            if (err) return reject(err);
                            resolve({
                                uid,
                                from: parsed.from?.text || '',
                                to: parsed.to?.text || '',
                                subject: parsed.subject || '(No Subject)',
                                date: parsed.date?.toISOString() || new Date().toISOString(),
                                body: parsed.text || parsed.html || '',
                                html: parsed.html || '',
                                attachments: (parsed.attachments || []).map(a => ({
                                    filename: a.filename,
                                    contentType: a.contentType,
                                    size: a.size
                                }))
                            });
                        });
                    });
                });

                fetch.once('error', reject);
            });
        });
    }

    /**
     * Get folder list
     */
    async getFolders(userId) {
        const conn = this.connections.get(userId);
        if (!conn) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            conn.imap.getBoxes((err, boxes) => {
                if (err) return reject(err);

                const folders = [];
                const parseBoxes = (boxes, prefix = '') => {
                    for (const [name, box] of Object.entries(boxes)) {
                        const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;
                        folders.push({
                            name: fullName,
                            delimiter: box.delimiter,
                            flags: box.attribs
                        });
                        if (box.children) {
                            parseBoxes(box.children, fullName);
                        }
                    }
                };
                parseBoxes(boxes);
                resolve(folders);
            });
        });
    }

    /**
     * Mark email as read/unread
     */
    async markRead(userId, uid, read = true, folder = 'INBOX') {
        const conn = this.connections.get(userId);
        if (!conn) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            conn.imap.openBox(folder, false, (err) => {
                if (err) return reject(err);

                const method = read ? 'addFlags' : 'delFlags';
                conn.imap[method](uid, ['\\Seen'], (err) => {
                    if (err) return reject(err);
                    resolve({ success: true });
                });
            });
        });
    }

    /**
     * Delete email (move to trash)
     */
    async deleteEmail(userId, uid, folder = 'INBOX') {
        const conn = this.connections.get(userId);
        if (!conn) throw new Error('Not connected');

        return new Promise((resolve, reject) => {
            conn.imap.openBox(folder, false, (err) => {
                if (err) return reject(err);

                conn.imap.addFlags(uid, ['\\Deleted'], (err) => {
                    if (err) return reject(err);
                    conn.imap.expunge((err) => {
                        if (err) return reject(err);
                        resolve({ success: true });
                    });
                });
            });
        });
    }

    /**
     * Disconnect user
     */
    disconnect(userId) {
        const conn = this.connections.get(userId);
        if (conn) {
            conn.imap.end();
            this.connections.delete(userId);
        }
    }

    /**
     * Check if user is connected
     */
    isConnected(userId) {
        return this.connections.has(userId);
    }
}

// Singleton
module.exports = new ImapService();
