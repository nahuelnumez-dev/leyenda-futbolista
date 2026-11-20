/** Esquemas zod de los archivos de /src/data. Sirven para validar datos escritos a mano. */
import { z } from 'zod';
import { CLUB_STYLES, KIT_PATTERNS } from '../types/club';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color hex #RRGGBB');
const localized = z.object({ es: z.string().min(1) }).catchall(z.string());
const score = z.number().int().min(1).max(100);

export const rivalrySchema = z.object({
  clubId: z.string(),
  type: z.enum(['derbi', 'clasico']),
  intensity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  name: z.string().optional(),
});

export const clubSourceSchema = z
  .object({
    id: z.string().regex(/^[a-z]{3}\.[a-z0-9-]+$/, 'id con formato pais.slug'),
    name: z.string().min(2),
    shortName: z.string().min(2),
    abbr: z.string().regex(/^[A-Z]{2,4}$/, 'abreviatura de 2-4 mayúsculas'),
    city: z.string().min(1),
    region: z.string().min(1),
    coords: z.tuple([z.number(), z.number()]).optional(),
    stadium: z.object({ name: z.string().min(2), capacity: z.number().int().positive() }),
    colors: z.object({ primary: hex, secondary: hex, pattern: z.enum(KIT_PATTERNS as [string, ...string[]]) }),
    crest: z.object({ file: z.string().optional(), wiki: z.string().optional() }).optional(),
    prestige: score,
    budgetM: z.number().positive(),
    academy: score,
    style: z.enum(CLUB_STYLES as [string, ...string[]]),
    rivals: z.array(rivalrySchema).optional(),
    parentClubId: z.string().optional(),
    needsReview: z.boolean().optional(),
  })
  .strict();

const ruleSchema = z.object({
  direct: z.number().int().min(0),
  playoff: z.tuple([z.number().int(), z.number().int()]).optional(),
  playoffSpots: z.number().int().min(0).optional(),
});

export const divisionSchema = z
  .object({
    id: z.string().regex(/^[a-z]{3}\.[a-z0-9-]+$/),
    name: z.string().min(2),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    groups: z.array(z.object({ id: z.string(), name: z.string(), clubIds: z.array(z.string()).min(2) })).optional(),
    promotion: ruleSchema.optional(),
    relegation: ruleSchema.optional(),
    format: z.object({ rounds: z.union([z.literal(1), z.literal(2)]) }).optional(),
    needsReview: z.boolean().optional(),
    clubs: z.array(clubSourceSchema).min(2),
  })
  .strict();

export const leagueFileSchema = z
  .object({
    country: z.string().regex(/^[A-Z]{3}$/),
    needsReview: z.boolean(),
    dataSeason: z.string(),
    calendar: z.enum(['europeo', 'anual']),
    divisions: z.array(divisionSchema).min(1),
    cups: z.array(z.string()).optional(),
    continental: z.array(z.object({ competitionId: z.string(), from: z.number().int().min(1), to: z.number().int().min(1) }).strict()).optional(),
    notes: z.string().optional(),
  })
  .strict();

export const countrySchema = z
  .object({
    id: z.string().regex(/^[A-Z]{3}$/),
    name: localized,
    demonym: localized,
    language: z.string(),
    confederation: z.enum(['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC']),
    neighbours: z.array(z.string()),
    regions: z.array(z.object({ id: z.string(), name: z.string(), cities: z.array(z.string()).min(1) })).min(1),
    hasLeagues: z.boolean(),
  })
  .strict();

export const competitionSchema = z
  .object({
    id: z.string().regex(/^[a-z]+\.[a-z0-9-]+$/),
    name: localized,
    type: z.enum(['liga', 'copa', 'supercopa', 'continental', 'mundial', 'selecciones']),
    country: z.string().optional(),
    confederation: z.enum(['UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC']).optional(),
  })
  .strict();
