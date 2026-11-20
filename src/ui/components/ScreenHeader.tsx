import type { ReactNode } from 'react';
import { t } from '@/i18n';

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <header className="screen-header">
      {onBack && (
        <button className="btn btn-ghost" onClick={onBack} aria-label={t('common.back')}>
          <span aria-hidden="true">←</span>
        </button>
      )}
      <h1 style={{ flex: 1 }}>{title}</h1>
      {right}
    </header>
  );
}
