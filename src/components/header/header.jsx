// Header.jsx
import React from 'react';
import './Header.css';

function Header({ currentView, setCurrentView }) {
  return (
    <div className="header">
      <button
        className={currentView === 'chatbot' ? 'active' : ''}
        onClick={() => setCurrentView('chatbot')}
      >
        Chatbot
      </button>
      <button
        className={currentView === 'dashboard' ? 'active' : ''}
        onClick={() => setCurrentView('dashboard')}
      >
        Dashboard
      </button>
    </div>
  );
}

export default Header;
