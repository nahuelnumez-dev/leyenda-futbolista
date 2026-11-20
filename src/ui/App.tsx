import { Suspense, lazy, useEffect, type ComponentType } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useUi, type ScreenId } from '@/store/uiStore';
import { MainMenu } from './screens/MainMenu';
import { Options } from './screens/Options';

// Carga diferida: el menú principal arranca sin descargar el resto de pantallas.
const NewCareer = lazy(() => import('./screens/NewCareer').then((m) => ({ default: m.NewCareer })));
const SeasonHub = lazy(() => import('./screens/SeasonHub').then((m) => ({ default: m.SeasonHub })));
const LoadScreen = lazy(() => import('./screens/LoadScreen').then((m) => ({ default: m.LoadScreen })));
const HallOfFame = lazy(() => import('./screens/HallOfFame').then((m) => ({ default: m.HallOfFame })));
const DebugScreen = lazy(() => import('./screens/DebugScreen').then((m) => ({ default: m.DebugScreen })));
const ClubsScreen = lazy(() => import('./screens/ClubsScreen').then((m) => ({ default: m.ClubsScreen })));
const CareerEnd = lazy(() => import('./screens/CareerEnd').then((m) => ({ default: m.CareerEnd })));
import { Toasts } from './components/Toasts';

const SCREENS: Record<ScreenId, ComponentType> = {
  mainMenu: MainMenu,
  newCareer: NewCareer,
  hub: SeasonHub,
  load: LoadScreen,
  hallOfFame: HallOfFame,
  options: Options,
  debug: DebugScreen,
  clubs: ClubsScreen,
  careerEnd: CareerEnd,
};

export function App() {
  const screen = useUi((s) => s.screen);
  const settings = useUi((s) => s.settings);
  const Screen = SCREENS[screen];

  // Ajustes de accesibilidad aplicados al documento.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textScale = settings.textScale;
    root.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings.textScale, settings.reduceMotion]);

  // Al cambiar de pantalla, el foco va al contenido principal (navegación por teclado y lectores).
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [screen]);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'user'}>
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={screen}
          tabIndex={-1}
          style={{ minHeight: '100%', outline: 'none' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          <Suspense fallback={<p className="screen muted" role="status">Cargando…</p>}>
            <Screen />
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Toasts />
    </MotionConfig>
  );
}
