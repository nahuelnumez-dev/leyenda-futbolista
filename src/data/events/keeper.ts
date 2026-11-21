/** Decisiones de portero (v1.6): paradas y porterías a cero que suman a las estadísticas. */
import type { GameEvent } from '@/engine/types/events';
import {
  KEEPER, attr, cleanSheet, fitness, followers, form, injury, keyPass, matchRating, mev, morale, news, opt, out, rel, rep, roll, save, tendency,
} from './helpers';

const K = [KEEPER];

export const KEEPER_EVENTS: GameEvent[] = [
  mev('gkm-mano-a-mano', K, 'Mano a mano', 'El delantero rival se planta solo ante ti tras un error de tu central.', [
    opt('salir', 'Salir rápido a taparle', [], { roll: roll(0.5, out('Le tapas todo el ángulo y despejas con el cuerpo.', save(), matchRating(0.5)), out('Te regatea y marca.', form(-3)), 'rushingOut') }),
    opt('esperar', 'Esperar de pie hasta el final', [], { roll: roll(0.45, out('Aguantas, chuta y la sacas con el pie.', save(), matchRating(0.5)), out('La cruza junto al palo.'), 'reflexes') }),
  ]),
  mev('gkm-asedio', K, 'Asedio', 'Ganáis 1-0 y el rival os encierra en vuestra área durante veinte minutos.', [
    opt('mandar', 'Mandar en el área y salir a todo', [], { roll: roll(0.55, out('Atrapas cada centro. Portería a cero.', save(3), cleanSheet(), rel('fans', 5)), out('Sales mal en un córner y empatan.', save(2), form(-3)), 'rushingOut') }),
    opt('linea', 'Quedarte en la línea', [], { roll: roll(0.5, out('Tres paradas seguidas. Portería a cero.', save(3), cleanSheet()), out('Un cabezazo imparable. Empate.', save(2)), 'reflexes') }),
  ], { weight: 12 }),
  mev('gkm-penalti', K, 'Penalti en contra', 'Penalti en contra. El lanzador es zurdo y lleva cinco seguidos marcados al mismo lado.', [
    opt('lado', 'Tirarte a su lado de siempre', [], { roll: roll(0.4, out('¡Lo paras! Te lo celebran como un gol.', save(), matchRating(0.8), rel('fans', 8)), out('Cambia de lado. Gol.', morale(-2)), 'diving') }),
    opt('esperar', 'Aguantar hasta el último momento', [], { roll: roll(0.33, out('La pica al centro y la atrapas sin moverte.', save(), matchRating(0.8), followers(4)), out('Entra pegada al palo.'), 'composure') }),
    opt('psicologia', 'Hablarle antes del lanzamiento', [tendency('carisma', 2)], { roll: roll(0.35, out('Duda y la manda fuera. Psicología pura.', matchRating(0.5)), out('Te mira, sonríe y marca.')) }),
  ]),
  mev('gkm-paradon', K, 'Disparo a la escuadra', 'Un disparo lejano va directo a la escuadra.', [
    opt('volar', 'Volar con la mano cambiada', [], { roll: roll(0.45, out('¡Paradón! La sacas con la punta de los dedos.', save(), matchRating(0.6), followers(5)), out('No llegas. Gol de bandera del rival.'), 'diving') }),
    opt('desviar', 'Desviarla a córner con la buena', [], { roll: roll(0.5, out('La desvías al larguero y fuera.', save(), matchRating(0.3)), out('Te falta un palmo.'), 'agility') }),
  ]),
  mev('gkm-salida-pies', K, 'Presión alta rival', 'Te la devuelven con el delantero rival encima. {entrenador} quiere salir jugando.', [
    opt('jugar', 'Regatearle y salir jugando', [], { roll: roll(0.45, out('Le dejas sentado y das un pase perfecto. La grada aplaude.', keyPass(), matchRating(0.3)), out('Te la roba y marca a puerta vacía.', rel('coach', -6), form(-5)), 'kicking') }),
    opt('patadon', 'Patadón', [rel('coach', -1)], { result: 'Sin riesgo. El entrenador resopla.' }),
  ]),
  mev('gkm-porteria-cero-racha', [KEEPER, { type: 'form', min: 60 }], 'Racha imbatida', 'Llevas cuatro partidos sin encajar. Hoy juega el equipo más goleador de la liga.', [
    opt('concentracion', 'Máxima concentración', [], { roll: roll(0.45, out('Cinco paradas y quinta portería a cero seguida.', save(5), cleanSheet(), rep('national', 3), news('{apodo} sigue imbatido', 'positive')), out('Se acaba la racha con un gol de rebote.', save(3), morale(-2)), 'concentration') }),
    opt('disfrutar', 'Disfrutar sin presión', [morale(3)], { roll: roll(0.4, out('Partidazo relajado. Portería a cero.', save(4), cleanSheet()), out('Encajas uno.', save(2))) }),
  ], { weight: 8 }),
  mev('gkm-tanda', [KEEPER], 'Tanda de penaltis', 'Eliminatoria de copa a los penaltis. Has estudiado a los lanzadores toda la semana.', [
    opt('estudio', 'Seguir tus notas', [], { roll: roll(0.5, out('Paras dos. ¡Pasáis!', matchRating(0.8), rel('fans', 10), rep('national', 2)), out('Te cambian todos el lado.', morale(-4)), 'diving') }),
    opt('instinto', 'Fiarte del instinto', [], { roll: roll(0.4, out('Paras uno decisivo. ¡Clasificados!', matchRating(0.6), rel('fans', 8)), out('No paras ninguno.', morale(-4)), 'reflexes') }),
  ], { phases: ['secondHalf'] }),
  mev('gkm-centro-lateral', K, 'Centro con efecto', 'Centro cerrado al primer palo con un delantero entrando.', [
    opt('atrapar', 'Salir a atraparlo', [], { roll: roll(0.55, out('Lo atrapas por encima de todos.', save(), matchRating(0.3)), out('Te gana la posición y cabecea a gol.', form(-3)), 'rushingOut') }),
    opt('puño', 'Despejar de puños', [], { roll: roll(0.6, out('Despeje lejano. Peligro fuera.', save()), out('El despeje cae a un rival. Gol.'), 'strength') }),
  ]),
  mev('gkm-saque-rapido', K, 'Saque rápido', 'Atrapas un balón y ves a tu extremo solo en la banda.', [
    opt('rapido', 'Saque con la mano rapidísimo', [], { roll: roll(0.5, out('Contraataque y gol. La jugada empezó en tus manos.', keyPass(), matchRating(0.4)), out('El saque sale corto y os pillan.', rel('coach', -3)), 'kicking') }),
    opt('calma', 'Dormir el partido', [matchRating(0.1)], { result: 'Calma. Ganáis por la mínima.' }),
  ]),
  mev('gkm-error', K, 'La cantada', 'Un tiro fácil se te escapa entre las manos. Gol en contra.', [
    opt('olvidar', 'Olvidarlo al instante', [attr('composure', 1)], { roll: roll(0.55, out('Haces tres paradas de mérito después. Te ovacionan.', save(3), matchRating(0.3)), out('Te tiembla todo el partido.', save(1), form(-4)), 'composure') }),
    opt('disculpa', 'Pedir perdón a tus compañeros', [rel('dressingRoom', 4)], { result: 'Te arropan. «Nos salvas cada semana».' }),
  ]),
  mev('gkm-doble-parada', K, 'Doble ocasión', 'Paras un disparo, pero el rechace cae a otro delantero a dos metros.', [
    opt('levantarse', 'Levantarte a por la segunda', [], { roll: roll(0.4, out('¡Doble parada! El estadio entero en pie.', save(2), matchRating(0.8), followers(6)), out('Paras la primera, pero no la segunda.', save()), 'agility') }),
    opt('cuerpo', 'Tirarte al suelo a tapar', [], { roll: roll(0.45, out('Le tapas el remate con el cuerpo.', save(2), matchRating(0.5)), out('Te la mete por encima.', save()), 'reflexes') }),
  ]),
  mev('gkm-falta', K, 'La barrera', 'Falta peligrosa a 20 metros. Tienes que colocar la barrera.', [
    opt('cuatro', 'Barrera de cuatro y cubrir tu palo', [], { roll: roll(0.55, out('Tira por encima y la atrapas.', save(), matchRating(0.3)), out('Por encima de la barrera y a tu palo.', form(-2)), 'gkPositioning') }),
    opt('dos', 'Barrera de dos y ver el balón', [], { roll: roll(0.45, out('Lo ves salir y vuelas.', save(), matchRating(0.5)), out('No llegas.'), 'diving') }),
  ]),
  mev('gkm-gol-anulado', K, 'El VAR te salva', 'Encajas un gol, pero el VAR revisa una posible falta sobre ti.', [
    opt('protestar', 'Protestar al árbitro', [tendency('temperamento', 2)], { roll: roll(0.5, out('Anulado. Portería a cero al final.', cleanSheet()), out('Gol válido y amarilla.')) }),
    opt('calma', 'Esperar tranquilo', [attr('composure', 1)], { roll: roll(0.5, out('Anulado. Y no encajas nada más.', cleanSheet(), save(2)), out('Gol válido.')) }),
  ]),
  mev('gkm-lluvia', K, 'Balón mojado', 'Diluvia. El balón resbala y bota de forma extraña.', [
    opt('blocar', 'Intentar blocar todo', [], { roll: roll(0.45, out('Ni un rechace. Partidazo bajo la lluvia.', save(4), cleanSheet()), out('Se te escurre uno. Gol.', save(2), form(-2)), 'concentration') }),
    opt('despejar', 'Despejar todo a córner', [save(3), rel('coach', 2)], { result: 'Feo pero seguro.' }),
  ]),
  mev('gkm-gran-noche', [KEEPER, { type: 'flag', id: 'continental' }], 'Noche europea', 'Partido continental contra uno de los mejores ataques de Europa.', [
    opt('heroe', 'Querer ser el héroe', [], { roll: roll(0.4, out('Ocho paradas. Portería a cero. Te eligen jugador del partido.', save(8), cleanSheet(), rep('world', 3), followers(8)), out('Encajas tres. Noche larga.', save(4), morale(-6)), 'reflexes') }),
    opt('sencillo', 'Hacer lo sencillo bien', [save(4), matchRating(0.3)], { result: 'Partido serio. Os vais con un empate.' }),
  ]),
  mev('gkm-juvenil', K, 'Portero juvenil', 'Partido juvenil contra el líder. Su delantero ya tiene ficha profesional.', [
    opt('salir', 'Salir a cortar sus desmarques', [], { roll: roll(0.5, out('Le cortas tres veces. Portería a cero.', save(3), cleanSheet()), out('Te pica el balón por encima.', save(1)), 'rushingOut') }),
    opt('portería', 'Esperarle en la portería', [], { roll: roll(0.5, out('Le paras un mano a mano. Portería a cero.', save(4), cleanSheet()), out('Te marca dos.', save(2)), 'reflexes') }),
  ], { stages: ['academy'] }),
  mev('gkm-capitan', [KEEPER, { type: 'flag', id: 'captain' }], 'Ordenar la defensa', 'Tu defensa está desordenada. Como capitán, te toca hablar.', [
    opt('gritar', 'Gritar y ordenar a todos', [attr('leadership', 1)], { roll: roll(0.55, out('La defensa se ordena. Portería a cero.', cleanSheet(), save(2)), out('Nadie te escucha. Encajáis.', save(2)), 'leadership') }),
    opt('ejemplo', 'Dar ejemplo con paradas', [], { roll: roll(0.5, out('Tres paradas que levantan al equipo.', save(3), matchRating(0.4)), out('No basta.', save(1)), 'reflexes') }),
  ]),
  mev('gkm-lesion', K, 'Golpe en la salida', 'Sales a por un balón y un delantero te golpea con la rodilla.', [
    opt('seguir', 'Seguir jugando con dolor', [rel('fans', 4)], { roll: roll(0.55, out('Aguantas y haces dos paradas más.', save(2), matchRating(0.4)), out('El dolor no te deja. Te tienen que sustituir.', injury(1, 2)), 'stamina') }),
    opt('cambio', 'Pedir el cambio', [fitness(2)], { result: 'Entra el suplente. Lo correcto.' }),
  ]),
  mev('gkm-bocajarro', K, 'A bocajarro', 'Remate a dos metros tras un rebote en el área.', [
    opt('reflejo', 'Reaccionar por puro reflejo', [], { roll: roll(0.4, out('¡Parada imposible! Nadie entiende cómo.', save(), matchRating(0.6), followers(6)), out('Imposible de parar.'), 'reflexes') }),
    opt('cerrar', 'Cerrar el cuerpo', [], { roll: roll(0.45, out('Te da en el pecho y sale fuera.', save()), out('Entra entre las piernas.', form(-2))) }),
  ]),
  mev('gkm-colocacion', K, 'Colocación', 'El rival chuta mucho desde lejos. El entrenador de porteros te pide adelantar un metro.', [
    opt('adelantar', 'Adelantarte', [], { roll: roll(0.5, out('Interceptas dos pases al hueco. Portería a cero.', save(2), cleanSheet()), out('Te superan con un globo.'), 'gkPositioning') }),
    opt('atras', 'Quedarte en la línea', [], { roll: roll(0.55, out('Paras cuatro disparos lejanos.', save(4)), out('Un centro raso se te cuela.', save(2)), 'reflexes') }),
  ]),
  mev('gkm-derbi', [KEEPER, { type: 'derbyUpcoming' }], 'Derbi', 'Derbi. La grada rival lleva toda la semana metiéndose contigo.', [
    opt('callar', 'Callarles con paradas', [], { roll: roll(0.5, out('Portería a cero en el derbi. La ciudad es tuya.', save(5), cleanSheet(), rel('fans', 12)), out('Encajas dos. Te lo recordarán.', save(3), morale(-4)), 'concentration') }),
    opt('provocar', 'Provocarles en el calentamiento', [tendency('ego', 3), followers(4)], { roll: roll(0.4, out('Y luego paras un penalti. Leyenda.', save(3), cleanSheet(), rel('fans', 10)), out('Encajas tres y te silban hasta el autobús.', save(2), rel('fans', -6))) }),
  ], { weight: 12 }),
  mev('gkm-suplente-sale', K, 'Sales del banquillo', 'El titular se lesiona en el minuto 20. Te toca entrar en frío.', [
    opt('calentar', 'Pedir un minuto para estirar', [], { roll: roll(0.55, out('Entras y haces un partidazo. Portería a cero.', save(4), cleanSheet(), rel('coach', 6)), out('Te cuesta entrar. Encajas uno.', save(2)), 'composure') }),
    opt('directo', 'Entrar directamente', [], { roll: roll(0.45, out('Primera parada a los 30 segundos. Ya estás dentro.', save(3), matchRating(0.4)), out('Te pilla frío el primer disparo.', save(1))) }),
  ], { stages: ['breakthrough', 'establishment'] }),
  mev('gkm-penalti-juego', K, 'Te pitan penalti', 'Sales a por el balón y el delantero cae. El árbitro pita penalti.', [
    opt('protestar', 'Protestar', [tendency('temperamento', 3)], { roll: roll(0.35, out('El VAR lo anula. No le tocaste.', matchRating(0.2)), out('Penalti y amarilla.', form(-2))) }),
    opt('parar', 'Concentrarte en pararlo', [], { roll: roll(0.3, out('¡Lo paras! Te redimes en el acto.', save(), matchRating(0.6)), out('Gol.'), 'diving') }),
  ]),
  mev('gkm-veterano', [KEEPER, { type: 'age', min: 32 }], 'Experiencia', 'Ya no saltas como antes, pero lees el juego mejor que nunca.', [
    opt('leer', 'Anticiparte a todo', [], { roll: roll(0.6, out('Ni un remate peligroso. Portería a cero.', save(3), cleanSheet()), out('Uno te sorprende.', save(2)), 'gkPositioning') }),
    opt('ordenar', 'Dirigir a la defensa todo el partido', [attr('leadership', 1), save(2)], { result: 'Tu voz se oye en todo el estadio.' }),
  ]),
  mev('gkm-entrevista', K, 'El mejor portero', 'Un periodista te pregunta si eres el mejor portero de la liga.', [
    opt('humilde', '«Mi defensa me lo pone fácil»', [rel('dressingRoom', 4), rel('press', 2)], { result: 'Tus defensas te invitan a cenar.' }),
    opt('si', '«Los números hablan»', [tendency('ego', 3), followers(4)], { result: 'Titular jugoso. Tus defensas se ríen.' }),
  ], { category: 'media', speaker: 'press' }),
];
