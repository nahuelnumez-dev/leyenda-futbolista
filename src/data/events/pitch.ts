/** Eventos de campo, entrenamiento, vestuario y cuerpo técnico (ampliación v1.3). */
import type { GameEvent } from '@/engine/types/events';
import {
  ALL, HALVES, PRO, SENIOR, addTrait, attr, chance, ev, family, fitness, flag, followers, form, group, hasTrait, injury, maxAge, minAge,
  minOverall, money, morale, news, noFlag, opt, playingTime, potential, rel, rep, roll, tendency,
} from './helpers';

const FIELD = [{ type: 'positionGroup', in: ['forward', 'midfielder', 'defender'] }] as GameEvent['requires'];

export const PITCH_EVENTS: GameEvent[] = [
  /* ── Partido ─────────────────────────────────────── */
  ev({
    id: 'cp-penalti-decisivo', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 18, cooldownSeasons: 2, requires: FIELD, speaker: 'narrator',
    title: 'Penalti en el último minuto',
    text: 'Penalti a favor en el minuto 90. El lanzador habitual está en el banquillo y todos te miran a ti.',
    options: [
      opt('tirar', 'Coger el balón', [], { roll: roll(0.7, { text: 'Engañas al portero. Tres puntos.', effects: [rel('fans', 8), morale(6), form(5)] }, { text: 'Lo para. El estadio se queda mudo.', effects: [morale(-8), rel('fans', -4)] }, 'penalties') }),
      opt('ceder', 'Dárselo a {companero}', [rel('dressingRoom', 5), tendency('solidaridad', 4)], { roll: roll(0.65, { text: '{companero} lo mete y te abraza.', effects: [] }, { text: 'Lo falla. Nadie te culpa… en voz alta.', effects: [tendency('ego', -2)] }) }),
    ],
  }),
  ev({
    id: 'cp-panenka', category: 'keyMatch', stages: SENIOR, phases: HALVES, weight: 10, cooldownSeasons: 4, requires: [{ type: 'positionGroup', in: ['forward', 'midfielder'] }, minOverall(70)], speaker: 'narrator',
    title: '¿A lo Panenka?',
    text: 'Vas ganando 3-0 y te toca tirar un penalti. Te viene a la cabeza tirarlo a lo Panenka.',
    options: [
      opt('panenka', 'Picarla', [tendency('ego', 4)], { roll: roll(0.6, { text: 'Suave, por el centro. El vídeo se vuelve viral.', effects: [followers(10), rep('national', 2)] }, { text: 'El portero no se mueve y la atrapa. Te llueven memes.', effects: [rel('coach', -5), followers(3), morale(-4)] }, 'composure') }),
      opt('fuerte', 'Fuerte y a la escuadra', [tendency('profesionalidad', 2)], { result: 'Gol. Sin florituras.' }),
    ],
  }),
  ev({
    id: 'cp-gol-olimpico', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'attribute', id: 'crossing', min: 60 }], speaker: 'narrator',
    title: 'Córner con efecto',
    text: 'Te toca sacar un córner. El portero está adelantado y el viento sopla a favor.',
    options: [
      opt('directo', 'Buscar el gol olímpico', [], { roll: roll(0.15, { text: '¡Entra directo! Gol olímpico en {estadio}.', effects: [rep('national', 4), followers(12), news('Gol olímpico de {apodo}', 'positive')] }, { text: 'Se va fuera por poco. El entrenador suspira.', effects: [rel('coach', -2)] }, 'crossing') }),
      opt('jugada', 'Sacar la jugada ensayada', [rel('coach', 4), attr('teamwork', 1)], { result: 'Remate de cabeza al larguero. Bien ejecutada.' }),
    ],
  }),
  ev({
    id: 'cp-chilena', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 9, cooldownSeasons: 3, requires: [{ type: 'positionGroup', in: ['forward'] }], speaker: 'narrator',
    title: 'Centro a tu espalda',
    text: 'Te llega un centro algo pasado, a la espalda, en el punto de penalti.',
    options: [
      opt('chilena', 'Intentar la chilena', [], { roll: roll(0.3, { text: '¡Chilena a la red! El gol de la temporada.', effects: [rep('national', 4), followers(15), form(8), news('La chilena de {apodo}, gol del año', 'positive')] }, { text: 'Le das al aire y caes de espaldas.', effects: [fitness(-4)] }, 'agility') }),
      opt('controlar', 'Controlar y buscar el pase', [attr('ballControl', 1), rel('coach', 2)], { result: 'Juegas sencillo y la jugada sigue viva.' }),
    ],
  }),
  ev({
    id: 'cp-hat-trick-cerca', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'positionGroup', in: ['forward', 'midfielder'] }], speaker: 'narrator',
    title: 'A un gol del hat-trick',
    text: 'Llevas dos goles. Minuto 85, contraataque de dos contra el portero; tu compañero está mejor colocado.',
    options: [
      opt('egoista', 'Ir a por el tercero', [tendency('ego', 5)], { roll: roll(0.45, { text: '¡Hat-trick! Te llevas el balón a casa.', effects: [morale(10), rep('local', 3), flag('firstHatTrick')] }, { text: 'El portero la saca. Tu compañero no te habla en el vestuario.', effects: [rel('dressingRoom', -6)] }, 'finishing') }),
      opt('pase', 'Pasarla', [rel('dressingRoom', 7), tendency('solidaridad', 5)], { result: 'Gol a puerta vacía. Te lo agradece con una reverencia.' }),
    ],
  }),
  ev({
    id: 'cp-expulsion-rival', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [], speaker: 'narrator',
    title: 'Te provocan',
    text: 'Un defensa rival te pisa, te insulta y te tira del pelo en cada córner. Quiere que pierdas los papeles.',
    options: [
      opt('fingir', 'Exagerar la próxima falta', [tendency('ego', 2)], { roll: roll(0.5, { text: 'Segunda amarilla para él. La grada rival te silba todo el partido.', effects: [rel('fans', 3)] }, { text: 'El árbitro te saca la amarilla por simular.', effects: [rel('press', -4), tendency('temperamento', 2)] }) }),
      opt('ignorar', 'Ignorarle y jugar', [tendency('temperamento', -5), attr('composure', 1)], { result: 'Le ganas la partida sin decir una palabra.' }),
      opt('devolver', 'Devolvérsela', [tendency('temperamento', 7)], { roll: roll(0.35, { text: 'Nadie lo ve. Pero ya no te molesta más.', effects: [] }, { text: 'Roja directa. Tres partidos de sanción.', effects: [rel('coach', -10), playingTime(-8), money(-6000)] }) }),
    ],
  }),
  ev({
    id: 'cp-remontada', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 14, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Perdiendo 0-2 al descanso',
    text: 'Vais perdiendo 0-2 al descanso. En el vestuario, nadie dice nada.',
    options: [
      opt('hablar', 'Levantarte y hablar', [attr('leadership', 2), tendency('carisma', 4)], { roll: roll(0.4, { text: 'Remontada épica: 3-2. Todos recuerdan tu discurso.', effects: [rel('dressingRoom', 10), rel('fans', 6), morale(8)] }, { text: 'Empatáis a dos. No está mal.', effects: [rel('dressingRoom', 4)] }, 'leadership') }),
      opt('callar', 'Dejar hablar al entrenador', [rel('coach', 3)], { result: 'Perdéis 1-2. Al menos lo intentasteis.' }),
    ],
  }),
  ev({
    id: 'cp-lesion-companero', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Compañero en el suelo',
    text: '{companero} se ha caído mal y se retuerce de dolor. El rival ha seguido jugando y ya está en tu área.',
    options: [
      opt('fuera', 'Echar el balón fuera en cuanto lo tengas', [tendency('solidaridad', 5), rel('dressingRoom', 5), rep('national', 1)], { result: 'Juego limpio. Hasta la grada rival aplaude.' }),
      opt('seguir', 'Seguir la jugada: el árbitro decide', [tendency('solidaridad', -3)], { result: 'Marcáis en esa jugada. Hay polémica en las redes.' }),
    ],
  }),
  ev({
    id: 'cp-portero-adelantado', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: FIELD, speaker: 'narrator',
    title: 'El portero, fuera del área',
    text: 'Recuperas el balón en tu campo y ves al portero rival muy adelantado.',
    options: [
      opt('lejos', 'Chutar desde el centro del campo', [], { roll: roll(0.2, { text: 'Gol desde el centro del campo. Imposible de olvidar.', effects: [followers(14), rep('national', 4), form(6)] }, { text: 'Se queda corto. Contraataque del rival.', effects: [rel('coach', -3)] }, 'longPassing') }),
      opt('conducir', 'Conducir y combinar', [attr('vision', 1)], { result: 'Llegáis con ventaja y ganáis un córner.' }),
    ],
  }),
  ev({
    id: 'cp-jugar-dolor', category: 'injury', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [{ type: 'injured', value: false }], speaker: 'coach',
    title: 'Molestias en el muslo',
    text: 'Notas un pinchazo en el muslo en el calentamiento. Hoy es un partido importante.',
    options: [
      opt('jugar', 'Jugar igualmente', [rel('coach', 5)], { roll: roll(0.55, { text: 'Aguantas y cumples.', effects: [rel('fans', 3)] }, { text: 'Rotura fibrilar en el minuto 30.', effects: [injury(2, 4)] }, 'stamina') }),
      opt('avisar', 'Avisar al médico', [tendency('profesionalidad', 4), fitness(5)], { result: 'Te quedas fuera, pero sin riesgo.' }),
    ],
  }),
  ev({
    id: 'cp-portero-penalti', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 18, cooldownSeasons: 2, requires: [{ type: 'position', in: ['POR'] }], speaker: 'narrator',
    title: 'Penalti en contra',
    text: 'Penalti en contra en el descuento. El lanzador es zurdo y suele tirar a su derecha.',
    options: [
      opt('estudiar', 'Tirarte a su lado preferido', [], { roll: roll(0.35, { text: '¡Lo paras! Te llevan a hombros.', effects: [rel('fans', 10), rep('local', 3), morale(8)] }, { text: 'Te engaña y tira al otro lado.', effects: [morale(-3)] }, 'diving') }),
      opt('esperar', 'Aguantar hasta el final', [], { roll: roll(0.3, { text: 'Tira al centro y la atrapas sin moverte.', effects: [rel('fans', 8), attr('composure', 1)] }, { text: 'Entra pegado al palo. Imparable.', effects: [] }, 'reflexes') }),
    ],
  }),
  ev({
    id: 'cp-portero-salida', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [{ type: 'position', in: ['POR'] }], speaker: 'narrator',
    title: 'Balón dividido',
    text: 'Un pase largo cae entre tu central y el delantero rival. Puedes salir o quedarte en la línea.',
    options: [
      opt('salir', 'Salir a por todas', [], { roll: roll(0.6, { text: 'Despejas con el pie justo a tiempo.', effects: [rel('coach', 4), attr('rushingOut', 1)] }, { text: 'Te regatea y marca a puerta vacía.', effects: [rel('fans', -5), form(-5)] }, 'rushingOut') }),
      opt('quedarse', 'Quedarte bajo palos', [], { roll: roll(0.5, { text: 'Tu central llega y corta.', effects: [] }, { text: 'Remata solo. Gol.', effects: [form(-3)] }, 'gkPositioning') }),
    ],
  }),
  ev({
    id: 'cp-portero-saque', category: 'training', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [{ type: 'position', in: ['POR'] }], speaker: 'coach',
    title: 'Jugar con los pies',
    text: '{entrenador} quiere que el equipo salga jugando desde atrás y te pide arriesgar con el balón.',
    options: [
      opt('practicar', 'Quedarte después de entrenar a practicar', [attr('kicking', 2), attr('shortPassing', 1), rel('coach', 5)], { result: 'En dos semanas ya juegas como un defensa más.' }),
      opt('pelotazo', 'Explicarle que prefieres el pelotazo', [rel('coach', -5), tendency('rebeldia', 3)], { result: 'Te mira serio. «Aquí se juega así».' }),
    ],
  }),
  ev({
    id: 'cp-defensa-marcaje', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 2, requires: [{ type: 'positionGroup', in: ['defender'] }], speaker: 'coach',
    title: 'Marcar a la estrella',
    text: 'El rival tiene al máximo goleador de la liga. {entrenador} te pide marcarle al hombre todo el partido.',
    options: [
      opt('pegajoso', 'Pegarte a él como una sombra', [], { roll: roll(0.55, { text: 'No le dejas ni rematar. Los periódicos te ponen un 9.', effects: [rep('national', 3), rel('coach', 6), attr('positioning', 1)] }, { text: 'Se te escapa una vez y marca.', effects: [form(-3)] }, 'concentration') }),
      opt('duro', 'Ser duro desde el principio', [tendency('temperamento', 4)], { roll: roll(0.5, { text: 'Le intimidas y desaparece del partido.', effects: [rel('coach', 4)] }, { text: 'Amarilla en el minuto 10 y tienes que aflojar.', effects: [rel('coach', -3)] }, 'aggression') }),
    ],
  }),
  ev({
    id: 'cp-defensa-gol-cabeza', category: 'keyMatch', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'positionGroup', in: ['defender'] }], speaker: 'narrator',
    title: 'Subes al remate',
    text: 'Último córner del partido y vais empatando. {entrenador} manda subir a todos.',
    options: [
      opt('primer-palo', 'Atacar el primer palo', [], { roll: roll(0.3, { text: '¡Gol de cabeza! El central salvador.', effects: [rel('fans', 8), form(6), morale(6)] }, { text: 'La toca antes el portero.', effects: [] }, 'heading') }),
      opt('cubrir', 'Quedarte atrás por si hay contra', [rel('coach', 3), attr('positioning', 1)], { result: 'Cortas el contraataque. Partido serio.' }),
    ],
  }),
  ev({
    id: 'cp-capitan-arbitro', category: 'keyMatch', stages: SENIOR, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'flag', id: 'captain' }], speaker: 'narrator',
    title: 'Hablar con el árbitro',
    text: 'Como capitán, el árbitro te llama para que calmes a tu equipo o empezará a sacar tarjetas.',
    options: [
      opt('mediar', 'Pedir calma a tus compañeros', [attr('leadership', 2), rel('coach', 3)], { result: 'El partido se tranquiliza.' }),
      opt('defender', 'Defender a tu equipo frente al árbitro', [rel('dressingRoom', 5), tendency('temperamento', 3)], { result: 'Amarilla para ti, pero el equipo se siente respaldado.' }),
    ],
  }),
  ev({
    id: 'cp-suplente-minutos', category: 'coach', stages: ['breakthrough', 'establishment'], phases: HALVES, weight: 14, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Cinco minutos',
    text: 'Sales en el minuto 85 con el partido decidido. {entrenador} te dice: «Disfruta».',
    options: [
      opt('lucirse', 'Intentar algo espectacular', [], { roll: roll(0.4, { text: 'Un caño y un pase de gol. La grada corea tu nombre.', effects: [rel('fans', 6), playingTime(4)] }, { text: 'Pierdes el balón dos veces. Nadie se acuerda.', effects: [] }, 'dribbling') }),
      opt('orden', 'Hacer lo que pide el equipo', [rel('coach', 4), tendency('profesionalidad', 2)], { result: 'Cumples sin brillar.' }),
    ],
  }),
  ev({
    id: 'cp-titular-sorpresa', category: 'coach', stages: ['breakthrough'], phases: HALVES, weight: 12, once: true, requires: [], speaker: 'coach',
    title: 'Titular por sorpresa',
    text: 'Una gripe deja al titular en casa. {entrenador} te avisa dos horas antes: «Hoy juegas tú».',
    options: [
      opt('calma', 'Seguir tu rutina como si nada', [attr('composure', 2)], { roll: roll(0.55, { text: 'Partidazo. Te ganas otra oportunidad.', effects: [playingTime(8), rel('coach', 6)] }, { text: 'Correcto, sin más.', effects: [playingTime(2)] }, 'composure') }),
      opt('nervios', 'Llamar a casa para calmar los nervios', [family(5)], { result: 'Tu madre te tranquiliza. Juegas con el corazón en un puño.' }),
    ],
  }),
  ev({
    id: 'cp-gol-ex', category: 'keyMatch', stages: SENIOR, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [{ type: 'careerStat', stat: 'clubs', min: 2 }], speaker: 'narrator',
    title: 'Gol a tu exequipo',
    text: 'Marcas contra tu antiguo club, en su estadio. Su afición te recibió con aplausos.',
    options: [
      opt('no-celebrar', 'No celebrarlo, por respeto', [tendency('lealtad', 4), rep('national', 2)], { result: 'Te aplauden hasta los rivales.' }),
      opt('celebrar', 'Celebrarlo con todo', [tendency('ego', 4), rel('fans', 4)], { result: 'Tu afición te adora; la rival ya no.' }),
    ],
  }),
  ev({
    id: 'cp-partido-benefico', category: 'social', stages: SENIOR, phases: ['preseason', 'seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Partido benéfico',
    text: 'Te invitan a un partido benéfico con leyendas y famosos. Coincide con tus vacaciones.',
    options: [
      opt('ir', 'Ir y jugar', [rep('national', 2), followers(4), tendency('solidaridad', 5), fitness(-3)], { result: 'Recaudáis medio millón para un hospital infantil.' }),
      opt('donar', 'Donar, pero no ir', [money(-10000), tendency('solidaridad', 2), family(4)], { result: 'Pasas las vacaciones con tu familia.' }),
    ],
  }),
  ev({
    id: 'cp-tarjeta-ciclo', category: 'ethics', stages: PRO, phases: ['firstHalf'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'teammate',
    title: 'Forzar la tarjeta',
    text: 'Estás a una amarilla de la sanción. {companero} te sugiere forzarla hoy para limpiar el ciclo antes del derbi.',
    options: [
      opt('forzar', 'Forzarla', [tendency('profesionalidad', -3)], { roll: roll(0.7, { text: 'Nadie lo nota. Llegas limpio al derbi.', effects: [] }, { text: 'El comité de competición te abre expediente.', effects: [money(-8000), rel('press', -5)] }) }),
      opt('no', 'Jugar limpio', [tendency('profesionalidad', 3)], { result: 'Llegas al derbi en el filo.' }),
    ],
  }),

  /* ── Entrenamiento ───────────────────────────────── */
  ev({
    id: 'en-especialista-faltas', category: 'training', stages: ALL, phases: ['preseason', 'winterWindow'], weight: 10, cooldownSeasons: 3, requires: FIELD, speaker: 'coach',
    title: 'Lanzador de faltas',
    text: 'El lanzador de faltas se ha marchado. {entrenador} busca un sustituto.',
    options: [
      opt('practicar', 'Quedarte cada día a tirar 50 faltas', [attr('freeKicks', 3), fitness(-3), tendency('profesionalidad', 3)], { result: 'A final de mes la clavas en la escuadra con los ojos cerrados.' }),
      opt('pasar', 'No es lo tuyo', [], { result: 'Se lo queda {companero}.' }),
    ],
  }),
  ev({
    id: 'en-gimnasio', category: 'training', stages: ALL, phases: ['preseason'], weight: 12, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Plan de gimnasio',
    text: 'El preparador físico te propone un plan de fuerza para ganar músculo este verano.',
    options: [
      opt('fuerza', 'Ganar fuerza', [attr('strength', 3), attr('agility', -1)], { result: 'Llegas a pretemporada con tres kilos más de músculo.' }),
      opt('explosividad', 'Trabajar la explosividad', [attr('acceleration', 2), attr('pace', 1)], { result: 'Arrancas más rápido que nunca.' }),
      opt('descanso', 'Descansar: el verano es para recargar', [morale(6), fitness(4)], { result: 'Vuelves fresco, aunque algo pesado.' }),
    ],
  }),
  ev({
    id: 'en-pierna-mala', category: 'training', stages: ['academy', 'breakthrough', 'establishment'], phases: HALVES, weight: 10, cooldownSeasons: 4, requires: [], speaker: 'coach',
    title: 'La pierna mala',
    text: 'Un ayudante te dice que si dominaras la otra pierna serías el doble de peligroso.',
    options: [
      opt('trabajar', 'Entrenarla todos los días', [attr('ballControl', 1), attr('shooting', 1), attr('shortPassing', 1), fitness(-2)], { result: 'Ya no te da miedo recibir por el otro lado.' }),
      opt('potenciar', 'Mejor perfeccionar tu pierna buena', [attr('finishing', 1)], { result: 'Si funciona, ¿por qué cambiarlo?' }),
    ],
  }),
  ev({
    id: 'en-video', category: 'training', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Sesión de vídeo',
    text: 'El analista del club te ofrece estudiar contigo tus partidos, jugada a jugada.',
    options: [
      opt('si', 'Aceptar y tomar notas', [attr('positioning', 2), attr('vision', 1), rel('coach', 3)], { result: 'Descubres que siempre te desmarcas tarde.' }),
      opt('no', 'Prefieres jugar por instinto', [tendency('rebeldia', 2)], { result: 'El analista se encoge de hombros.' }),
    ],
  }),
  ev({
    id: 'en-yoga', category: 'training', stages: ['establishment', 'prime', 'veteran'], phases: ['preseason', 'winterWindow'], weight: 8, cooldownSeasons: 4, requires: [minAge(26)], speaker: 'narrator',
    title: 'Yoga y pilates',
    text: 'Un veterano del vestuario jura que el yoga le ha alargado la carrera tres años.',
    options: [
      opt('probar', 'Apuntarte', [attr('agility', 1), fitness(6), { type: 'injuryProneness', delta: -3 }], { result: 'Al principio te duele todo. Después, nada.' }),
      opt('reir', 'Reírte de él', [rel('dressingRoom', -2)], { result: 'Él sigue jugando a los 37.' }),
    ],
  }),
  ev({
    id: 'en-nutricionista', category: 'training', stages: ALL, phases: ['preseason'], weight: 10, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Dieta estricta',
    text: 'El nutricionista del club te prepara una dieta sin azúcar ni fritos para toda la temporada.',
    options: [
      opt('cumplir', 'Cumplirla al pie de la letra', [fitness(8), attr('stamina', 1), tendency('profesionalidad', 4), morale(-2)], { result: 'Echas de menos las pizzas, pero vuelas.' }),
      opt('a-medias', 'Cumplirla entre semana', [fitness(3)], { result: 'Los domingos son sagrados.' }),
      opt('ignorar', 'Ignorarla', [tendency('profesionalidad', -4), fitness(-3)], { result: 'El nutricionista se queja al entrenador.' }),
    ],
  }),
  ev({
    id: 'en-entrenador-personal', category: 'training', stages: PRO, phases: ['preseason', 'seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [{ type: 'money', min: 40000 }], speaker: 'agent',
    title: 'Entrenador personal',
    text: '{agente} te recomienda contratar a un preparador privado para el verano. No es barato.',
    options: [
      opt('contratar', 'Contratarlo (30.000 €)', [money(-30000), group('physical', 1), fitness(8)], { result: 'Llegas a pretemporada en tu mejor forma.' }),
      opt('no', 'Entrenar por tu cuenta', [fitness(2)], { result: 'Corres por la playa. Algo es algo.' }),
    ],
  }),
  ev({
    id: 'en-pelea-entreno', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Entrada en el entrenamiento',
    text: '{companero} te hace una entrada durísima en un partidillo. Todos se paran a mirar.',
    options: [
      opt('encarar', 'Encararte con él', [tendency('temperamento', 6)], { roll: roll(0.5, { text: 'Os separan. Al día siguiente os pedís perdón.', effects: [rel('dressingRoom', 2)] }, { text: 'Acabáis a empujones y el club os multa.', effects: [money(-5000), rel('coach', -6)] }) }),
      opt('broma', 'Quitarle hierro con una broma', [rel('dressingRoom', 6), tendency('carisma', 3)], { result: 'Las risas cortan la tensión.' }),
    ],
  }),
  ev({
    id: 'en-ultimo-salir', category: 'training', stages: ['academy', 'breakthrough'], phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'El último en irse',
    text: '{entrenador} te ve quedarte a practicar solo cuando todos se han ido.',
    options: [
      opt('seguir', 'Seguir hasta que se haga de noche', [group('technical', 1), rel('coach', 6), fitness(-3)], { result: '«Así se llega», te dice al salir.' }),
      opt('irse', 'Irte con los demás a cenar', [rel('dressingRoom', 5)], { result: 'Hace falta grupo también.' }),
    ],
  }),
  ev({
    id: 'en-posicion-nueva', category: 'coach', stages: ['breakthrough', 'establishment'], phases: ['preseason'], weight: 8, cooldownSeasons: 5, requires: FIELD, speaker: 'coach',
    title: 'Una posición nueva',
    text: '{entrenador} cree que rendirías mejor una línea más atrás y quiere probarte allí en pretemporada.',
    options: [
      opt('probar', 'Probar', [attr('positioning', 2), attr('teamwork', 1), rel('coach', 6), playingTime(5)], { result: 'Te adaptas antes de lo esperado.' }),
      opt('negarse', 'Pedir seguir en tu sitio', [rel('coach', -4)], { result: 'Acepta, pero pierdes minutos.' }),
    ],
  }),
  ev({
    id: 'en-cantera-mentor', category: 'dressingRoom', stages: ['prime', 'veteran'], phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [minAge(28)], speaker: 'coach',
    title: 'Apadrinar a un canterano',
    text: 'Ha subido un chaval de 17 años con muchísimo talento. El club quiere que lo tomes bajo tu protección.',
    options: [
      opt('si', 'Acogerlo', [attr('leadership', 2), rel('dressingRoom', 5), rel('board', 4), tendency('solidaridad', 4)], { result: 'Te llama «maestro». Te hace gracia.' }),
      opt('no', 'Cada uno a lo suyo', [tendency('ego', 3)], { result: 'Acaba quitándote el puesto un año después.' }),
    ],
  }),
  ev({
    id: 'en-sesion-extra-gk', category: 'training', stages: ALL, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'position', in: ['POR'] }], speaker: 'coach',
    title: 'Sesión de reflejos',
    text: 'El entrenador de porteros quiere probar contigo una máquina que dispara balones a 120 km/h.',
    options: [
      opt('si', 'Ponerte delante', [attr('reflexes', 2), attr('diving', 1), fitness(-3)], { result: 'Acabas con las manos rojas, pero más rápido.' }),
      opt('no', 'Prefieres tu rutina', [], { result: 'La máquina se queda en el almacén.' }),
    ],
  }),
  ev({
    id: 'en-tecnologia', category: 'training', stages: PRO, phases: ['preseason'], weight: 6, cooldownSeasons: 5, requires: [], speaker: 'narrator',
    title: 'Gafas de realidad virtual',
    text: 'Una empresa ofrece al club gafas de realidad virtual para entrenar la toma de decisiones.',
    options: [
      opt('probar', 'Ser el primero en probarlas', [attr('vision', 2), attr('concentration', 1)], { result: 'Ves jugadas antes de que pasen.' }),
      opt('pasar', 'Nada como el césped', [], { result: 'Las prueban otros.' }),
    ],
  }),

  /* ── Vestuario y cuerpo técnico ──────────────────── */
  ev({
    id: 'vs-cumple-companero', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'teammate',
    title: 'Cumpleaños en el vestuario',
    text: 'Es el cumpleaños de {companero} y el grupo organiza una cena. Mañana hay entrenamiento a primera hora.',
    options: [
      opt('ir', 'Ir y volver pronto', [rel('dressingRoom', 6)], { result: 'Te marchas a medianoche. Equilibrio perfecto.' }),
      opt('quedarse', 'Quedarte hasta el final', [rel('dressingRoom', 9), fitness(-6), tendency('profesionalidad', -3)], { result: 'Nadie olvida esa noche. Tampoco el entrenamiento de al día siguiente.' }),
      opt('no-ir', 'Quedarte en casa', [fitness(3), rel('dressingRoom', -4)], { result: 'Te mandan fotos. No pareces echarlo de menos.' }),
    ],
  }),
  ev({
    id: 'vs-novatada', category: 'dressingRoom', stages: ['breakthrough'], phases: ['preseason', 'firstHalf'], weight: 12, once: true, requires: [], speaker: 'teammate',
    title: 'La canción del novato',
    text: 'Tradición del vestuario: el recién llegado canta una canción subido a una silla en la cena de pretemporada.',
    options: [
      opt('cantar', 'Cantar con todo', [rel('dressingRoom', 10), tendency('carisma', 4)], { result: 'Desafinas tanto que te ganas al grupo.' }),
      opt('negarse', 'Negarte', [rel('dressingRoom', -6), tendency('rebeldia', 3)], { result: 'Durante semanas te esconden las botas.' }),
    ],
  }),
  ev({
    id: 'vs-clan', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [], speaker: 'teammate',
    title: 'Dos bandos',
    text: 'El vestuario está partido en dos grupos: los veteranos y los recién llegados. Ambos te quieren de su lado.',
    options: [
      opt('veteranos', 'Juntarte con los veteranos', [rel('dressingRoom', 3), attr('composure', 1)], { result: 'Aprendes de los que más saben.' }),
      opt('nuevos', 'Juntarte con los nuevos', [rel('dressingRoom', 3), tendency('carisma', 2)], { result: 'Os hacéis inseparables.' }),
      opt('puente', 'Hacer de puente entre ambos', [attr('leadership', 2), tendency('solidaridad', 3)], { roll: roll(0.5, { text: 'Unes al grupo. El entrenador lo nota.', effects: [rel('dressingRoom', 8), rel('coach', 5)] }, { text: 'Ninguno se fía de ti.', effects: [rel('dressingRoom', -4)] }, 'leadership') }),
    ],
  }),
  ev({
    id: 'vs-filtracion', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Topo en el vestuario',
    text: 'Alguien filtra a la prensa la alineación y las broncas internas. El entrenador sospecha de todos.',
    options: [
      opt('investigar', 'Descubrir quién es', [], { roll: roll(0.4, { text: 'Lo descubres y se lo dices al capitán. Se acaban las filtraciones.', effects: [rel('coach', 6), rel('dressingRoom', 3)] }, { text: 'Señalas a quien no era. Lío monumental.', effects: [rel('dressingRoom', -8)] }, 'concentration') }),
      opt('apartarse', 'No meterte', [], { result: 'El asunto se apaga solo semanas después.' }),
    ],
  }),
  ev({
    id: 'vs-multa-retraso', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Llegas tarde',
    text: 'Un atasco te hace llegar veinte minutos tarde al autobús del equipo.',
    options: [
      opt('disculpa', 'Pedir disculpas delante de todos', [rel('coach', 2), money(-2000), tendency('profesionalidad', 2)], { result: 'Pagas la multa sin rechistar.' }),
      opt('excusa', 'Inventar una excusa', [], { roll: roll(0.5, { text: 'Cuela.', effects: [] }, { text: 'No cuela. Multa doble y bronca.', effects: [money(-4000), rel('coach', -6)] }) }),
    ],
  }),
  ev({
    id: 'vs-ayudante-promesa', category: 'coach', stages: PRO, phases: ['winterWindow'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: 'El entrenador, en la cuerda floja',
    text: 'La directiva está a punto de despedir a {entrenador}. Te preguntan en privado tu opinión.',
    options: [
      opt('apoyar', 'Defenderlo', [rel('coach', 10), rel('board', -4), tendency('lealtad', 4)], { result: 'Se salva por ahora. No lo olvidará.' }),
      opt('sincero', 'Decir que el grupo necesita un cambio', [rel('board', 5), rel('coach', -10)], { result: 'Le despiden. El nuevo entrenador llega con ideas distintas.' }),
      opt('neutral', 'No opinar', [], { result: 'Prefieres no mojarte.' }),
    ],
  }),
  ev({
    id: 'vs-nuevo-entrenador', category: 'coach', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 10, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: 'Entrenador nuevo',
    text: 'Llega un entrenador nuevo que no te conoce. Todos empiezan de cero.',
    options: [
      opt('reunion', 'Pedirle una reunión para presentarte', [rel('coach', 8), tendency('carisma', 2)], { result: 'Le gusta tu actitud.' }),
      opt('campo', 'Demostrarlo en el campo', [attr('concentration', 1)], { roll: roll(0.55, { text: 'En dos semanas eres fijo.', effects: [playingTime(8), rel('coach', 6)] }, { text: 'Tarda en fijarse en ti.', effects: [playingTime(-4)] }, 'teamwork') }),
    ],
  }),
  ev({
    id: 'vs-companero-depresion', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 7, cooldownSeasons: 4, requires: [], speaker: 'teammate',
    title: 'Un compañero que no está bien',
    text: '{companero} lleva semanas callado, sin ganas de nada. Una noche te cuenta que lo está pasando muy mal.',
    options: [
      opt('ayudar', 'Acompañarle a buscar ayuda profesional', [tendency('solidaridad', 6), rel('dressingRoom', 6), morale(-2)], { result: 'Meses después te da las gracias. Ha vuelto a sonreír.' }),
      opt('animar', 'Animarle a desconectar con el grupo', [rel('dressingRoom', 3)], { result: 'Ayuda un poco. No es suficiente, pero es algo.' }),
    ],
  }),
  ev({
    id: 'vs-idioma', category: 'dressingRoom', stages: PRO, phases: ['preseason', 'firstHalf'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'El fichaje que no habla el idioma',
    text: 'Ha llegado un fichaje extranjero que no entiende a nadie y come solo cada día.',
    options: [
      opt('acoger', 'Sentarte con él y ayudarle', [rel('dressingRoom', 5), tendency('solidaridad', 4), attr('teamwork', 1)], { result: 'Os entendéis por gestos. En el campo, a la perfección.' }),
      opt('ignorar', 'Ya aprenderá', [], { result: 'Tarda medio año en adaptarse.' }),
    ],
  }),
  ev({
    id: 'vs-premio-grupo', category: 'dressingRoom', stages: SENIOR, phases: ['seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [{ type: 'money', min: 100000 }], speaker: 'teammate',
    title: 'Regalo al personal',
    text: 'A final de temporada, los capitanes proponen hacer un regalo a utilleros, cocineros y fisios.',
    options: [
      opt('generoso', 'Poner más que nadie', [money(-20000), rel('dressingRoom', 6), tendency('solidaridad', 5)], { result: 'El utillero se emociona al abrir el sobre.' }),
      opt('igual', 'Poner lo mismo que todos', [money(-5000), rel('dressingRoom', 2)], { result: 'Detalle de grupo.' }),
    ],
  }),
  ev({
    id: 'vs-dorsal-veterano', category: 'dressingRoom', stages: ['breakthrough', 'establishment'], phases: ['preseason'], weight: 8, cooldownSeasons: 5, requires: [], speaker: 'teammate',
    title: 'El dorsal del veterano',
    text: 'Se retira un veterano del club y te ofrece heredar su dorsal histórico.',
    options: [
      opt('aceptar', 'Aceptarlo con orgullo', [rel('fans', 5), tendency('lealtad', 3), morale(4)], { result: 'La grada lo recibe con un aplauso.' }),
      opt('rechazar', 'Rechazarlo: es demasiado peso', [tendency('ego', -2)], { result: 'Sigues con tu número de siempre.' }),
    ],
  }),
  ev({
    id: 'vs-cambio-capitan', category: 'dressingRoom', stages: SENIOR, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: [noFlag('captain'), minAge(24), { type: 'seasonsAtClub', min: 2 }], speaker: 'coach',
    title: 'Votación de capitanes',
    text: 'El vestuario vota a los nuevos capitanes. Hay rumores de que tienes opciones.',
    options: [
      opt('campana', 'Hablar con los compañeros', [tendency('carisma', 3)], { roll: roll(0.45, { text: 'Te eligen tercer capitán.', effects: [flag('captain'), attr('leadership', 2), rel('dressingRoom', 4)] }, { text: 'Se queda en otro. Felicitas al elegido.', effects: [] }, 'leadership') }),
      opt('humilde', 'No hacer nada', [tendency('ego', -3)], { roll: roll(0.25, { text: 'Te eligen igualmente. Precisamente por no pedirlo.', effects: [flag('captain'), rel('dressingRoom', 5)] }, { text: 'No sales elegido.', effects: [] }) }),
    ],
  }),
  ev({
    id: 'vs-jugador-pesado', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [], speaker: 'teammate',
    title: 'Un compañero envidioso',
    text: 'Un compañero que ha perdido el puesto por ti habla mal de ti a tus espaldas.',
    options: [
      opt('hablar', 'Hablar con él a solas', [tendency('temperamento', -3), attr('composure', 1)], { roll: roll(0.6, { text: 'Os entendéis. Es duro estar en el banquillo.', effects: [rel('dressingRoom', 5)] }, { text: 'No quiere escucharte.', effects: [] }) }),
      opt('ignorar', 'Responder en el campo', [form(3)], { result: 'Tus actuaciones hablan por ti.' }),
      opt('entrenador', 'Contárselo al entrenador', [rel('coach', 2), rel('dressingRoom', -6)], { result: 'Se entera todo el vestuario. Quedas como chivato.' }),
    ],
  }),
  ev({
    id: 'vs-presidente-cena', category: 'coach', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 7, cooldownSeasons: 3, requires: [minOverall(70)], speaker: 'board',
    title: 'Cena con el presidente',
    text: 'El presidente te invita a cenar. Quiere saber qué piensas del proyecto deportivo.',
    options: [
      opt('franco', 'Ser franco: faltan fichajes', [rel('board', -2), rel('dressingRoom', 4)], { result: 'Toma nota. En verano llegan dos refuerzos.' }),
      opt('diplomatico', 'Elogiar el proyecto', [rel('board', 6)], { result: 'Sale encantado. Tus compañeros, no tanto.' }),
    ],
  }),
  ev({
    id: 'vs-psicologo', category: 'training', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'morale', max: 45 }], speaker: 'narrator',
    title: 'Psicólogo deportivo',
    text: 'Llevas una mala racha y el club te ofrece sesiones con el psicólogo deportivo.',
    options: [
      opt('aceptar', 'Aceptar', [morale(10), attr('composure', 2), tendency('profesionalidad', 2)], { result: 'Aprendes a soltar los errores.' }),
      opt('rechazar', 'Rechazarlo: estás bien', [morale(-2)], { result: 'La racha sigue un poco más.' }),
    ],
  }),
  ev({
    id: 'vs-veterano-consejo', category: 'dressingRoom', stages: ['academy', 'breakthrough'], phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [maxAge(21)], speaker: 'teammate',
    title: 'El consejo del veterano',
    text: 'El jugador más veterano te lleva aparte: «A tu edad yo creía que lo sabía todo. Escucha más».',
    options: [
      opt('escuchar', 'Escucharle con atención', [attr('composure', 1), attr('positioning', 1), tendency('ego', -3)], { result: 'Te cuenta cómo leer a los defensas. Oro puro.' }),
      opt('sonreir', 'Sonreír y seguir a lo tuyo', [tendency('ego', 3)], { result: 'Él también sonríe. Ya aprenderás.' }),
    ],
  }),
  ev({
    id: 'vs-talento-oculto', category: 'training', stages: ['academy'], phases: HALVES, weight: 6, once: true, requires: [], speaker: 'coach',
    title: 'El ojeador del primer equipo',
    text: 'Un técnico del primer equipo viene a ver un entrenamiento de juveniles sin avisar.',
    options: [
      opt('brillar', 'Darlo todo', [], { roll: roll(0.5, { text: 'Toma notas sobre ti. Te sentirás observado desde ahora.', effects: [potential(1), rel('coach', 4), morale(5)] }, { text: 'Tienes un mal día. Mala suerte.', effects: [morale(-3)] }, 'concentration') }),
      opt('normal', 'Entrenar como siempre', [tendency('profesionalidad', 2)], { result: 'La constancia también se ve.' }),
    ],
  }),
  ev({
    id: 'vs-lider-silencioso', category: 'dressingRoom', stages: SENIOR, phases: HALVES, weight: 6, once: true, requires: [hasTrait('timido')], speaker: 'coach',
    title: 'Liderar sin hablar',
    text: '{entrenador} te dice que el equipo te sigue aunque no hables. Quiere que des un paso al frente.',
    options: [
      opt('paso', 'Intentarlo', [attr('leadership', 3), tendency('carisma', 6)], { result: 'Te tiembla la voz, pero te escuchan.' }),
      opt('ejemplo', 'Seguir liderando con el ejemplo', [attr('teamwork', 2)], { result: 'Cada uno tiene su forma.' }),
    ],
  }),
  ev({
    id: 'vs-ritual', category: 'dressingRoom', stages: PRO, phases: HALVES, weight: 6, once: true, requires: [], speaker: 'narrator',
    title: 'Superstición',
    text: 'Llevas seis partidos marcando con las mismas espinilleras rotas. El utillero quiere tirarlas.',
    options: [
      opt('guardar', 'Ni hablar: siguen contigo', [morale(5), flag('lucky-shinpads')], { result: 'Las arreglas con cinta.' }),
      opt('tirar', 'Tirarlas: no eres supersticioso', [], { result: 'El domingo, sin espinilleras de la suerte, también marcas.' }),
    ],
  }),
  ev({
    id: 'vs-rival-interno', category: 'dressingRoom', stages: ['breakthrough', 'establishment'], phases: ['preseason'], weight: 10, cooldownSeasons: 3, requires: [], speaker: 'coach',
    title: 'Competencia por el puesto',
    text: 'El club ha fichado a un jugador de tu posición. {entrenador} dice que el puesto es de quien lo gane.',
    options: [
      opt('trabajar', 'Entrenar más que nunca', [group('physical', 1), tendency('profesionalidad', 4), fitness(-2)], { roll: roll(0.55, { text: 'Ganas el puesto en pretemporada.', effects: [playingTime(8)] }, { text: 'Empieza él. Te toca esperar.', effects: [playingTime(-6)] }, 'stamina') }),
      opt('amigo', 'Hacerte su amigo', [rel('dressingRoom', 5)], { result: 'Os repartís los minutos sin malos rollos.' }),
      opt('quejarse', 'Quejarte a tu agente', [rel('agent', 3), tendency('ego', 3)], { result: '{agente} empieza a escuchar ofertas.' }),
    ],
  }),
  ev({
    id: 'vs-fisio', category: 'injury', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'injured', value: true }], speaker: 'narrator',
    title: 'Recuperación',
    text: 'El fisio te propone un tratamiento intensivo dos veces al día para volver antes.',
    options: [
      opt('intensivo', 'Doble sesión', [{ type: 'recovery', weeks: -2 }, morale(-2)], { result: 'Vuelves dos semanas antes.' }),
      opt('calma', 'Sin prisa', [{ type: 'injuryProneness', delta: -2 }, morale(2)], { result: 'Vuelves cuando toca, sin recaídas.' }),
    ],
  }),
  ev({
    id: 'vs-recaida', category: 'injury', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [{ type: 'injured', value: true }], speaker: 'coach',
    title: 'Volver antes de tiempo',
    text: 'El equipo te necesita para el partido clave. Los médicos dicen que aún te falta una semana.',
    options: [
      opt('forzar', 'Jugar infiltrado', [rel('coach', 6), rel('fans', 4)], { roll: roll(0.5, { text: 'Aguantas y ayudas a ganar.', effects: [{ type: 'recovery', weeks: -1 }] }, { text: 'Recaída. Un mes más fuera.', effects: [injury(2, 4), { type: 'injuryProneness', delta: 4 }] }) }),
      opt('esperar', 'Hacer caso a los médicos', [tendency('profesionalidad', 3)], { result: 'Ves el partido desde la grada.' }),
    ],
  }),
  ev({
    id: 'vs-cambio-dieta-vegana', category: 'training', stages: PRO, phases: ['preseason'], weight: 5, once: true, requires: [minAge(24)], speaker: 'narrator',
    title: 'Cambio de alimentación',
    text: 'Lees que muchos atletas de élite han cambiado a una dieta basada en plantas.',
    options: [
      opt('probar', 'Probar una temporada', [fitness(4), followers(2)], { roll: roll(0.6, { text: 'Te recuperas antes de los partidos.', effects: [attr('stamina', 1)] }, { text: 'Te sientes sin fuerzas. Vuelves a lo de siempre.', effects: [fitness(-3)] }) }),
      opt('no', 'Mejor no tocar lo que funciona', [], { result: 'Sigues con el filete de los jueves.' }),
    ],
  }),
  ev({
    id: 'cp-derrota-dolorosa', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 10, cooldownSeasons: 2, requires: [], speaker: 'narrator',
    title: 'Goleada en contra',
    text: 'Perdéis 0-5 en casa. Al acabar, un grupo de aficionados os espera en el túnel.',
    options: [
      opt('dar-cara', 'Dar la cara ante ellos', [rel('fans', 6), attr('leadership', 1), morale(-3)], { result: 'Escuchas sus reproches en silencio. Te lo agradecen.' }),
      opt('salir', 'Salir por la puerta de atrás', [rel('fans', -4)], { result: 'En las redes os llaman cobardes.' }),
    ],
  }),
  ev({
    id: 'cp-record-club', category: 'keyMatch', stages: SENIOR, phases: ['secondHalf'], weight: 6, cooldownSeasons: 4, requires: [{ type: 'seasonStat', stat: 'goals', min: 15 }], speaker: 'press',
    title: 'A por el récord',
    text: 'Estás a dos goles del récord de goles del club en una temporada. Quedan tres partidos.',
    options: [
      opt('obsesion', 'Ir a por él a toda costa', [tendency('ego', 5)], { roll: roll(0.45, { text: '¡Récord batido! Tu nombre, en la historia del club.', effects: [rep('national', 3), rel('fans', 8), news('{apodo} bate el récord goleador del {club}', 'positive')] }, { text: 'Te quedas a uno. Y el equipo se resiente.', effects: [rel('dressingRoom', -4)] }, 'finishing') }),
      opt('equipo', 'Pensar solo en el equipo', [rel('dressingRoom', 4)], { roll: roll(0.25, { text: 'Lo bates sin buscarlo.', effects: [rel('fans', 8), rep('national', 2)] }, { text: 'No llega, pero el equipo acaba fuerte.', effects: [] }) }),
    ],
  }),
  ev({
    id: 'cp-golpe-cabeza', category: 'injury', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [{ type: 'injured', value: false }], speaker: 'narrator',
    title: 'Choque de cabezas',
    text: 'Un choque de cabezas te deja aturdido. El médico te pregunta en qué estadio estáis y dudas.',
    options: [
      opt('salir', 'Pedir el cambio', [tendency('profesionalidad', 4), fitness(-2)], { result: 'Protocolo de conmoción. Lo correcto.' }),
      opt('seguir', 'Seguir jugando', [rel('fans', 2)], { roll: roll(0.6, { text: 'Acabas el partido mareado, pero bien.', effects: [] }, { text: 'Te desplomas en el descanso. Dos semanas de baja.', effects: [injury(1, 2), rel('press', -2)] }) }),
    ],
  }),
  ev({
    id: 'cp-joven-prodigio-rival', category: 'keyMatch', stages: ['prime', 'veteran'], phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [minAge(29)], speaker: 'press',
    title: 'El niño que te admiraba',
    text: 'Un chaval rival de 18 años te pide la camiseta en el túnel antes del partido: «Eres mi ídolo».',
    options: [
      opt('dar', 'Prometérsela al acabar', [rep('national', 1), followers(3), tendency('solidaridad', 2)], { result: 'Os hacéis una foto que da la vuelta al mundo.' }),
      opt('picar', 'Decirle «Primero gánamela»', [tendency('ego', 3), tendency('carisma', 2)], { result: 'Os reís los dos. Te mete un caño en el primer minuto.' }),
    ],
  }),
  ev({
    id: 'en-pretemporada-exotica', category: 'training', stages: PRO, phases: ['preseason'], weight: 8, cooldownSeasons: 3, requires: [{ type: 'clubPrestige', min: 70 }], speaker: 'board',
    title: 'Gira de verano',
    text: 'El club organiza una gira de pretemporada por Asia y Estados Unidos: partidos, patrocinadores y mucho avión.',
    options: [
      opt('marketing', 'Volcarte con los actos de patrocinio', [followers(8), rel('board', 5), fitness(-5)], { result: 'Firmas mil camisetas. El jet lag te mata.' }),
      opt('futbol', 'Centrarte en ponerte a punto', [fitness(4), rel('coach', 3)], { result: 'Llegas al primer partido oficial como un tiro.' }),
    ],
  }),
  ev({
    id: 'en-lesion-leve-entreno', category: 'injury', stages: ALL, phases: ['preseason', 'firstHalf'], weight: 6, cooldownSeasons: 3, requires: [{ type: 'injured', value: false }, chance(0.6)], speaker: 'narrator',
    title: 'Torcedura de tobillo',
    text: 'Pisas mal un balón en el entrenamiento y el tobillo se te hincha.',
    options: [
      opt('hielo', 'Hielo y reposo', [injury(1, 1)], { result: 'Una semana fuera.' }),
      opt('vendaje', 'Vendarlo y seguir', [], { roll: roll(0.5, { text: 'Aguanta.', effects: [] }, { text: 'Se complica: esguince.', effects: [injury(2, 3)] }) }),
    ],
  }),
  ev({
    id: 'en-doble-sesion-veterano', category: 'training', stages: ['veteran'], phases: ['preseason'], weight: 10, cooldownSeasons: 2, requires: [minAge(32)], speaker: 'coach',
    title: 'El cuerpo ya no es el mismo',
    text: 'A tu edad, la pretemporada pesa. El preparador te ofrece un plan específico más suave.',
    options: [
      opt('suave', 'Aceptar el plan adaptado', [fitness(6), { type: 'injuryProneness', delta: -2 }], { result: 'Llegas sano al primer partido.' }),
      opt('igual', 'Entrenar como los jóvenes', [rel('dressingRoom', 4), fitness(-6)], { roll: roll(0.5, { text: 'Aguantas. Los jóvenes te respetan aún más.', effects: [attr('stamina', 1)] }, { text: 'Sobrecarga en el gemelo.', effects: [injury(1, 2)] }, 'stamina') }),
    ],
  }),
  ev({
    id: 'cp-afición-pancarta', category: 'social', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [{ type: 'relation', who: 'fans', min: 40 }], speaker: 'fans',
    title: 'Una pancarta con tu nombre',
    text: 'La grada de animación despliega una pancarta gigante con tu cara antes del partido.',
    options: [
      opt('agradecer', 'Ir a aplaudirles antes del calentamiento', [rel('fans', 6), tendency('carisma', 3)], { result: 'La foto es portada al día siguiente.' }),
      opt('concentrarse', 'Mantener la concentración', [form(3)], { result: 'Les das las gracias con un gol.' }),
    ],
  }),
  ev({
    id: 'cp-mvp-partido', category: 'media', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [{ type: 'form', min: 60 }], speaker: 'press',
    title: 'Jugador del partido',
    text: 'Te dan el premio al mejor jugador del partido. El periodista te pregunta a quién se lo dedicas.',
    options: [
      opt('familia', 'A tu familia', [family(6), followers(2)], { result: 'Tu madre lo ve en directo y llora.' }),
      opt('equipo', 'Al equipo', [rel('dressingRoom', 5)], { result: '«Esto es de todos».' }),
      opt('criticos', 'A los que dudaban de ti', [tendency('ego', 4), rel('press', -3), followers(4)], { result: 'Titular jugoso para la prensa.' }),
    ],
  }),
  ev({
    id: 'cp-talento-natural-reto', category: 'training', stages: ['breakthrough', 'establishment'], phases: HALVES, weight: 6, once: true, requires: [hasTrait('talento-natural')], speaker: 'coach',
    title: 'El talento no basta',
    text: '{entrenador} te dice delante de todos: «Con tu talento podrías ser el mejor, pero entrenas al 60 %».',
    options: [
      opt('reto', 'Aceptar el reto', [tendency('profesionalidad', 8), group('technical', 1), rel('coach', 6)], { result: 'Durante un mes no fallas a un solo ejercicio.' }),
      opt('orgullo', 'Responder que los partidos se ganan el domingo', [tendency('ego', 5), rel('coach', -6)], { result: 'Te deja en el banquillo el domingo.' }),
    ],
  }),
  ev({
    id: 'vs-trabajador-premio', category: 'coach', stages: PRO, phases: ['seasonEnd'], weight: 6, once: true, requires: [hasTrait('trabajador')], speaker: 'coach',
    title: 'El jugador más trabajador',
    text: 'El cuerpo técnico te da una placa interna: el que más ha trabajado de toda la plantilla.',
    options: [
      opt('agradecer', 'Agradecerlo con humildad', [rel('coach', 5), morale(5), tendency('ego', -2)], { result: 'La cuelgas en tu taquilla.' }),
      opt('broma', 'Bromear: «¿Y el sueldo cuándo?»', [rel('dressingRoom', 5), tendency('carisma', 2)], { result: 'Carcajada general.' }),
    ],
  }),
  ev({
    id: 'cp-afición-insultos', category: 'ethics', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Insultos racistas',
    text: 'Desde la grada rival lanzan insultos racistas a un compañero. Él está a punto de llorar.',
    options: [
      opt('parar', 'Pedir al árbitro que pare el partido', [tendency('solidaridad', 8), rep('world', 2), rel('dressingRoom', 8), news('{apodo} detiene el partido contra el racismo', 'positive')], { result: 'Se activa el protocolo. El estadio entero aplaude cuando vuelve a empezar.' }),
      opt('abrazar', 'Abrazarle y seguir jugando', [rel('dressingRoom', 4)], { result: 'Termináis el partido con un nudo en la garganta.' }),
    ],
  }),
  ev({
    id: 'cp-amistoso-pueblo', category: 'social', stages: PRO, phases: ['preseason'], weight: 6, cooldownSeasons: 4, requires: [], speaker: 'narrator',
    title: 'Amistoso en tu pueblo',
    text: 'El equipo juega un amistoso de verano cerca de {ciudadNatal}. Medio pueblo va a verte.',
    options: [
      opt('lucirse', 'Jugar para ellos', [rel('fans', 3), family(6), rep('local', 2)], { result: 'Golazo y vuelta al campo saludando a todos.' }),
      opt('firmas', 'Quedarte una hora firmando autógrafos', [family(4), tendency('solidaridad', 3), followers(2)], { result: 'Los niños del pueblo no olvidarán ese día.' }),
    ],
  }),
  ev({
    id: 'en-obsesion-mejora', category: 'training', stages: ['breakthrough', 'establishment'], phases: ['seasonEnd'], weight: 6, once: true, requires: [{ type: 'tendency', id: 'profesionalidad', min: 30 }], speaker: 'coach',
    title: 'Obsesionado con mejorar',
    text: 'Llevas meses siendo el primero en llegar y el último en irte. El cuerpo técnico lo ha notado.',
    options: [
      opt('seguir', 'Convertirlo en tu forma de ser', [addTrait('profesional'), rel('coach', 5)], { result: 'Ya no es un esfuerzo: es tu identidad.', key: true }),
      opt('aflojar', 'Aflojar un poco para no quemarte', [morale(6)], { result: 'Equilibrio. También cuenta.' }),
    ],
  }),
];
