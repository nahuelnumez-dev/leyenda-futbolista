import { useRef, useState } from 'react';
import { t } from '@/i18n';
import {
  SLOT_IDS,
  loadFromSlot,
  exportCode,
  exportGame,
  exportFileName,
  importGame,
  type SlotId,
  type SlotMeta,
} from '@/persistence/slots';
import { getBrowserStorage } from '@/persistence/storage';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { ConfirmDialog } from '../components/Modal';
import { downloadText, readFileText } from '../download';
import { SaveCodeDialog } from '../components/SaveCodeDialog';
import { errorMessage } from '../errors';

const dateFmt = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

interface PendingImport {
  json: string;
  slot: SlotId;
}

function slotName(id: SlotId): string {
  return id === 'auto' ? t('load.slotAuto') : t('load.slot', { n: id });
}

export function LoadScreen() {
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const slots = useGame((s) => s.slots);
  const loadSlot = useGame((s) => s.loadSlot);
  const removeSlot = useGame((s) => s.deleteSlot);
  const importInto = useGame((s) => s.importInto);

  const [toDelete, setToDelete] = useState<SlotMeta | null>(null);
  const [importSlot, setImportSlot] = useState<SlotId>('1');
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saveCode, setSaveCode] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');

  const onCode = (id: SlotId) => {
    try {
      setSaveCode(exportCode(loadFromSlot(getBrowserStorage(), id), new Date().toISOString()));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const onLoad = (id: SlotId) => {
    try {
      loadSlot(id);
      toast(t('load.loaded'), 'success');
      goTo(slots[id]?.retired ? 'careerEnd' : 'hub');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const onExport = (id: SlotId) => {
    try {
      const game = loadFromSlot(getBrowserStorage(), id);
      void downloadText(exportFileName(game), exportGame(game, new Date().toISOString()));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const doImport = ({ json, slot }: PendingImport) => {
    try {
      importInto(json, slot);
      toast(t('load.imported'), 'success');
      goTo('hub');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setPendingImport(null);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const json = await readFileText(file);
    if (fileRef.current) fileRef.current.value = '';
    onText(json);
  };

  const onText = (json: string) => {
    // Se valida antes de preguntar nada: un archivo inválido no debe ofrecer sobrescribir.
    try {
      importGame(json);
    } catch (err) {
      toast(errorMessage(err), 'error');
      return;
    }
    const pending = { json, slot: importSlot };
    if (slots[importSlot]) setPendingImport(pending);
    else doImport(pending);
  };

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <ScreenHeader title={t('load.title')} onBack={() => goTo('mainMenu')} />

      {SLOT_IDS.map((id) => {
        const meta = slots[id];
        return (
          <section key={id} className="card slot-card" aria-label={slotName(id)}>
            <div className="slot-info">
              <span className="slot-label">{slotName(id)}</span>
              {meta ? (
                <>
                  <div className="slot-title">
                    {meta.playerName}
                    {meta.nickname && <span className="muted"> «{meta.nickname}»</span>}
                  </div>
                  <div className="row small muted" style={{ gap: 8 }}>
                    <span>{meta.position}</span>·<span>{meta.seasonLabel}</span>·<span>{meta.age} años</span>
                    {meta.ironMan && <span className="badge badge-danger">Ironman</span>}
                    {meta.retired && <span className="badge">{t('load.retired')}</span>}
                  </div>
                  <div className="faint small">
                    {t('load.savedAt', { date: dateFmt.format(new Date(meta.savedAt)) })} · {t('load.size', { kb: meta.sizeKb })}
                  </div>
                </>
              ) : (
                <div className="slot-title faint">{t('common.empty')}</div>
              )}
            </div>
            {meta && (
              <div className="slot-actions">
                <button className="btn btn-primary" onClick={() => onLoad(id)}>
                  {t('common.load')}
                </button>
                <button className="btn" onClick={() => onCode(id)}>
                  {t('saveCode.copy')}
                </button>
                <button className="btn" onClick={() => onExport(id)}>
                  {t('common.export')}
                </button>
                <button className="btn btn-danger" onClick={() => setToDelete(meta)}>
                  {t('common.delete')}
                </button>
              </div>
            )}
          </section>
        );
      })}

      <section className="card stack">
        <h2>{t('load.importTitle')}</h2>
        <p className="muted small">{t('load.importHint')}</p>
        <div className="row">
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <span>{t('load.importTo')}</span>
            <select className="select" style={{ width: 'auto' }} value={importSlot} onChange={(e) => setImportSlot(e.target.value as SlotId)}>
              {SLOT_IDS.filter((s) => s !== 'auto').map((s) => (
                <option key={s} value={s}>
                  {slotName(s)}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            {t('load.chooseFile')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        <label className="field">
          <span>{t('saveCode.pasteTitle')}</span>
          <textarea
            id="paste-code"
            className="input save-code"
            rows={3}
            value={pasted}
            placeholder={t('saveCode.pastePlaceholder')}
            onChange={(e) => setPasted(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="faint small">{t('saveCode.pasteHint')}</span>
        </label>
        <div className="row">
          <button
            className="btn btn-primary"
            disabled={!pasted.trim()}
            onClick={() => {
              onText(pasted);
              setPasted('');
            }}
          >
            {t('saveCode.pasteButton')}
          </button>
        </div>
      </section>
      <SaveCodeDialog code={saveCode} onClose={() => setSaveCode(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        title={t('common.delete')}
        message={t('load.confirmDelete', { name: toDelete?.playerName ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          if (toDelete) removeSlot(toDelete.slotId);
          setToDelete(null);
          toast(t('load.deleted'));
        }}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={pendingImport !== null}
        title={t('common.import')}
        message={t('load.confirmOverwrite', { name: pendingImport ? (slots[pendingImport.slot]?.playerName ?? '') : '' })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => pendingImport && doImport(pendingImport)}
        onCancel={() => setPendingImport(null)}
      />
    </div>
  );
}
