import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './ui/theme/global.css';
import './ui/theme/menu.css';
import './ui/theme/creation.css';
import './ui/theme/hub.css';
import './ui/theme/charts.css';
import './ui/theme/cinematics.css';
import './ui/theme/legacy.css';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
