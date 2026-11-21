/**
 * Punto de entrada de los datos del juego. Para añadir un país:
 * 1. Crea leagues/<pais>.json (tipo CountryLeagueFile).
 * 2. Impórtalo aquí y añádelo a LEAGUE_FILES.
 * 3. Pon hasLeagues: true en countries.json y ejecuta `npm run validate:data`.
 */
import type { ClubSource, CountryLeagueFile } from '@/engine/types/club';
import type { CompetitionDef, CountryDef } from '@/engine/types/definitions';
import { buildWorldData, type RawGameData } from '@/engine/data/world';
import countries from './countries.json';
import competitions from './competitions.json';
import crests from './crests-manifest.json';
import esp from './leagues/esp.json';
import eng from './leagues/eng.json';
import arg from './leagues/arg.json';
import bra from './leagues/bra.json';
import ita from './leagues/ita.json';
import ger from './leagues/ger.json';
import fra from './leagues/fra.json';
import por from './leagues/por.json';
import ned from './leagues/ned.json';
import uru from './leagues/uru.json';
import col from './leagues/col.json';
import chi from './leagues/chi.json';
import jpn from './leagues/jpn.json';
import kor from './leagues/kor.json';
import ksa from './leagues/ksa.json';
import tur from './leagues/tur.json';
import bel from './leagues/bel.json';
import sco from './leagues/sco.json';
import ecu from './leagues/ecu.json';
import par from './leagues/par.json';
import per from './leagues/per.json';
import mex from './leagues/mex.json';
import usa from './leagues/usa.json';
import qat from './leagues/qat.json';
import uae from './leagues/uae.json';

const LEAGUE_FILES = [esp, eng, ita, ger, fra, por, ned, tur, bel, sco, arg, bra, uru, col, chi, ecu, par, per, mex, usa, jpn, kor, ksa, qat, uae];

/** Datos tal y como están en los JSON (el validador comprueba que cumplen los tipos). */
export const RAW_DATA: RawGameData = {
  countries: countries as unknown as CountryDef[],
  competitions: competitions as unknown as CompetitionDef[],
  leagues: LEAGUE_FILES as unknown as CountryLeagueFile<ClubSource>[],
  crests: crests as Record<string, string>,
};

export const WORLD = buildWorldData(RAW_DATA);

import { PLAY_STYLES } from './playStyles';
import { TRAITS } from './traits';
import { SPECIALTIES } from './specialties';
import { EVENTS } from './events';
import { NAMES } from './names';
import { TENDENCIES } from './tendencies';
import { REACTIONS } from './reactions';
import { INTERNATIONAL } from './international';
import { ACHIEVEMENTS, TIER_POINTS } from './achievements';
import type { EngineContent } from '@/engine/season/advance';

/** Todo el contenido que necesita el motor de temporada. */
export const ENGINE_CONTENT: EngineContent = { world: WORLD, styles: PLAY_STYLES, traits: TRAITS, specialties: SPECIALTIES, events: EVENTS, names: NAMES, tendencies: TENDENCIES, reactions: REACTIONS, intl: INTERNATIONAL, achievements: ACHIEVEMENTS, tierPoints: TIER_POINTS };
