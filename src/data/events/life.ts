/** Eventos de vida personal, medios, redes, lesiones y final de carrera (bloque de la Fase 11). */
import type { GameEvent } from '@/engine/types/events';
import { HALVES, PRO, SENIOR, attr, chance, ev, family, fitness, flag, followers, form, group, injury, minAge, minMoney, money, morale, news, opt, rel, rep, roll, tendency } from './helpers';

export const LIFE_EVENTS: GameEvent[] = [
  ev({
    id: 'lf-documental', category: 'media', stages: SENIOR, phases: ['preseason', 'seasonEnd'], weight: 12, once: true, requires: [{ type: 'reputation', scope: 'world', min: 45 }], speaker: 'agent',
    title: 'Un documental sobre tu vida',
    text: 'Una plataforma de streaming quiere grabar una serie documental sobre tu temporada: cámaras en el vestuario, en casa y en los viajes.',
    options: [
      opt('aceptar', 'Aceptar: que el mundo te conozca', [money(400000), followers(30), tendency('carisma', 8), rel('dressingRoom', -5)], { result: 'La serie es un éxito. Algunos compañeros odian las cámaras.' }),
      opt('vestuario-no', 'Aceptar, pero sin cámaras en el vestuario', [money(200000), followers(15)], { result: 'Un término medio que todos respetan.' }),
      opt('no', 'Rechazarlo', [rel('dressingRoom', 4), tendency('carisma', -3)], { result: 'Tu intimidad sigue siendo tuya.' }),
    ],
  }),
  ev({
    id: 'lf-libro', category: 'media', stages: ['prime', 'veteran'], phases: ['seasonEnd'], weight: 10, once: true, requires: [minAge(29), { type: 'reputation', scope: 'national', min: 50 }], speaker: 'agent',
    title: 'Tu autobiografía',
    text: 'Una editorial te propone escribir tu autobiografía con un periodista. Quieren que cuentes «toda la verdad».',
    options: [
      opt('sincera', 'Contarlo todo, también lo malo', [money(150000), rel('press', 8), followers(8), rel('board', -4)], { result: 'Un libro sincero que remueve algún despacho.' }),
      opt('amable', 'Un libro amable, sin polémicas', [money(100000), rel('fans', 4)], { result: 'Se vende bien en Navidad.' }),
      opt('no', 'Aún no es momento', [], { result: 'Quizá cuando te retires.' }),
    ],
  }),
  ev({
    id: 'lf-estudios', category: 'personal', stages: PRO, phases: ['preseason'], weight: 10, once: true, requires: [], speaker: 'family',
    title: 'Volver a estudiar',
    text: 'Tienes tardes libres y una universidad a distancia ofrece un programa para deportistas de élite.',
    options: [
      opt('matricular', 'Matricularte en Administración de Empresas', [group('mental', 1), family(8), fitness(-4)], { result: 'Estudias en los aviones y en los hoteles.' }),
      opt('idiomas', 'Aprender idiomas', [attr('composure', 1), tendency('carisma', 4)], { result: 'Ya das las ruedas de prensa en dos idiomas.' }),
      opt('no', 'Prefieres descansar', [morale(3)], { result: 'Las tardes son para la siesta.' }),
    ],
  }),
  ev({
    id: 'lf-perro', category: 'personal', stages: PRO, phases: HALVES, weight: 10, once: true, requires: [], speaker: 'family',
    title: 'Un perro en la protectora',
    text: 'En una visita a una protectora de animales con el club, un perro mayor no se separa de ti.',
    options: [
      opt('adoptar', 'Adoptarlo', [morale(8), followers(6), tendency('solidaridad', 5)], { result: 'Le pones el nombre de tu primer entrenador. Se hace famoso en redes.' }),
      opt('no', 'Ahora no puedes cuidarlo', [], { result: 'Pides que te avisen si alguien lo adopta.' }),
    ],
  }),
  ev({
    id: 'lf-casa-padres', category: 'personal', stages: PRO, phases: ['seasonEnd'], weight: 14, once: true, requires: [minMoney(400000)], speaker: 'family',
    title: 'Una casa para tus padres',
    text: 'Tus padres siguen viviendo en el mismo piso de siempre en {ciudadNatal}. Podrías comprarles una casa.',
    options: [
      opt('comprar', 'Comprarles la casa de sus sueños', [money(-350000), family(25), morale(10)], { result: 'Tu madre llora en la entrega de llaves. Tu padre hace como que no.', key: true }),
      opt('reformar', 'Reformar su piso de siempre', [money(-80000), family(15)], { result: 'Ellos no querían irse del barrio.' }),
    ],
  }),
  ev({
    id: 'lf-amigo-infancia', category: 'personal', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 4, requires: [minMoney(50000)], speaker: 'family',
    title: 'Un amigo de la infancia',
    text: 'Tu mejor amigo del colegio está sin trabajo y te pide ayuda. Te propone ser tu chófer y «mano derecha».',
    options: [
      opt('contratar', 'Contratarle', [money(-30000), family(6), tendency('solidaridad', 6)], { result: 'Tener a alguien de confianza cerca te da paz.' }),
      opt('ayudar', 'Ayudarle a buscar trabajo en otro sitio', [family(3)], { result: 'Le consigues una entrevista en una empresa de un patrocinador.' }),
      opt('no', 'Decirle que no', [family(-6), tendency('solidaridad', -5)], { result: 'Deja de contestar a tus mensajes.' }),
    ],
  }),
  ev({
    id: 'lf-politica', category: 'media', stages: SENIOR, phases: HALVES, weight: 10, cooldownSeasons: 4, requires: [{ type: 'reputation', scope: 'national', min: 40 }], speaker: 'press',
    title: 'Una pregunta política',
    text: 'En plena campaña electoral, un periodista te pregunta a quién vas a votar.',
    options: [
      opt('neutral', '«Yo de fútbol, de política no»', [rel('press', -2)], { result: 'Una respuesta clásica.' }),
      opt('valores', 'Hablar de valores sin dar nombres', [rel('press', 4), tendency('carisma', 4)], { result: 'Mensaje inteligente. Nadie se ofende demasiado.' }),
      opt('opinar', 'Decirlo claramente', [followers(10), rel('fans', -6), rel('board', -4)], { result: 'Media afición te aplaude y la otra media te pita.' }),
    ],
  }),
  ev({
    id: 'lf-meme', category: 'social', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 4, requires: [], speaker: 'social',
    title: 'Te has convertido en meme',
    text: 'Una cara tuya tras fallar un pase se ha convertido en el meme de la semana.',
    options: [
      opt('reirse', 'Compartir el meme y reírte de ti mismo', [followers(15), tendency('ego', -5), tendency('carisma', 5)], { result: 'Tu respuesta tiene más «me gusta» que el meme.' }),
      opt('ignorar', 'Ignorarlo', [], { result: 'Se olvida en unos días.' }),
    ],
  }),
  ev({
    id: 'lf-streaming', category: 'social', stages: ['breakthrough', 'establishment'], phases: HALVES, weight: 10, cooldownSeasons: 3, requires: [], speaker: 'social',
    title: 'Torneo benéfico en directo',
    text: 'Un streamer famoso organiza un torneo benéfico de videojuegos de fútbol y te invita a jugarlo en directo.',
    options: [
      opt('jugar', 'Jugar', [followers(12), tendency('solidaridad', 4), fitness(-3)], { roll: roll(0.4, { text: '¡Ganas el torneo! La recaudación va íntegra a la causa.', effects: [followers(10)] }, { text: 'Te eliminan en primera ronda. Te ríes con el chat.', effects: [] }) }),
      opt('donar', 'No jugar, pero donar', [money(-10000), tendency('solidaridad', 4)], { result: 'Tu donación es de las más altas.' }),
    ],
  }),
  ev({
    id: 'lf-ansiedad', category: 'personal', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 3, requires: [{ type: 'any', of: [{ type: 'morale', max: 40 }, { type: 'sentiment', max: -40 }] }], speaker: 'family',
    title: 'Cuando la cabeza no para',
    text: 'Llevas semanas durmiendo mal. Las críticas te persiguen incluso en sueños.',
    options: [
      opt('psicologo', 'Pedir ayuda a un psicólogo', [morale(15), attr('composure', 2), money(-5000)], { result: 'Hablarlo es el primer paso. Lo notas enseguida.', key: true }),
      opt('familia', 'Refugiarte en tu familia', [morale(8), family(10)], { result: 'Unos días en casa te devuelven la sonrisa.' }),
      opt('aguantar', 'Aguantar solo', [morale(-6), form(-4)], { result: 'Nadie lo nota. Tú sí.' }),
    ],
  }),
  ev({
    id: 'lf-videoclip', category: 'social', stages: SENIOR, phases: ['seasonEnd', 'preseason'], weight: 8, once: true, requires: [{ type: 'followers', min: 300000 }], speaker: 'agent',
    title: 'Un videoclip',
    text: 'Un cantante muy famoso, amigo tuyo, te invita a salir en su próximo videoclip.',
    options: [
      opt('salir', 'Salir y bailar', [followers(20), tendency('carisma', 6), tendency('ego', 3)], { result: 'Tus pasos de baile son tendencia.' }),
      opt('cameo', 'Solo un cameo de dos segundos', [followers(8)], { result: 'Apareces con un balón. Suficiente.' }),
      opt('no', 'Mejor no', [], { result: 'Sigues siendo solo futbolista.' }),
    ],
  }),
  ev({
    id: 'lf-idioma-ingles', category: 'personal', stages: PRO, phases: ['preseason'], weight: 22, once: true, requires: [{ type: 'clubCountry', in: ['ENG'] }, { type: 'not', condition: { type: 'country', in: ['ENG', 'WAL', 'SCO', 'IRL', 'NIR', 'USA'] } }], speaker: 'coach',
    title: 'Clases de inglés',
    text: 'Te cuesta entender las charlas de {entrenador}. El club te ofrece un profesor particular.',
    options: [
      opt('clases', 'Dar clases cada día', [rel('coach', 6), rel('dressingRoom', 6), group('mental', 1)], { result: 'En tres meses ya haces bromas en inglés. Malas, pero en inglés.' }),
      opt('companero', 'Apoyarte en un compañero que habla tu idioma', [rel('dressingRoom', 3)], { result: 'Te apañas, pero te pierdes cosas.' }),
    ],
  }),
  ev({
    id: 'lf-idioma-portugues', category: 'personal', stages: PRO, phases: ['preseason'], weight: 22, once: true, requires: [{ type: 'clubCountry', in: ['BRA'] }, { type: 'not', condition: { type: 'country', in: ['BRA', 'POR'] } }], speaker: 'coach',
    title: 'Aprender portugués',
    text: 'En {club} todo el vestuario habla portugués. El club te ofrece clases intensivas.',
    options: [
      opt('clases', 'Apuntarte a las clases', [rel('dressingRoom', 8), group('mental', 1)], { result: 'Pronto entiendes hasta las bromas del utillero.' }),
      opt('portunol', 'Tirar de «portuñol»', [rel('dressingRoom', 4), tendency('carisma', 3)], { result: 'Te entienden a medias, pero se ríen contigo.' }),
    ],
  }),
  ev({
    id: 'lf-molestias', category: 'injury', stages: SENIOR, phases: HALVES, weight: 14, cooldownSeasons: 2, requires: [{ type: 'injured', value: false }, chance(0.5)], speaker: 'coach',
    title: 'Molestias en el aductor',
    text: 'Llevas varios días con molestias en el aductor. El médico recomienda parar una semana; el partido del domingo es importante.',
    options: [
      opt('parar', 'Parar una semana', [injury(1, 1), { type: 'injuryProneness', delta: -3 }], { result: 'Te pierdes el partido, pero vuelves bien.' }),
      opt('infiltrar', 'Infiltrarte y jugar', [{ type: 'injuryProneness', delta: 5 }], { roll: roll(0.65, { text: 'Juegas sin problemas. El dolor vuelve el lunes.', effects: [rel('coach', 4)] }, { text: 'Rotura en el minuto 30. Dos meses fuera.', effects: [injury(2, 8)] }) }),
    ],
  }),
  ev({
    id: 'lf-segunda-opinion', category: 'injury', stages: PRO, phases: ['firstHalf', 'winterWindow', 'secondHalf'], weight: 20, cooldownSeasons: 2, requires: [{ type: 'injured', value: true }], speaker: 'agent',
    title: 'Una segunda opinión',
    text: '{agente} quiere que te vea un especialista famoso en el extranjero. Los médicos del club se sienten desautorizados.',
    options: [
      opt('especialista', 'Ir al especialista', [money(-20000), rel('board', -4)], { roll: roll(0.6, { text: 'Un tratamiento nuevo acelera tu vuelta.', effects: [{ type: 'recovery', weeks: -3 }] }, { text: 'Dice lo mismo que el médico del club.', effects: [] }) }),
      opt('club', 'Confiar en los médicos del club', [rel('board', 6)], { result: 'Los servicios médicos te lo agradecen.' }),
    ],
  }),
  ev({
    id: 'lf-cumple-nino', category: 'social', stages: PRO, phases: HALVES, weight: 12, cooldownSeasons: 3, requires: [], speaker: 'fans',
    title: 'Un cumpleaños especial',
    text: 'Un niño de ocho años ha pedido como regalo de cumpleaños conocerte. Su madre ha escrito al club.',
    options: [
      opt('sorpresa', 'Presentarte por sorpresa en la fiesta', [rel('fans', 8), tendency('solidaridad', 6), morale(5)], { result: 'Juegas un partido en el jardín con veinte niños. Ganan ellos.' }),
      opt('video', 'Grabarle un vídeo', [rel('fans', 3)], { result: 'El vídeo le hace llorar de alegría.' }),
    ],
  }),
  ev({
    id: 'lf-colegio', category: 'personal', stages: PRO, phases: ['seasonEnd'], weight: 10, once: true, requires: [{ type: 'reputation', scope: 'national', min: 30 }], speaker: 'family',
    title: 'Vuelta al colegio',
    text: 'Tu antiguo colegio de {ciudadNatal} te invita a dar una charla a los alumnos.',
    options: [
      opt('ir', 'Ir y contar tu historia', [rep('local', 6), family(6), tendency('solidaridad', 4)], { result: 'Tu antigua profesora de matemáticas te recuerda que nunca hacías los deberes.' }),
      opt('no', 'No tienes tiempo', [rep('local', -2)], { result: 'Mandas una camiseta firmada.' }),
    ],
  }),
  ev({
    id: 'lf-camiseta-retro', category: 'social', stages: PRO, phases: ['preseason'], weight: 10, cooldownSeasons: 4, requires: [{ type: 'seasonsAtClub', min: 1 }], speaker: 'board',
    title: 'La camiseta retro',
    text: '{club} lanza una camiseta retro y quiere que seas la imagen de la campaña.',
    options: [
      opt('aceptar', 'Aceptar', [money(30000), rel('board', 4), followers(5)], { result: 'Se agota en dos días.' }),
      opt('no', 'Ceder el protagonismo a un canterano', [rel('dressingRoom', 5), tendency('ego', -4)], { result: 'El chaval no se lo cree.' }),
    ],
  }),
  ev({
    id: 'lf-apuestas-companero', category: 'ethics', stages: PRO, phases: HALVES, weight: 10, once: true, requires: [], speaker: 'teammate',
    title: 'Un compañero con un problema',
    text: 'Te enteras de que {companero} tiene deudas por apuestas deportivas y ha empezado a apostar en partidos de su propia liga.',
    options: [
      opt('hablar', 'Hablar con él y ayudarle a buscar tratamiento', [tendency('solidaridad', 8), rel('dressingRoom', 4)], { result: 'Le cuesta, pero acepta ayuda.', key: true }),
      opt('club', 'Avisar al club', [rel('board', 6), rel('dressingRoom', -6)], { result: 'El club actúa. Él no te lo perdona.' }),
      opt('callar', 'Mirar hacia otro lado', [tendency('solidaridad', -6)], { result: 'Meses después, el escándalo estalla.' }),
    ],
  }),
  ev({
    id: 'lf-accidente', category: 'ethics', stages: PRO, phases: HALVES, weight: 8, once: true, requires: [], speaker: 'narrator',
    title: 'Un golpe en el aparcamiento',
    text: 'Al salir marcha atrás del aparcamiento del centro comercial, rozas un coche aparcado. No hay nadie mirando.',
    options: [
      opt('nota', 'Dejar una nota con tu teléfono', [tendency('profesionalidad', 3), money(-800)], { result: 'El dueño te llama emocionado: es socio de tu club desde hace 30 años.' }),
      opt('irse', 'Irte', [], { roll: roll(0.6, { text: 'Nadie se entera.', effects: [] }, { text: 'Una cámara lo grabó. El vídeo se hace viral.', effects: [rel('fans', -10), rel('press', -6), news('{apodo} se marcha tras golpear un coche', 'negative')] }) }),
    ],
  }),
  ev({
    id: 'lf-retirada-amigo', category: 'dressingRoom', stages: SENIOR, phases: ['seasonEnd'], weight: 12, once: true, requires: [], speaker: 'teammate',
    title: 'Se retira tu mejor amigo del equipo',
    text: '{capitan}, con quien has compartido mil batallas, anuncia su retirada.',
    options: [
      opt('homenaje', 'Organizarle un homenaje sorpresa', [rel('dressingRoom', 10), tendency('solidaridad', 5), money(-15000)], { result: 'Viene hasta su primer entrenador. No hay nadie sin lágrimas.' }),
      opt('discurso', 'Dedicarle unas palabras en el vestuario', [rel('dressingRoom', 6)], { result: 'Un abrazo largo vale más que cualquier discurso.' }),
    ],
  }),
  ev({
    id: 'lf-futuro', category: 'retirement', stages: ['veteran'], phases: ['preseason'], weight: 14, once: true, requires: [minAge(31)], speaker: 'agent',
    title: '¿Y después?',
    text: 'Varias televisiones te tantean para comentar partidos cuando te retires. También hay un curso de director deportivo.',
    options: [
      opt('tele', 'Hablar con la televisión', [flag('futureCommentator'), tendency('carisma', 5), rel('press', 6)], { result: 'Haces una prueba en un programa. Tienes buena voz.' }),
      opt('despachos', 'Formarte como director deportivo', [flag('futureDirector'), group('mental', 1)], { result: 'Empiezas a ver el fútbol desde otro ángulo.' }),
      opt('nada', 'Todavía no quieres pensar en eso', [morale(3)], { result: 'Aún quedan partidos por jugar.' }),
    ],
  }),
  ev({
    id: 'lf-hijo-predilecto', category: 'social', stages: SENIOR, phases: ['seasonEnd'], weight: 12, once: true, requires: [{ type: 'reputation', scope: 'national', min: 60 }], speaker: 'family',
    title: 'Hijo predilecto',
    text: 'El ayuntamiento de {ciudadNatal} te nombra hijo predilecto. Quieren poner tu nombre a una calle.',
    options: [
      opt('aceptar', 'Aceptar emocionado', [rep('local', 10), family(10), morale(8), news('{ciudadNatal} nombra hijo predilecto a {nombreCompleto}', 'positive')], { result: 'Tu abuela pasea por «tu» calle cada mañana.', key: true }),
      opt('polideportivo', 'Pedir que lo pongan al polideportivo del barrio', [rep('local', 12), tendency('solidaridad', 6)], { result: 'El polideportivo lleva tu nombre. Los niños juegan allí cada tarde.' }),
    ],
  }),
];

