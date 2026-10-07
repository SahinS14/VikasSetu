import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import App from './App';
import { VikasSetuPreloader } from './components/common/VikasSetuPreloader';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <VikasSetuPreloader>
        <App />
      </VikasSetuPreloader>
    </AppProvider>
  </React.StrictMode>,
);
