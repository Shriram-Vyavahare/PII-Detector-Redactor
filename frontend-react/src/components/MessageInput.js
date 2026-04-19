import React, { useState, useRef } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, disabled, theme }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const maxLength = 2000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars < 100;

  return (
    <div className={`message-input-container ${theme}`}>
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            className="message-textarea"
            rows="1"
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="send-button"
            title="Send message"
          >
            {disabled ? (
              <div className="loading-spinner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
              </div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        
        {isNearLimit && (
          <div className="character-count">
            <span className={remainingChars < 50 ? 'warning' : ''}>
              {remainingChars} characters remaining
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;