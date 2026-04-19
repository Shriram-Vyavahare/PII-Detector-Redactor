const Groq = require("groq-sdk").default;

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
    this.temperature = parseFloat(process.env.GROQ_TEMPERATURE || "0.7");
    this.maxTokens = parseInt(process.env.GROQ_MAX_TOKENS || "1024");
    
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is required but not found in environment variables");
    }
    
    this.client = new Groq({
      apiKey: this.apiKey,
    });
    
    this.systemPrompt = `You are a helpful AI assistant. You provide clear, accurate, and educational responses on a wide range of topics. You are knowledgeable about technology, science, programming, and general topics. When discussing data privacy concepts like PII (Personally Identifiable Information), provide educational explanations with examples. You do not have access to any specific project data or context - you are a general-purpose assistant.`;
  }

  async sendMessage(userMessage, conversationHistory = []) {
    try {
      // Prepare messages array with system prompt and conversation history
      const messages = [
        {
          role: "system",
          content: this.systemPrompt
        }
      ];
      
      // Add conversation history (limited by context window)
      const contextWindow = parseInt(process.env.CHAT_CONTEXT_WINDOW || "10");
      const recentHistory = conversationHistory.slice(-contextWindow);
      messages.push(...recentHistory);
      
      // Add current user message
      messages.push({
        role: "user",
        content: userMessage
      });

      const completion = await this.client.chat.completions.create({
        messages: messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error("No response received from Groq API");
      }

      return {
        response: completion.choices[0].message.content,
        usage: completion.usage
      };

    } catch (error) {
      console.error("Groq API error:", error.message);
      
      // Transform API errors into user-friendly messages
      if (error.status === 401) {
        throw new Error("Authentication failed. Please check API configuration.");
      } else if (error.status === 429) {
        throw new Error("Too many requests. Please wait a moment before sending another message.");
      } else if (error.status >= 500) {
        throw new Error("Chat service is temporarily unavailable. Please try again later.");
      } else {
        throw new Error("Unable to process your message. Please try again.");
      }
    }
  }

  async healthCheck() {
    try {
      // Simple health check by sending a minimal request
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Hello"
          }
        ],
        model: this.model,
        temperature: 0.1,
        max_tokens: 10,
      });

      return {
        status: "healthy",
        model: this.model,
        available: true
      };
    } catch (error) {
      console.error("Groq health check failed:", error.message);
      return {
        status: "unhealthy",
        model: this.model,
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = GroqService;