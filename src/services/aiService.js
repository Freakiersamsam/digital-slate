import OpenAI from 'openai';

class AIService {
  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  // Initialize OpenAI client
  init() {
    // SECURITY WARNING: This is for development only!
    // In production, ALL AI calls should go through a backend proxy
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
      return;
    }

    if (import.meta.env.PROD) {
      console.error('SECURITY ERROR: OpenAI API key should not be in production frontend!');
      console.error('Implement backend proxy for AI features in production.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // WARNING: DEVELOPMENT ONLY!
    });
    this.initialized = true;
  }

  // Clean up and organize notes
  async cleanupNotes(notes, sessionMetadata = {}) {
    if (!this.initialized) {
      throw new Error('AI service not initialized');
    }

    // Security: Validate and sanitize input
    if (!Array.isArray(notes)) {
      throw new Error('Notes must be an array');
    }

    if (notes.length > 100) {
      throw new Error('Too many notes to process at once (max 100)');
    }

    try {
      // Group notes by time proximity (within 30 seconds)
      const groupedNotes = this.groupNotesByTimeProximity(notes, 30000);
      
      // Prepare context for AI
      const context = this.buildContext(sessionMetadata);
      
      // Process each group
      const cleanedGroups = await Promise.all(
        groupedNotes.map(group => this.processNoteGroup(group, context))
      );

      return {
        original: notes,
        cleaned: cleanedGroups.flat(),
        summary: await this.generateSessionSummary(cleanedGroups, context),
        categories: this.extractCategories(cleanedGroups.flat()),
        actionItems: this.extractActionItems(cleanedGroups.flat())
      };
    } catch (error) {
      console.error('Error cleaning up notes:', error);
      throw error;
    }
  }

  // Group notes by time proximity
  groupNotesByTimeProximity(notes, threshold = 30000) {
    const groups = [];
    let currentGroup = [];
    
    const sortedNotes = [...notes].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedNotes.forEach((note, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(note);
      } else {
        const lastNote = currentGroup[currentGroup.length - 1];
        if (note.timestamp - lastNote.timestamp <= threshold) {
          currentGroup.push(note);
        } else {
          groups.push(currentGroup);
          currentGroup = [note];
        }
      }
      
      if (index === sortedNotes.length - 1 && currentGroup.length > 0) {
        groups.push(currentGroup);
      }
    });
    
    return groups;
  }

  // Process a group of related notes
  async processNoteGroup(noteGroup, context) {
    if (!this.openai) return noteGroup;

    try {
      const prompt = this.buildCleanupPrompt(noteGroup, context);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional video production assistant helping to organize and clean up notes taken during filming. 
            Your task is to:
            1. Combine related notes into coherent thoughts
            2. Fix typos and grammar
            3. Preserve all technical details and timestamps
            4. Categorize notes appropriately
            5. Maintain the original meaning and context
            6. Keep all specific names, numbers, and technical terms
            Output format should be JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      // Merge AI suggestions with original timestamps
      return noteGroup.map((note, index) => ({
        ...note,
        aiSummary: result.notes?.[index]?.summary || note.text,
        aiCategory: result.notes?.[index]?.category || note.category,
        aiTags: result.notes?.[index]?.tags || note.tags,
        cleaned: true
      }));
    } catch (error) {
      console.error('Error processing note group:', error);
      return noteGroup; // Return original if AI fails
    }
  }

  // Build cleanup prompt
  buildCleanupPrompt(noteGroup, context) {
    const notesText = noteGroup.map((note, index) => 
      `[${index}] (${note.timecodeIn}${note.userName ? ` by ${note.userName}` : ''}): ${note.text}`
    ).join('\n');

    return `Context:
Production: ${context.production || 'Unknown'}
Scene: ${context.scene || 'N/A'}
Take: ${context.take || 'N/A'}

Notes to clean up:
${notesText}

Please analyze these notes and return a JSON object with the following structure:
{
  "notes": [
    {
      "index": 0,
      "summary": "cleaned and organized version of the note",
      "category": "director|script|camera|sound|continuity|vfx|general",
      "tags": ["relevant", "tags"]
    }
  ]
}

Preserve all specific details, names, and technical information. Combine only if notes are clearly related.`;
  }

  // Generate session summary
  async generateSessionSummary(cleanedGroups, context) {
    if (!this.openai || cleanedGroups.length === 0) return '';

    try {
      const allNotes = cleanedGroups.flat();
      const notesSummary = allNotes
        .map(note => note.aiSummary || note.text)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a professional video production assistant. Create a concise summary of the filming session based on the notes provided.'
          },
          {
            role: 'user',
            content: `Production: ${context.production || 'Unknown'}
Scene: ${context.scene || 'N/A'}
Total notes: ${allNotes.length}

Notes:
${notesSummary}

Please provide a brief summary of this filming session, highlighting key decisions, issues, and notable moments.`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  // Extract action items from notes
  extractActionItems(notes) {
    const actionKeywords = [
      'todo', 'to do', 'action', 'follow up', 'follow-up', 
      'need to', 'needs to', 'must', 'should', 'will',
      'fix', 'change', 'update', 'review', 'check'
    ];

    return notes.filter(note => {
      const text = (note.aiSummary || note.text).toLowerCase();
      return actionKeywords.some(keyword => text.includes(keyword));
    }).map(note => ({
      text: note.aiSummary || note.text,
      timecode: note.timecodeIn,
      user: note.userName,
      category: note.aiCategory || note.category
    }));
  }

  // Extract unique categories
  extractCategories(notes) {
    const categories = new Set();
    notes.forEach(note => {
      if (note.aiCategory) categories.add(note.aiCategory);
      if (note.category) categories.add(note.category);
    });
    return Array.from(categories);
  }

  // Build context object
  buildContext(metadata) {
    return {
      production: metadata.production,
      scene: metadata.scene,
      take: metadata.take,
      director: metadata.director,
      camera: metadata.camera,
      dop: metadata.dop,
      created: metadata.created,
      syncTime: metadata.syncTime
    };
  }

  // Process notes in real-time (for suggestions)
  async getSuggestions(currentText, recentNotes = []) {
    if (!this.initialized || !currentText || currentText.length < 10) {
      return null;
    }

    try {
      const prompt = `Current note being typed: "${currentText}"
      
Recent notes: ${recentNotes.slice(-3).map(n => n.text).join('; ')}

Suggest: 1) likely completion, 2) relevant category, 3) relevant tags (max 3).
Return as JSON: { "completion": "...", "category": "...", "tags": ["..."] }`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for video production note-taking.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 100
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return null;
    }
  }

  // Categorize a single note
  async categorizeNote(noteText) {
    const categories = {
      director: ['performance', 'acting', 'emotion', 'direction', 'blocking'],
      script: ['dialogue', 'lines', 'script', 'story', 'plot'],
      camera: ['shot', 'frame', 'lens', 'focus', 'camera', 'angle'],
      sound: ['audio', 'sound', 'noise', 'mic', 'boom'],
      continuity: ['continuity', 'match', 'props', 'wardrobe', 'makeup'],
      vfx: ['vfx', 'visual effects', 'green screen', 'cgi', 'composite'],
      general: []
    };

    const lowerText = noteText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
}

export default new AIService();