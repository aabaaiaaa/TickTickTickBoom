import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupConsoleCapture } from './utils/consoleCapture.ts';

// Setup console capture for TestBoardBed integration
setupConsoleCapture();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
