/** Tercer bloque de decisiones (v1.3): cantera, posiciones, táctica, cesiones, derbis, contrato, afición y cadenas. */
import type { GameEvent } from '@/engine/types/events';
import {
  ALL, HALVES, PRO, SENIOR, attr, ev, family, fitness, flag, followers, form, group, hasFlag, injury, maxAge, minAge, minMoney, minOverall, money, morale, news, noFlag, opt, playingTime, potential, rel, rep, roll, schedule, tendency, goal, goalsAtLeast, assist, dribble, keyPass, tackle, save, matchRating, OUTFIELD,
} from './helpers';

const ACADEMY = ['academy'] as GameEvent['stages'];
const YOUNG = ['academy', 'breakthrough'] as GameEvent['stages'];
const KEEPER = [{ type: 'position', in: ['POR'] }] as GameEvent['requires'];
const DEFENDER = [{ type: 'positionGroup', in: ['defender'] }] as GameEvent['requires'];
const MIDFIELD = [{ type: 'positionGroup', in: ['midfielder'] }] as GameEvent['requires'];
const FORWARD = [{ type: 'positionGroup', in: ['forward'] }] as GameEvent['requires'];
const ATTACKER = [{ type: 'positionGroup', in: ['forward', 'midfielder'] }] as GameEvent['requires'];

export const CHOICE_EVENTS: GameEvent[] = [
  /* ── Cantera ─────────────────────────────────────── */
  ev({
    id: 'ca-colegio', category: 'personal', stages: ACADEMY, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [], speaker: 'family',
    title: 'Exámenes',
    text: 'Se acercan los exámenes finales y el torneo juvenil más importante del año, la misma semana.',
    options: [
      opt('estudiar', 'Estudiar: el fútbol puede esperar una semana', [family(8), attr('concentration', 1), form(-3)], { result: 'Apruebas todo. Tus padres respiran.' }),
      opt('torneo', 'Jugar el torneo', [family(-5)], { roll: roll(0.5, { text: 'Eres el mejor del torneo. Un ojeador apunta tu nombre.', effects: [rep('local', 4), morale(6)] }, { text: 'Caéis en cuartos y además suspendes dos.', effects: [morale(-4)] }, 'composure') }),
      opt('ambas', 'Estudiar de noche y jugar de día', [fitness(-8)], { roll: roll(0.45, { text: 'Llegas a todo. Agotado, pero orgulloso.', effects: [family(4), tendency('profesionalidad', 4)] }, { text: 'No llegas a nada del todo.', effects: [morale(-3)] }, 'stamina') }),
    ],
  }),
  ev({
    id: 'ca-botas-caras', category: 'personal', stages: ACADEMY, phases: ['preseason'], weight: 10, once: true, requires: [], speaker: 'family',
    title: 'Las botas',
    text: 'Tus botas están rotas. Tus padres pueden comprarte unas sencillas o hacer un esfuerzo por las que llevan los profesionales.',
    options: [
      opt('sencillas', 'Las sencillas: no hace falta más', [family(6), tendency('ego', -3)], { result: 'Las cuidas como un tesoro.' }),
      opt('caras', 'Pedir las caras', [family(-4), morale(5), tendency('ego', 3)], { result: 'Te sientes un profesional. Tus padres se aprietan el cinturón.' }),
    ],
  }),
  ev({
    id: 'ca-entrenador-juvenil', category: 'coach', stages: ACADEMY, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Un entrenador que grita',
    text: 'El entrenador de juveniles te grita delante de todos en cada error. Algunos compañeros lloran al salir.',
    options: [
      opt('aguantar', 'Aguantar y usarlo como motivación', [attr('composure', 2), morale(-3)], { result: 'Te endureces. Cada vez te afecta menos.' }),
      opt('hablar', 'Pedirle hablar a solas', [tendency('carisma', 3)], { roll: roll(0.55, { text: 'Te escucha. Cambia el tono contigo.', effects: [rel('coach', 8)] }, { text: 'Se ríe de ti.', effects: [rel('coach', -6)] }, 'leadership') }),
      opt('padres', 'Contárselo a tus padres', [family(4), rel('coach', -3)], { result: 'Tus padres hablan con el club. El asunto se calma.' }),
    ],
  }),
  ev({
    id: 'ca-hermano-mayor', category: 'personal', stages: ACADEMY, phases: HALVES, weight: 8, once: true, requires: [], speaker: 'family',
    title: 'Tu hermano mayor',
    text: 'Tu hermano mayor también jugaba, pero lo dejó. Ahora te entrena por las tardes en el parque.',
    options: [
      opt('aprender', 'Aprender todo lo que pueda enseñarte', [attr('finishing', 1), attr('ballControl', 1), family(6)], { result: 'Os unís más que nunca.' }),
      opt('solo', 'Preferir entrenar solo', [attr('concentration', 1), family(-2)], { result: 'Le duele un poco.' }),
    ],
  }),
  ev({
    id: 'ca-mudarse-residencia', category: 'personal', stages: ACADEMY, phases: ['preseason'], weight: 10, once: true, requires: [], speaker: 'family',
    title: 'La residencia del club',
    text: 'El club te ofrece una plaza en su residencia de jugadores. Dejarías de vivir con tus padres a los 15 años.',
    options: [
      opt('residencia', 'Irte a la residencia', [group('mental', 1), rel('coach', 5), family(-6), flag('academyResidence')], { result: 'Las primeras noches cuestan. Luego, el grupo se convierte en tu familia.' }),
      opt('casa', 'Seguir en casa', [family(8), fitness(-2)], { result: 'Muchas horas de autobús, pero cena con los tuyos.' }),
    ],
  }),
  ev({
    id: 'ca-residencia-escapada', category: 'ethics', stages: ACADEMY, phases: HALVES, weight: 8, once: true, requires: [hasFlag('academyResidence')], speaker: 'teammate',
    title: 'Escapada nocturna',
    text: 'Unos compañeros de la residencia planean escaparse por la noche a una fiesta.',
    options: [
      opt('ir', 'Ir con ellos', [rel('dressingRoom', 6)], { roll: roll(0.5, { text: 'Nadie os pilla. Una noche para recordar.', effects: [morale(5)] }, { text: 'Os pillan. Expediente y una semana sin jugar.', effects: [rel('coach', -10), tendency('profesionalidad', -4)] }) }),
      opt('quedarse', 'Quedarte a dormir', [tendency('profesionalidad', 3), fitness(3)], { result: 'Al día siguiente eres el único despierto en el entrenamiento.' }),
      opt('avisar', 'Avisar al responsable', [rel('coach', 4), rel('dressingRoom', -10)], { result: 'Se quedan sin fiesta. Y tú, sin amigos durante semanas.' }),
    ],
  }),
  ev({
    id: 'ca-torneo-internacional', category: 'keyMatch', stages: ACADEMY, phases: ['secondHalf'], weight: 10, cooldownSeasons: 2, requires: [OUTFIELD], speaker: 'coach',
    title: 'Torneo internacional juvenil',
    text: 'Viajáis a un torneo con las canteras de los mejores clubes del mundo. La final es contra un gigante europeo.',
    options: [
      opt('lucirse', 'Jugar para los ojeadores', [tendency('ego', 3)], { roll: roll(0.45, { text: 'Marcas en la final. Tres clubes preguntan por ti.', effects: [rep('national', 3), flag('scoutedByBig'), morale(6), goal()] }, { text: 'Te empeñas en el lucimiento y el entrenador te sustituye.', effects: [rel('coach', -4)] }, 'dribbling') }),
      opt('equipo', 'Jugar para el equipo', [rel('coach', 5), attr('teamwork', 1)], { roll: roll(0.4, { text: '¡Campeones! Te eligen en el equipo ideal del torneo.', effects: [rep('local', 4), morale(8), matchRating(0.5)] }, { text: 'Subcampeones. Orgullosos igualmente.', effects: [morale(2)] }) }),
    ],
  }),
  ev({
    id: 'ca-cambio-posicion-juvenil', category: 'coach', stages: ACADEMY, phases: ['preseason'], weight: 8, once: true, requires: [OUTFIELD], speaker: 'coach',
    title: 'Probar de delantero',
    text: 'Al entrenador juvenil le falta un delantero y te pregunta si quieres probar ahí unos partidos.',
    options: [
      opt('probar', 'Probar', [attr('finishing', 2), attr('positioning', 1), rel('coach', 4)], { result: 'Marcas en el primer partido. Aprendes a ver el área de otra forma.' }),
      opt('no', 'Seguir en tu posición', [attr('concentration', 1)], { result: 'Prefieres especializarte.' }),
    ],
  }),
  ev({
    id: 'ca-dieta-familia', category: 'personal', stages: ACADEMY, phases: HALVES, weight: 6, once: true, requires: [], speaker: 'family',
    title: 'La cocina de tu abuela',
    text: 'Tu abuela cocina para toda la familia cada domingo: comida abundante y deliciosa. El nutricionista del club pone mala cara.',
    options: [
      opt('abuela', 'Los domingos son sagrados', [family(8), morale(4), fitness(-2)], { result: 'Nada como la comida de casa.' }),
      opt('dieta', 'Comer lo justo y explicarle por qué', [fitness(3), family(-2), tendency('profesionalidad', 2)], { result: 'Tu abuela te prepara una versión «de futbolista». Casi igual de buena.' }),
    ],
  }),
  ev({
    id: 'ca-video-viral', category: 'social', stages: ACADEMY, phases: HALVES, weight: 8, once: true, requires: [OUTFIELD], speaker: 'social',
    title: 'Un vídeo tuyo, viral',
    text: 'Alguien graba tu golazo en un partido juvenil y el vídeo tiene millones de visitas.',
    options: [
      opt('disfrutar', 'Disfrutarlo y abrir redes', [followers(15), tendency('ego', 4), rel('coach', -2), goal()], { result: 'Pasas de 300 a 40.000 seguidores en una semana.' }),
      opt('ignorar', 'Seguir como si nada', [tendency('ego', -3), rel('coach', 3), goal()], { result: 'Tu entrenador valora que no se te suba.' }),
    ],
  }),
  ev({
    id: 'ca-primer-contrato', category: 'contract', stages: ACADEMY, phases: ['seasonEnd'], weight: 10, once: true, requires: [minAge(16)], speaker: 'board',
    title: 'Tu primer contrato',
    text: 'El club te ofrece tu primer contrato juvenil. Un agente ofrece a tus padres negociar algo mejor.',
    options: [
      opt('firmar', 'Firmar tal cual con el club', [rel('board', 8), money(15000), tendency('lealtad', 4)], { result: 'Firmas con una sonrisa.' }),
      opt('agente', 'Dejar que negocie el agente', [{ type: 'setAgent', profile: 'local' }, rel('board', -3)], { roll: roll(0.6, { text: 'Consigue el doble de sueldo.', effects: [money(30000), rel('agent', 6)] }, { text: 'El club se enfada y la negociación se alarga meses.', effects: [rel('board', -4), money(10000)] }) }),
    ],
  }),
  ev({
    id: 'ca-lesion-crecimiento', category: 'injury', stages: ACADEMY, phases: HALVES, weight: 6, once: true, requires: [], speaker: 'narrator',
    title: 'Dolores de crecimiento',
    text: 'Has crecido ocho centímetros en un año y te duelen las rodillas. El médico habla de «dolores de crecimiento».',
    options: [
      opt('parar', 'Parar un mes para que el cuerpo se adapte', [injury(1, 4), { type: 'injuryProneness', delta: -4 }, attr('strength', 1)], { result: 'Vuelves más alto, más fuerte y sin dolores.' }),
      opt('seguir', 'Seguir con menos carga', [fitness(-4)], { roll: roll(0.6, { text: 'Las molestias desaparecen solas.', effects: [] }, { text: 'Tendinitis rotuliana. Dos meses fuera.', effects: [injury(2, 8)] }) }),
    ],
  }),

  /* ── Porteros ────────────────────────────────────── */
  ev({
    id: 'gk-error-garrafal', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: KEEPER, speaker: 'narrator',
    title: 'La cantada',
    text: 'Un tiro flojo se te escapa entre las piernas. Gol en contra en el minuto 5. El estadio murmura.',
    options: [
      opt('reaccionar', 'Pedir el balón y jugar como si nada', [attr('composure', 1)], { roll: roll(0.55, { text: 'Paras tres mano a mano después. Te ovacionan al final.', effects: [rel('fans', 6), morale(6), save(3)] }, { text: 'Encajas otro y te sustituyen en el descanso.', effects: [morale(-8), rel('coach', -4)] }, 'composure') }),
      opt('companeros', 'Pedir perdón a tus compañeros', [rel('dressingRoom', 4)], { result: 'Te abrazan. «Nos ha pasado a todos».' }),
    ],
  }),
  ev({
    id: 'gk-competencia', category: 'coach', stages: PRO, phases: ['preseason'], weight: 10, cooldownSeasons: 3, requires: KEEPER, speaker: 'coach',
    title: 'Dos porteros, un puesto',
    text: 'El club ficha a un portero internacional. {entrenador} dice que la portería es de quien la gane.',
    options: [
      opt('competir', 'Competir cada día', [attr('reflexes', 1), attr('concentration', 1)], { roll: roll(0.5, { text: 'Ganas el puesto. Él será tu suplente.', effects: [playingTime(10)] }, { text: 'Gana él. Te toca la copa.', effects: [playingTime(-10)] }, 'reflexes') }),
      opt('aliarse', 'Hacer piña con él', [rel('dressingRoom', 6), attr('gkPositioning', 1)], { result: 'Os ayudáis a mejorar. El entrenador de porteros está encantado.' }),
      opt('salir', 'Pedir salir cedido para jugar', [{ type: 'offer', kind: 'loan' }], { result: 'Tu agente busca un equipo donde seas titular.' }),
    ],
  }),
  ev({
    id: 'gk-guantes', category: 'personal', stages: PRO, phases: ['preseason'], weight: 6, once: true, requires: KEEPER, speaker: 'agent',
    title: 'Tus propios guantes',
    text: 'Una marca quiere sacar una línea de guantes con tu nombre.',
    options: [
      opt('si', 'Aceptar', [money(40000), followers(5)], { result: 'Los niños de tu barrio los llevan en el recreo.' }),
      opt('diseñar', 'Aceptar, pero diseñarlos tú', [money(25000), attr('diving', 1), morale(4)], { result: 'Los mejores guantes que has tenido nunca.' }),
    ],
  }),
  ev({
    id: 'gk-tanda', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 8, cooldownSeasons: 2, requires: KEEPER, speaker: 'narrator',
    title: 'Tanda de penaltis',
    text: 'Eliminatoria de copa a los penaltis. El analista te ha dado una chuleta con los lanzamientos de cada rival.',
    options: [
      opt('chuleta', 'Seguir la chuleta', [], { roll: roll(0.55, { text: 'Paras dos. ¡Pasáis a la siguiente ronda!', effects: [rel('fans', 10), rep('national', 2), news('{apodo}, héroe en la tanda de penaltis', 'positive')] }, { text: 'Los rivales han cambiado de lado. Eliminados.', effects: [morale(-4)] }, 'diving') }),
      opt('instinto', 'Fiarte de tu instinto', [], { roll: roll(0.45, { text: 'Adivinas tres de cinco. Leyenda.', effects: [rel('fans', 12), morale(8)] }, { text: 'No paras ninguno.', effects: [morale(-5)] }, 'reflexes') }),
      opt('tirar', 'Pedir tirar el quinto penalti', [tendency('carisma', 4)], { roll: roll(0.4, { text: 'Lo marcas tú. El estadio enloquece.', effects: [rel('fans', 12), followers(8), morale(8)] }, { text: 'Lo fallas. Nadie lo olvidará.', effects: [rel('fans', -6), morale(-6)] }, 'penalties') }),
    ],
  }),
  ev({
    id: 'gk-subir-corner', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: KEEPER, speaker: 'coach',
    title: 'Sube el portero',
    text: 'Minuto 95, perdéis por uno y hay un córner a favor. El banquillo te hace gestos para que subas.',
    options: [
      opt('subir', 'Subir al remate', [], { roll: roll(0.12, { text: '¡GOL DEL PORTERO! Momento histórico.', effects: [rel('fans', 15), followers(15), rep('national', 4), news('¡Gol del portero {apodo} en el último segundo!', 'positive'), goal()] }, { text: 'Despejan. Corres de vuelta con el corazón en la boca.', effects: [fitness(-2)] }, 'heading') }),
      opt('quedarse', 'Quedarte en tu área', [rel('coach', -2)], { result: 'El córner no da nada. Perdéis por la mínima.' }),
    ],
  }),
  ev({
    id: 'gk-entrenador-porteros', category: 'training', stages: ALL, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: KEEPER, speaker: 'coach',
    title: 'El entrenador de porteros',
    text: 'Llega un entrenador de porteros con métodos nuevos: menos estiradas, más colocación y juego con los pies.',
    options: [
      opt('adaptarse', 'Abrazar el método nuevo', [attr('gkPositioning', 2), attr('kicking', 1), rel('coach', 3)], { result: 'Paras con menos esfuerzo: siempre estás en el sitio.' }),
      opt('clasico', 'Defender tu estilo', [attr('diving', 1), attr('reflexes', 1)], { result: 'Seguís cada uno a lo vuestro.' }),
    ],
  }),

  /* ── Defensas ────────────────────────────────────── */
  ev({
    id: 'df-ultimo-hombre', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: DEFENDER, speaker: 'narrator',
    title: 'Último hombre',
    text: 'El delantero rival se te escapa. Eres el último defensa y está entrando en el área.',
    options: [
      opt('falta', 'Hacerle falta', [tendency('temperamento', 2), rel('dressingRoom', 3), playingTime(-4)], { result: 'Roja directa, pero evitas el gol. El equipo aguanta con diez.' }),
      opt('perseguir', 'Perseguirle y tirarte al suelo', [], { roll: roll(0.5, { text: 'Robo limpio en el último segundo. La grada se pone en pie.', effects: [rel('fans', 8), form(5), attr('positioning', 1), tackle()] }, { text: 'Llegas tarde. Gol.', effects: [form(-3)] }, 'pace') }),
      opt('temporizar', 'Temporizar y esperar ayuda', [], { roll: roll(0.55, { text: 'Llega tu compañero y entre los dos se la quitáis.', effects: [rel('coach', 4), tackle()] }, { text: 'Le da tiempo a pensar y marca.', effects: [] }, 'concentration') }),
    ],
  }),
  ev({
    id: 'df-subir-banda', category: 'coach', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [{ type: 'position', in: ['LD', 'LI'] }], speaker: 'coach',
    title: 'Lateral ofensivo',
    text: '{entrenador} quiere que subas al ataque en cada jugada, aunque dejes espacios atrás.',
    options: [
      opt('subir', 'Subir sin miedo', [attr('crossing', 2), attr('stamina', 1), fitness(-3), assist(), keyPass(2)], { result: 'Das tres asistencias en un mes. Y sufres atrás.' }),
      opt('equilibrio', 'Subir solo cuando sea seguro', [attr('positioning', 1), rel('coach', -2)], { result: 'El entrenador te pide más valentía.' }),
    ],
  }),
  ev({
    id: 'df-pareja-centrales', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'position', in: ['DFC'] }], speaker: 'teammate',
    title: 'Tu pareja de centrales',
    text: 'Tu compañero en el centro de la defensa y tú no os entendéis: los dos salís a por el mismo balón.',
    options: [
      opt('hablar', 'Quedar después del entrenamiento para coordinaros', [attr('teamwork', 2), attr('positioning', 1), rel('dressingRoom', 4)], { result: 'En dos semanas parecéis hermanos.' }),
      opt('mandar', 'Imponer que tú mandas en la defensa', [attr('leadership', 2), rel('dressingRoom', -3)], { result: 'Funciona, pero él no te lo perdona.' }),
    ],
  }),
  ev({
    id: 'df-salida-balon', category: 'training', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: DEFENDER, speaker: 'coach',
    title: 'Salir jugando',
    text: 'El nuevo sistema exige a los defensas sacar el balón con pases filtrados.',
    options: [
      opt('pase', 'Trabajar el pase cada día', [attr('shortPassing', 2), attr('longPassing', 1)], { result: 'Ya no te tiembla el balón en los pies.' }),
      opt('fisico', 'Centrarte en defender', [attr('strength', 1), attr('aggression', 1), rel('coach', -2)], { result: 'Lo tuyo es quitar el balón, no jugarlo.' }),
    ],
  }),
  ev({
    id: 'df-delantero-estrella', category: 'keyMatch', stages: SENIOR, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: DEFENDER, speaker: 'press',
    title: 'Duelo con el mejor del mundo',
    text: 'Te toca defender al delantero más famoso del planeta. Todo el mundo habla de vuestro duelo.',
    options: [
      opt('anularle', 'Estudiarle durante toda la semana', [attr('concentration', 1)], { roll: roll(0.45, { text: 'No toca un balón. «El hombre que apagó a la estrella».', effects: [rep('world', 3), rep('national', 3), followers(8)] }, { text: 'Te hace dos goles. Noche para olvidar.', effects: [morale(-6)] }, 'positioning') }),
      opt('intimidar', 'Intimidarle desde el primer minuto', [tendency('temperamento', 4)], { roll: roll(0.5, { text: 'Se desespera y le expulsan por protestar.', effects: [rel('fans', 6)] }, { text: 'Te expulsan a ti en el minuto 30.', effects: [rel('coach', -8), playingTime(-6)] }, 'aggression') }),
    ],
  }),

  /* ── Centrocampistas ─────────────────────────────── */
  ev({
    id: 'mc-pase-arriesgado', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: MIDFIELD, speaker: 'narrator',
    title: 'El pase imposible',
    text: 'Ves un hueco mínimo entre dos defensas. Si sale, tu delantero se queda solo; si no, contraataque.',
    options: [
      opt('arriesgar', 'Intentarlo', [], { roll: roll(0.45, { text: 'Pase de tiralíneas. Gol y asistencia para el recuerdo.', effects: [attr('vision', 1), rel('fans', 5), form(5), assist()] }, { text: 'Lo cortan y os marcan a la contra.', effects: [rel('coach', -5)] }, 'vision') }),
      opt('seguro', 'Pase seguro atrás', [rel('coach', 2)], { result: 'La grada silba. El entrenador asiente.' }),
    ],
  }),
  ev({
    id: 'mc-pivote', category: 'coach', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 4, requires: MIDFIELD, speaker: 'coach',
    title: 'Mediocentro defensivo',
    text: '{entrenador} necesita un mediocentro que proteja a la defensa y te ve con condiciones.',
    options: [
      opt('si', 'Aceptar el papel', [attr('positioning', 2), attr('aggression', 1), rel('coach', 5), playingTime(5)], { result: 'Te conviertes en el equilibrio del equipo.' }),
      opt('no', 'Prefieres seguir creando', [attr('vision', 1)], { result: 'Te quedas con tu papel de siempre.' }),
    ],
  }),
  ev({
    id: 'mc-marcar-mas', category: 'training', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: MIDFIELD, speaker: 'coach',
    title: 'Llegar al área',
    text: 'Los datos dicen que llegas muy poco al área. {entrenador} quiere que marques al menos ocho goles.',
    options: [
      opt('llegar', 'Trabajar la llegada desde segunda línea', [attr('shooting', 2), attr('finishing', 1), fitness(-2)], { result: 'Empiezas a aparecer por sorpresa.' }),
      opt('crear', 'Tu trabajo es crear', [attr('shortPassing', 1), rel('coach', -2)], { result: 'Sigues dando asistencias, no goles.' }),
    ],
  }),

  /* ── Delanteros y extremos ───────────────────────── */
  ev({
    id: 'dl-sequia', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 12, cooldownSeasons: 2, requires: [...FORWARD, { type: 'seasonStat', stat: 'goals', max: 2 }], speaker: 'press',
    title: 'Sequía goleadora',
    text: 'Llevas meses sin marcar. La prensa cuenta los minutos y tú ya no duermes bien.',
    options: [
      opt('extra', 'Quedarte a tirar 200 balones cada día', [attr('finishing', 2), fitness(-4), tendency('profesionalidad', 3), goal()], { result: 'Al tercer día, marcas. Y no paras.' }),
      opt('psicologo', 'Hablar con el psicólogo', [attr('composure', 2), morale(6), goal()], { result: 'Aprendes a dejar de pensar en el gol. Y llega.' }),
      opt('cambio', 'Cambiarte las botas y el peinado', [followers(3), morale(3)], { roll: roll(0.4, { text: 'Superstición o no, marcas un doblete.', effects: [form(8), goalsAtLeast(2)] }, { text: 'Sigues sin marcar. Con otro peinado.', effects: [morale(-3)] }) }),
    ],
  }),
  ev({
    id: 'dl-regateador', category: 'training', stages: ALL, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: ATTACKER, speaker: 'coach',
    title: 'Regate o pase',
    text: 'El cuerpo técnico te dice que regateas demasiado. Los datos les dan la razón: pierdes muchos balones.',
    options: [
      opt('menos', 'Regatear solo cuando haga falta', [attr('shortPassing', 1), attr('vision', 1), rel('coach', 4)], { result: 'Pierdes menos balones; ganas en eficacia.' }),
      opt('mas', 'Perfeccionar el regate, no abandonarlo', [attr('dribbling', 2), attr('agility', 1), rel('coach', -2), dribble(2)], { result: 'Cuando sale, nadie te para.' }),
    ],
  }),
  ev({
    id: 'dl-cabeza', category: 'training', stages: ALL, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: FORWARD, speaker: 'coach',
    title: 'Juego aéreo',
    text: 'Tienes muchos centros a favor, pero apenas ganas un balón por arriba.',
    options: [
      opt('trabajar', 'Trabajar remate de cabeza y salto', [attr('heading', 2), attr('jumping', 1)], { result: 'Tu primer gol de cabeza llega al mes siguiente.' }),
      opt('suelo', 'Pedir que te la den al pie', [attr('ballControl', 1)], { result: 'Tus compañeros cambian el tipo de pase.' }),
    ],
  }),
  ev({
    id: 'dl-punta-solo', category: 'coach', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: FORWARD, speaker: 'coach',
    title: 'Solo arriba',
    text: 'El equipo juega muy defensivo y tú estás solo contra tres centrales.',
    options: [
      opt('pelear', 'Pelear cada balón', [attr('strength', 2), rel('coach', 4), fitness(-3)], { result: 'Acabas los partidos molido. El equipo respira gracias a ti.' }),
      opt('pedir', 'Pedir más apoyo al entrenador', [rel('coach', -3)], { roll: roll(0.4, { text: 'Cambia el sistema y llegan los goles.', effects: [form(6)] }, { text: 'No cambia nada.', effects: [] }) }),
    ],
  }),
  ev({
    id: 'dl-extremo-banda', category: 'coach', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'position', in: ['ED', 'EI', 'MD', 'MI'] }], speaker: 'coach',
    title: '¿Pierna cambiada?',
    text: '{entrenador} quiere probarte en la banda contraria, para que entres hacia dentro con tu pierna buena.',
    options: [
      opt('probar', 'Probar a pierna cambiada', [attr('shooting', 2), attr('finishing', 1)], { result: 'Empiezas a marcar en diagonal.' }),
      opt('clasico', 'Seguir de extremo clásico', [attr('crossing', 2)], { result: 'Tus centros son cada vez mejores.' }),
    ],
  }),

  /* ── Táctica y entrenador ────────────────────────── */
  ev({
    id: 'tc-pizarra', category: 'coach', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [minAge(22)], speaker: 'coach',
    title: 'Tu opinión táctica',
    text: '{entrenador} te pregunta qué cambiarías del planteamiento ante el próximo rival.',
    options: [
      opt('presion', 'Presión alta', [rel('coach', 3), attr('stamina', 1)], { roll: roll(0.55, { text: 'Funciona: robáis arriba y ganáis 3-0.', effects: [rel('coach', 5), attr('vision', 1)] }, { text: 'Os pillan a la espalda.', effects: [rel('coach', -3)] }) }),
      opt('bloque', 'Esperar atrás y salir a la contra', [rel('coach', 3)], { roll: roll(0.55, { text: 'Victoria trabajada a la contra.', effects: [rel('coach', 5), attr('positioning', 1)] }, { text: 'Encerrados todo el partido. Derrota.', effects: [rel('coach', -3)] }) }),
      opt('nada', '«Usted sabe más»', [], { result: 'No arriesgas, no ganas.' }),
    ],
  }),
  ev({
    id: 'tc-banquillo-castigo', category: 'coach', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'relation', who: 'coach', max: 0 }], speaker: 'coach',
    title: 'Al banquillo',
    text: '{entrenador} te deja en el banquillo sin explicación tres partidos seguidos.',
    options: [
      opt('trabajar', 'Callar y entrenar más fuerte', [rel('coach', 8), tendency('profesionalidad', 3)], { result: 'Vuelves a la titularidad y no la sueltas.' }),
      opt('preguntar', 'Pedirle explicaciones', [], { roll: roll(0.5, { text: 'Te explica lo que necesita de ti. Ahora lo entiendes.', effects: [rel('coach', 6)] }, { text: 'La conversación acaba en gritos.', effects: [rel('coach', -8), tendency('temperamento', 3)] }, 'composure') }),
      opt('salir', 'Pedir el traspaso', [{ type: 'transferRequest' }, rel('board', -4)], { result: 'Tu agente empieza a buscar equipo.' }),
    ],
  }),
  ev({
    id: 'tc-capitan-charla', category: 'dressingRoom', stages: SENIOR, phases: ['secondHalf'], weight: 8, cooldownSeasons: 2, requires: [hasFlag('captain')], speaker: 'teammate',
    title: 'Final de temporada tensa',
    text: 'El equipo se juega el objetivo en las últimas jornadas. Como capitán, te toca la charla antes del partido decisivo.',
    options: [
      opt('emocion', 'Hablar con el corazón', [tendency('carisma', 4)], { roll: roll(0.55, { text: 'Salís a morder. Victoria.', effects: [rel('dressingRoom', 8), morale(6)] }, { text: 'Demasiados nervios. Empate.', effects: [] }, 'leadership') }),
      opt('calma', 'Pedir calma y concentración', [attr('composure', 1)], { roll: roll(0.55, { text: 'Partido perfecto, sin errores.', effects: [rel('coach', 5)] }, { text: 'Os falta intensidad.', effects: [] }, 'concentration') }),
    ],
  }),
  ev({
    id: 'tc-rotaciones', category: 'coach', stages: ['prime', 'veteran'], phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [minAge(29)], speaker: 'coach',
    title: 'Dosificarte',
    text: '{entrenador} quiere que descanses en los partidos de copa para llegar fresco a los importantes.',
    options: [
      opt('aceptar', 'Aceptar las rotaciones', [fitness(8), { type: 'injuryProneness', delta: -3 }, playingTime(-4)], { result: 'Llegas a mayo en tu mejor forma.' }),
      opt('jugar', 'Quieres jugarlo todo', [rel('coach', -3), fitness(-6)], { result: 'Lo juegas todo. El cuerpo lo nota.' }),
    ],
  }),

  /* ── Cesiones ────────────────────────────────────── */
  ev({
    id: 'ce-cesion-dificil', category: 'loan', stages: YOUNG, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'onLoan', value: true }], speaker: 'narrator',
    title: 'Lejos de casa',
    text: 'En tu cesión vives solo en una ciudad desconocida. Las tardes se hacen largas.',
    options: [
      opt('integrarse', 'Apuntarte a todo con los compañeros', [rel('dressingRoom', 8), morale(4)], { result: 'Te adoptan como a uno más.' }),
      opt('estudiar', 'Aprovechar para estudiar idiomas', [flag('english'), morale(-2)], { result: 'Al menos sacas algo útil.' }),
      opt('volver', 'Pedir volver antes de tiempo', [rel('board', -6), morale(4)], { result: 'Tu club se niega. Tienes que aguantar.' }),
    ],
  }),
  ev({
    id: 'ce-cesion-brillante', category: 'loan', stages: YOUNG, phases: ['secondHalf'], weight: 8, cooldownSeasons: 2, requires: [{ type: 'onLoan', value: true }, { type: 'form', min: 60 }], speaker: 'board',
    title: 'Te quieren comprar',
    text: 'Tu cesión va tan bien que el club que te tiene cedido quiere comprarte en propiedad.',
    options: [
      opt('quedarse', 'Quedarte: aquí eres importante', [{ type: 'offer', kind: 'transfer' }, rel('fans', 6)], { result: 'Tu agente empieza a negociar.' }),
      opt('volver', 'Volver a tu club a pelear el puesto', [tendency('lealtad', 4), rel('board', 4)], { result: 'Vuelves con más experiencia y confianza.' }),
    ],
  }),

  /* ── Derbis y afición ────────────────────────────── */
  ev({
    id: 'db-semana-derbi', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 1, requires: [{ type: 'derbyUpcoming' }], speaker: 'fans',
    title: 'Semana de derbi',
    text: 'Toda la ciudad habla del derbi del domingo. La afición rival ha colgado una pancarta contra ti.',
    options: [
      opt('responder', 'Responder en las redes', [followers(5), tendency('ego', 3), rel('fans', 4)], { result: 'Tu afición te adora. La rival, menos.' }),
      opt('callar', 'Responder en el campo', [form(3)], { roll: roll(0.45, { text: 'Gol en el derbi. Celebración ante la grada rival.', effects: [rel('fans', 12), rep('local', 4), news('{apodo} decide el derbi', 'positive')] }, { text: 'Derrota. La semana será larga.', effects: [morale(-5)] }, 'composure') }),
    ],
  }),
  ev({
    id: 'db-cantico', category: 'social', stages: PRO, phases: HALVES, weight: 8, once: true, requires: [{ type: 'relation', who: 'fans', min: 50 }], speaker: 'fans',
    title: 'Tu propio cántico',
    text: 'La grada estrena un cántico con tu nombre. Te piden que lo cantes con ellos en la celebración.',
    options: [
      opt('cantar', 'Cantarlo con ellos', [rel('fans', 8), followers(6), tendency('carisma', 4)], { result: 'El vídeo se hace viral.' }),
      opt('saludar', 'Saludar con timidez', [rel('fans', 3)], { result: 'Se te escapa una sonrisa.' }),
    ],
  }),
  ev({
    id: 'db-ultras', category: 'ethics', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 4, requires: [], speaker: 'fans',
    title: 'Los ultras',
    text: 'El líder de los ultras te pide entradas gratis «para la gente». Si no, el ambiente puede ponerse feo.',
    options: [
      opt('dar', 'Dárselas', [money(-3000), rel('fans', 3), tendency('profesionalidad', -2)], { result: 'Paz… por ahora.' }),
      opt('negarse', 'Negarte', [tendency('profesionalidad', 3)], { roll: roll(0.5, { text: 'No pasa nada. Era un farol.', effects: [] }, { text: 'Pitos en el siguiente partido.', effects: [rel('fans', -6), morale(-3)] }) }),
      opt('club', 'Avisar al club', [rel('board', 5), rel('fans', -2)], { result: 'El club toma medidas.' }),
    ],
  }),
  ev({
    id: 'db-nino-camiseta', category: 'social', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [], speaker: 'fans',
    title: 'Un niño en la grada',
    text: 'Un niño lleva un cartel: «¿Me das tu camiseta? Es mi cumpleaños».',
    options: [
      opt('dar', 'Dársela al acabar', [rel('fans', 5), followers(3), tendency('solidaridad', 3)], { result: 'Llora de emoción. La foto sale en todas partes.' }),
      opt('olvidar', 'Con el partido se te olvida', [], { result: 'Sales del campo sin verle.' }),
    ],
  }),

  /* ── Contrato y dinero ───────────────────────────── */
  ev({
    id: 'ct-bonus-objetivos', category: 'contract', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'board',
    title: 'Contrato por objetivos',
    text: 'La directiva te propone bajar el fijo a cambio de primas por goles, partidos y títulos.',
    options: [
      opt('variable', 'Aceptar las variables', [flag('goalBonusContract'), rel('board', 5)], { roll: roll(0.55, { text: 'Gran temporada: cobras más que nunca.', effects: [money(120000)] }, { text: 'Temporada discreta: cobras menos.', effects: [money(-30000)] }, 'concentration') }),
      opt('fijo', 'Mantener el fijo', [], { result: 'Seguridad ante todo.' }),
    ],
  }),
  ev({
    id: 'ct-rebaja', category: 'contract', stages: SENIOR, phases: ['winterWindow'], weight: 6, cooldownSeasons: 4, requires: [{ type: 'divisionTier', min: 2 }], speaker: 'board',
    title: 'El club tiene problemas',
    text: 'El club está en crisis económica y pide a los jugadores con más sueldo que se lo rebajen.',
    options: [
      opt('rebajar', 'Aceptar la rebaja', [money(-60000), rel('board', 10), rel('fans', 6), tendency('lealtad', 5)], { result: 'Gracias a gestos así, el club sobrevive.' }),
      opt('no', 'Negarte', [rel('board', -6), rel('fans', -4)], { result: 'Te señalan como egoísta.' }),
      opt('aplazar', 'Proponer cobrar más tarde', [rel('board', 5)], { result: 'Solución intermedia. Todos contentos.' }),
    ],
  }),
  ev({
    id: 'ct-asesor', category: 'personal', stages: PRO, phases: ['seasonEnd'], weight: 6, once: true, requires: [minAge(20)], speaker: 'family',
    title: 'Un asesor financiero',
    text: 'Tu padre insiste en que contrates a un asesor para no acabar arruinado como tantos futbolistas.',
    options: [
      opt('si', 'Contratarlo', [money(-10000), family(5), flag('financialAdvisor')], { result: 'Por primera vez sabes en qué gastas el dinero.' }),
      opt('no', 'Tú sabes administrarte', [tendency('ego', 2)], { result: 'Ya veremos.' }),
    ],
  }),
  ev({
    id: 'ct-asesor-beneficio', category: 'personal', stages: SENIOR, phases: ['seasonEnd'], weight: 6, cooldownSeasons: 3, requires: [hasFlag('financialAdvisor')], speaker: 'narrator',
    title: 'Buenas inversiones',
    text: 'Tu asesor te presenta el resultado de sus inversiones este año.',
    options: [
      opt('reinvertir', 'Reinvertir todo', [], { roll: roll(0.7, { text: 'Tu patrimonio sigue creciendo.', effects: [money(150000)] }, { text: 'Año flojo en los mercados.', effects: [money(20000)] }) }),
      opt('cobrar', 'Sacar los beneficios', [money(60000), family(3)], { result: 'Un viaje con toda la familia.' }),
    ],
  }),

  /* ── Selección ───────────────────────────────────── */
  ev({
    id: 'sl-sub21', category: 'nationalTeam', stages: YOUNG, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [minAge(18), maxAge(21), minOverall(60)], speaker: 'coach',
    title: 'Convocatoria sub-21',
    text: 'Te llaman de la selección sub-21. Coincide con un partido importante de tu club.',
    options: [
      opt('ir', 'Ir con la selección', [rep('national', 3), flag('youthInternational'), rel('coach', -2)], { result: 'Debutas con la camiseta de tu país. Piel de gallina.' }),
      opt('club', 'Pedir quedarte en el club', [rel('coach', 5), rep('national', -1)], { result: 'Tu club te lo agradece con minutos.' }),
    ],
  }),
  ev({
    id: 'sl-himno', category: 'nationalTeam', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [{ type: 'internationalCaps', min: 1 }], speaker: 'press',
    title: 'El himno',
    text: 'Una polémica en las redes: te acusan de no cantar el himno en el último partido.',
    options: [
      opt('explicar', 'Explicar que te concentras así', [rep('national', 1)], { result: 'La mayoría lo entiende.' }),
      opt('cantar', 'Cantarlo a pleno pulmón la próxima vez', [rel('fans', 3), followers(3)], { result: 'Polémica zanjada.' }),
      opt('ignorar', 'Ignorar la polémica', [], { result: 'Se olvida en una semana.' }),
    ],
  }),
  ev({
    id: 'sl-veterano-retirada', category: 'nationalTeam', stages: ['veteran'], phases: ['seasonEnd'], weight: 6, once: true, requires: [minAge(32), { type: 'internationalCaps', min: 20 }, noFlag('ntRetired')], speaker: 'press',
    title: '¿Dejar la selección?',
    text: 'Te preguntan si piensas retirarte de la selección para alargar tu carrera en el club.',
    options: [
      opt('retirarse', 'Anunciar tu retirada internacional', [flag('ntRetired'), fitness(8), rep('national', 2)], { result: 'Te despiden con un homenaje en el siguiente partido.', key: true }),
      opt('seguir', 'Mientras el seleccionador cuente contigo', [rep('national', 2), fitness(-3)], { result: 'La camiseta de tu país no se rechaza.' }),
    ],
  }),

  /* ── Cadenas de eventos ──────────────────────────── */
  ev({
    id: 'ch-promesa-abuelo', category: 'personal', stages: YOUNG, phases: HALVES, weight: 6, once: true, requires: [OUTFIELD], speaker: 'family',
    title: 'Una promesa',
    text: 'Tu abuelo te pide una cosa: «Cuando debutes en primera, dedícame el primer gol».',
    options: [
      opt('prometer', 'Prometérselo', [family(8), flag('grandpaPromise'), schedule('ch-promesa-cumplida', 2)], { result: 'Le das la mano como dos caballeros.' }),
      opt('reir', 'Reírte: «¡Primero tengo que debutar!»', [family(3)], { result: 'Él también se ríe.' }),
    ],
  }),
  ev({
    id: 'ch-promesa-cumplida', category: 'personal', stages: ['breakthrough', 'establishment', 'prime'], phases: HALVES, weight: 0, once: true, requires: [OUTFIELD, hasFlag('grandpaPromise')], speaker: 'family',
    title: 'La promesa',
    text: 'Te acuerdas de la promesa que le hiciste a tu abuelo. Hoy juegas en casa y él está en la grada.',
    options: [
      opt('dedicar', 'Buscar el gol para él', [], { roll: roll(0.4, { text: 'Marcas y corres hacia su asiento. Todo el estadio lo ve.', effects: [family(15), rel('fans', 8), morale(10), followers(6), news('La dedicatoria de {apodo} a su abuelo emociona al estadio', 'positive'), goal()] }, { text: 'Hoy no hay gol. Le das tu camiseta al acabar.', effects: [family(8)] }, 'finishing') }),
      opt('llamar', 'Llamarle a la grada antes del partido', [family(8), morale(4)], { result: 'Su sonrisa te acompaña los noventa minutos.' }),
    ],
  }),
  ev({
    id: 'ch-mentor-inicio', category: 'dressingRoom', stages: ['breakthrough'], phases: HALVES, weight: 8, once: true, requires: [], speaker: 'teammate',
    title: 'Un veterano te adopta',
    text: 'El veterano del equipo te propone entrenar con él por las tardes durante toda la temporada.',
    options: [
      opt('si', 'Aceptar', [rel('dressingRoom', 5), flag('mentored'), schedule('ch-mentor-final', 1)], { result: 'Empieza un año de aprendizaje.' }),
      opt('no', 'Preferir tu ritmo', [], { result: 'Le das las gracias.' }),
    ],
  }),
  ev({
    id: 'ch-mentor-final', category: 'dressingRoom', stages: ['breakthrough', 'establishment'], phases: ['seasonEnd'], weight: 0, once: true, requires: [hasFlag('mentored')], speaker: 'teammate',
    title: 'La despedida del mentor',
    text: 'Tu mentor se retira. Antes de irse, te regala sus botas y una libreta con sus apuntes de veinte años.',
    options: [
      opt('libreta', 'Estudiar la libreta', [group('mental', 1), attr('positioning', 2), potential(1)], { result: 'Cada página es una lección.', key: true }),
      opt('homenaje', 'Organizarle un homenaje en el vestuario', [rel('dressingRoom', 10), attr('leadership', 2)], { result: 'Llora como un niño.' }),
    ],
  }),
  ev({
    id: 'ch-apuesta-entrenador', category: 'coach', stages: PRO, phases: ['firstHalf'], weight: 6, cooldownSeasons: 4, requires: [OUTFIELD], speaker: 'coach',
    title: 'Una apuesta con el entrenador',
    text: '{entrenador} te reta: «Si haces diez goles o asistencias antes de Navidad, te dejo elegir el destino de la pretemporada».',
    options: [
      opt('aceptar', 'Aceptar el reto', [rel('coach', 4), flag('coachBet'), schedule('ch-apuesta-resultado', 0, 'winterWindow')], { result: 'Te frotas las manos.' }),
      opt('no', 'No te gustan las apuestas', [], { result: 'Se ríe: «Cobarde».' }),
    ],
  }),
  ev({
    id: 'ch-apuesta-resultado', category: 'coach', stages: PRO, phases: ['winterWindow'], weight: 0, once: false, cooldownSeasons: 1, requires: [OUTFIELD, hasFlag('coachBet')], speaker: 'coach',
    title: 'La apuesta',
    text: 'Llega Navidad. Toca saber quién ha ganado la apuesta con {entrenador}.',
    options: [
      opt('ganada', 'Reclamar el premio', [], { roll: roll(0.5, { text: 'Lo has conseguido. Pretemporada en la playa para todos.', effects: [rel('dressingRoom', 10), rel('coach', 5), morale(6), { type: 'flag', id: 'coachBet', value: false }] }, { text: 'Te faltan dos. Te toca invitar a cenar a la plantilla.', effects: [money(-4000), rel('dressingRoom', 5), { type: 'flag', id: 'coachBet', value: false }] }, 'finishing') }),
      opt('olvidar', 'Hacerte el despistado', [rel('coach', -2), { type: 'flag', id: 'coachBet', value: false }], { result: 'Él no lo olvida.' }),
    ],
  }),

  /* ── Vida y otros ────────────────────────────────── */
  ev({
    id: 'ot-casa-nueva', category: 'personal', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: [minMoney(150000)], speaker: 'narrator',
    title: 'Dónde vivir',
    text: 'Te mudas a una ciudad nueva. Puedes vivir en el centro, junto al estadio, o en una urbanización tranquila.',
    options: [
      opt('centro', 'En el centro', [followers(3), rel('fans', 3), fitness(-2)], { result: 'Te paran por la calle cada día.' }),
      opt('afueras', 'En las afueras', [fitness(3), morale(2), family(2)], { result: 'Silencio, jardín y siestas largas.' }),
    ],
  }),
  ev({
    id: 'ot-hobby', category: 'personal', stages: PRO, phases: ['seasonEnd', 'winterWindow'], weight: 8, once: true, requires: [], speaker: 'narrator',
    title: 'Un hobby',
    text: 'Necesitas desconectar del fútbol. ¿Qué afición eliges?',
    options: [
      opt('musica', 'Aprender a tocar la guitarra', [morale(6), attr('concentration', 1)], { result: 'Tocas en la fiesta de fin de temporada. Regular.' }),
      opt('ajedrez', 'Ajedrez', [attr('vision', 1), attr('composure', 1)], { result: 'Empiezas a ver el fútbol como un tablero.' }),
      opt('golf', 'Golf', [morale(4), money(-5000)], { result: 'El hobby oficial de los futbolistas.' }),
      opt('cocina', 'Cocina', [fitness(3), family(4)], { result: 'Tu pasta con verduras es legendaria en el vestuario.' }),
    ],
  }),
  ev({
    id: 'ot-mal-arbitro', category: 'media', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [], speaker: 'press',
    title: 'Arbitraje polémico',
    text: 'Os han anulado un gol legal y os han pitado un penalti inexistente. Los micrófonos te esperan.',
    options: [
      opt('cargar', 'Cargar contra el árbitro', [rel('fans', 5), rel('press', 3), money(-6000), tendency('temperamento', 3)], { result: 'Multa de la federación. Tu afición te aplaude.' }),
      opt('autocritica', 'Hacer autocrítica', [rel('coach', 4), tendency('temperamento', -3)], { result: '«Teníamos que haberlo dejado sentenciado antes».' }),
    ],
  }),
  ev({
    id: 'ot-jugador-joven-pregunta', category: 'dressingRoom', stages: SENIOR, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [minAge(25)], speaker: 'teammate',
    title: 'Un juvenil te pide consejo',
    text: 'Un chaval del filial te pregunta si debería aceptar una oferta millonaria de otro país o quedarse para debutar aquí.',
    options: [
      opt('quedarse', 'Aconsejarle que se quede', [tendency('lealtad', 3), rel('board', 3)], { result: 'Se queda. Debuta meses después.' }),
      opt('irse', 'Aconsejarle que se vaya', [tendency('ego', 1), rel('agent', 2)], { result: 'Se marcha. Te escribe cada mes.' }),
      opt('el', '«Decide tú; yo te apoyo»', [attr('leadership', 1), rel('dressingRoom', 4)], { result: 'Valora que respetes su decisión.' }),
    ],
  }),
  ev({
    id: 'ot-retirada-companero', category: 'dressingRoom', stages: SENIOR, phases: ['seasonEnd'], weight: 6, cooldownSeasons: 3, requires: [], speaker: 'teammate',
    title: 'Se retira un amigo',
    text: 'Tu mejor amigo en el vestuario anuncia su retirada por una lesión crónica.',
    options: [
      opt('homenaje', 'Organizarle un partido homenaje', [rel('dressingRoom', 8), rel('fans', 4), money(-8000)], { result: 'El estadio se llena para despedirle.' }),
      opt('negocio', 'Ofrecerle un trabajo en tu fundación o negocio', [family(3), tendency('solidaridad', 5)], { result: 'Nunca lo olvidará.' }),
    ],
  }),
  ev({
    id: 'ot-entrenamiento-abierto', category: 'social', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 2, requires: [], speaker: 'fans',
    title: 'Entrenamiento a puerta abierta',
    text: 'Miles de aficionados ven el entrenamiento de pretemporada. Al acabar, todos piden fotos.',
    options: [
      opt('fotos', 'Quedarte hasta la última foto', [rel('fans', 6), followers(3), fitness(-2)], { result: 'Dos horas de fotos bajo el sol.' }),
      opt('rapido', 'Unas pocas y a la ducha', [rel('fans', 1)], { result: 'Correcto.' }),
    ],
  }),
  ev({
    id: 'ot-lesion-larga-apoyo', category: 'injury', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [{ type: 'injured', value: true }], speaker: 'family',
    title: 'Una lesión larga',
    text: 'Te quedan meses de recuperación. Los días se hacen eternos.',
    options: [
      opt('familia', 'Volver a casa con tu familia', [family(10), morale(6)], { result: 'El cariño de casa acelera la cabeza.' }),
      opt('gimnasio', 'Vivir en el gimnasio del club', [group('physical', 1), { type: 'recovery', weeks: -1 }, rel('coach', 4)], { result: 'Vuelves con el cuerpo más fuerte que antes.' }),
      opt('estudiar', 'Ver partidos y estudiar táctica', [attr('vision', 1), attr('positioning', 1)], { result: 'Vuelves viendo el juego distinto.' }),
    ],
  }),
  ev({
    id: 'ot-premio-mes', category: 'media', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 2, requires: [{ type: 'form', min: 70 }], speaker: 'press',
    title: 'Jugador del mes',
    text: 'Te eligen mejor jugador del mes de la liga.',
    options: [
      opt('equipo', 'Compartirlo con el equipo', [rel('dressingRoom', 6), rep('national', 2)], { result: 'Foto con el trofeo y toda la plantilla.' }),
      opt('familia', 'Llevárselo a tu madre', [family(6), rep('national', 2)], { result: 'Lo pone en el salón, junto a tus fotos de niño.' }),
    ],
  }),
  ev({
    id: 'ot-cambio-agente-local', category: 'agent', stages: PRO, phases: ['seasonEnd'], weight: 5, once: true, requires: [{ type: 'hasAgent', value: false }], speaker: 'agent',
    title: 'Un representante',
    text: 'Te llaman varios agentes. Uno es un exjugador cercano; otro, una gran agencia.',
    options: [
      opt('cercano', 'El exjugador', [{ type: 'setAgent', profile: 'local' }, rel('agent', 8)], { result: 'Te entiende como nadie.' }),
      opt('agencia', 'La gran agencia', [{ type: 'setAgent', profile: 'top' }, rep('world', 1)], { result: 'Contactos en todo el mundo.' }),
      opt('solo', 'Seguir sin agente', [money(20000)], { result: 'Te ahorras su comisión.' }),
    ],
  }),
  ev({
    id: 'ot-partido-leyendas', category: 'retirement', stages: ['veteran'], phases: ['seasonEnd'], weight: 5, once: true, requires: [OUTFIELD, minAge(33)], speaker: 'narrator',
    title: 'El último baile',
    text: 'Te invitan a jugar contra las leyendas de tu club en un partido de exhibición.',
    options: [
      opt('jugar', 'Jugarlo con alegría', [rel('fans', 6), morale(6), followers(4)], { result: 'Marcas de tacón. El estadio ríe y aplaude.' }),
      opt('banquillo', 'Ir de entrenador de las leyendas', [flag('coachingBadges'), rel('press', 3)], { result: 'Descubres que te gusta dirigir.' }),
    ],
  }),
  ev({
    id: 'ot-video-analisis-rival', category: 'training', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Estudiar al rival',
    text: 'El analista te prepara un vídeo con los puntos débiles de tu par en el próximo partido.',
    options: [
      opt('estudiar', 'Verlo tres veces', [attr('concentration', 1)], { roll: roll(0.6, { text: 'Te sabes cada movimiento. Partidazo.', effects: [form(6), rel('coach', 3)] }, { text: 'El rival cambia el plan.', effects: [] }, 'vision') }),
      opt('no', 'Prefieres no pensar demasiado', [morale(2)], { result: 'Juegas suelto.' }),
    ],
  }),
];
