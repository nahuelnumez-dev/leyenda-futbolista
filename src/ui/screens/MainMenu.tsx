import { motion } from 'framer-motion';
import { t } from '@/i18n';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import type { SlotMeta } from '@/persistence/slots';
import { errorMessage } from '../errors';
import { PitchBackdrop } from '../components/PitchBackdrop';
import { Modal } from '../components/Modal';
import { useState } from 'react';
import { WORLD } from '@/data';

function mostRecent(metas: (SlotMeta | null)[]): SlotMeta | null {
  return (
    metas
      .filter((m): m is SlotMeta => m !== null && !m.retired)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null
  );
}

export function MainMenu() {
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const debug = useUi((s) => s.settings.debug);
  const slots = useGame((s) => s.slots);
  const continueLatest = useGame((s) => s.continueLatest);
  const latest = mostRecent(Object.values(slots));
  const [help, setHelp] = useState(false);

  const onContinue = () => {
    try {
      if (continueLatest()) goTo('hub');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const items: { label: string; hint?: string; onClick: () => void; primary?: boolean; disabled?: boolean }[] = [
    ...(latest
      ? [
          {
            label: t('menu.continue'),
            hint: t('menu.continueHint', { name: latest.playerName, season: latest.seasonLabel }),
            onClick: onContinue,
            primary: true,
          },
        ]
      : []),
    { label: t('menu.newCareer'), onClick: () => goTo('newCareer'), primary: !latest },
    { label: t('menu.load'), onClick: () => goTo('load') },
    { label: t('menu.hallOfFame'), onClick: () => goTo('hallOfFame') },
    {
      label: t('menu.clubs'),
      hint: t('menu.clubsHint', { clubs: WORLD.clubById.size, countries: WORLD.leagues.length }),
      onClick: () => goTo('clubs'),
    },
    { label: t('menu.howTo'), onClick: () => setHelp(true) },
    { label: t('menu.options'), onClick: () => goTo('options') },
    ...(debug ? [{ label: t('menu.debug'), onClick: () => goTo('debug') }] : []),
  ];

  return (
    <div className="main-menu">
      <PitchBackdrop />
      <div className="main-menu-inner">
        <motion.div
          className="logo"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className="logo-star" aria-hidden="true">★</span>
          <h1 className="logo-title">{t('app.title')}</h1>
          <p className="logo-sub">{t('app.subtitle')}</p>
        </motion.div>

        <nav className="menu-list" aria-label="Menú principal">
          {items.map((item, i) => (
            <motion.button
              key={item.label}
              className={`menu-item ${item.primary ? 'menu-item-primary' : ''}`}
              onClick={item.onClick}
              disabled={item.disabled}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
            >
              <span>{item.label}</span>
              {item.hint && <span className="menu-item-hint">{item.hint}</span>}
            </motion.button>
          ))}
        </nav>

        <Modal open={help} title={t('help.title')} onClose={() => setHelp(false)} actions={<button className="btn btn-primary" onClick={() => setHelp(false)}>{t('common.close')}</button>}>
          <ol className="help-list">
            {(['create', 'season', 'decide', 'market', 'grow', 'legacy'] as const).map((k) => (
              <li key={k}>
                <strong>{t(`help.${k}.title`)}</strong> {t(`help.${k}.text`)}
              </li>
            ))}
          </ol>
        </Modal>

        <p className="menu-footer faint small">
          {t('menu.footer')} · {t('app.version', { version: __APP_VERSION__ })}
        </p>
      </div>
    </div>
  );
}
