/**
 * Opciones del avatar. Los nombres visibles están en i18n (avatar.hair.*, avatar.facial.*...).
 * Para añadir un peinado: añade su id aquí, su dibujo en src/ui/avatar/Avatar.tsx y su nombre en es.json.
 */
export const SKIN_TONES = ['#f6d7c3', '#eec1a1', '#e0ac85', '#c68b62', '#a86f4a', '#8a5536', '#6b3f27', '#4a2a1a'] as const;

export const HAIR_STYLES = ['corto', 'rapado', 'peinado', 'tupe', 'rizado', 'afro', 'largo', 'moño', 'cresta', 'calvo'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = ['#1b1612', '#3b2618', '#6b4423', '#a57a3f', '#d9b26a', '#a8471f', '#8f8f8f', '#e8e4da', '#2f5fb3'] as const;

export const FACIAL_HAIR = ['ninguno', 'bigote', 'perilla', 'sombra', 'barba'] as const;
export type FacialHair = (typeof FACIAL_HAIR)[number];

export const EYE_COLORS = ['#4b3621', '#2e1f14', '#3d6b9a', '#4f7a3f', '#8a6d3b', '#5f6f7a'] as const;

export const ACCESSORIES = ['ninguno', 'cinta', 'diadema'] as const;

export const BOOT_COLORS = ['#f5c542', '#ffffff', '#111111', '#e63946', '#2fd27a', '#3a86ff', '#ff7ac6', '#ff8c1a'] as const;

export const BUILDS = ['delgado', 'atletico', 'robusto'] as const;

export const HEIGHT_RANGE: [number, number] = [160, 200];
