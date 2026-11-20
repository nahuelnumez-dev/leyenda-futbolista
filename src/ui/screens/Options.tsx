import { useState } from 'react';
import { t } from '@/i18n';
import type { Settings } from '@/persistence/settings';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { ConfirmDialog } from '../components/Modal';

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Options() {
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const settings = useUi((s) => s.settings);
  const update = useUi((s) => s.updateSettings);
  const resetSettings = useUi((s) => s.resetSettings);
  const wipeAll = useGame((s) => s.wipeAll);
  const [confirm, setConfirm] = useState(false);

  const toggle = (key: keyof Settings, label: string) => (
    <label className="toggle">
      <span>{label}</span>
      <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => update({ [key]: e.target.checked })} />
    </label>
  );

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <ScreenHeader title={t('options.title')} onBack={() => goTo('mainMenu')} />

      <section className="card">
        <div className="toggle">
          <span>{t('options.textScale')}</span>
          <Segmented
            label={t('options.textScale')}
            value={settings.textScale}
            onChange={(v) => update({ textScale: v })}
            options={[
              { value: 'normal', label: t('options.textNormal') },
              { value: 'large', label: t('options.textLarge') },
              { value: 'xlarge', label: t('options.textXLarge') },
            ]}
          />
        </div>
        <div className="toggle">
          <span>{t('options.cinematics')}</span>
          <Segmented
            label={t('options.cinematics')}
            value={settings.cinematics}
            onChange={(v) => update({ cinematics: v })}
            options={[
              { value: 'all', label: t('options.cinAll') },
              { value: 'important', label: t('options.cinImportant') },
              { value: 'off', label: t('options.cinOff') },
            ]}
          />
        </div>
        {toggle('reduceMotion', t('options.reduceMotion'))}
        {toggle('sound', t('options.sound'))}
        {toggle('ironManDefault', t('options.ironManDefault'))}
        <div className="toggle">
          <span>{t('options.language')}</span>
          <span className="muted">Español</span>
        </div>
        {toggle('debug', t('options.debug'))}
      </section>

      <section>
        <button className="btn btn-danger" onClick={() => setConfirm(true)}>
          {t('options.resetAll')}
        </button>
      </section>

      <ConfirmDialog
        open={confirm}
        title={t('options.resetAll')}
        message={t('options.confirmReset')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          wipeAll();
          resetSettings();
          setConfirm(false);
          toast(t('options.resetDone'));
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
