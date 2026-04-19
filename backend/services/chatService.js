const GroqService = require('./groqService');

class ChatService {
  constructor() {
    try {
      this.groqService = new GroqService();
    } catch (error) {
      console.error('Failed to initialize Groq service:', error.message);
      this.groqService = null;
    }
    this.conversations = new Map(); // In-memory storage for session-only conversations
    this.historyLimit = parseInt(process.env.CHAT_HISTORY_LIMIT || "50");
    this.messageMaxLength = parseInt(process.env.CHAT_MESSAGE_MAX_LENGTH || "2000");
  }

  // Sanitize user input to prevent XSS and other security issues
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate message content and length
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { isValid: false, error: 'Message must be a non-empty string' };
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > this.messageMaxLength) {
      return { isValid: false, error: `Message is too long. Maximum length is ${this.messageMaxLength} characters.` };
    }

    return { isValid: true };
  }

  // Get or create conversation
  getConversation(conversationId) {
    if (!conversationId) {
      conversationId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }

    return this.conversations.get(conversationId);
  }

  // Add message to conversation history
  addMessageToHistory(conversationId, role, content) {
    const conversation = this.getConversation(conversationId);
    
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role,
      content: content,
      timestamp: new Date()
    };

    conversation.messages.push(message);
    conversation.lastActivity = new Date();

    // Limit conversation history
    if (conversation.messages.length > this.historyLimit) {
      conversation.messages = conversation.messages.slice(-this.historyLimit);
    }

    return message;
  }

  // Get conversation history formatted for Groq API
  getFormattedHistory(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Process chat message
  async processMessage(userMessage, conversationId = null) {
    try {
      // Check if Groq service is available
      if (!this.groqService) {
        throw new Error('AI service is not configured. Please add GROQ_API_KEY to your .env file.');
      }

      // Validate message
      const validation = this.validateMessage(userMessage);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Sanitize input
      const sanitizedMessage = this.sanitizeInput(userMessage);
      
      // Get or create conversation
      const conversation = this.getConversation(conversationId);
      
      // Add user message to history
      this.addMessageToHistory(conversation.id, 'user', sanitizedMessage);
      
      // Get conversation history for context
      const history = this.getFormattedHistory(conversation.id);
      
      // Send to Groq API
      const result = await this.groqService.sendMessage(sanitizedMessage, history.slice(0, -1)); // Exclude current message
      
      // Add assistant response to history
      this.addMessageToHistory(conversation.id, 'assistant', result.response);
      
      return {
        response: result.response,
        conversationId: conversation.id,
        timestamp: new Date().toISOString(),
        usage: result.usage
      };

    } catch (error) {
      console.error('Chat service error:', error.message);
      
      // Return user-friendly error messages
      return {
        error: error.message || 'Unable to process your message. Please try again.',
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.groqService) {
        return {
          status: 'unhealthy',
          groqApiStatus: 'unavailable',
          error: 'Groq service not initialized',
          timestamp: new Date().toISOString()
        };
      }
      
      const groqHealth = await this.groqService.healthCheck();
      return {
        status: groqHealth.available ? 'healthy' : 'unhealthy',
        groqApiStatus: groqHealth.available ? 'available' : 'unavailable',
        activeConversations: this.conversations.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        groqApiStatus: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clean up old conversations (optional - for memory management)
  cleanupOldConversations(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < cutoffTime) {
        this.conversations.delete(id);
      }
    }
  }
}

module.exports = ChatService;