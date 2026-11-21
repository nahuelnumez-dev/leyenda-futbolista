/** Vida fuera del campo (v1.6): familia, dinero, redes, prensa, ocio y valores. No tocan las estadísticas de los partidos. */
import type { GameEvent } from '@/engine/types/events';
import type { SeasonPhase } from '@/engine/types/common';
import {
  ALL, PRO, SENIOR, attr, family, fitness, flag, followers, form, hasFlag, injury, maxAge, mev, minAge, minMoney, money, morale, news, opt, out,
  rel, rep, roll, tendency,
} from './helpers';

const ANY: SeasonPhase[] = ['preseason', 'firstHalf', 'winterWindow', 'secondHalf', 'seasonEnd'];
const OFF: SeasonPhase[] = ['seasonEnd', 'preseason'];
const P = { category: 'personal' as const, phases: ANY, speaker: 'family' as const };
const S = { category: 'social' as const, phases: ANY, speaker: 'social' as const };
const M = { category: 'media' as const, phases: ANY, speaker: 'press' as const };
const E = { category: 'ethics' as const, phases: ANY };

export const LIFESTYLE_EVENTS: GameEvent[] = [
  /* ── Familia ─────────────────────────────────────── */
  mev('ls-cumple-madre', [], 'El cumpleaños de tu madre', 'Es el cumpleaños de tu madre y tienes partido fuera ese fin de semana.', [
    opt('video', 'Mandarle un vídeo con todo el vestuario cantando', [family(8), morale(3)], { result: 'Lo ve veinte veces.' }),
    opt('viaje', 'Pagarle un viaje para que venga a verte', [money(-3000), family(10)], { result: 'Te ve jugar desde la grada.' }),
    opt('llamada', 'Llamarla al acabar', [family(3)], { result: 'Correcto, sin más.' }),
  ], { ...P, stages: ALL, cd: 3 }),
  mev('ls-hermano-paro', [], 'Tu hermano, sin trabajo', 'Tu hermano mayor se ha quedado en paro y le da vergüenza pedirte ayuda.', [
    opt('trabajo', 'Ofrecerle trabajar contigo como asistente', [family(8), money(-20000)], { result: 'Te organiza la agenda mejor que nadie.' }),
    opt('dinero', 'Pasarle dinero sin decir nada', [family(5), money(-10000)], { result: 'Se entera y se emociona.' }),
    opt('animo', 'Animarle a buscar algo propio', [family(-2)], { result: 'Lo consigue a los tres meses. Orgulloso.' }),
  ], { ...P, stages: PRO, once: true }),
  mev('ls-padre-entrenador', [], 'Tu padre opina demasiado', 'Tu padre te llama después de cada partido para decirte qué hiciste mal.', [
    opt('escuchar', 'Escucharle con paciencia', [family(4), morale(-2)], { result: 'Algunas cosas son útiles. Otras, no.' }),
    opt('limite', 'Pedirle que solo te hable de otras cosas', [family(-3), morale(3)], { result: 'Le cuesta, pero lo entiende.' }),
  ], { ...P, stages: ['academy', 'breakthrough', 'establishment'], cd: 4 }),
  mev('ls-abuela-partido', [], 'La abuela en el estadio', 'Tu abuela nunca te ha visto jugar en un estadio. Tiene 88 años.', [
    opt('traerla', 'Traerla al palco', [money(-2000), family(12), morale(6)], { result: 'Se pasa el partido gritándole al árbitro.' }),
    opt('tele', 'Mandarle una tele nueva para verte', [money(-1500), family(5)], { result: 'Te ve en grande desde su sillón.' }),
  ], { ...P, stages: PRO, once: true }),
  mev('ls-primo-representante', [], 'Tu primo quiere ser tu agente', 'Tu primo dice que podría representarte mejor que cualquier agente.', [
    opt('si', 'Darle una oportunidad', [family(6), rel('agent', -6)], { roll: roll(0.35, out('Resulta que se le da bien negociar.', money(20000)), out('Te mete en un lío con el club.', rel('board', -5))) }),
    opt('no', 'Decirle que no con cariño', [family(-3)], { result: 'Se enfada un tiempo.' }),
  ], { ...P, stages: PRO, once: true }),
  mev('ls-boda-hermana', [], 'Boda de tu hermana', 'Tu hermana se casa el mismo día de un partido importante.', [
    opt('boda', 'Ir a la boda', [family(12), rel('coach', -4)], { result: 'Bailas hasta las tantas. El club te multa.' }),
    opt('partido', 'Jugar el partido', [family(-8), rel('coach', 3)], { result: 'Te mandan fotos. Duele.' }),
    opt('ambos', 'Pedir permiso para ir solo a la ceremonia', [family(6), fitness(-3)], { result: 'Llegas justo al calentamiento.' }),
  ], { ...P, stages: PRO, once: true }),
  mev('ls-casa-familia', [minMoney(80000)], 'Reunión familiar', 'Toda tu familia se reúne este verano. Te piden que lo organices tú.', [
    opt('casa', 'Alquilar una casa grande para todos', [money(-15000), family(10), morale(5)], { result: 'Una semana inolvidable.' }),
    opt('sencillo', 'Una comida en el pueblo', [family(5)], { result: 'Como siempre. Perfecto.' }),
  ], { ...P, phases: OFF, stages: PRO, cd: 3 }),
  mev('ls-hijo-futbol', [hasFlag('parent')], 'Tu hijo quiere jugar', 'Tu hijo pequeño quiere apuntarse a una escuela de fútbol.', [
    opt('apoyar', 'Apuntarle sin presión', [family(8), morale(4)], { result: 'Lo disfruta. Tú también.' }),
    opt('entrenar', 'Entrenarle tú mismo', [family(6), fitness(-2), attr('leadership', 1)], { result: 'Descubres que te gusta enseñar.' }),
  ], { ...P, phases: OFF, stages: SENIOR, once: true }),
  mev('ls-pareja-crisis', [hasFlag('partner')], 'Crisis de pareja', 'Tu pareja se queja de que solo existes para el fútbol.', [
    opt('viaje', 'Organizar un viaje sorpresa', [money(-8000), family(8), morale(4)], { result: 'Os reconciliáis en una isla.' }),
    opt('hablar', 'Hablarlo con calma', [family(4)], { result: 'Os prometéis más tiempo juntos.' }),
    opt('ignorar', 'Pensar que se le pasará', [family(-8), morale(-4)], { result: 'No se le pasa.' }),
  ], { ...P, stages: PRO, cd: 4 }),
  mev('ls-mudanza-familia', [minAge(20)], 'Traer a tus padres', 'Juegas lejos de casa. Te planteas traer a tus padres a vivir a tu ciudad.', [
    opt('traer', 'Traerlos', [money(-30000), family(10), morale(5)], { result: 'Cena familiar cada domingo.' }),
    opt('no', 'Que sigan en su vida', [family(2)], { result: 'Mejor así: cada uno en su sitio.' }),
  ], { ...P, phases: OFF, stages: PRO, once: true }),

  /* ── Dinero ──────────────────────────────────────── */
  mev('ls-reloj', [minMoney(50000)], 'Un reloj de lujo', 'Un compañero te enseña un reloj que cuesta lo que tu primera casa.', [
    opt('comprar', 'Comprarte uno igual', [money(-40000), tendency('ego', 3), followers(2)], { result: 'Lo lucen todas tus fotos.' }),
    opt('no', 'Pasar', [tendency('profesionalidad', 1)], { result: 'Tu móvil da la hora igual.' }),
  ], { category: 'personal', phases: ANY, stages: PRO, cd: 4 }),
  mev('ls-inmobiliaria', [minMoney(300000)], 'Inversión en pisos', 'Un asesor te propone comprar pisos para alquilar.', [
    opt('comprar', 'Invertir', [money(-200000)], { roll: roll(0.7, out('Rentas estables cada año.', money(260000)), out('Mal momento del mercado.', money(150000))) }),
    opt('no', 'Prefieres liquidez', [], { result: 'Nada cambia.' }),
  ], { category: 'personal', phases: OFF, stages: SENIOR, cd: 4, speaker: 'agent' }),
  mev('ls-estafa', [minMoney(100000)], 'Una inversión milagrosa', 'Un conocido te ofrece doblar tu dinero en seis meses con un negocio «seguro».', [
    opt('invertir', 'Meter 100.000 €', [money(-100000)], { roll: roll(0.15, out('Increíble: funciona.', money(200000)), out('Era una estafa. Desaparece con tu dinero.', morale(-6), news('{apodo}, víctima de una estafa', 'negative'))) }),
    opt('asesor', 'Consultarlo con un asesor', [], { result: 'Te dice que huyas. Huyes.' }),
  ], { category: 'personal', phases: ANY, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-restaurante', [minMoney(150000)], 'Tu propio restaurante', 'Un chef amigo te propone abrir un restaurante con tu nombre.', [
    opt('abrir', 'Abrirlo', [money(-120000), followers(3)], { roll: roll(0.55, out('Lleno cada noche.', money(180000), rep('local', 2)), out('Cierra al año.', money(30000), morale(-3))) }),
    opt('no', 'Prefieres no complicarte', [], { result: 'Sigues comiendo en el suyo.' }),
  ], { category: 'personal', phases: OFF, stages: SENIOR, once: true, speaker: 'narrator' }),
  mev('ls-deuda-club', [], 'El club paga tarde', 'El club lleva dos meses sin pagar las nóminas.', [
    opt('esperar', 'Esperar con paciencia', [rel('board', 6), morale(-3)], { result: 'Pagan con retraso. Te lo agradecen.' }),
    opt('denunciar', 'Denunciarlo con el sindicato', [rel('board', -8), rel('dressingRoom', 4)], { result: 'Os pagan en una semana.' }),
  ], { category: 'contract', phases: ['winterWindow', 'secondHalf'], stages: PRO, cd: 4, speaker: 'board' }),
  mev('ls-caridad', [minMoney(50000)], 'Recaudación solidaria', 'Hay una campaña para reconstruir un colegio tras unas inundaciones.', [
    opt('donar', 'Donar 30.000 €', [money(-30000), tendency('solidaridad', 6), rep('national', 2)], { result: 'El colegio lleva tu nombre en una placa.' }),
    opt('camiseta', 'Subastar tu camiseta', [tendency('solidaridad', 3), followers(3)], { result: 'Se vende por 12.000 €.' }),
  ], { category: 'social', phases: ANY, stages: PRO, cd: 4, speaker: 'social' }),
  mev('ls-apuestas', [], 'La casa de apuestas', 'Una casa de apuestas te ofrece ser su imagen. Pagan muy bien.', [
    opt('aceptar', 'Aceptar', [money(150000), rel('fans', -6), tendency('profesionalidad', -2)], { result: 'Polémica: te acusan de dar mal ejemplo.' }),
    opt('rechazar', 'Rechazarlo', [rel('fans', 3), tendency('profesionalidad', 2)], { result: 'Tu agente no está contento.' }),
  ], { category: 'agent', phases: ANY, stages: SENIOR, once: true, speaker: 'agent' }),

  /* ── Redes sociales ──────────────────────────────── */
  mev('ls-meme', [], 'Te has hecho meme', 'Una foto tuya poniendo una cara rarísima se ha convertido en meme.', [
    opt('reir', 'Reírte de ti mismo', [followers(8), tendency('carisma', 3)], { result: 'Las redes te adoran.' }),
    opt('molestar', 'Pedir que lo borren', [followers(-2), tendency('ego', 2)], { result: 'Efecto contrario: más memes.' }),
  ], { ...S, stages: ALL, cd: 4 }),
  mev('ls-fan-enfermo-video', [], 'Mensaje a un fan', 'Te etiquetan en un vídeo de un niño con una enfermedad grave que sueña con conocerte.', [
    opt('visitar', 'Ir a verle', [tendency('solidaridad', 6), followers(4), morale(4)], { result: 'Pasáis la tarde jugando a la consola.' }),
    opt('video', 'Mandarle un vídeo', [tendency('solidaridad', 2)], { result: 'Lo ve cada día.' }),
  ], { ...S, stages: PRO, cd: 4 }),
  mev('ls-polemica-tuit', [], 'Un tuit antiguo', 'Alguien ha rescatado un comentario desafortunado que escribiste con 15 años.', [
    opt('disculpa', 'Pedir disculpas sinceras', [rel('fans', 2), rel('press', 2)], { result: 'La mayoría lo acepta.' }),
    opt('ignorar', 'Ignorarlo', [], { roll: roll(0.5, out('Se olvida en dos días.'), out('Crece la bola.', rel('fans', -5))) }),
  ], { ...S, stages: PRO, once: true }),
  mev('ls-influencer', [{ type: 'followers', min: 100000 }], 'Colaboración con un influencer', 'Un influencer famoso quiere grabar un vídeo de retos contigo.', [
    opt('si', 'Aceptar', [followers(10), fitness(-1)], { result: 'Millones de visitas.' }),
    opt('no', 'Rechazar', [], { result: 'Prefieres no exponerte.' }),
  ], { ...S, stages: PRO, cd: 3 }),
  mev('ls-redes-descanso', [], 'Desconectar de las redes', 'Pasas cuatro horas al día en redes. Lo notas en tu descanso.', [
    opt('borrar', 'Borrar las apps un mes', [morale(5), fitness(3), followers(-3)], { result: 'Duermes mejor que nunca.' }),
    opt('community', 'Contratar a alguien que las lleve', [money(-12000), followers(4)], { result: 'Tus redes mejoran; tú también.' }),
    opt('seguir', 'Seguir igual', [fitness(-2)], { result: 'Las ojeras te delatan.' }),
  ], { ...S, stages: PRO, cd: 4 }),
  mev('ls-fake-news', [], 'Fichaje inventado', 'Una cuenta de rumores publica que has firmado con el eterno rival. Es falso.', [
    opt('desmentir', 'Desmentirlo con humor', [followers(4), rel('fans', 4)], { result: 'Tu respuesta tiene más likes que el rumor.' }),
    opt('callar', 'No decir nada', [], { roll: roll(0.5, out('Nadie se lo cree.'), out('La afición se inquieta.', rel('fans', -4))) }),
  ], { ...S, stages: PRO, cd: 3 }),
  mev('ls-gamer-torneo', [], 'Torneo de videojuegos', 'Te invitan a un torneo benéfico de videojuegos retransmitido en directo.', [
    opt('ganar', 'Ir a por todas', [followers(6)], { roll: roll(0.4, out('¡Ganas el torneo!', followers(4), tendency('carisma', 3)), out('Eliminado en primera ronda. Risas.')) }),
    opt('no', 'No es lo tuyo', [], { result: 'Lo ves desde casa.' }),
  ], { ...S, stages: PRO, cd: 4 }),
  mev('ls-foto-aficionado', [], 'Foto con un aficionado', 'Un aficionado te pide una foto mientras cenas con tu familia.', [
    opt('foto', 'Hacerte la foto', [rel('fans', 3), family(-1)], { result: 'Se va feliz.' }),
    opt('luego', 'Pedirle que espere al postre', [rel('fans', 1), family(2)], { result: 'Lo entiende perfectamente.' }),
  ], { ...S, stages: PRO, cd: 3 }),

  /* ── Prensa ──────────────────────────────────────── */
  mev('ls-entrevista-radio', [], 'Entrevista en la radio', 'Un programa de radio nocturno te invita en directo.', [
    opt('ir', 'Ir y hablar de todo', [rel('press', 5), followers(3), fitness(-2)], { result: 'Hablas de tu infancia. Emociona.' }),
    opt('no', 'Rechazar', [rel('press', -2)], { result: 'Te llaman «antipático».' }),
  ], { ...M, stages: PRO, cd: 3 }),
  mev('ls-pregunta-entrenador', [], 'Te preguntan por el entrenador', 'Un periodista te pregunta si el entrenador ha perdido al vestuario.', [
    opt('defender', 'Defender al entrenador', [rel('coach', 6), rel('press', -1)], { result: 'Frase de apoyo en todas las portadas.' }),
    opt('ambiguo', 'Responder con evasivas', [rel('coach', -3), rel('press', 3)], { result: 'Tu silencio se interpreta como crítica.' }),
  ], { ...M, stages: PRO, cd: 3 }),
  mev('ls-portada', [{ type: 'reputation', scope: 'national', min: 40 }], 'Portada de revista', 'Una revista de moda quiere hacerte la portada.', [
    opt('aceptar', 'Aceptar', [followers(6), money(10000), tendency('ego', 2)], { result: 'Sales guapísimo. Tus compañeros te imprimen la foto.' }),
    opt('rechazar', 'Rechazar', [], { result: 'Prefieres las portadas deportivas.' }),
  ], { ...M, stages: SENIOR, cd: 4 }),
  mev('ls-periodista-amigo', [], 'Un periodista de confianza', '{periodista} te propone ser tu fuente de confianza: tú le cuentas cosas y él te trata bien.', [
    opt('aceptar', 'Aceptar el trato', [rel('press', 8), rel('dressingRoom', -4)], { result: 'Buena prensa. Algún compañero sospecha.' }),
    opt('no', 'Negarte', [rel('press', -3), rel('dressingRoom', 2)], { result: 'Lo que pasa en el vestuario, se queda en el vestuario.' }),
  ], { ...M, stages: PRO, once: true }),
  mev('ls-critica-tv', [], 'Tertulia contra ti', 'En una tertulia de televisión te ponen a parir durante veinte minutos.', [
    opt('responder', 'Responder en redes', [tendency('temperamento', 3), followers(4), rel('press', -4)], { result: 'Guerra abierta con el programa.' }),
    opt('ignorar', 'Ignorarlo', [attr('composure', 1)], { result: 'A la semana siguiente hablan de otro.' }),
  ], { ...M, stages: PRO, cd: 3 }),
  mev('ls-documental-club', [], 'Documental del club', 'El club graba un documental y quiere seguirte en tu día a día.', [
    opt('aceptar', 'Dejarles grabar', [followers(5), rel('board', 4)], { result: 'Sales en tres episodios.' }),
    opt('limitar', 'Solo en el campo', [rel('board', 1)], { result: 'Tu casa, tu intimidad.' }),
  ], { ...M, stages: PRO, once: true }),

  /* ── Ocio y salud ────────────────────────────────── */
  mev('ls-insomnio', [], 'Insomnio', 'Llevas semanas durmiendo mal antes de los partidos.', [
    opt('medico', 'Ir al médico del club', [fitness(4), morale(3)], { result: 'Rutinas de sueño. Mejoras.' }),
    opt('pastillas', 'Tomar pastillas por tu cuenta', [fitness(2)], { roll: roll(0.6, out('Duermes.'), out('Te dejan aturdido.', form(-4))) }),
  ], { category: 'personal', phases: ANY, stages: PRO, cd: 4, speaker: 'narrator' }),
  mev('ls-vacaciones-riesgo', [], 'Vacaciones de aventura', 'Tus amigos te invitan a hacer paracaidismo en vacaciones.', [
    opt('saltar', 'Saltar', [morale(8)], { roll: roll(0.9, out('Experiencia inolvidable.'), out('Mala caída. Llegas lesionado a la pretemporada.', injury(2, 4), rel('coach', -6))) }),
    opt('no', 'Mejor la playa', [morale(4)], { result: 'Tu contrato lo prohíbe, de todas formas.' }),
  ], { category: 'personal', phases: ['seasonEnd'], stages: PRO, cd: 4, speaker: 'narrator' }),
  mev('ls-hobby-musica', [], 'Tu canción', 'Un productor quiere grabar una canción contigo para el himno del verano.', [
    opt('grabar', 'Grabarla', [followers(8), money(15000), tendency('carisma', 3)], { result: 'Suena en todas las discotecas. Tus compañeros te la cantan a todas horas.' }),
    opt('no', 'No cantas ni en la ducha', [], { result: 'Sabia decisión.' }),
  ], { category: 'social', phases: OFF, stages: SENIOR, once: true, speaker: 'agent' }),
  mev('ls-ayuno', [], 'Dieta de moda', 'Un compañero jura que el ayuno intermitente le ha cambiado la vida.', [
    opt('probar', 'Probarlo', [], { roll: roll(0.5, out('Te sientes más ligero.', fitness(4)), out('Te mareas en un entrenamiento.', fitness(-4))) }),
    opt('nutricionista', 'Preguntar al nutricionista', [fitness(2), tendency('profesionalidad', 2)], { result: 'Te ajusta la dieta de verdad.' }),
  ], { category: 'training', phases: ANY, stages: PRO, cd: 4, speaker: 'teammate' }),
  mev('ls-crioterapia', [minMoney(30000)], 'Cámara de frío', 'Puedes instalar una cámara de crioterapia en casa para recuperarte mejor.', [
    opt('comprar', 'Comprarla', [money(-25000), fitness(6), { type: 'injuryProneness', delta: -3 }], { result: 'Te recuperas en la mitad de tiempo.' }),
    opt('club', 'Usar la del club', [fitness(2)], { result: 'Funciona igual, pero hay cola.' }),
  ], { category: 'training', phases: ANY, stages: SENIOR, once: true, speaker: 'narrator' }),
  mev('ls-yoga-pareja', [], 'Meditación', 'Te recomiendan meditación para controlar la ansiedad antes de los partidos.', [
    opt('probar', 'Probarlo', [attr('composure', 1), morale(3)], { result: 'Diez minutos al día. Notas la diferencia.' }),
    opt('no', 'No es para ti', [], { result: 'Sigues con tus nervios.' }),
  ], { category: 'training', phases: ANY, stages: ALL, cd: 5, speaker: 'narrator' }),
  mev('ls-noche-fiesta', [], 'La fiesta de un famoso', 'Un cantante famoso te invita a su fiesta. Mañana entrenáis a las nueve.', [
    opt('ir', 'Ir un rato', [followers(4), fitness(-4)], { roll: roll(0.6, out('Vuelves pronto. Nadie se entera.'), out('Te fotografían a las 5 de la mañana.', rel('coach', -6), rel('fans', -3))) }),
    opt('no', 'No ir', [fitness(2), tendency('profesionalidad', 2)], { result: 'Mañana eres el mejor del entrenamiento.' }),
  ], { category: 'personal', phases: ANY, stages: PRO, cd: 3, speaker: 'social' }),
  mev('ls-moto', [minMoney(40000)], 'Una moto', 'Te encantan las motos. Tu contrato prohíbe conducirlas.', [
    opt('comprar', 'Comprarla igualmente', [money(-30000), morale(5), tendency('rebeldia', 4)], { roll: roll(0.85, out('Paseos de domingo. Nadie se entera.'), out('Caída. Te pierdes un mes y el club te sanciona.', injury(2, 4), rel('board', -8))) }),
    opt('no', 'Respetar el contrato', [tendency('profesionalidad', 2)], { result: 'La miras en el escaparate.' }),
  ], { category: 'personal', phases: ANY, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-libro', [], 'Un libro que te cambia', 'Lees la biografía de un deportista legendario. Te deja pensando.', [
    opt('aplicar', 'Aplicar sus hábitos', [tendency('profesionalidad', 4), attr('concentration', 1)], { result: 'Te levantas antes y entrenas mejor.' }),
    opt('regalar', 'Regalarlo a un compañero joven', [rel('dressingRoom', 3)], { result: 'Le inspira tanto como a ti.' }),
  ], { category: 'personal', phases: ANY, stages: ALL, cd: 5, speaker: 'narrator' }),

  /* ── Valores y ética ─────────────────────────────── */
  mev('ls-amano', [], 'Un amaño', 'Un desconocido te ofrece 50.000 € por provocar una amarilla en el próximo partido.', [
    opt('denunciar', 'Denunciarlo a la federación', [tendency('profesionalidad', 6), rep('national', 2)], { result: 'La policía abre una investigación. Te felicitan.' }),
    opt('ignorar', 'Ignorarlo', [], { result: 'No vuelve a escribirte.' }),
    opt('aceptar', 'Aceptar', [money(50000), tendency('profesionalidad', -8)], { roll: roll(0.4, out('Nadie se entera… por ahora.'), out('Te descubren. Sanción de un año y vergüenza nacional.', injury(3, 40), rep('national', -20), news('{apodo}, implicado en un amaño', 'negative'))) }),
  ], { ...E, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-arbitro-amigo', [], 'Un árbitro conocido', 'Te enteras de que el árbitro del domingo es amigo de tu familia.', [
    opt('avisar', 'Avisar a la federación', [tendency('profesionalidad', 3)], { result: 'Cambian de árbitro. Transparencia.' }),
    opt('callar', 'No decir nada', [], { result: 'Nadie lo sabrá.' }),
  ], { ...E, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-companero-dopaje', [], 'Pastillas en el vestuario', 'Ves a un compañero tomar unas pastillas sospechosas antes de un partido.', [
    opt('hablar', 'Hablar con él a solas', [tendency('solidaridad', 3), rel('dressingRoom', 2)], { result: 'Eran analgésicos. Os reís del susto.' }),
    opt('medico', 'Avisar al médico del club', [tendency('profesionalidad', 3), rel('dressingRoom', -3)], { result: 'El médico lo controla. Tu compañero no te habla.' }),
    opt('nada', 'No es asunto tuyo', [], { result: 'Mejor no saber.' }),
  ], { ...E, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-trabajadores', [], 'Despidos en el club', 'El club despide a varios empleados de limpieza para ahorrar.', [
    opt('protestar', 'Protestar públicamente', [tendency('solidaridad', 6), rel('board', -6), rel('fans', 4)], { result: 'Los readmiten. Gran gesto.' }),
    opt('pagar', 'Pagar tú sus sueldos un año', [money(-60000), tendency('solidaridad', 8)], { result: 'Nadie lo sabe. Ellos sí.' }),
    opt('nada', 'No meterte', [], { result: 'No es tu guerra.' }),
  ], { ...E, stages: SENIOR, once: true, speaker: 'narrator' }),
  mev('ls-discriminacion', [], 'Comentario en el vestuario', 'Un compañero hace un comentario ofensivo sobre otro por su origen.', [
    opt('plantar', 'Plantarle cara', [tendency('solidaridad', 5), rel('dressingRoom', 3)], { result: 'Pide perdón. El vestuario te respalda.' }),
    opt('capitan', 'Contárselo al capitán', [rel('dressingRoom', 1)], { result: 'El capitán lo resuelve.' }),
    opt('callar', 'Callar', [rel('dressingRoom', -2)], { result: 'Tu silencio también dice algo.' }),
  ], { ...E, stages: PRO, once: true, speaker: 'teammate' }),
  mev('ls-tabaco', [], 'Un cigarro', 'En una fiesta, unos amigos de la infancia te ofrecen un cigarro.', [
    opt('no', 'No fumar', [tendency('profesionalidad', 2)], { result: 'Te miran raro. Te da igual.' }),
    opt('si', 'Probar uno', [fitness(-2), tendency('profesionalidad', -2)], { result: 'Tosiendo toda la noche.' }),
  ], { ...E, stages: ['academy', 'breakthrough'], once: true, speaker: 'narrator' }),

  /* ── Juventud y cantera ──────────────────────────── */
  mev('ls-cantera-novia', [maxAge(18)], 'Primer amor', 'Te has enamorado de una compañera de clase. Solo piensas en ella.', [
    opt('equilibrio', 'Organizar tu tiempo', [morale(6), family(2)], { result: 'Fútbol por la tarde, paseos por la noche.' }),
    opt('futbol', 'Centrarte en el fútbol', [tendency('profesionalidad', 2), morale(-2)], { result: 'Lo dejas pasar.' }),
  ], { ...P, stages: ['academy'], once: true, speaker: 'narrator' }),
  mev('ls-cantera-movil', [maxAge(17)], 'El móvil nuevo', 'Tus padres te regalan tu primer móvil bueno. Toda la noche con él.', [
    opt('limite', 'Ponerte un límite', [fitness(2)], { result: 'Duermes bien.' }),
    opt('enganche', 'Engancharte', [fitness(-3), followers(2)], { result: 'Llegas zombi a entrenar.' }),
  ], { ...P, stages: ['academy'], once: true, speaker: 'family' }),
  mev('ls-cantera-graduacion', [minAge(17)], 'Graduación', 'Terminas el instituto. Tu familia está orgullosa.', [
    opt('fiesta', 'Ir a la fiesta de graduación', [morale(6), family(4), fitness(-2)], { result: 'Una noche para recordar.' }),
    opt('universidad', 'Matricularte en la universidad a distancia', [family(8), flag('degree')], { result: 'Fútbol y estudios.' }),
  ], { ...P, stages: ['academy', 'breakthrough'], once: true, phases: OFF }),
  mev('ls-cantera-carnet', [minAge(18)], 'El carnet de conducir', 'Por fin puedes sacarte el carnet. Tu primer coche te espera.', [
    opt('modesto', 'Un coche sencillo', [money(-12000), family(2)], { result: 'Práctico y seguro.' }),
    opt('deportivo', 'Un deportivo', [money(-60000), tendency('ego', 3)], { result: 'El vestuario se ríe de ti con cariño.' }),
  ], { category: 'personal', phases: OFF, stages: ['academy', 'breakthrough'], once: true, speaker: 'narrator' }),
  mev('ls-cantera-idolo', [], 'Conocer a tu ídolo', 'Tu ídolo de la infancia visita la ciudad deportiva.', [
    opt('hablar', 'Atreverte a hablarle', [morale(6), attr('composure', 1)], { result: 'Te da un consejo que no olvidarás.' }),
    opt('foto', 'Solo una foto', [followers(2), morale(3)], { result: 'Foto de perfil para siempre.' }),
  ], { category: 'personal', phases: ANY, stages: ['academy'], once: true, speaker: 'narrator' }),
  mev('ls-cantera-amigos-barrio', [], 'Los amigos del barrio', 'Tus amigos de siempre te echan en cara que ya no quedas con ellos.', [
    opt('quedar', 'Quedar con ellos el fin de semana', [morale(5), family(2), fitness(-1)], { result: 'Como antes. Te sienta genial.' }),
    opt('explicar', 'Explicarles que no tienes tiempo', [morale(-2)], { result: 'Lo entienden… más o menos.' }),
  ], { ...P, stages: ['academy', 'breakthrough'], cd: 3, speaker: 'narrator' }),

  /* ── Ciudad y afición ────────────────────────────── */
  mev('ls-barrio-pintada', [{ type: 'relation', who: 'fans', min: 50 }], 'Un mural con tu cara', 'Unos artistas han pintado un mural con tu cara en el barrio donde creciste.', [
    opt('visitar', 'Visitarlo por sorpresa', [rel('fans', 5), followers(5), family(4)], { result: 'Se monta una fiesta improvisada.' }),
    opt('agradecer', 'Agradecerlo en redes', [followers(3)], { result: 'Miles de likes.' }),
  ], { ...S, stages: SENIOR, once: true }),
  mev('ls-aficionado-enfadado', [], 'Un aficionado enfadado', 'Un aficionado te increpa en el supermercado por la derrota del domingo.', [
    opt('dialogar', 'Hablar con él con calma', [rel('fans', 3), attr('composure', 1)], { result: 'Acabáis hablando de fútbol una hora.' }),
    opt('irse', 'Irte sin responder', [], { result: 'Compras otro día.' }),
  ], { ...S, stages: PRO, cd: 3 }),
  mev('ls-pena', [], 'Visita a una peña', 'Una peña del club en un pueblo lejano te invita a su aniversario.', [
    opt('ir', 'Ir', [rel('fans', 6), fitness(-2)], { result: 'Te tratan como a un rey. Paella para cien.' }),
    opt('video', 'Mandar un vídeo', [rel('fans', 2)], { result: 'Lo ponen en bucle toda la noche.' }),
  ], { ...S, stages: PRO, cd: 3, speaker: 'fans' }),
  mev('ls-ciudad-nueva', [], 'Una ciudad nueva', 'Llevas poco tiempo en la ciudad y aún no conoces a nadie fuera del club.', [
    opt('explorar', 'Explorarla a fondo', [morale(4), rep('local', 2)], { result: 'Encuentras tu cafetería favorita.' }),
    opt('casa', 'Quedarte en casa', [fitness(2), morale(-2)], { result: 'Mucha consola y poco sol.' }),
  ], { category: 'personal', phases: ['preseason', 'firstHalf'], stages: PRO, cd: 4, speaker: 'narrator' }),
  mev('ls-escuela-visita', [], 'Visita a un colegio', 'Un colegio de la ciudad te invita a dar una charla a los alumnos.', [
    opt('ir', 'Ir con ganas', [rel('fans', 4), tendency('solidaridad', 3), rep('local', 2)], { result: 'Los niños te preguntan de todo.' }),
    opt('no', 'No tienes tiempo', [], { result: 'Va otro compañero.' }),
  ], { ...S, stages: PRO, cd: 3, speaker: 'board' }),
  mev('ls-animal-estadio', [], 'Un perro en el campo', 'Un perro se cuela en el césped durante el calentamiento.', [
    opt('jugar', 'Jugar con él', [followers(6), morale(4)], { result: 'El vídeo da la vuelta al mundo.' }),
    opt('seguridad', 'Avisar a seguridad', [], { result: 'Se lo llevan. Algún aficionado te silba.' }),
  ], { ...S, stages: PRO, once: true, speaker: 'narrator' }),
  mev('ls-cumple-companero', [], 'Sorpresa a un compañero', 'Organizáis una sorpresa por el cumpleaños de {companero}.', [
    opt('organizar', 'Organizarla tú', [rel('dressingRoom', 6), money(-1500)], { result: 'Llora de emoción.' }),
    opt('participar', 'Solo participar', [rel('dressingRoom', 2)], { result: 'Una tarta en la cara. Clásico.' }),
  ], { category: 'dressingRoom', phases: ANY, stages: PRO, cd: 3, speaker: 'teammate' }),
  mev('ls-premio-ciudad', [{ type: 'reputation', scope: 'local', min: 50 }], 'Hijo predilecto', 'Tu ciudad natal quiere nombrarte hijo predilecto.', [
    opt('ir', 'Ir a la ceremonia', [family(8), rep('local', 4), morale(6)], { result: 'Discurso con la voz rota.' }),
    opt('video', 'Mandar un vídeo', [family(2)], { result: 'Tu padre recoge el premio por ti.' }),
  ], { ...S, stages: SENIOR, once: true, speaker: 'family' }),
];
