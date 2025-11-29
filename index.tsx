import './index.css'; // Theme CSS - must be first!
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { StoryProvider } from './contexts/StoryContext';

import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <StoryProvider>
          <App />
        </StoryProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);