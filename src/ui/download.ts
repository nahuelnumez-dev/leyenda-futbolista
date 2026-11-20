/** Descarga un texto como archivo en el navegador. */
export function downloadText(fileName: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lee un File como texto. */
export function readFileText(file: File): Promise<string> {
  return file.text();
}
