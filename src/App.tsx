import React from 'react';
import { CartPilot } from './components/CartPilot';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <CartPilot />
    </ErrorBoundary>
  );
}

export default App;
