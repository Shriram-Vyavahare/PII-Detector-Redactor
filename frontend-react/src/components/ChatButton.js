import React from 'react';
import './ChatButton.css';

const ChatButton = ({ isOpen, onClick, theme }) => {
  return (
    <button
      className={`chat-button ${isOpen ? 'open' : ''} ${theme}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title={isOpen ? 'Close chat' : 'Open AI assistant'}
    >
      {isOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
};

export default ChatButton;