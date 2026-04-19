const express = require("express");
const ChatService = require("../services/chatService");
const router = express.Router();

// Initialize chat service
const chatService = new ChatService();

// Middleware for JSON parsing (already handled by Express, but explicit for chat routes)
router.use(express.json({ limit: '10mb' }));

// Middleware for request validation
const validateChatMessage = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: "Message is required and must be a string",
      code: "VALIDATION_ERROR"
    });
  }
  
  if (message.trim().length === 0) {
    return res.status(400).json({
      error: "Message cannot be empty",
      code: "VALIDATION_ERROR"
    });
  }
  
  if (message.length > parseInt(process.env.CHAT_MESSAGE_MAX_LENGTH || 2000)) {
    return res.status(400).json({
      error: "Message is too long. Please shorten your message and try again.",
      code: "VALIDATION_ERROR"
    });
  }
  
  next();
};

// Chat message endpoint
router.post("/message", validateChatMessage, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    const result = await chatService.processMessage(message, conversationId);
    
    if (result.error) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error("Chat message error:", error.message);
    res.status(500).json({
      error: "Chat service is temporarily unavailable. Please try again later.",
      code: "CHAT_SERVICE_ERROR",
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const health = await chatService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Chat health check error:", error.message);
    res.status(500).json({
      status: "unhealthy",
      groqApiStatus: "unavailable",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;