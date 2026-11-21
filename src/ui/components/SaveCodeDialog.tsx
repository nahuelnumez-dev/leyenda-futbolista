/** Muestra el código de partida para copiarlo (portapapeles o selección manual en iPhone). */
import { useRef, useState } from 'react';
import { t } from '@/i18n';
import { Modal } from './Modal';

export function SaveCodeDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const selectAll = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(0, el.value.length);
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Sin permiso de portapapeles: se selecciona el texto para que el jugador use «Copiar».
      selectAll();
    }
  };

  return (
    <Modal
      open={code !== null}
      title={t('saveCode.title')}
      onClose={() => {
        setCopied(false);
        onClose();
      }}
      actions={
        <>
          <button className="btn" onClick={onClose}>
            {t('common.close')}
          </button>
          <button className="btn btn-primary" onClick={() => void copy()}>
            {copied ? t('saveCode.copied') : t('saveCode.copy')}
          </button>
        </>
      }
    >
      <p className="muted small">{t('saveCode.hint')}</p>
      <textarea ref={ref} className="input save-code" readOnly value={code ?? ''} rows={5} onFocus={selectAll} aria-label={t('saveCode.title')} />
      <p className="faint small">{t('saveCode.size', { kb: Math.max(1, Math.round((code?.length ?? 0) / 1024)) })}</p>
    </Modal>
  );
}
