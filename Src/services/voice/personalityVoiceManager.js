/**
 * PERSONALITY VOICE MANAGER
 * Manages multiple voice personas: Tesla, Goggins, Huberman, etc.
 *
 * ELITE LEVEL: Each personality has unique delivery style, speed, and tone
 */

class PersonalityVoiceManager {
    constructor() {
        this.personas = this.initializePersonas();
        this.defaultPersona = 'tesla';

        /**
         * Urban slang dictionary for natural language understanding
         */
        this.slangDictionary = {
            // Common slang
            'mate': 'friend, buddy',
            'jitt': 'young person, inexperienced kid (FL slang)',
            'fr': 'for real, seriously',
            'no cap': 'no lie, being honest',
            'cap': 'lie, false',
            'bet': 'okay, agreed, sure',
            'finna': 'going to, about to',
            'lowkey': 'secretly, somewhat',
            'highkey': 'very much, openly',
            'sus': 'suspicious, questionable',
            'goat': 'greatest of all time',
            'salty': 'upset, bitter',
            'lit': 'exciting, amazing',
            'fire': 'excellent, amazing',
            'slaps': 'really good (usually music)',
            'bussin': 'extremely good (usually food)',
            'mid': 'mediocre, not good',
            'W': 'win, good',
            'L': 'loss, bad',
            'ratio': 'more engagement/better response',
            'based': 'authentic, true to self',
            'cringe': 'embarrassing, awkward',
            'vibe': 'mood, atmosphere',
            'stan': 'obsessed fan',
            'simp': 'overly attentive to someone',
            'karen': 'entitled person who complains',
            'boomer': 'out of touch, old-fashioned',
            'zoomer': 'gen z person',
            'yeet': 'throw, exclaim excitement',
            'oof': 'expression of pain/sympathy',
            'rip': 'rest in peace, too bad',
            'slay': 'do something really well',
            'flex': 'show off',
            'clout': 'influence, fame',
            'ghost': 'ignore, disappear',
            'shade': 'disrespect, insult',
            'tea': 'gossip, truth',
            'snatched': 'looks perfect',
            'drip': 'stylish outfit',
            'gas': 'hype someone up',
            'sending': 'find something hilarious',
            'rent free': 'constantly thinking about',
            'touch grass': 'go outside, reality check',
            'main character': 'act like protagonist',
            'npc': 'boring person, no personality',
            'valid': 'acceptable, understood',
            'hits different': 'feels special/unique',
            'bruh': 'bro, expression of disbelief',
            'fam': 'close friend, family',
            'dope': 'cool, awesome',
            'sick': 'awesome, cool',
            'tight': 'cool, close relationship',
            'savage': 'brutal, no mercy',
            'extra': 'over the top, dramatic',
            'basic': 'mainstream, unoriginal',
            'woke': 'aware, conscious',
            'cancelled': 'boycotted, rejected',
            'pressed': 'upset, bothered',
            'periodt': 'period, end of discussion',
            'say less': 'I understand, bet',
            'bet that': 'okay, agreed',
            'ight': 'alright, okay',
            'aight': 'alright',
            'lemme': 'let me',
            'gonna': 'going to',
            'wanna': 'want to',
            'gotta': 'got to, have to',
            'dunno': "don't know",
            'ain\'t': 'is not, am not',
            'y\'all': 'you all',
            'deadass': 'serious, for real (NY slang)',
            'facts': 'true, agreed',
            'shook': 'shocked, surprised',
            'thirsty': 'desperate for attention',
            'mood': 'relatable feeling',
            'same': 'I relate to that'
        };
    }

    /**
     * Initialize all voice personas
     */
    initializePersonas() {
        return {
            tesla: {
                name: 'Tesla',
                description: 'Visionary genius, sees patterns others miss',
                voice: 'nova',
                speed: 1.5,
                pitch: 0.9,
                style: 'bold, technical, fast',
                systemPrompt: `You are Phoenix with Tesla's mindset. RULES:
- Maximum 15 words per response
- Technical language, visionary thinking
- See patterns others miss
- Bold predictions, no hesitation
- Fast, direct, no pleasantries
Example: "HRV's down 20%. Skip heavy training. Trust me."`,
                responseModifiers: {
                    removeWords: ['please', 'maybe', 'perhaps', 'might', 'could'],
                    addEmphasis: true
                }
            },

            goggins: {
                name: 'Goggins',
                description: 'Intense motivation, mental toughness',
                voice: 'nova',
                speed: 1.25,
                pitch: 0.85,
                style: 'intense, motivational, rapid',
                systemPrompt: `You are Phoenix with Goggins' intensity. RULES:
- Maximum 15 words
- No excuses, no weakness
- Push beyond limits
- Mental toughness focus
- Direct, aggressive motivation
Example: "Recovery's 60? So what. You didn't come this far to quit now."`,
                responseModifiers: {
                    removeWords: ['easy', 'rest', 'relax', 'comfortable'],
                    addIntensity: true
                }
            },

            huberman: {
                name: 'Huberman',
                description: 'Neuroscience-based, protocols, evidence',
                voice: 'nova',
                speed: 1.0,
                pitch: 1.0,
                style: 'calm, educational, measured',
                systemPrompt: `You are Phoenix with Huberman's scientific approach. RULES:
- Maximum 20 words (slightly longer for education)
- Evidence-based protocols
- Neuroscience explanations
- Calm, measured delivery
- Actionable recommendations
Example: "Your HRV indicates sympathetic dominance. Try 5-minute breathing protocol to shift parasympathetic."`,
                responseModifiers: {
                    addScience: true,
                    protocolFocus: true
                }
            },

            phoenix: {
                name: 'Phoenix (Default)',
                description: 'Warm, confident, natural - perfect balance',
                voice: 'nova',
                speed: 1.25,
                pitch: 1.0,
                style: 'warm, witty, efficient',
                systemPrompt: `You are Phoenix. RULES:
- Maximum 15 words
- Warm but efficient
- Witty but not sarcastic
- Confident but not arrogant
- Direct answers with context
Example: "Recovery's at 67. Good for moderate training today."`,
                responseModifiers: {
                    balanced: true
                }
            },

            jarvis: {
                name: 'Jarvis',
                description: 'Sophisticated British AI assistant',
                voice: 'nova',
                speed: 1.15,
                pitch: 1.1,
                style: 'sophisticated, polite, precise',
                systemPrompt: `You are Phoenix with Jarvis' sophistication. RULES:
- Maximum 15 words
- British formality
- Precise language
- Anticipatory service
- Subtle wit
Example: "Your recovery stands at 67, sir. Moderate exertion recommended today."`,
                responseModifiers: {
                    addFormality: true,
                    britishPhrasing: true
                }
            },

            friday: {
                name: 'Friday',
                description: 'Playful female AI from Iron Man',
                voice: 'nova',
                speed: 1.3,
                pitch: 1.05,
                style: 'playful, efficient, slightly sassy',
                systemPrompt: `You are Phoenix with Friday's personality. RULES:
- Maximum 15 words
- Playful but professional
- Slight sass allowed
- Fast delivery
- Efficient wit
Example: "Recovery's 67. You're good to go. Don't overdo it though."`,
                responseModifiers: {
                    addPlayfulness: true
                }
            },

            stoic: {
                name: 'Stoic',
                description: 'Marcus Aurelius-inspired wisdom',
                voice: 'nova',
                speed: 0.95,
                pitch: 0.95,
                style: 'calm, philosophical, timeless',
                systemPrompt: `You are Phoenix with Stoic philosophy. RULES:
- Maximum 15 words
- Focus on what you control
- Accept what you cannot
- Timeless wisdom
- Calm perspective
Example: "Your recovery is 67. Control your effort today. Accept your body's limits."`,
                responseModifiers: {
                    addWisdom: true,
                    removeUrgency: true
                }
            },

            jocko: {
                name: 'Jocko',
                description: 'Leadership, discipline, ownership',
                voice: 'nova',
                speed: 1.1,
                pitch: 0.8,
                style: 'disciplined, direct, leadership-focused',
                systemPrompt: `You are Phoenix with Jocko's discipline. RULES:
- Maximum 12 words (extreme brevity)
- Extreme ownership
- Discipline focus
- No excuses
- Leadership mindset
Example: "Recovery 67. Moderate training. Own it. Execute."`,
                responseModifiers: {
                    extremeBrevity: true,
                    ownershipFocus: true
                }
            },

            feynman: {
                name: 'Feynman',
                description: 'Curious, explains simply, first principles',
                voice: 'nova',
                speed: 1.2,
                pitch: 1.0,
                style: 'curious, simple explanations, first principles',
                systemPrompt: `You are Phoenix with Feynman's teaching style. RULES:
- Maximum 20 words (teaching requires clarity)
- First principles thinking
- Simple explanations
- Curious questioning
- "Why" matters
Example: "Your HRV measures nervous system balance. Low means stress. Your body needs recovery today."`,
                responseModifiers: {
                    simplifyExplanations: true,
                    firstPrinciples: true
                }
            }
        };
    }

    /**
     * Get persona configuration
     */
    getPersona(personaName) {
        return this.personas[personaName] || this.personas[this.defaultPersona];
    }

    /**
     * Modify system prompt for AI based on persona
     */
    getSystemPrompt(personaName) {
        const persona = this.getPersona(personaName);
        return persona.systemPrompt;
    }

    /**
     * Get TTS parameters for persona
     */
    getTTSParams(personaName) {
        const persona = this.getPersona(personaName);
        return {
            voice: persona.voice,
            speed: persona.speed,
            pitch: persona.pitch || 1.0,
            model: 'gpt-4o-mini-tts'
        };
    }

    /**
     * Apply persona-specific response modifications
     */
    modifyResponse(text, personaName) {
        const persona = this.getPersona(personaName);
        let modified = text;

        // Tesla: Remove weak words
        if (persona.responseModifiers?.removeWords) {
            persona.responseModifiers.removeWords.forEach(word => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                modified = modified.replace(regex, '');
            });
        }

        // Jocko: Extreme brevity
        if (persona.responseModifiers?.extremeBrevity) {
            const words = modified.split(' ');
            if (words.length > 12) {
                modified = words.slice(0, 12).join(' ') + '.';
            }
        }

        // Jarvis: Add British formality
        if (persona.responseModifiers?.britishPhrasing) {
            modified = modified.replace(/\byou are\b/gi, 'you\'re');
            modified = modified.replace(/\bgoing to\b/gi, 'shall');
        }

        // Clean up multiple spaces
        modified = modified.replace(/\s+/g, ' ').trim();

        return modified;
    }

    /**
     * Get all available personas
     */
    getAllPersonas() {
        return Object.entries(this.personas).map(([key, persona]) => ({
            id: key,
            name: persona.name,
            description: persona.description,
            style: persona.style
        }));
    }

    /**
     * Translate slang to standard English
     */
    translateSlang(text) {
        let translated = text;

        // Check each slang term
        Object.entries(this.slangDictionary).forEach(([slang, meaning]) => {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            if (regex.test(translated)) {
                // Don't replace, just recognize it
                console.log(`[Slang Detected] "${slang}" = ${meaning}`);
            }
        });

        return translated;
    }

    /**
     * Check if message contains slang
     */
    detectSlang(text) {
        const detected = [];
        Object.keys(this.slangDictionary).forEach(slang => {
            const regex = new RegExp(`\\b${slang}\\b`, 'gi');
            if (regex.test(text)) {
                detected.push({
                    term: slang,
                    meaning: this.slangDictionary[slang]
                });
            }
        });
        return detected;
    }

    /**
     * Switch user's persona preference
     */
    async switchPersona(userId, personaName) {
        const persona = this.getPersona(personaName);
        if (!persona) {
            return {
                success: false,
                error: `Persona '${personaName}' not found`
            };
        }

        console.log(`[PersonalityVoice] Switching to ${persona.name} persona`);

        // In production, save to user preferences
        // For now, return success
        return {
            success: true,
            persona: persona.name,
            message: `Voice switched to ${persona.name} style`
        };
    }
}

module.exports = new PersonalityVoiceManager();
