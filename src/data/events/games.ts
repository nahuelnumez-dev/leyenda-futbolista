/** Situaciones de partido para todas las posiciones de campo (v1.6): finales, copas, clima, VAR y órdenes del banquillo. */
import type { GameEvent } from '@/engine/types/events';
import {
  ATTACKERS, DEFENDERS, MIDFIELDERS, OUTFIELD, assist, attr, cleanSheet, dribble, fitness, followers, form, goal, injury, keyPass, matchRating, mev, money,
  morale, news, opt, out, rel, rep, roll, tackle, tendency,
} from './helpers';

const O = [OUTFIELD];

export const GAME_EVENTS: GameEvent[] = [
  mev('gm-final-copa', [ATTACKERS], 'Final de copa', 'Final de copa en campo neutral. Empate a cero en el minuto 75 y el balón te llega a ti.', [
    opt('decidir', 'Intentar decidirla', [], { roll: roll(0.4, out('¡Gol en la final! Tu nombre en la historia del club.', goal(), rel('fans', 15), rep('national', 5), news('{apodo} decide la final', 'positive')), out('El portero la saca. Prórroga.', morale(-3)), 'composure') }),
    opt('servir', 'Servírsela al delantero', [], { roll: roll(0.45, out('Pase perfecto y gol. La asistencia de la final.', assist(), keyPass(), rel('fans', 10)), out('La despeja un defensa.')) }),
  ], { phases: ['secondHalf'], weight: 6 }),
  mev('gm-final-copa-def', [DEFENDERS], 'Final de copa', 'Final de copa. Ganáis 1-0 y el rival se vuelca en los últimos minutos.', [
    opt('aguantar', 'Aguantar como un muro', [], { roll: roll(0.55, out('Despejas todo. ¡Campeones con portería a cero!', tackle(4), cleanSheet(), rel('fans', 12)), out('Empatan en el 93. Prórroga.', tackle(2), morale(-4)), 'concentration') }),
    opt('salir', 'Salir a presionar', [], { roll: roll(0.45, out('Robas arriba y casi marcáis el segundo.', tackle(3), keyPass()), out('Te sacan de sitio y empatan.', morale(-4))) }),
  ], { phases: ['secondHalf'], weight: 6 }),
  mev('gm-viento', O, 'Vendaval', 'Sopla un viento que desvía todos los balones largos.', [
    opt('corto', 'Jugar al pie', [keyPass(2), rel('coach', 3)], { result: 'Partido de toque corto. Bien leído.' }),
    opt('aprovechar', 'Aprovechar el viento a favor', [], { roll: roll(0.3, out('Un disparo lejano con el viento acaba dentro.', goal(), followers(3)), out('El viento se lleva tu disparo a la grada.')) }),
  ]),
  mev('gm-campo-malo', O, 'Campo en mal estado', 'El césped del rival está lleno de calvas. El balón bota donde quiere.', [
    opt('sencillo', 'Jugar sencillo', [keyPass(), tackle(), rel('coach', 2)], { result: 'Sin errores en un campo imposible.' }),
    opt('regate', 'Intentar regates igualmente', [], { roll: roll(0.35, out('Te salen dos regates imposibles.', dribble(2), form(3)), out('Te tuerces el tobillo en un bache.', injury(1, 1)), 'agility') }),
  ]),
  mev('gm-instruccion-banda', O, 'Grito desde la banda', '{entrenador} te grita que cambies de banda para sorprender al rival.', [
    opt('obedecer', 'Cambiar de banda', [rel('coach', 4)], { roll: roll(0.5, out('Sorprendes al rival: das un pase clave tras otro.', keyPass(2), dribble()), out('No te encuentras.', form(-2))) }),
    opt('seguir', 'Seguir donde estás', [rel('coach', -4)], { result: 'Te sustituye en el 60.' }),
  ]),
  mev('gm-diez-contra-once', O, 'Con diez', 'Expulsan a un compañero en el minuto 30. Os queda una hora con diez.', [
    opt('sacrificio', 'Correr por dos', [fitness(-5)], { roll: roll(0.55, out('Te vacías. Robas y corres como nunca.', tackle(3), matchRating(0.5), rel('dressingRoom', 6)), out('No llegas a todo y perdéis.', tackle(1)), 'stamina') }),
    opt('orden', 'Mantener la posición', [tackle(2), rel('coach', 3)], { result: 'Empate sufrido. Disciplina táctica.' }),
  ]),
  mev('gm-once-contra-diez', [ATTACKERS], 'Con uno más', 'El rival se queda con diez. Hay espacios por todas partes.', [
    opt('atacar', 'Atacar sin parar', [], { roll: roll(0.55, out('Aprovechas los espacios: gol y pase clave.', goal(), keyPass()), out('Muchas ocasiones, ningún gol.', keyPass(2)), 'finishing') }),
    opt('paciencia', 'Mover el balón con paciencia', [keyPass(2), matchRating(0.3)], { roll: roll(0.45, out('Asistencia tras una larga posesión.', assist()), out('Ganáis por la mínima.')) }),
  ]),
  mev('gm-remontada', O, 'Remontada', 'Vais perdiendo 0-2 a falta de veinte minutos.', [
    opt('arriesgar', 'Arriesgar todo', [fitness(-3)], { roll: roll(0.35, out('¡Remontada! Participas en los tres goles.', goal(), assist(), rel('fans', 10)), out('No da tiempo. Derrota.', morale(-3)), 'composure') }),
    opt('orgullo', 'Al menos uno', [], { roll: roll(0.45, out('Marcas el del honor.', goal()), out('Ni eso.')) }),
  ], { weight: 9 }),
  mev('gm-amonestado', O, 'Con amarilla', 'Tienes amarilla desde el minuto 15. El rival lo sabe y te busca.', [
    opt('cuidado', 'Jugar con cuidado', [attr('concentration', 1), tackle()], { result: 'Terminas el partido sin la segunda.' }),
    opt('normal', 'Jugar como siempre', [], { roll: roll(0.5, out('Partido intenso y limpio.', tackle(2), matchRating(0.3)), out('Segunda amarilla en el 70.', rel('coach', -6)), 'composure') }),
  ]),
  mev('gm-capitan-ausente', O, 'Brazalete prestado', 'El capitán no juega y {entrenador} te da el brazalete por un día.', [
    opt('liderar', 'Liderar con el ejemplo', [attr('leadership', 2)], { roll: roll(0.55, out('Partidazo de capitán.', tackle(2), keyPass(), matchRating(0.6)), out('Te pesa la responsabilidad.', form(-2)), 'leadership') }),
    opt('normal', 'Jugar tu partido de siempre', [keyPass(), tackle()], { result: 'Cumples. El brazalete no te cambia.' }),
  ]),
  mev('gm-copa-segunda', O, 'Copa contra un modesto', 'Eliminatoria de copa en el campo de un equipo de tercera división. El campo es pequeño y la grada aprieta.', [
    opt('serio', 'Tomárselo en serio', [], { roll: roll(0.6, out('Partido serio. Pasáis sin sustos.', keyPass(), tackle(), matchRating(0.4)), out('Sufrís hasta los penaltis.')) }),
    opt('relajado', 'Ir con el freno de mano', [], { roll: roll(0.35, out('Pasáis igualmente.'), out('¡Eliminados por un modesto! Ridículo nacional.', rel('fans', -8), morale(-6))) }),
  ], { phases: ['firstHalf', 'winterWindow'] }),
  mev('gm-golpe-franco-ensayado', [ATTACKERS], 'La jugada ensayada', 'Llevas toda la semana ensayando una falta con {companero}. Hoy hay ocasión.', [
    opt('ensayada', 'Hacer la ensayada', [], { roll: roll(0.4, out('Sale perfecta. Gol tras tu pase.', assist(), keyPass(), rel('coach', 4)), out('El rival la lee. Nada.')) }),
    opt('improvisar', 'Improvisar un disparo', [tendency('ego', 2)], { roll: roll(0.2, out('¡Y entra!', goal(), followers(4)), out('Barrera. El entrenador te mira mal.', rel('coach', -3))) }),
  ]),
  mev('gm-mal-arbitraje', O, 'Arbitraje casero', 'El árbitro pita todo a favor del local. Tu equipo está desquiciado.', [
    opt('calma', 'Pedir calma', [attr('composure', 1), rel('coach', 3)], { roll: roll(0.5, out('Os centráis y rascáis un empate.', keyPass(), tackle()), out('Perdéis igualmente.')) }),
    opt('protesta', 'Protestar cada decisión', [tendency('temperamento', 4)], { result: 'Amarilla y multa del club.' }),
  ]),
  mev('gm-hinchas-rivales', O, 'Estadio hostil', 'Todo el estadio te silba porque una vez criticaste a este club en una entrevista.', [
    opt('callar', 'Callarles jugando', [], { roll: roll(0.5, out('Partidazo. Les mandas callar con el dedo en los labios.', keyPass(2), dribble(), followers(5), tendency('ego', 2)), out('Te superan los silbidos.', form(-3)), 'composure') }),
    opt('ignorar', 'Ignorarlo', [attr('composure', 1), keyPass()], { result: 'Partido correcto. Ni caso.' }),
  ]),
  mev('gm-pretemporada-amistoso', O, 'Amistoso de lujo', 'Amistoso de verano contra un grande europeo. Las cámaras de medio mundo graban.', [
    opt('lucirse', 'Lucirse', [tendency('ego', 2)], { roll: roll(0.5, out('Te salen tres jugadas de highlights.', followers(8), rep('world', 1)), out('Te hacen un caño y se viraliza.', followers(4), morale(-2)), 'dribbling') }),
    opt('rodaje', 'Coger ritmo sin arriesgar', [fitness(4), rel('coach', 2)], { result: 'Rodaje tranquilo.' }),
  ], { phases: ['preseason'], category: 'training' }),
  mev('gm-nevada', O, 'Nieve', 'Nieva en pleno partido. El balón cuesta de mover.', [
    opt('fisico', 'Imponer el físico', [], { roll: roll(0.5, out('Ganas todos los duelos.', tackle(3), matchRating(0.3)), out('Resbalas en cada choque.'), 'strength') }),
    opt('tecnica', 'Toque por arriba', [], { roll: roll(0.35, out('Un pase picado acaba en gol.', keyPass(), matchRating(0.3)), out('El balón se frena en la nieve.')) }),
  ], { phases: ['winterWindow', 'secondHalf'] }),
  mev('gm-calor-tropical', O, '40 grados', 'Partido a pleno sol con 40 grados y una humedad brutal.', [
    opt('dosificar', 'Dosificarte', [fitness(3)], { roll: roll(0.5, out('Llegas entero al final y decides.', keyPass(2), matchRating(0.4)), out('Partido gris.')) }),
    opt('todo', 'Darlo todo desde el principio', [fitness(-6)], { roll: roll(0.45, out('Arrasas en la primera parte.', keyPass(), tackle(2), dribble()), out('Golpe de calor. Te retiran.', injury(1, 1)), 'stamina') }),
  ], { phases: ['firstHalf', 'secondHalf'] }),
  mev('gm-partido-aplazado', O, 'Partido aplazado', 'El partido se suspende en el descanso por una tormenta y se reanuda al día siguiente.', [
    opt('descansar', 'Descansar y concentrarte', [fitness(4)], { roll: roll(0.5, out('Sales enchufado en la reanudación.', keyPass(), tackle(), matchRating(0.4)), out('Cuesta volver a entrar.')) }),
    opt('analizar', 'Ver el vídeo de la primera parte', [attr('positioning', 1), keyPass()], { result: 'Corriges errores y mejoras.' }),
  ]),
  mev('gm-tacticas-rival', [MIDFIELDERS], 'El rival cambia el sistema', 'El rival cambia a tres centrales y os hace daño por dentro.', [
    opt('ajustar', 'Proponer un ajuste al entrenador', [rel('coach', 4), attr('vision', 1)], { roll: roll(0.55, out('El ajuste funciona: controlas el medio.', keyPass(3), tackle(2)), out('No hay tiempo para ajustarlo.')) }),
    opt('callar', 'Hacer lo que puedas', [tackle(2)], { result: 'Partido de supervivencia.' }),
  ]),
  mev('gm-lesionado-companero', O, 'Ocupar otra posición', 'Se lesiona un compañero y no quedan cambios. Te toca jugar en su posición.', [
    opt('aceptar', 'Aceptar sin quejarte', [rel('coach', 5), rel('dressingRoom', 4)], { roll: roll(0.5, out('Cumples de maravilla en un puesto nuevo.', tackle(2), keyPass(), matchRating(0.4)), out('Sufres, pero te dejas el alma.', tackle(1))) }),
    opt('quejarte', 'Decir que no es tu sitio', [rel('coach', -4)], { result: 'Juegas de mala gana.' }),
  ]),
  mev('gm-estreno-estadio', O, 'Estadio nuevo', 'El club estrena estadio y tú juegas el primer partido oficial.', [
    opt('historia', 'Querer el primer gol del estadio', [tendency('ego', 2)], { roll: roll(0.25, out('¡Primer gol de la historia del estadio! Placa con tu nombre.', goal(), rel('fans', 10), followers(6)), out('Lo marca un compañero.'), 'finishing') }),
    opt('ganar', 'Solo pensar en ganar', [keyPass(), tackle()], { result: 'Victoria en el estreno.' }),
  ], { once: true, weight: 4 }),
  mev('gm-hermano-rival', O, 'Contra tu hermano', 'Tu hermano juega en el equipo rival. Tus padres van con una camiseta mitad y mitad.', [
    opt('ganar', 'Ganarle sin piedad', [], { roll: roll(0.5, out('Ganas el duelo fraternal.', tackle(2), keyPass(), matchRating(0.4)), out('Gana él. Comida familiar tensa.', morale(-3)), 'composure') }),
    opt('disfrutar', 'Disfrutar el momento', [{ type: 'relation', who: 'family', delta: 8 }, morale(4)], { result: 'Foto con tu hermano al acabar. Tu madre llora.' }),
  ], { once: true, weight: 4, category: 'personal' }),
  mev('gm-pelea-grada', O, 'Lanzan objetos', 'Desde la grada rival lanzan un mechero que golpea a un compañero.', [
    opt('parar', 'Pedir que se pare el partido', [tendency('solidaridad', 4), rel('dressingRoom', 5)], { result: 'Se para diez minutos. Luego ganáis.' }),
    opt('seguir', 'Seguir jugando', [], { roll: roll(0.5, out('Respondéis con fútbol.', keyPass(), tackle()), out('El ambiente os puede.')) }),
  ]),
  mev('gm-penalti-fallado-companero', O, 'Penalti fallado', 'Tu compañero falla un penalti decisivo y se derrumba en el césped.', [
    opt('levantarle', 'Ir a levantarle', [rel('dressingRoom', 6), tendency('solidaridad', 4)], { result: 'Le abrazas. Nadie le culpa.' }),
    opt('seguir', 'Seguir concentrado', [], { roll: roll(0.45, out('Y en la siguiente jugada participas en el gol.', keyPass(), matchRating(0.3)), out('No hay más ocasiones.')) }),
  ]),
  mev('gm-debut-continental', [OUTFIELD, { type: 'flag', id: 'continental' }], 'Tu primera noche europea', 'Debutas en una competición continental. Suena el himno del torneo.', [
    opt('emocion', 'Dejarte llevar por la emoción', [morale(6)], { roll: roll(0.5, out('Juegas como en un sueño.', keyPass(2), tackle(), matchRating(0.5), rep('world', 2)), out('Los nervios te pueden.')) }),
    opt('frialdad', 'Jugar con frialdad', [attr('composure', 1), keyPass(), tackle()], { result: 'Debut sobrio y efectivo.' }),
  ], { once: true }),
  mev('gm-entrenador-interino', O, 'Entrenador interino', 'Han destituido al entrenador. El interino es el de juveniles, que te conoce desde niño.', [
    opt('confianza', 'Darlo todo por él', [rel('coach', 8)], { roll: roll(0.55, out('Partidazo. El interino gana su primer partido.', keyPass(), tackle(), matchRating(0.5)), out('Perdéis, pero se nota el compromiso.')) }),
    opt('normal', 'Jugar como siempre', [keyPass()], { result: 'Partido normal.' }),
  ]),
  mev('gm-gol-anulado-var-def', [DEFENDERS], 'El VAR anula tu gol', 'Marcas de cabeza en un córner, pero el VAR lo revisa por un posible empujón.', [
    opt('aceptar', 'Aceptarlo', [attr('composure', 1)], { roll: roll(0.5, out('El VAR lo da por bueno. ¡Gol!', goal()), out('Anulado. Sigue el partido.')) }),
    opt('protestar', 'Protestar', [tendency('temperamento', 3)], { roll: roll(0.45, out('Válido. Lo celebras el doble.', goal()), out('Anulado y amarilla.')) }),
  ]),
  mev('gm-asistencia-defensa', [DEFENDERS], 'El pase largo', 'Ves al delantero desmarcado a la espalda de la defensa rival.', [
    opt('pase', 'Pase largo de cuarenta metros', [], { roll: roll(0.35, out('Le dejas solo ante el portero. Gol. Asistencia de defensa.', assist(), keyPass()), out('Se va larga.'), 'longPassing') }),
    opt('corto', 'Pase corto al medio', [keyPass()], { result: 'Seguridad.' }),
  ]),
  mev('gm-presion-final', O, 'Último partido', 'Último partido de liga. Os jugáis el objetivo de la temporada.', [
    opt('heroe', 'Querer ser el héroe', [tendency('ego', 2)], { roll: roll(0.4, out('Decisivo: el partido de tu temporada.', keyPass(2), tackle(2), matchRating(0.8), rel('fans', 8)), out('Te precipitas.', form(-3)), 'composure') }),
    opt('equipo', 'Partido de equipo', [keyPass(), tackle(), rel('dressingRoom', 3)], { result: 'Cumplís el objetivo entre todos.' }),
  ], { phases: ['secondHalf'] }),
  mev('gm-vuelta-lesion', [OUTFIELD, { type: 'injured', value: false }], 'Vuelta tras lesión', 'Primer partido tras una lesión. Aún tienes miedo en los choques.', [
    opt('miedo', 'Evitar los choques', [], { roll: roll(0.5, out('Partido tranquilo para coger confianza.', keyPass()), out('Se nota que no estás.', form(-2))) }),
    opt('valiente', 'Meter la pierna desde el principio', [], { roll: roll(0.55, out('Primer choque, ganado. Ya estás de vuelta.', tackle(3), matchRating(0.4)), out('Te resientes de la lesión.', injury(1, 2)), 'strength') }),
  ]),
  mev('gm-camiseta-retirada', O, 'Homenaje a una leyenda', 'Antes del partido, el club retira la camiseta de una leyenda. El estadio está emocionado.', [
    opt('honrar', 'Jugar en su honor', [], { roll: roll(0.5, out('Partidazo. Se lo dedicas mirando al palco.', keyPass(2), tackle(), matchRating(0.5)), out('La emoción te bloquea.')) }),
    opt('foto', 'Pedirle una foto al acabar', [followers(3), morale(4)], { result: 'Te dice que le recuerdas a él de joven.' }),
  ]),
  mev('gm-gol-rebote', [ATTACKERS], '¿Tuyo o en propia?', 'Tu disparo rebota en un defensa y entra. La liga tiene que decidir a quién se lo da.', [
    opt('reclamar', 'Reclamarlo como tuyo', [tendency('ego', 2)], { roll: roll(0.5, out('Te lo dan. Un gol más.', goal()), out('Se lo apuntan como propia al defensa.')) }),
    opt('igual', 'Da igual: lo importante es ganar', [rel('dressingRoom', 3)], { roll: roll(0.4, out('Te lo dan igualmente.', goal()), out('En propia. Te da igual.')) }),
  ]),
  mev('gm-asistencia-rebote', [ATTACKERS], 'El rechace', 'Tu disparo lo para el portero y el rechace le cae a un compañero, que marca.', [
    opt('celebrar', 'Celebrarlo con él', [keyPass(), rel('dressingRoom', 3)], { result: 'Una ocasión creada. No cuenta como asistencia, pero cuenta.' }),
    opt('lamentar', 'Lamentar que no fuera tuyo', [tendency('ego', 2), keyPass()], { result: 'Las cámaras pillan tu cara de fastidio.' }),
  ]),
  mev('gm-dos-partidos', O, 'Tres partidos en una semana', 'Encadenáis tres partidos en siete días. Estás cansado.', [
    opt('rotar', 'Pedir descanso en uno', [fitness(6), rel('coach', -1)], { result: 'Llegas fresco al importante.' }),
    opt('jugar', 'Jugarlos todos', [fitness(-6), rel('coach', 4)], { roll: roll(0.5, out('Aguantas los tres a buen nivel.', keyPass(2), tackle(2)), out('Sobrecarga muscular.', injury(1, 2)), 'stamina') }),
  ]),
  mev('gm-revelacion', [OUTFIELD, { type: 'age', max: 21 }], 'Revelación de la jornada', 'Un periódico te elige revelación de la jornada tras tu último partido.', [
    opt('celebrar', 'Compartirlo en redes', [followers(6), tendency('ego', 2)], { result: 'Tu primera portada digital.' }),
    opt('trabajar', 'Seguir trabajando', [tendency('profesionalidad', 3), matchRating(0.2)], { result: 'El siguiente partido, otro notable.' }),
  ], { category: 'media', speaker: 'press' }),
  mev('gm-capitan-rival-respeto', O, 'Intercambio de camisetas', 'Al acabar, la estrella del rival te pide la camiseta.', [
    opt('aceptar', 'Intercambiarla', [followers(4), morale(4)], { result: 'Su camiseta acaba enmarcada en tu salón.' }),
    opt('regalar', 'Regalársela a un niño de la grada', [rel('fans', 5), tendency('solidaridad', 3)], { result: 'El niño no se lo cree.' }),
  ], { category: 'social' }),
  mev('gm-mvp-votacion', [OUTFIELD, { type: 'form', min: 65 }], 'Mejor jugador del mes', 'Te nominan a mejor jugador del mes. Los aficionados votan en redes.', [
    opt('campaña', 'Pedir el voto en redes', [followers(5), tendency('ego', 2)], { roll: roll(0.5, out('Ganas el premio.', rep('national', 2), morale(5)), out('Lo gana otro.')) }),
    opt('nada', 'No hacer campaña', [tendency('ego', -2)], { roll: roll(0.35, out('Lo ganas igualmente.', rep('national', 2)), out('Lo gana otro.')) }),
  ], { category: 'media', speaker: 'press' }),
  mev('gm-partido-cero', [MIDFIELDERS], 'Partido trabado', 'Partido sin ocasiones. Todo se decide en el centro del campo.', [
    opt('robar', 'Morder en cada balón', [], { roll: roll(0.55, out('Ganas la batalla del medio: seis robos.', tackle(6), matchRating(0.4)), out('Partido gris.', tackle(2)), 'aggression') }),
    opt('crear', 'Buscar el pase diferente', [], { roll: roll(0.4, out('Un pase rompe el partido: asistencia.', assist(), keyPass()), out('No encuentras huecos.', keyPass()), 'vision') }),
  ]),
  mev('gm-salida-contra', [ATTACKERS, { type: 'attribute', id: 'pace', min: 65 }], 'Contra en velocidad', 'El rival tiene un córner y tú te quedas arriba esperando la contra.', [
    opt('esperar', 'Quedarte arriba', [], { roll: roll(0.45, out('Despejan, sales como una bala y marcas.', goal(), form(4)), out('El córner acaba en gol rival. Te reprochan no defender.', rel('coach', -3)), 'pace') }),
    opt('defender', 'Bajar a defender el córner', [tackle(), rel('coach', 3)], { result: 'Despejas de cabeza. Disciplina.' }),
  ]),
  mev('gm-volver-club-cedido', O, 'Contra el club que te cedió', 'Estás cedido y te toca jugar contra tu club de origen.', [
    opt('demostrar', 'Demostrar que deben contar contigo', [], { roll: roll(0.5, out('Partidazo. Tu club toma nota.', keyPass(2), tackle(2), matchRating(0.6), rel('board', 4)), out('No te sale nada.'), 'composure') }),
    opt('neutral', 'Partido normal', [keyPass(), tackle()], { result: 'Profesional.' }),
  ], { category: 'loan' }),
  mev('gm-entrenamiento-a-partido', O, 'Lo del entrenamiento', 'Hoy sale en el partido exactamente la jugada que ensayasteis toda la semana.', [
    opt('ejecutar', 'Ejecutarla a la perfección', [], { roll: roll(0.55, out('Sale de libro. Tu pase la culmina.', keyPass(2), matchRating(0.3), rel('coach', 4)), out('Un rival la intuye.')) }),
    opt('variar', 'Variar en el último momento', [], { roll: roll(0.4, out('Sorprendes a todos. Pase clave.', keyPass(), dribble()), out('Sorprendes también a tus compañeros.', rel('coach', -2))) }),
  ]),
  mev('gm-capitan-propio-error', O, 'Error del capitán', 'El capitán comete un error que os cuesta un gol. Está hundido.', [
    opt('animar', 'Animarle en voz alta', [rel('dressingRoom', 4), attr('leadership', 1)], { result: 'Se levanta y hace un gran partido.' }),
    opt('compensar', 'Compensarlo con tu juego', [], { roll: roll(0.5, out('Tiras del equipo: pase clave y robos.', keyPass(), tackle(2), matchRating(0.3)), out('No basta.')) }),
  ]),
  mev('gm-penalti-favor-def', [DEFENDERS], 'Penalti provocado', 'Subes a un córner, te agarran y el árbitro pita penalti.', [
    opt('pedir', 'Pedir tirarlo', [tendency('ego', 2)], { roll: roll(0.55, out('Gol. Los defensas también marcan.', goal(), followers(3)), out('Lo fallas. Te miran mal.', rel('dressingRoom', -3)), 'penalties') }),
    opt('ceder', 'Cedérselo al lanzador', [rel('dressingRoom', 2)], { result: 'Gol del lanzador. Penalti provocado por ti.' }),
  ]),
  mev('gm-premio-dinero', O, 'Prima por victoria', 'La directiva promete una prima doble si ganáis el próximo partido.', [
    opt('motivado', 'Salir motivado', [], { roll: roll(0.55, out('Ganáis. Prima en el bolsillo.', money(15000), keyPass(), tackle(), matchRating(0.3)), out('Empate. Sin prima.')) }),
    opt('repartir', 'Proponer repartirla con los empleados del club', [tendency('solidaridad', 5), rel('dressingRoom', 4)], { result: 'Gesto aplaudido.' }),
  ], { category: 'contract', speaker: 'board' }),
  mev('gm-penalti-parado-repetido', [ATTACKERS], 'Repetir el penalti', 'El portero te para un penalti, pero el árbitro manda repetirlo porque se adelantó.', [
    opt('mismo', 'Tirarlo al mismo lado', [], { roll: roll(0.55, out('Al mismo sitio. Esta vez, gol.', goal()), out('Te lo vuelve a parar.', morale(-6)), 'composure') }),
    opt('otro', 'Cambiar de lado', [], { roll: roll(0.65, out('Engañado. Gol.', goal()), out('Al palo.', morale(-6)), 'penalties') }),
  ]),
  mev('gm-insultos-companero', O, 'Te culpan', 'Un compañero te culpa a gritos de un gol en contra delante de todo el estadio.', [
    opt('responder', 'Responderle', [tendency('temperamento', 3), rel('dressingRoom', -4)], { result: 'Os separan. El entrenador os sienta a los dos.' }),
    opt('callar', 'Callar y jugar', [attr('composure', 1)], { roll: roll(0.5, out('Le respondes con un partidazo.', keyPass(), tackle(2), matchRating(0.4)), out('Te afecta.', form(-2))) }),
  ]),
  mev('gm-equipo-ideal', [OUTFIELD, { type: 'form', min: 70 }], 'Once ideal', 'Entras en el once ideal de la jornada por tercera vez esta temporada.', [
    opt('celebrar', 'Celebrarlo', [followers(4), morale(4)], { result: 'Racha de forma.' }),
    opt('exigir', 'Exigirte más', [tendency('profesionalidad', 3), matchRating(0.2)], { result: 'Siguiente partido: notable alto.' }),
  ], { category: 'media', speaker: 'press' }),
  mev('gm-falta-ultimo-minuto', [ATTACKERS, { type: 'attribute', id: 'freeKicks', min: 60 }], 'Falta en el descuento', 'Falta en la frontal en el minuto 94. Empate.', [
    opt('directa', 'Directa a puerta', [], { roll: roll(0.25, out('¡Gol en el último segundo! Locura.', goal(), rel('fans', 12), followers(6)), out('A la barrera. Final.'), 'freeKicks') }),
    opt('centro', 'Centro al área', [], { roll: roll(0.3, out('Cabezazo y gol. Tu centro, decisivo.', assist(), keyPass()), out('Despeja el portero.'), 'crossing') }),
  ], { phases: ['secondHalf'] }),
  mev('gm-honor-veterano', [OUTFIELD, { type: 'age', min: 33 }], 'Partido 500', 'Hoy juegas tu partido número 500 como profesional.', [
    opt('celebrar', 'Disfrutarlo', [morale(6), followers(3)], { roll: roll(0.5, out('Lo celebras con un partidazo.', keyPass(2), tackle(), matchRating(0.5)), out('Un partido más.')) }),
    opt('normal', 'Un partido más', [keyPass(), tackle()], { result: 'Sin ceremonias.' }),
  ], { once: true, weight: 4 }),
];
