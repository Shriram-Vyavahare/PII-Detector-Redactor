import React, { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';
import './ChatInterface.css';

const ChatInterface = ({ isOpen, theme, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversationId);

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        role: 'error',
        content: err.message || 'Failed to send message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className={`chat-interface ${theme}`}>
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-avatar">🤖</div>
          <div>
            <h3>AI Assistant</h3>
            <p>Ask me anything!</p>
          </div>
        </div>
        <div className="chat-actions">
          <button 
            className="clear-button" 
            onClick={clearChat}
            title="Clear conversation"
            disabled={messages.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="close-button" 
            onClick={onClose}
            title="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-avatar">👋</div>
            <div className="welcome-text">
              <h4>Welcome! I'm your AI assistant.</h4>
              <p>I can help you with questions about technology, programming, data privacy, or any other topic. What would you like to know?</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : message.role === 'error' ? '⚠️' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={sendMessage} 
        disabled={isLoading}
        theme={theme}
      />
    </div>
  );
};

export default ChatInterface;