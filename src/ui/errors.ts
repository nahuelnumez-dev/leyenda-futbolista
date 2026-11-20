import { SaveError } from '@/engine/save/serialize';
import { t, tDynamic } from '@/i18n';

/** Mensaje de error legible para el jugador. */
export function errorMessage(err: unknown): string {
  if (err instanceof SaveError) return tDynamic(`errors.${err.code}`);
  const message = err instanceof Error ? err.message : String(err);
  return t('errors.generic', { message });
}
