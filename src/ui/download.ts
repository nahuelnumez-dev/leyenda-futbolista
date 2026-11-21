/**
 * Descarga un texto como archivo. En iPhone/iPad (y móviles con Web Share) abre el menú de compartir,
 * desde el que se puede «Guardar en Archivos»; si no se puede compartir, usa la descarga normal.
 */
export async function downloadText(fileName: string, text: string, mime = 'application/json'): Promise<void> {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  if (await shareFile(new File([blob], fileName, { type: mime }))) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Intenta compartir un archivo con el menú del sistema. Devuelve true si se compartió (o el usuario canceló). */
export async function shareFile(file: File): Promise<boolean> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (!isTouchDevice() || !nav.share || !nav.canShare?.({ files: [file] })) return false;
  try {
    await nav.share({ files: [file], title: file.name });
    return true;
  } catch (err) {
    // AbortError = el usuario cerró el menú: no hay que descargar además.
    return err instanceof DOMException && err.name === 'AbortError';
  }
}

/** Pantalla táctil sin ratón (iPhone, iPad, Android). */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}

/** Lee un File como texto. */
export function readFileText(file: File): Promise<string> {
  return file.text();
}
