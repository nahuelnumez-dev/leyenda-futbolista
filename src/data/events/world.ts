/** Eventos de prensa, redes, vida personal, mercado, selección y final de carrera (ampliación v1.3). */
import type { GameEvent } from '@/engine/types/events';
import {
  ALL, HALVES, PRO, SENIOR, attr, ev, family, fitness, flag, followers, form, hasFlag, injury, minAge, minMoney, minOverall,
  money, morale, news, noFlag, opt, rel, rep, roll, tendency,
} from './helpers';

export const WORLD_EVENTS: GameEvent[] = [
  /* ── Prensa ──────────────────────────────────────── */
  ev({
    id: 'pr-pregunta-trampa', category: 'media', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 2, requires: [], speaker: 'press',
    title: 'Pregunta trampa',
    text: '{periodista} te pregunta en rueda de prensa si el entrenador se equivoca dejando en el banquillo a {companero}.',
    options: [
      opt('evadir', '«Eso lo decide el míster»', [rel('coach', 3), rel('press', -1)], { result: 'Respuesta de manual.' }),
      opt('opinar', 'Dar tu opinión sincera', [rel('press', 5), rel('coach', -6), tendency('rebeldia', 3)], { result: 'Tu frase abre todos los programas deportivos.' }),
    ],
  }),
  ev({
    id: 'pr-entrevista-larga', category: 'media', stages: SENIOR, phases: ['preseason', 'winterWindow'], weight: 8, cooldownSeasons: 3, requires: [minOverall(68)], speaker: 'press',
    title: 'Entrevista a fondo',
    text: 'Un diario nacional quiere hacerte una entrevista de cuatro páginas sobre tu vida.',
    options: [
      opt('abrirse', 'Hablar de tu infancia y tu familia', [rel('press', 6), rep('national', 2), family(-2), followers(4)], { result: 'Emociona a medio país.' }),
      opt('futbol', 'Hablar solo de fútbol', [rel('press', 2)], { result: 'Correcta, aunque algo fría.' }),
      opt('rechazar', 'Rechazarla', [rel('press', -4)], { result: 'El diario publica igualmente un perfil tuyo, sin tu versión.' }),
    ],
  }),
  ev({
    id: 'pr-bulo', category: 'media', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [], speaker: 'press',
    title: 'Un bulo sobre ti',
    text: 'Una web publica que has discutido con el entrenador y quieres irte. Es mentira.',
    options: [
      opt('desmentir', 'Desmentirlo en las redes', [followers(2), rel('coach', 3)], { result: 'El bulo se apaga en un día.' }),
      opt('demandar', 'Pedir a tus abogados que actúen', [money(-8000), rel('press', -3)], { result: 'La web rectifica. Otras toman nota.' }),
      opt('ignorar', 'Ignorarlo', [], { roll: roll(0.5, { text: 'Nadie se lo cree.', effects: [] }, { text: 'Crece la bola y la afición te pregunta.', effects: [rel('fans', -4)] }) }),
    ],
  }),
  ev({
    id: 'pr-programa-tv', category: 'media', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 6, cooldownSeasons: 3, requires: [minOverall(72)], speaker: 'press',
    title: 'Invitado en la tele',
    text: 'Un programa de televisión de máxima audiencia te invita a un plató. No de deporte: de entretenimiento.',
    options: [
      opt('ir', 'Ir y divertirte', [followers(10), tendency('carisma', 5), rep('national', 2), rel('coach', -2)], { result: 'Bailas en directo. Récord de audiencia.' }),
      opt('no', 'Declinar', [tendency('profesionalidad', 2)], { result: 'Prefieres que hablen de ti por el fútbol.' }),
    ],
  }),
  ev({
    id: 'pr-critica-dura', category: 'media', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [{ type: 'form', max: 40 }], speaker: 'press',
    title: 'Te ponen un 1',
    text: 'Un periódico te pone un 1 y una columna te llama «el fichaje más caro del aire». Te duele.',
    options: [
      opt('responder', 'Contestar al columnista', [rel('press', -6), tendency('temperamento', 4), followers(3)], { result: 'La polémica dura una semana.' }),
      opt('callar', 'Recortar la columna y pegarla en tu taquilla', [morale(4), attr('concentration', 1)], { result: 'Motivación extra.' }),
    ],
  }),
  ev({
    id: 'pr-documental', category: 'media', stages: SENIOR, phases: ['preseason'], weight: 5, once: true, requires: [minOverall(78)], speaker: 'agent',
    title: 'Tu propio documental',
    text: 'Una plataforma de streaming quiere grabar una serie documental sobre tu temporada.',
    options: [
      opt('si', 'Aceptar las cámaras', [money(250000), followers(15), rep('world', 3), rel('dressingRoom', -4)], { result: 'Se estrena en 190 países. Al vestuario no le encantan las cámaras.' }),
      opt('no', 'Rechazarlo', [rel('dressingRoom', 2)], { result: 'Tu intimidad no está en venta.' }),
    ],
  }),
  ev({
    id: 'pr-libro', category: 'media', stages: ['veteran'], phases: ['seasonEnd'], weight: 5, once: true, requires: [minAge(31)], speaker: 'agent',
    title: 'Tu autobiografía',
    text: 'Una editorial te propone escribir tu autobiografía. Quieren polémica.',
    options: [
      opt('sincera', 'Contarlo todo, sin filtros', [money(150000), rel('press', 6), rel('dressingRoom', -6), followers(6)], { result: 'Superventas. Algunos excompañeros no vuelven a hablarte.' }),
      opt('amable', 'Una versión amable', [money(60000), rep('national', 1)], { result: 'Un libro bonito que lee tu familia.' }),
      opt('no', 'No es el momento', [], { result: 'Quizá cuando te retires.' }),
    ],
  }),

  /* ── Redes sociales ──────────────────────────────── */
  ev({
    id: 'rs-reto-viral', category: 'social', stages: ALL, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'social',
    title: 'Reto viral',
    text: 'Te retan en las redes a dar 100 toques con una naranja. Medio vestuario ya lo ha hecho.',
    options: [
      opt('hacerlo', 'Grabarlo', [], { roll: roll(0.6, { text: 'Lo consigues a la primera. Millones de reproducciones.', effects: [followers(10)] }, { text: 'Fallas en el 12. Aun así, risas.', effects: [followers(3)] }, 'ballControl') }),
      opt('pasar', 'No te va eso', [], { result: 'Sigues con lo tuyo.' }),
    ],
  }),
  ev({
    id: 'rs-troll', category: 'social', stages: PRO, phases: HALVES, weight: 10, cooldownSeasons: 2, requires: [], speaker: 'social',
    title: 'Mensajes de odio',
    text: 'Tras un mal partido recibes cientos de mensajes de odio, algunos contra tu familia.',
    options: [
      opt('denunciar', 'Denunciarlos públicamente', [rep('national', 1), followers(3), tendency('solidaridad', 3)], { result: 'La liga abre una campaña contra el acoso.' }),
      opt('desconectar', 'Desconectar unas semanas', [morale(4), followers(-2)], { result: 'Duermes mejor.' }),
      opt('contestar', 'Contestar uno por uno', [tendency('temperamento', 5), morale(-4)], { result: 'Error. Los mensajes se multiplican.' }),
    ],
  }),
  ev({
    id: 'rs-foto-fiesta', category: 'social', stages: PRO, phases: ['winterWindow'], weight: 8, cooldownSeasons: 3, requires: [], speaker: 'social',
    title: 'Foto comprometida',
    text: 'Circula una foto tuya en una fiesta a las 4 de la mañana, dos días antes de un partido.',
    options: [
      opt('explicar', 'Explicar que era una boda familiar', [], { roll: roll(0.6, { text: 'La gente lo entiende.', effects: [] }, { text: 'Nadie te cree.', effects: [rel('fans', -5), rel('coach', -4)] }) }),
      opt('disculpa', 'Pedir disculpas', [rel('fans', 2), rel('coach', 2), tendency('profesionalidad', 2)], { result: 'Dar la cara te honra.' }),
    ],
  }),
  ev({
    id: 'rs-canal', category: 'social', stages: PRO, phases: ['preseason', 'seasonEnd'], weight: 6, once: true, requires: [], speaker: 'social',
    title: 'Tu propio canal',
    text: 'Tus amigos te animan a abrir un canal de vídeos sobre tu día a día como futbolista.',
    options: [
      opt('abrir', 'Abrirlo', [followers(12), money(15000), flag('ownChannel'), fitness(-2)], { result: 'Cien mil suscriptores en una semana.' }),
      opt('no', 'Prefieres tu intimidad', [family(3)], { result: 'Tu vida es tuya.' }),
    ],
  }),
  ev({
    id: 'rs-videojuego', category: 'social', stages: SENIOR, phases: ['preseason'], weight: 6, cooldownSeasons: 3, requires: [minOverall(70)], speaker: 'social',
    title: 'Tu nota en el videojuego',
    text: 'Sale la nueva edición de un videojuego de fútbol y tu nota es más baja de lo que esperabas.',
    options: [
      opt('quejarse', 'Quejarte con humor', [followers(6), tendency('carisma', 3)], { result: 'La compañía te responde con un meme. Todos ríen.' }),
      opt('motivacion', 'Tomarlo como motivación', [morale(3), form(2)], { result: '«El año que viene me tendréis que subir».' }),
    ],
  }),
  ev({
    id: 'rs-gamer', category: 'personal', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Noches de consola',
    text: 'Te has enganchado a jugar en línea con tus compañeros hasta las tantas.',
    options: [
      opt('limitar', 'Ponerte un límite', [fitness(3), tendency('profesionalidad', 2)], { result: 'A las 23:00, consola apagada.' }),
      opt('seguir', 'Seguir jugando', [rel('dressingRoom', 4), fitness(-5)], { result: 'Eres el mejor del vestuario. En la consola.' }),
    ],
  }),

  /* ── Vida personal ───────────────────────────────── */
  ev({
    id: 'vp-casa-padres', category: 'personal', stages: SENIOR, phases: ['seasonEnd'], weight: 8, once: true, requires: [minMoney(300000)], speaker: 'family',
    title: 'Una casa para tus padres',
    text: 'Tus padres siguen viviendo en el piso de siempre. Ahora puedes cambiarles la vida.',
    options: [
      opt('comprar', 'Comprarles una casa', [money(-250000), family(15), morale(8)], { result: 'Tu madre no para de llorar.', key: true }),
      opt('reforma', 'Pagarles una reforma', [money(-60000), family(8)], { result: 'Prefieren seguir en su barrio, pero con cocina nueva.' }),
    ],
  }),
  ev({
    id: 'vp-pareja-mudanza', category: 'personal', stages: PRO, phases: ['seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [hasFlag('partner')], speaker: 'family',
    title: 'Tu pareja y su trabajo',
    text: 'A tu pareja le han ofrecido el trabajo de su vida en otra ciudad.',
    options: [
      opt('apoyar', 'Apoyarla aunque estéis lejos', [family(6), morale(-4)], { result: 'Muchos viajes, pero merece la pena.' }),
      opt('pedir', 'Pedirle que se quede', [family(-8), morale(2)], { result: 'Se queda, pero algo ha cambiado.' }),
    ],
  }),
  ev({
    id: 'vp-conocer', category: 'personal', stages: ['breakthrough', 'establishment', 'prime'], phases: ['seasonEnd', 'preseason', 'winterWindow'], weight: 8, once: true, requires: [minAge(19), noFlag('partner')], speaker: 'narrator',
    title: 'Alguien especial',
    text: 'En la boda de un amigo conoces a alguien que no tiene ni idea de fútbol. Hablas con esa persona toda la noche.',
    options: [
      opt('cita', 'Pedirle una cita', [flag('partner'), morale(8), family(4)], { result: 'Seis meses después ya vivís juntos.', key: true }),
      opt('carrera', 'Ahora solo cabe el fútbol', [tendency('profesionalidad', 2)], { result: 'Te quedas con la duda.' }),
    ],
  }),
  ev({
    id: 'vp-hijo', category: 'personal', stages: SENIOR, phases: ['firstHalf', 'secondHalf'], weight: 5, once: true, requires: [hasFlag('partner'), minAge(25)], speaker: 'family',
    title: 'Vas a ser padre',
    text: 'Tu pareja está embarazada. El parto coincide con un partido importante.',
    options: [
      opt('estar', 'Estar en el parto', [family(15), morale(10), rel('coach', -2), flag('parent')], { result: 'El momento más feliz de tu vida.', key: true }),
      opt('jugar', 'Jugar y volar justo después', [rel('coach', 4), family(-10), flag('parent')], { result: 'Llegas dos horas tarde.' }),
    ],
  }),
  ev({
    id: 'vp-amigo-infancia', category: 'personal', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 3, requires: [], speaker: 'family',
    title: 'El amigo de siempre',
    text: 'Tu mejor amigo de la infancia te pide dinero para montar un negocio en {ciudadNatal}.',
    options: [
      opt('prestar', 'Prestarle 50.000 €', [money(-50000)], { roll: roll(0.5, { text: 'El negocio funciona y te lo devuelve con creces.', effects: [money(70000), family(4)] }, { text: 'Fracasa. Pierdes el dinero, no la amistad.', effects: [morale(-3)] }) }),
      opt('no', 'Decirle que no', [family(-4)], { result: 'Os veis menos desde entonces.' }),
    ],
  }),
  ev({
    id: 'vp-coche', category: 'personal', stages: PRO, phases: ['preseason', 'seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [minMoney(200000)], speaker: 'narrator',
    title: 'El coche de tus sueños',
    text: 'Ves en un escaparate el deportivo con el que soñabas de niño.',
    options: [
      opt('comprar', 'Comprarlo', [money(-180000), morale(6), tendency('ego', 3), followers(3)], { result: 'Llegas al entrenamiento haciendo ruido.' }),
      opt('ahorrar', 'Ahorrar', [tendency('profesionalidad', 2)], { result: 'Tu asesor financiero sonríe.' }),
    ],
  }),
  ev({
    id: 'vp-inversion', category: 'personal', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [minMoney(500000)], speaker: 'agent',
    title: 'Una inversión',
    text: '{agente} te habla de invertir en una cadena de restaurantes o en criptomonedas.',
    options: [
      opt('restaurantes', 'Restaurantes', [money(-200000)], { roll: roll(0.65, { text: 'Abren con éxito. Ingresos estables.', effects: [money(320000)] }, { text: 'Cierran en un año.', effects: [money(60000)] }) }),
      opt('cripto', 'Criptomonedas', [money(-200000)], { roll: roll(0.35, { text: 'Se multiplica por tres.', effects: [money(600000)] }, { text: 'Se desploma.', effects: [money(20000), morale(-5)] }) }),
      opt('nada', 'Dejarlo en el banco', [], { result: 'Sin sobresaltos.' }),
    ],
  }),
  ev({
    id: 'vp-estudios', category: 'personal', stages: ['establishment', 'prime', 'veteran'], phases: ['preseason'], weight: 6, once: true, requires: [minAge(23)], speaker: 'family',
    title: 'Volver a estudiar',
    text: 'Tu padre siempre quiso que terminaras los estudios. Hay una universidad a distancia.',
    options: [
      opt('estudiar', 'Matricularte en Administración de Empresas', [family(8), attr('vision', 1), fitness(-2), flag('degree')], { result: 'Estudias en los viajes del equipo.' }),
      opt('no', 'Ahora toca el fútbol', [], { result: 'Quizá más adelante.' }),
    ],
  }),
  ev({
    id: 'vp-mascota', category: 'personal', stages: PRO, phases: ['seasonEnd', 'preseason'], weight: 6, once: true, requires: [], speaker: 'narrator',
    title: 'Un perro',
    text: 'En la protectora de animales te encariñas con un cachorro.',
    options: [
      opt('adoptar', 'Adoptarlo', [morale(8), followers(4), tendency('solidaridad', 2)], { result: 'Se convierte en la estrella de tus redes.' }),
      opt('no', 'No tienes tiempo', [], { result: 'Haces un donativo a la protectora.' }),
    ],
  }),
  ev({
    id: 'vp-enfermedad-familiar', category: 'personal', stages: PRO, phases: HALVES, weight: 5, cooldownSeasons: 5, requires: [], speaker: 'family',
    title: 'Malas noticias de casa',
    text: 'Tu abuelo, que te llevaba a todos los partidos de pequeño, está hospitalizado.',
    options: [
      opt('viajar', 'Pedir permiso y viajar', [family(10), rel('coach', -2), morale(-4)], { result: 'Le coges la mano. Te dice que está orgulloso de ti.' }),
      opt('dedicar', 'Jugar y dedicarle un gol', [], { roll: roll(0.4, { text: 'Marcas y miras al cielo. Él lo ve por la tele desde la cama.', effects: [family(8), rel('fans', 5), morale(5)] }, { text: 'No marcas. Le llamas al acabar.', effects: [family(3), morale(-4)] }, 'finishing') }),
    ],
  }),
  ev({
    id: 'vp-vacaciones', category: 'personal', stages: PRO, phases: ['seasonEnd'], weight: 10, cooldownSeasons: 1, requires: [], speaker: 'narrator',
    title: 'Vacaciones',
    text: 'Por fin, tres semanas libres. ¿Dónde las pasas?',
    options: [
      opt('lujo', 'Una isla de lujo', [money(-40000), morale(8), followers(3)], { result: 'Desconectas por completo.' }),
      opt('pueblo', 'En {ciudadNatal}, con los tuyos', [family(8), morale(5)], { result: 'Comidas familiares y partidillos con los amigos.' }),
      opt('entrenar', 'Entrenar por tu cuenta', [fitness(6), morale(-2), tendency('profesionalidad', 3)], { result: 'Llegas a pretemporada como un avión.' }),
    ],
  }),
  ev({
    id: 'vp-fundacion-escuela', category: 'personal', stages: ['prime', 'veteran'], phases: ['seasonEnd'], weight: 5, once: true, requires: [minMoney(400000)], speaker: 'family',
    title: 'Una escuela de fútbol',
    text: 'En tu barrio de {ciudadNatal} cierran el campo donde empezaste. Podrías salvarlo.',
    options: [
      opt('salvar', 'Comprarlo y abrir una escuela', [money(-300000), rep('national', 3), family(8), tendency('solidaridad', 8), news('{apodo} salva el campo de su infancia', 'positive')], { result: 'Doscientos niños entrenan allí hoy.', key: true }),
      opt('no', 'No puedes salvarlo todo', [], { result: 'Construyen pisos.' }),
    ],
  }),
  ev({
    id: 'vp-noche-casino', category: 'ethics', stages: PRO, phases: HALVES, weight: 5, cooldownSeasons: 4, requires: [], speaker: 'teammate',
    title: 'Una noche en el casino',
    text: 'Unos compañeros te invitan a un casino. Las apuestas deportivas están prohibidas para vosotros.',
    options: [
      opt('ruleta', 'Ir, pero solo a la ruleta', [], { roll: roll(0.4, { text: 'Ganas 20.000 € y te vas.', effects: [money(20000)] }, { text: 'Pierdes 30.000 €.', effects: [money(-30000), morale(-4)] }) }),
      opt('no', 'Volver a casa', [tendency('profesionalidad', 3)], { result: 'A veces decir que no es lo mejor.' }),
    ],
  }),

  /* ── Mercado y contrato ──────────────────────────── */
  ev({
    id: 'mc-clausula', category: 'contract', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 8, cooldownSeasons: 3, requires: [minOverall(72)], speaker: 'board',
    title: 'Subir la cláusula',
    text: 'El club quiere blindarte con una cláusula de rescisión mucho más alta, a cambio de una pequeña subida.',
    options: [
      opt('aceptar', 'Aceptar', [money(50000), rel('board', 6), tendency('lealtad', 4)], { result: 'Ahora eres casi intocable.' }),
      opt('negociar', 'Pedir más sueldo', [rel('board', -3)], { roll: roll(0.5, { text: 'Te suben el sueldo un 20 %.', effects: [money(150000)] }, { text: 'Se rompen las conversaciones.', effects: [rel('board', -4)] }) }),
    ],
  }),
  ev({
    id: 'mc-agente-cambio', category: 'agent', stages: PRO, phases: ['seasonEnd'], weight: 6, cooldownSeasons: 4, requires: [{ type: 'hasAgent', value: true }], speaker: 'agent',
    title: 'Un superagente',
    text: 'El agente más poderoso del fútbol te llama: quiere representarte. Tu agente actual te descubrió de niño.',
    options: [
      opt('cambiar', 'Cambiar al superagente', [{ type: 'setAgent', profile: 'top' }, tendency('lealtad', -5), rep('world', 1)], { result: 'Las puertas de los grandes clubes se abren.' }),
      opt('fiel', 'Seguir con tu agente de siempre', [rel('agent', 10), tendency('lealtad', 5)], { result: '{agente} se emociona al teléfono.' }),
    ],
  }),
  ev({
    id: 'mc-renovar-pronto', category: 'contract', stages: ['breakthrough', 'establishment'], phases: ['winterWindow'], weight: 8, cooldownSeasons: 3, requires: [{ type: 'form', min: 55 }], speaker: 'board',
    title: 'Renovación anticipada',
    text: 'Estás en tu mejor momento y el club quiere renovarte ya, antes de que te lleguen ofertas.',
    options: [
      opt('firmar', 'Firmar ya', [money(80000), rel('board', 6)], { result: 'Seguridad para cinco años.' }),
      opt('esperar', 'Esperar a final de temporada', [rel('agent', 4)], { roll: roll(0.5, { text: 'Sigues en racha y consigues un contrato mucho mejor.', effects: [money(200000)] }, { text: 'Bajas el nivel y la oferta también.', effects: [rel('board', -3)] }) }),
    ],
  }),
  ev({
    id: 'mc-oferta-exotica', category: 'transfer', stages: ['prime', 'veteran'], phases: ['seasonEnd', 'winterWindow'], weight: 6, cooldownSeasons: 3, requires: [minAge(28)], speaker: 'agent',
    title: 'Una oferta millonaria lejos',
    text: 'Un club de una liga emergente ofrece multiplicar tu sueldo por cinco. Deportivamente, un paso atrás.',
    options: [
      opt('estudiar', 'Escuchar la oferta en serio', [{ type: 'offer', kind: 'transfer' }, rel('agent', 4)], { result: '{agente} se pone a negociar.' }),
      opt('no', 'Seguir compitiendo al máximo nivel', [rep('national', 1), morale(2)], { result: 'El dinero no lo es todo.' }),
    ],
  }),
  ev({
    id: 'mc-filial-rival', category: 'transfer', stages: ['academy'], phases: ['seasonEnd'], weight: 6, cooldownSeasons: 2, requires: [minAge(16)], speaker: 'family',
    title: 'Te quiere la cantera rival',
    text: 'La cantera del eterno rival ofrece a tu familia un buen dinero para que te cambies.',
    options: [
      opt('quedarse', 'Quedarte en tu club', [tendency('lealtad', 6), rel('board', 4)], { result: 'Tu club te lo agradece con más minutos.' }),
      opt('escuchar', 'Escuchar a tu familia', [family(4), money(5000), tendency('lealtad', -3)], { result: 'Se quedan pensándolo. Nada se cierra.' }),
    ],
  }),
  ev({
    id: 'mc-patrocinio', category: 'agent', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 10, cooldownSeasons: 2, requires: [{ type: 'followers', min: 50000 }], speaker: 'agent',
    title: 'Un patrocinador',
    text: '{agente} tiene dos propuestas: una bebida energética que paga mucho o una marca local de ropa deportiva.',
    options: [
      opt('energetica', 'La bebida energética', [money(120000), followers(4), rel('press', -1)], { result: 'Tu cara en todas las neveras.' }),
      opt('local', 'La marca local', [money(40000), rep('local', 3), family(2)], { result: 'Orgullo de tu tierra.' }),
    ],
  }),
  ev({
    id: 'mc-compania-equipo', category: 'transfer', stages: SENIOR, phases: ['seasonEnd'], weight: 5, cooldownSeasons: 3, requires: [{ type: 'seasonsAtClub', min: 4 }], speaker: 'fans',
    title: '¿Te vas?',
    text: 'Los rumores de tu marcha llenan la ciudad. La afición quiere saber si te quedas.',
    options: [
      opt('quedarse', 'Prometer que te quedas', [rel('fans', 10), tendency('lealtad', 6)], { result: 'Lo celebran como un fichaje.' }),
      opt('abierto', 'Decir que escucharás ofertas', [rel('fans', -6), { type: 'offer', kind: 'transfer' }], { result: 'Llueven ofertas. Y silbidos.' }),
    ],
  }),

  /* ── Selección ───────────────────────────────────── */
  ev({
    id: 'nt-convocatoria-sorpresa', category: 'nationalTeam', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [minOverall(70), { type: 'internationalCaps', max: 0 }], speaker: 'press',
    title: 'Rumores de convocatoria',
    text: 'El seleccionador ha venido a verte al estadio. Todo el mundo habla de tu posible convocatoria.',
    options: [
      opt('lucirse', 'Jugar para impresionarle', [tendency('ego', 2)], { roll: roll(0.5, { text: 'Partidazo. El seleccionador toma nota.', effects: [rep('national', 4), morale(5)] }, { text: 'Te pueden los nervios.', effects: [form(-4)] }, 'composure') }),
      opt('normal', 'Jugar tu partido de siempre', [attr('concentration', 1)], { result: 'Haces lo de siempre. Y eso es bueno.' }),
    ],
  }),
  ev({
    id: 'nt-doble-nacionalidad', category: 'nationalTeam', stages: ['academy', 'breakthrough'], phases: HALVES, weight: 6, once: true, requires: [{ type: 'internationalCaps', max: 0 }, minAge(17)], speaker: 'agent',
    title: 'Te llama otra federación',
    text: 'La federación del país de tus abuelos te ofrece jugar con ellos. Con la tuya aún no te han llamado.',
    options: [
      opt('esperar', 'Esperar a tu país', [tendency('lealtad', 4), flag('waitForHomeNation')], { result: 'Confías en que llegará tu momento.' }),
      opt('estudiar', 'Agradecerlo y pensarlo', [rel('agent', 3), rep('world', 1)], { result: 'Las puertas quedan abiertas.' }),
    ],
  }),
  ev({
    id: 'nt-concentracion', category: 'nationalTeam', stages: PRO, phases: HALVES, weight: 8, cooldownSeasons: 2, requires: [{ type: 'internationalCaps', min: 1 }], speaker: 'teammate',
    title: 'Concentración con la selección',
    text: 'En la concentración coincides con el jugador al que más admirabas de niño.',
    options: [
      opt('hablar', 'Atreverte a hablar con él', [attr('composure', 1), morale(5), rel('dressingRoom', 2)], { result: 'Es más cercano de lo que pensabas.' }),
      opt('observar', 'Observar cómo entrena', [attr('positioning', 1), attr('vision', 1)], { result: 'Aprendes más mirando que hablando.' }),
    ],
  }),
  ev({
    id: 'nt-lesion-club', category: 'nationalTeam', stages: SENIOR, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [{ type: 'internationalCaps', min: 3 }], speaker: 'coach',
    title: 'El club o la selección',
    text: 'Vuelves de la selección con molestias. {entrenador} insinúa que deberías haberte borrado de la convocatoria.',
    options: [
      opt('club', 'Prometer que priorizarás al club', [rel('coach', 5), rep('national', -1)], { result: 'La federación toma nota.' }),
      opt('pais', 'Defender que jugar por tu país es sagrado', [rep('national', 2), rel('coach', -5)], { result: 'Frase aplaudida en todo el país.' }),
    ],
  }),

  /* ── Ética ───────────────────────────────────────── */
  ev({
    id: 'et-dopaje', category: 'ethics', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 4, cooldownSeasons: 5, requires: [], speaker: 'narrator',
    title: 'Un suplemento milagroso',
    text: 'Un conocido te ofrece un suplemento que «no sale en los controles» y te hará recuperarte el doble de rápido.',
    options: [
      opt('rechazar', 'Rechazarlo y avisar al médico del club', [tendency('profesionalidad', 6), rel('coach', 3)], { result: 'El médico te lo agradece: era una sustancia prohibida.' }),
      opt('aceptar', 'Probarlo', [], { roll: roll(0.4, { text: 'Te sientes mejor. Nadie se entera… por ahora.', effects: [fitness(8), tendency('profesionalidad', -6)] }, { text: 'Positivo en un control. Seis meses de sanción.', effects: [injury(3, 24), rep('national', -10), rel('fans', -15), news('{apodo}, sancionado por dopaje', 'negative')] }) }),
    ],
  }),
  ev({
    id: 'et-arbitro-error', category: 'ethics', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [], speaker: 'narrator',
    title: 'Fue con la mano',
    text: 'Marcas un gol decisivo… pero ha sido con la mano. El árbitro no lo ha visto y no hay VAR en esta competición.',
    options: [
      opt('confesar', 'Confesárselo al árbitro', [tendency('solidaridad', 6), rep('world', 2), rel('dressingRoom', -6), news('El gesto de {apodo}: confiesa su mano', 'positive')], { result: 'Anula el gol. El mundo entero te aplaude; tu vestuario, no tanto.', key: true }),
      opt('callar', 'Celebrarlo', [rel('dressingRoom', 4), tendency('ego', 2)], { result: 'Las repeticiones no mienten. La polémica, servida.' }),
    ],
  }),
  ev({
    id: 'et-hacienda', category: 'ethics', stages: SENIOR, phases: ['seasonEnd'], weight: 4, once: true, requires: [minMoney(1000000)], speaker: 'agent',
    title: 'Ingeniería fiscal',
    text: 'Un asesor te propone una estructura de sociedades en el extranjero para pagar menos impuestos.',
    options: [
      opt('no', 'Pagar lo que toca', [tendency('profesionalidad', 3)], { result: 'Duermes tranquilo.' }),
      opt('si', 'Aceptar', [money(300000)], { roll: roll(0.6, { text: 'Nadie pregunta.', effects: [] }, { text: 'Inspección fiscal. Multa enorme y titulares.', effects: [money(-900000), rep('national', -6), news('Hacienda investiga a {apodo}', 'negative')] }) }),
    ],
  }),

  /* ── Final de carrera ────────────────────────────── */
  ev({
    id: 'rt-ultimo-contrato', category: 'retirement', stages: ['veteran'], phases: ['seasonEnd'], weight: 8, cooldownSeasons: 2, requires: [minAge(33)], speaker: 'family',
    title: '¿Un año más?',
    text: 'Tu cuerpo protesta cada mañana. Tu familia te pregunta cuánto tiempo más quieres seguir.',
    options: [
      opt('seguir', 'Mientras disfrute, sigo', [morale(4), family(-3)], { result: 'El balón sigue siendo tu vida.' }),
      opt('pensar', 'Empezar a planear la retirada', [family(6), flag('farewellSeason')], { result: 'Será tu última temporada. O eso dices ahora.' }),
    ],
  }),
  ev({
    id: 'rt-carnet-entrenador', category: 'retirement', stages: ['veteran'], phases: ['preseason'], weight: 6, once: true, requires: [minAge(31), noFlag('coachingBadges')], speaker: 'coach',
    title: 'Sacarte el título de entrenador',
    text: '{entrenador} te ve pasta de técnico y te anima a sacarte el título mientras sigues jugando.',
    options: [
      opt('si', 'Matricularte', [flag('coachingBadges'), attr('vision', 1), attr('leadership', 1), fitness(-2)], { result: 'Ves el fútbol con otros ojos.' }),
      opt('no', 'Todavía te queda cuerda', [], { result: 'Ya habrá tiempo.' }),
    ],
  }),
  ev({
    id: 'rt-vuelta-origen', category: 'retirement', stages: ['veteran'], phases: ['seasonEnd'], weight: 6, once: true, requires: [minAge(32)], speaker: 'family',
    title: 'Volver a casa',
    text: 'El club de tu ciudad natal, en una división modesta, sueña con que acabes tu carrera allí.',
    options: [
      opt('volver', 'Escuchar su propuesta', [{ type: 'offer', kind: 'transfer', sameCountry: true }, family(8), rep('local', 4)], { result: 'En {ciudadNatal} ya preparan la presentación.' }),
      opt('no', 'Aún quieres competir arriba', [morale(2)], { result: 'Quizá algún día.' }),
    ],
  }),
  ev({
    id: 'rt-homenaje', category: 'retirement', stages: ['veteran'], phases: ['secondHalf'], weight: 5, once: true, requires: [minAge(33), { type: 'seasonsAtClub', min: 5 }], speaker: 'board',
    title: 'Un homenaje en vida',
    text: 'El club quiere poner tu nombre a una grada del estadio.',
    options: [
      opt('aceptar', 'Aceptarlo emocionado', [rel('fans', 10), rel('board', 6), morale(8), tendency('lealtad', 4)], { result: 'Lloras en el centro del campo.', key: true }),
      opt('humilde', 'Pedir que lleve el nombre de un utillero histórico', [rel('dressingRoom', 8), tendency('ego', -5), rep('national', 2)], { result: 'Un gesto que nadie olvidará.' }),
    ],
  }),
  ev({
    id: 'rt-comentarista', category: 'retirement', stages: ['veteran'], phases: ['seasonEnd'], weight: 5, once: true, requires: [minAge(32)], speaker: 'press',
    title: 'El micrófono',
    text: 'Una cadena de televisión te ofrece comentar partidos cuando te retires.',
    options: [
      opt('si', 'Firmar un precontrato', [flag('futureCommentator'), money(20000), rel('press', 6)], { result: 'Tu futuro, asegurado.' }),
      opt('no', 'Lo tuyo es el césped', [], { result: 'Prefieres los banquillos.' }),
    ],
  }),

  /* ── Varios ──────────────────────────────────────── */
  ev({
    id: 'vr-nino-enfermo', category: 'social', stages: PRO, phases: HALVES, weight: 6, cooldownSeasons: 3, requires: [], speaker: 'social',
    title: 'Un niño en el hospital',
    text: 'La familia de un niño hospitalizado te escribe: tú eres su ídolo.',
    options: [
      opt('visitar', 'Visitarle por sorpresa', [tendency('solidaridad', 6), rep('national', 2), morale(5)], { result: 'Su sonrisa vale más que cualquier trofeo.' }),
      opt('video', 'Enviarle un vídeo y una camiseta firmada', [tendency('solidaridad', 2)], { result: 'La familia te lo agradece.' }),
    ],
  }),
  ev({
    id: 'vr-huelga', category: 'ethics', stages: SENIOR, phases: HALVES, weight: 4, cooldownSeasons: 5, requires: [], speaker: 'teammate',
    title: 'Huelga de futbolistas',
    text: 'El sindicato de futbolistas convoca huelga por los derechos de las divisiones inferiores.',
    options: [
      opt('apoyar', 'Apoyarla públicamente', [tendency('solidaridad', 6), rel('dressingRoom', 6), rel('board', -5)], { result: 'Se consigue un acuerdo histórico.' }),
      opt('neutral', 'No pronunciarte', [], { result: 'Pasa sin que te mojes.' }),
    ],
  }),
  ev({
    id: 'vr-politica', category: 'media', stages: SENIOR, phases: HALVES, weight: 4, cooldownSeasons: 4, requires: [], speaker: 'press',
    title: 'Te preguntan por política',
    text: 'En plena campaña electoral, un periodista te pregunta a quién vas a votar.',
    options: [
      opt('no', '«De eso no hablo»', [rel('press', -1)], { result: 'Sales del paso.' }),
      opt('opinar', 'Dar tu opinión', [followers(5), rel('fans', -4), tendency('rebeldia', 4)], { result: 'Media afición te aplaude y la otra media te silba.' }),
    ],
  }),
  ev({
    id: 'vr-moda', category: 'social', stages: SENIOR, phases: ['seasonEnd'], weight: 5, cooldownSeasons: 3, requires: [{ type: 'followers', min: 200000 }], speaker: 'agent',
    title: 'Semana de la moda',
    text: 'Una gran firma te invita a desfilar en la semana de la moda de París.',
    options: [
      opt('desfilar', 'Desfilar', [followers(10), money(60000), tendency('ego', 3)], { result: 'Las fotos dan la vuelta al mundo.' }),
      opt('no', 'No es lo tuyo', [], { result: 'Ves el desfile por internet.' }),
    ],
  }),
  ev({
    id: 'vr-tatuaje', category: 'personal', stages: ALL, phases: ['seasonEnd'], weight: 6, once: true, requires: [minAge(18)], speaker: 'narrator',
    title: 'Un tatuaje',
    text: 'Quieres hacerte tu primer tatuaje.',
    options: [
      opt('familia', 'El nombre de tu madre', [family(6)], { result: 'Tu madre finge enfadarse. Está encantada.' }),
      opt('gigante', 'Un tatuaje enorme en la espalda', [followers(3), tendency('ego', 2)], { result: 'Tardas dos meses en terminarlo.' }),
      opt('ninguno', 'Mejor no', [], { result: 'Tu piel, intacta.' }),
    ],
  }),
  ev({
    id: 'vr-pelo', category: 'social', stages: ALL, phases: ['preseason'], weight: 6, cooldownSeasons: 3, requires: [], speaker: 'social',
    title: 'Cambio de look',
    text: 'Te apetece un cambio radical de imagen para la nueva temporada.',
    options: [
      opt('teñir', 'Teñirte de rubio platino', [followers(5), tendency('ego', 2)], { result: 'Te reconocen desde la última fila del estadio.' }),
      opt('rapar', 'Raparte', [morale(2)], { result: 'Más cómodo. Y más rápido en la ducha.' }),
      opt('igual', 'Quedarte como estás', [], { result: 'Si funciona, no lo cambies.' }),
    ],
  }),
  ev({
    id: 'vr-idioma', category: 'personal', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 6, once: true, requires: [], speaker: 'agent',
    title: 'Aprender inglés',
    text: '{agente} te recomienda aprender inglés por si algún día das el salto a otra liga.',
    options: [
      opt('estudiar', 'Clases todos los días', [flag('english'), rep('world', 1), fitness(-1)], { result: 'En seis meses ya das entrevistas en inglés.' }),
      opt('no', 'Ya aprenderás si hace falta', [], { result: '«Hello» y poco más.' }),
    ],
  }),
  ev({
    id: 'vr-premio-juego-limpio', category: 'media', stages: SENIOR, phases: ['seasonEnd'], weight: 5, cooldownSeasons: 3, requires: [{ type: 'tendency', id: 'temperamento', max: -10 }], speaker: 'press',
    title: 'Premio al juego limpio',
    text: 'Te conceden el premio al juego limpio de la temporada.',
    options: [
      opt('recoger', 'Recogerlo con orgullo', [rep('national', 2), rel('press', 4), morale(4)], { result: 'Un trofeo distinto, pero igual de valioso.' }),
      opt('ceder', 'Dedicárselo a los árbitros', [rel('press', 6), tendency('carisma', 3)], { result: 'Discurso aplaudido.' }),
    ],
  }),
  ev({
    id: 'vr-temporal-nieve', category: 'keyMatch', stages: PRO, phases: ['winterWindow', 'secondHalf'], weight: 6, cooldownSeasons: 3, requires: [{ type: 'clubCountry', in: ['ESP', 'ENG'] }], speaker: 'narrator',
    title: 'Partido en la nieve',
    text: 'Nieva sobre {estadio}. El balón es naranja y apenas se ven las líneas.',
    options: [
      opt('directo', 'Juego directo y balones largos', [attr('longPassing', 1), rel('coach', 3)], { result: 'Partido de trinchera. Empate.' }),
      opt('disfrutar', 'Disfrutar como un niño', [morale(6)], { roll: roll(0.4, { text: 'Un gol de vaselina sobre la nieve. Imagen icónica.', effects: [followers(8), rel('fans', 5)] }, { text: 'Te caes al intentar frenar.', effects: [fitness(-3)] }, 'agility') }),
    ],
  }),
  ev({
    id: 'vr-avion-miedo', category: 'personal', stages: PRO, phases: HALVES, weight: 4, once: true, requires: [], speaker: 'narrator',
    title: 'Turbulencias',
    text: 'El avión del equipo atraviesa unas turbulencias terribles. Desde entonces, te da pánico volar.',
    options: [
      opt('terapia', 'Hacer terapia para superarlo', [morale(4), attr('composure', 1)], { result: 'Vuelves a volar tranquilo.' }),
      opt('aguantar', 'Aguantar como puedas', [morale(-4), fitness(-2)], { result: 'Cada viaje es un mal trago.' }),
    ],
  }),
  ev({
    id: 'vr-forma-extra', category: 'training', stages: PRO, phases: ['winterWindow'], weight: 8, cooldownSeasons: 2, requires: [], speaker: 'coach',
    title: 'Parón invernal',
    text: 'Hay diez días sin partidos en mitad de la temporada.',
    options: [
      opt('descansar', 'Descansar del todo', [fitness(8), morale(4)], { result: 'Recargas pilas.' }),
      opt('trabajar', 'Mantener la forma', [form(4), fitness(2)], { result: 'Vuelves sin perder el ritmo.' }),
    ],
  }),
];
