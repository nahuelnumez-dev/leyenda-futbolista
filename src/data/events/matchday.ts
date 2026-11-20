/** Eventos de día de partido, entrenamiento y vestuario (bloque de la Fase 11). */
import type { GameEvent } from '@/engine/types/events';
import { HALVES, PRO, SENIOR, attr, chance, ev, family, fitness, flag, followers, form, group, injury, minOverall, money, morale, news, opt, playingTime, rel, rep, roll, tendency } from './helpers';

export const MATCHDAY_EVENTS: GameEvent[] = [
  ev({
    id: 'md-diluvio', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 18, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Partido bajo el diluvio',
    text: 'Llueve como nunca en {estadio}. El balón se frena en los charcos y el rival defiende con diez detrás.',
    options: [
      opt('sencillo', 'Jugar sencillo: pase corto y balón al área', [rel('coach', 4), attr('teamwork', 1)], { result: 'Partido feo, pero sin errores tuyos.' }),
      opt('regate', 'Intentar el regate en cada balón', [], { roll: roll(0.45, { text: 'Un eslalon entre charcos acaba en gol. El vídeo da la vuelta al país.', effects: [rep('national', 3), followers(6), form(6)] }, { text: 'Te resbalas tres veces. La grada se ríe; tú no.', effects: [form(-5)] }, 'dribbling') }),
    ],
  }),
  ev({
    id: 'md-penalti-dudoso', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 20, cooldownSeasons: 2, requires: [], speaker: 'narrator',
    title: 'Penalti dudoso',
    text: 'El árbitro pita un penalti en contra por un contacto mínimo. El estadio arde y tus compañeros rodean al colegiado.',
    options: [
      opt('protestar', 'Protestar con todo', [tendency('temperamento', 6)], { roll: roll(0.5, { text: 'El árbitro solo te mira. Te libras de la tarjeta.', effects: [rel('fans', 4)] }, { text: 'Amarilla por protestar. Te perderás el próximo partido.', effects: [rel('coach', -6), money(-3000)] }, 'composure') }),
      opt('calmar', 'Calmar a tus compañeros', [attr('leadership', 2), tendency('temperamento', -5), rel('coach', 5)], { result: 'Evitas una expulsión. {entrenador} lo valora en la charla.' }),
    ],
  }),
  ev({
    id: 'md-var', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 18, cooldownSeasons: 2, requires: [{ type: 'positionGroup', in: ['forward', 'midfielder'] }], speaker: 'narrator',
    title: 'El VAR te anula un gol',
    text: 'Lo celebras con toda la grada… y el VAR lo anula por un fuera de juego de centímetros.',
    options: [
      opt('aceptar', 'Encogerte de hombros y seguir', [tendency('temperamento', -4), form(2)], { result: 'Diez minutos después marcas otro. Este sí vale.' }),
      opt('quejarse', 'Quejarte en la entrevista posterior', [tendency('temperamento', 5), rel('press', 3), money(-5000)], { result: 'La federación te multa por tus declaraciones.' }),
    ],
  }),
  ev({
    id: 'md-brazalete-provisional', category: 'dressingRoom', stages: ['breakthrough', 'establishment'], phases: HALVES, weight: 15, once: true, requires: [{ type: 'notFlag', id: 'captain' }, { type: 'age', min: 20 }], speaker: 'coach',
    title: 'Capitán por un día',
    text: '{capitan} está lesionado y {entrenador} te da el brazalete para el partido del domingo.',
    options: [
      opt('liderar', 'Dar la charla en el vestuario', [attr('leadership', 3), rel('dressingRoom', 6), tendency('carisma', 4)], { result: 'Hablas con el corazón. Ganáis.' }),
      opt('ejemplo', 'Liderar con el ejemplo, sin discursos', [attr('teamwork', 2), rel('coach', 4)], { result: 'No hace falta hablar cuando corres por todos.' }),
    ],
  }),
  ev({
    id: 'md-tangana', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 16, cooldownSeasons: 2, requires: [], speaker: 'narrator',
    title: 'Tangana',
    text: 'Una entrada fea a un compañero desata una tangana. Hay empujones por todas partes.',
    options: [
      opt('separar', 'Separar a los tuyos', [tendency('temperamento', -6), rel('coach', 5)], { result: 'Te quedas sin tarjeta. El árbitro te lo agradece con un gesto.' }),
      opt('entrar', 'Defender a tu compañero', [tendency('temperamento', 8), rel('dressingRoom', 6)], { roll: roll(0.55, { text: 'Solo amarilla. El vestuario te ve como uno más.', effects: [] }, { text: 'Roja. Dos partidos de sanción.', effects: [rel('coach', -8), injury(1, 2)] }) }),
    ],
  }),
  ev({
    id: 'md-ultimo-balon', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 22, cooldownSeasons: 1, requires: [], speaker: 'narrator',
    title: 'Último balón',
    text: 'Minuto 94, empate. El balón te cae en la frontal. Un compañero pide el pase por la derecha, solo.',
    options: [
      opt('chutar', 'Chutar', [], { roll: roll(0.35, { text: '¡Escuadra! Tres puntos y un estadio en éxtasis.', effects: [rel('fans', 10), form(8), morale(8), news('{apodo} gana el partido en el último minuto', 'positive')] }, { text: 'A las nubes. El compañero te mira con los brazos abiertos.', effects: [rel('dressingRoom', -5)] }, 'shooting') }),
      opt('pasar', 'Dar el pase', [], { roll: roll(0.45, { text: 'Gol de tu compañero. La asistencia es tuya.', effects: [rel('dressingRoom', 8), tendency('solidaridad', 4)] }, { text: 'Lo falla. Al menos elegiste bien.', effects: [rel('dressingRoom', 3)] }, 'vision') }),
    ],
  }),
  ev({
    id: 'md-cambio-descanso', category: 'coach', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Cambio táctico en el descanso',
    text: 'Vais perdiendo. En el descanso, {entrenador} te pide que juegues por dentro, en una posición que no conoces.',
    options: [
      opt('aceptar', 'Hacerlo lo mejor posible', [rel('coach', 8), group('mental', 1)], { result: 'Te cuesta, pero ayudas a remontar.' }),
      opt('discutir', 'Decirle que ahí no rindes', [rel('coach', -8), tendency('rebeldia', 6)], { result: 'Te sienta en el minuto 60.' }),
    ],
  }),
  ev({
    id: 'md-calor', category: 'training', stages: PRO, phases: ['preseason', 'firstHalf'], weight: 12, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: '38 grados',
    text: 'Pretemporada en pleno verano. El termómetro marca 38 grados y el preparador quiere doble sesión.',
    options: [
      opt('dosificar', 'Dosificarte e hidratarte', [fitness(5), tendency('profesionalidad', 4)], { result: 'Terminas entero.' }),
      opt('todo', 'Darlo todo para impresionar', [rel('coach', 5)], { roll: roll(0.6, { text: 'Aguantas. Eres el último en terminar los sprints.', effects: [attr('stamina', 2)] }, { text: 'Golpe de calor. Dos días de descanso obligado.', effects: [fitness(-15), injury(1, 1)] }, 'stamina') }),
    ],
  }),
  ev({
    id: 'md-viaje-largo', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 3, requires: [{ type: 'clubCountry', in: ['ARG', 'BRA'] }], speaker: 'narrator',
    title: 'Doce horas de viaje',
    text: 'El partido es en la otra punta del país: avión, escala y autobús. Llegas al hotel a medianoche.',
    options: [
      opt('descansar', 'Dormir todo lo posible', [fitness(6), form(2)], { result: 'Llegas fresco al partido.' }),
      opt('partida', 'Partida de cartas con el grupo', [rel('dressingRoom', 8), fitness(-4)], { result: 'Las risas valen más que dos horas de sueño. O eso piensas.' }),
    ],
  }),
  ev({
    id: 'md-altura', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 16, cooldownSeasons: 2, requires: [{ type: 'flag', id: 'continental' }, { type: 'clubCountry', in: ['ARG', 'BRA'] }], speaker: 'coach',
    title: 'Jugar en la altura',
    text: 'Partido continental a más de 2.800 metros. Al subir unas escaleras ya notas que te falta el aire.',
    options: [
      opt('aclimatar', 'Seguir el plan de aclimatación del médico', [tendency('profesionalidad', 4), fitness(4)], { result: 'Sufres, pero aguantas los noventa minutos.' }),
      opt('ignorar', 'Ignorarlo: un partido es un partido', [], { roll: roll(0.4, { text: 'Aguantas de milagro.', effects: [] }, { text: 'En el minuto 50 pides el cambio, mareado.', effects: [form(-6), rel('coach', -3)] }, 'stamina') }),
    ],
  }),
  ev({
    id: 'md-concurso-tiros', category: 'training', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 2, requires: [], speaker: 'teammate',
    title: 'Concurso de tiros al larguero',
    text: '{companero} te reta a un concurso de tiros al larguero al acabar el entrenamiento. El que pierda paga la cena del equipo.',
    options: [
      opt('aceptar', 'Aceptar el reto', [], { roll: roll(0.5, { text: 'Ganas por uno. La cena corre a su cuenta.', effects: [rel('dressingRoom', 6), attr('shooting', 1)] }, { text: 'Pierdes. La cena de 25 personas te sale cara.', effects: [money(-4000), rel('dressingRoom', 8)] }, 'shooting') }),
      opt('no', 'Irte a casa', [rel('dressingRoom', -3)], { result: '«Cagón», te llaman en el grupo de WhatsApp. Con cariño.' }),
    ],
  }),
  ev({
    id: 'md-videoanalisis', category: 'training', stages: PRO, phases: HALVES, weight: 15, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Sesión de vídeo',
    text: 'El analista del club ha preparado un vídeo con todos tus errores de las últimas semanas. Dura veinte minutos.',
    options: [
      opt('estudiar', 'Verlo entero y pedir más', [attr('concentration', 2), attr('positioning', 1), tendency('profesionalidad', 4)], { result: 'Duele, pero corriges dos vicios de golpe.' }),
      opt('saltar', 'Verlo por encima', [tendency('profesionalidad', -3)], { result: 'Los errores siguen ahí la semana siguiente.' }),
    ],
  }),
  ev({
    id: 'md-tanda-portero', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 30, cooldownSeasons: 2, requires: [{ type: 'position', in: ['POR'] }], speaker: 'narrator',
    title: 'Tanda de penaltis',
    text: 'Eliminatoria a penaltis. Te toca adivinar el lado en el quinto lanzamiento rival.',
    options: [
      opt('estudio', 'Fiarte del estudio previo del entrenador de porteros', [], { roll: roll(0.45, { text: '¡Lo paras! Te llevan a hombros.', effects: [rel('fans', 12), rep('national', 4), form(8)] }, { text: 'Te engaña. Fuera de la copa.', effects: [morale(-6)] }, 'reflexes') }),
      opt('instinto', 'Esperar hasta el último momento', [], { roll: roll(0.4, { text: '¡Paradón con la mano cambiada!', effects: [rel('fans', 12), rep('national', 4), followers(6)] }, { text: 'Ni te mueves. Gol.', effects: [morale(-6)] }, 'diving') }),
    ],
  }),
  ev({
    id: 'md-marcar-estrella', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 25, cooldownSeasons: 2, requires: [{ type: 'positionGroup', in: ['defender'] }], speaker: 'coach',
    title: 'Marcar a la estrella',
    text: '{entrenador} te encarga marcar al hombre en el partido contra {rival} a su mejor delantero.',
    options: [
      opt('pegajoso', 'Pegarte a él todo el partido', [], { roll: roll(0.5, { text: 'No toca un balón. Te ganas el elogio de la prensa.', effects: [rep('national', 4), rel('coach', 6), form(5)] }, { text: 'Se te escapa una vez. Suficiente para un gol.', effects: [form(-4)] }, 'positioning') }),
      opt('anticipar', 'Anticiparte y salir con el balón', [], { roll: roll(0.45, { text: 'Robas y sales jugando una y otra vez.', effects: [attr('composure', 1), form(4)] }, { text: 'Te gana la espalda en la primera.', effects: [rel('coach', -4)] }, 'concentration') }),
    ],
  }),
  ev({
    id: 'md-apuesta-joven', category: 'coach', stages: ['breakthrough'], phases: HALVES, weight: 22, cooldownSeasons: 2, requires: [minOverall(60)], speaker: 'coach',
    title: 'Titular en el partido grande',
    text: '{entrenador} te dice que el domingo serás titular contra {rival}. «No me falles».',
    options: [
      opt('seguro', 'Hacer lo que sabes, sin inventar', [rel('coach', 6), form(3)], { result: 'Buen partido. Cumples con nota.' }),
      opt('brillar', 'Querer comerte el mundo', [], { roll: roll(0.45, { text: 'Partidazo. Los periódicos te ponen un 9.', effects: [rep('national', 5), playingTime(4), form(8)] }, { text: 'Te pierdes en el partido y te cambian al descanso.', effects: [morale(-6), rel('coach', -3)] }, 'composure') }),
    ],
  }),
  ev({
    id: 'md-crioterapia', category: 'training', stages: SENIOR, phases: HALVES, weight: 12, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: 'La cámara de frío',
    text: 'El club ha instalado una cámara de crioterapia a -110 grados. El fisio te recomienda usarla cada día.',
    options: [
      opt('usar', 'Usarla cada día', [{ type: 'injuryProneness', delta: -4 }, fitness(5), tendency('profesionalidad', 3)], { result: 'Tres minutos de sufrimiento al día. Tus músculos lo agradecen.' }),
      opt('no', 'Prefieres el baño de hielo de siempre', [], { result: 'Hay cosas que no cambian.' }),
    ],
  }),
  ev({
    id: 'md-cantico', category: 'social', stages: PRO, phases: HALVES, weight: 16, once: true, requires: [{ type: 'relation', who: 'fans', min: 35 }], speaker: 'fans',
    title: 'Tu propio cántico',
    text: 'La grada de animación de {estadio} estrena un cántico con tu nombre. Lo cantan durante diez minutos seguidos.',
    options: [
      opt('agradecer', 'Ir a aplaudir al fondo al acabar', [rel('fans', 10), rep('local', 5), morale(6)], { result: 'Se te ponen los pelos de punta.' }),
      opt('humilde', 'Pedir que canten por el equipo', [rel('fans', 6), tendency('ego', -6)], { result: 'Te quieren todavía más.' }),
    ],
  }),
  ev({
    id: 'md-goleada-contra', category: 'media', stages: PRO, phases: HALVES, weight: 16, cooldownSeasons: 2, requires: [], speaker: 'press',
    title: 'Después de la goleada',
    text: 'Habéis perdido 5-0. Te toca hablar en zona mixta.',
    options: [
      opt('autocritica', 'Autocrítica total: «Hoy no merecemos esta camiseta»', [rel('fans', 6), rel('press', 4)], { result: 'La afición valora la sinceridad.' }),
      opt('arbitro', 'Culpar al árbitro', [rel('press', -6), rel('fans', -2), tendency('ego', 4)], { result: 'Las repeticiones no te dan la razón.' }),
      opt('silencio', 'No hablar', [rel('press', -3)], { result: 'Pasas de largo con los cascos puestos.' }),
    ],
  }),
  ev({
    id: 'md-lesion-companero', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 4, requires: [chance(0.6)], speaker: 'teammate',
    title: 'Una entrada de más',
    text: 'En un partidillo, una entrada tuya deja a {companero} con un esguince. Se perderá un mes.',
    options: [
      opt('disculpa', 'Pedirle perdón y visitarle en casa', [rel('dressingRoom', 6), tendency('solidaridad', 5)], { result: 'Os hacéis más amigos que antes.' }),
      opt('futbol', '«Es fútbol, estas cosas pasan»', [rel('dressingRoom', -8), tendency('ego', 4)], { result: 'Su mujer no te saluda en la cena del club.' }),
    ],
  }),
  ev({
    id: 'md-reto-goles', category: 'coach', stages: PRO, phases: ['preseason'], weight: 15, cooldownSeasons: 3, requires: [{ type: 'positionGroup', in: ['forward'] }], speaker: 'coach',
    title: 'El reto del míster',
    text: '{entrenador} te reta: si llegas a 15 goles, te invita a cenar con toda tu familia.',
    options: [
      opt('aceptar', 'Aceptar el reto', [rel('coach', 6), morale(5), flag('coachChallenge')], { result: 'Os dais la mano delante de todos.' }),
      opt('subir', '«Mejor 20, y que pague usted el viaje»', [rel('coach', 3), tendency('ego', 4), morale(6)], { result: 'Se ríe. «Trato hecho».' }),
    ],
  }),
  ev({
    id: 'md-concentracion', category: 'training', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: 'Concentración sin móviles',
    text: 'Antes del partido más importante del mes, {entrenador} prohíbe los móviles en la concentración.',
    options: [
      opt('cumplir', 'Cumplir a rajatabla', [tendency('profesionalidad', 5), rel('coach', 5), form(3)], { result: 'Hablas más con tus compañeros que en todo el año.' }),
      opt('esconder', 'Esconder un segundo móvil', [tendency('rebeldia', 6)], { roll: roll(0.6, { text: 'Nadie se entera.', effects: [] }, { text: 'Te pillan. Multa y banquillo.', effects: [money(-6000), rel('coach', -10)] }) }),
    ],
  }),
  ev({
    id: 'md-hermano', category: 'personal', stages: SENIOR, phases: ['preseason'], weight: 12, once: true, requires: [], speaker: 'family',
    title: 'Tu hermano pequeño',
    text: 'Tu hermano pequeño ha superado las pruebas de una cantera. Te pide consejo antes de empezar.',
    options: [
      opt('consejo', 'Sentarte con él una tarde entera', [family(12), tendency('solidaridad', 4)], { result: 'Le cuentas todo lo que te habría gustado saber a ti.' }),
      opt('regalo', 'Regalarle unas botas y decirle que disfrute', [family(6), money(-300)], { result: 'Las estrena al día siguiente. No se las quita ni para dormir.' }),
    ],
  }),
];

