/**
 * Logros en cuatro niveles: bronce, plata, oro y leyenda. Se comprueban al cerrar cada temporada
 * y al retirarse. `progress` muestra una barra de avance (métricas de carrera).
 */
import type { AchievementDef } from '@/engine/types/definitions';
import type { CareerMetric, Condition, TrophyKind } from '@/engine/types/events';
import type { Tier } from '@/engine/types/common';

const es = (text: string) => ({ es: text });
const stat = (s: CareerMetric, min: number): Condition => ({ type: 'careerStat', stat: s, min });
const trophies = (kind: TrophyKind, min: number, competitions?: string[]): Condition => ({ type: 'trophyCount', kind, min, ...(competitions ? { competitions } : {}) });
const award = (awardId: string, min: number, maxRank = 1): Condition => ({ type: 'awardCount', awardId, min, maxRank });
const flag = (id: string): Condition => ({ type: 'flag', id });

function a(id: string, tier: Tier, name: string, description: string, requires: Condition[], progress?: { metric: CareerMetric; target: number }, hidden = false): AchievementDef {
  return { id, tier, name: es(name), description: es(description), requires, ...(progress ? { progress } : {}), ...(hidden ? { hidden } : {}) };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Bronce
  a('debut', 'bronze', 'El primer paso', 'Debuta con el primer equipo.', [flag('firstTeamDebut')]),
  a('primer-gol', 'bronze', 'Estreno goleador', 'Marca tu primer gol como profesional.', [flag('firstGoal')]),
  a('50-partidos', 'bronze', 'Fijo en la convocatoria', 'Juega 50 partidos con tus clubes.', [stat('apps', 50)], { metric: 'apps', target: 50 }),
  a('10-goles', 'bronze', 'Olfato', 'Marca 10 goles con tus clubes.', [stat('goals', 10)], { metric: 'goals', target: 10 }),
  a('internacional', 'bronze', 'Internacional', 'Juega tu primer partido con la absoluta.', [stat('caps', 1)]),
  a('primer-titulo', 'bronze', 'Primer título', 'Gana tu primer trofeo.', [stat('trophies', 1)]),
  a('fichaje', 'bronze', 'Nueva aventura', 'Juega en dos clubes distintos.', [stat('clubs', 2)]),
  a('cedido', 'bronze', 'Billete de ida y vuelta', 'Sal cedido a otro club.', [stat('loans', 1)]),
  a('hat-trick', 'bronze', 'Balón para casa', 'Marca un hat-trick.', [stat('hatTricks', 1)]),
  a('ascenso', 'bronze', 'Subir de categoría', 'Consigue un ascenso.', [stat('promotions', 1)]),
  a('seguidores-100k', 'bronze', 'Influencer', 'Llega a 100.000 seguidores.', [stat('followers', 100_000)], { metric: 'followers', target: 100_000 }),

  // Plata
  a('100-goles', 'silver', 'Centenario', 'Marca 100 goles con tus clubes.', [stat('goals', 100)], { metric: 'goals', target: 100 }),
  a('200-partidos', 'silver', 'Veterano de mil batallas', 'Juega 200 partidos con tus clubes.', [stat('apps', 200)], { metric: 'apps', target: 200 }),
  a('50-asistencias', 'silver', 'El socio perfecto', 'Da 50 asistencias.', [stat('assists', 50)], { metric: 'assists', target: 50 }),
  a('liga', 'silver', 'Campeón de liga', 'Gana una liga de primera división.', [trophies('topLeague', 1)]),
  a('copa', 'silver', 'Noche de copa', 'Gana una copa nacional.', [trophies('cup', 1)]),
  a('25-internacionalidades', 'silver', 'Habitual de la selección', 'Juega 25 partidos con la absoluta.', [stat('caps', 25)], { metric: 'caps', target: 25 }),
  a('capitan', 'silver', 'El brazalete', 'Sé capitán de tu club.', [flag('captain')]),
  a('traspaso-20', 'silver', 'Fichaje caro', 'Protagoniza un traspaso de 20 millones o más.', [stat('biggestFee', 20_000_000)]),
  a('media-80', 'silver', 'Jugador de élite', 'Alcanza una media de 80.', [stat('peakOverall', 80)], { metric: 'peakOverall', target: 80 }),
  a('golden-boy', 'silver', 'El mejor joven', 'Gana el premio al mejor jugador joven del mundo.', [award('golden-boy', 1)]),
  a('pichichi', 'silver', 'Máximo goleador', 'Sé el máximo goleador de una liga.', [award('top-scorer', 1)]),
  a('seguidores-1m', 'silver', 'Fenómeno social', 'Llega al millón de seguidores.', [stat('followers', 1_000_000)], { metric: 'followers', target: 1_000_000 }),

  // Oro
  a('250-goles', 'gold', 'Goleador histórico', 'Marca 250 goles con tus clubes.', [stat('goals', 250)], { metric: 'goals', target: 250 }),
  a('500-partidos', 'gold', 'Una vida en el césped', 'Juega 500 partidos con tus clubes.', [stat('apps', 500)], { metric: 'apps', target: 500 }),
  a('100-asistencias', 'gold', 'Asistente de lujo', 'Da 100 asistencias.', [stat('assists', 100)], { metric: 'assists', target: 100 }),
  a('continental', 'gold', 'Rey del continente', 'Gana la Champions League o la Libertadores.', [trophies('continental', 1, ['uefa.champions', 'conmebol.libertadores'])]),
  a('5-ligas', 'gold', 'Dinastía', 'Gana cinco ligas de primera división.', [trophies('topLeague', 5)]),
  a('50-internacionalidades', 'gold', 'Fijo con la selección', 'Juega 50 partidos con la absoluta.', [stat('caps', 50)], { metric: 'caps', target: 50 }),
  a('media-88', 'gold', 'Crack mundial', 'Alcanza una media de 88.', [stat('peakOverall', 88)], { metric: 'peakOverall', target: 88 }),
  a('traspaso-80', 'gold', 'Fichaje del verano', 'Protagoniza un traspaso de 80 millones o más.', [stat('biggestFee', 80_000_000)]),
  a('podio-balon', 'gold', 'En el podio', 'Termina entre los tres primeros del Balón de Oro.', [award('balon-de-oro', 1, 3)]),
  a('torneo-selecciones', 'gold', 'Gloria nacional', 'Gana la Eurocopa, la Copa América o el Mundial con tu selección.', [trophies('national', 1)]),
  a('10-titulos', 'gold', 'Coleccionista', 'Gana 10 títulos.', [stat('trophies', 10)], { metric: 'trophies', target: 10 }),

  // Leyenda
  a('balon-de-oro', 'legend', 'Balón de Oro', 'Gana el Balón de Oro.', [award('balon-de-oro', 1)]),
  a('tres-balones', 'legend', 'Tricampeón', 'Gana tres Balones de Oro.', [award('balon-de-oro', 3)]),
  a('mundial', 'legend', 'Campeón del mundo', 'Gana el Mundial.', [trophies('national', 1, ['fifa.world-cup'])]),
  a('400-goles', 'legend', 'Leyenda del gol', 'Marca 400 goles con tus clubes.', [stat('goals', 400)], { metric: 'goals', target: 400 }),
  a('triplete', 'legend', 'Triplete', 'Gana liga, copa y competición continental en la misma temporada.', [flag('treble')]),
  a('100-internacionalidades', 'legend', 'Centenario internacional', 'Juega 100 partidos con la absoluta.', [stat('caps', 100)], { metric: 'caps', target: 100 }),
  a('20-titulos', 'legend', 'Palmarés infinito', 'Gana 20 títulos.', [stat('trophies', 20)], { metric: 'trophies', target: 20 }),

  // Ocultos
  a('trotamundos', 'silver', 'Trotamundos', 'Juega en cinco clubes distintos.', [stat('clubs', 5)], undefined, true),
  a('un-solo-club', 'legend', 'Bandera', 'Retírate tras 15 temporadas o más en un único club.', [flag('retired'), stat('seasons', 15), { type: 'careerStat', stat: 'clubs', max: 1 }], undefined, true),
  a('amano', 'bronze', 'Lado oscuro', 'Aceptar dinero de una red de apuestas.', [{ type: 'eventSeen', id: 'off-amano-investigacion' }], undefined, true),
];

/** Puntos de legado por nivel de logro. */
export const TIER_POINTS: Record<Tier, number> = { bronze: 2, silver: 6, gold: 15, legend: 35 };
