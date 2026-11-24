import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './ui/theme/quick.css';
import { QuickApp } from './ui/quick/QuickApp';
import { loadCrestPack } from './ui/components/crestUrl';

void loadCrestPack().then(() =>
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuickApp />
  </StrictMode>,
  ),
);
