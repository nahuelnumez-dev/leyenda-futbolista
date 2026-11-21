/** Decisiones de ataque (v1.6): delanteros, extremos y mediapuntas. Lo que pasa en el campo suma a las estadísticas. */
import type { Condition, GameEvent } from '@/engine/types/events';
import {
  ATTACKERS, FORWARDS, STRIKERS, WINGERS, assist, attr, dribble, followers, form, goal, goalsAtLeast, keyPass, matchRating, mev, minOverall, morale, news,
  opt, out, rel, rep, roll, tendency, celebration, injury, fitness,
} from './helpers';

const MCO: Condition = { type: 'position', in: ['MCO', 'MC'] };

export const ATTACK_EVENTS: GameEvent[] = [
  mev('at-mano-a-mano', [FORWARDS], 'Solo ante el portero', 'Te filtran un pase perfecto y te quedas solo ante el portero. Sale a por ti.', [
    opt('vaselina', 'Picarla por encima', [], { roll: roll(0.45, out('Vaselina perfecta. El balón entra lento, como a cámara lenta.', goal(), followers(4), form(5)), out('El portero ni se mueve y la atrapa en el aire.', form(-3)), 'composure') }),
    opt('regatear', 'Regatearle', [], { roll: roll(0.5, out('Amagas, lo dejas sentado y empujas a puerta vacía.', goal(), dribble(), form(5)), out('Te tapa el ángulo y despeja con el pie.', form(-2)), 'dribbling') }),
    opt('cruzar', 'Cruzarla al palo largo', [], { roll: roll(0.55, out('Raso y cruzado. Gol de manual.', goal(), form(4)), out('Se va rozando el palo.', morale(-2)), 'finishing') }),
  ]),
  mev('at-doblete', [FORWARDS, minOverall(60)], 'Ya llevas uno', 'Has marcado en la primera parte. En la segunda, el rival se abre buscando el empate y te deja espacios.', [
    opt('ambicion', 'Ir a por el segundo', [], { roll: roll(0.45, out('Doblete. Los dos con la derecha, los dos a la red.', goalsAtLeast(2), rel('fans', 5), form(6)), out('Te quedas en uno, pero ganáis.', goalsAtLeast(1)), 'finishing') }),
    opt('equipo', 'Bajar a ayudar en defensa', [goalsAtLeast(1), rel('coach', 5), tendency('solidaridad', 3)], { result: 'Ganáis 1-0 con tu gol. El entrenador alaba tu sacrificio.' }),
  ]),
  mev('at-penalti-provocado', [FORWARDS], 'Te hacen penalti', 'Entras en el área, el central te derriba y el árbitro señala el punto. Eres el lanzador.', [
    opt('fuerte', 'Fuerte, arriba', [], { roll: roll(0.7, out('A la escuadra. Imparable.', goal(), form(4)), out('Al larguero. El balón tiembla en la cruceta.', morale(-4)), 'penalties') }),
    opt('raso', 'Raso, al lado contrario del portero', [], { roll: roll(0.72, out('El portero se tira al otro lado. Gol.', goal(), form(4)), out('Lo adivina y la detiene.', morale(-4)), 'composure') }),
    opt('ceder', 'Dejárselo a {companero}, que lleva una racha mala', [tendency('solidaridad', 5), rel('dressingRoom', 6)], { result: 'Lo marca y te dedica el gol. El vestuario no lo olvida.' }),
  ]),
  mev('at-contra', [ATTACKERS], 'Contraataque tres contra dos', 'Robáis en vuestro campo y salís a la contra. Llevas tú el balón y tienes un compañero a cada lado.', [
    opt('derecha', 'Abrir a la derecha en el momento justo', [], { roll: roll(0.55, out('Pase al hueco y gol de tu compañero.', assist(), keyPass(), rel('dressingRoom', 4)), out('El pase sale largo.', form(-2)), 'vision') }),
    opt('conducir', 'Conducir hasta el final', [], { roll: roll(0.4, out('Aguantas hasta que el portero se vence y la cruzas.', goal(), dribble(), form(5)), out('Te cierran y pierdes el balón.', rel('dressingRoom', -3)), 'dribbling') }),
  ]),
  mev('at-tiro-lejano', [ATTACKERS], 'Desde fuera del área', 'El rival se encierra atrás. Recibes a 25 metros con espacio para armar la pierna.', [
    opt('chutar', 'Chutar', [], { roll: roll(0.25, out('¡Misil a la escuadra! El portero ni la ve.', goal(), followers(6), rep('national', 2), form(6)), out('Se va alta, a la grada.', form(-1)), 'shooting') }),
    opt('combinar', 'Combinar al primer toque', [], { roll: roll(0.5, out('Pared y pase de la muerte. Gol de tu compañero.', assist(), keyPass()), out('El rival corta la pared.'), 'shortPassing') }),
  ]),
  mev('at-desmarque', [STRIKERS], 'El desmarque', 'Llevas todo el partido peleando con los centrales. {companero} levanta la cabeza en el medio campo.', [
    opt('espalda', 'Tirar el desmarque a la espalda', [], { roll: roll(0.45, out('Llegas antes que el central y la empujas.', goal(), form(5)), out('Fuera de juego por medio metro.', morale(-1)), 'pace') }),
    opt('apoyo', 'Bajar a recibir y descargar', [keyPass(2), rel('coach', 3), attr('teamwork', 1)], { result: 'No marcas, pero el equipo juega mejor contigo de referencia.' }),
  ]),
  mev('at-centro', [STRIKERS], 'Centro desde la banda', 'El extremo llega a línea de fondo y te mira antes de centrar.', [
    opt('primer', 'Atacar el primer palo', [], { roll: roll(0.45, out('Peinas el balón y se cuela por la escuadra contraria.', goal(), form(5)), out('Llegas un pelo tarde.', form(-1)), 'heading') }),
    opt('segundo', 'Quedarte en el segundo palo', [], { roll: roll(0.4, out('El balón pasa por todos y llega a ti. Remate a placer.', goal(), form(4)), out('El central despeja antes.', form(-1)), 'positioning') }),
  ]),
  mev('at-hat-trick-asistencia', [FORWARDS, minOverall(66)], 'A un gol del hat-trick', 'Llevas dos goles y es el minuto 88. Encaras al portero, pero {companero} está solo a tu lado.', [
    opt('tirar', 'Tirar tú', [tendency('ego', 3)], { roll: roll(0.5, out('¡Hat-trick! Te llevas el balón a casa firmado por todos.', goalsAtLeast(3), followers(8), rep('national', 3), celebration('voltereta')), out('El portero la saca con la punta de los dedos.', goalsAtLeast(2)), 'finishing') }),
    opt('pasar', 'Pasársela', [goalsAtLeast(2), assist(), tendency('solidaridad', 5), rel('dressingRoom', 8)], { result: 'Gol a puerta vacía. Tu compañero corre a abrazarte.' }),
  ]),
  mev('at-regate-banda', [WINGERS], 'Uno contra uno en la banda', 'El lateral rival está amonestado y te espera abierto. La grada pide que le encares.', [
    opt('encarar', 'Encararle una y otra vez', [], { roll: roll(0.55, out('Le ganas tres veces y la tercera acaba en centro de gol.', dribble(4), assist(), form(5)), out('Te gana todos los duelos. Te cambian en el 60.', dribble(1), form(-4)), 'dribbling') }),
    opt('provocar', 'Buscar la segunda amarilla', [tendency('ego', 2)], { roll: roll(0.45, out('Entra a destiempo. Roja y diez contra once.', dribble(2), rel('fans', 3)), out('El árbitro te amonesta a ti por simular.', rel('press', -3)), 'agility') }),
  ]),
  mev('at-pierna-mala', [WINGERS], 'Hacia dentro', 'Recortas hacia tu pierna buena y te queda el disparo desde la frontal.', [
    opt('rosca', 'Rosca al palo largo', [], { roll: roll(0.35, out('La rosca entra pegada al palo. Tu gol favorito.', goal(), dribble(), form(5)), out('Se va fuera por centímetros.', dribble()), 'shooting') }),
    opt('pase', 'Buscar al delantero', [], { roll: roll(0.5, out('Pase en profundidad y gol del nueve.', assist(), keyPass(), dribble()), out('Lo corta el central.', dribble()), 'vision') }),
  ]),
  mev('at-velocidad', [WINGERS], 'Carrera de 50 metros', 'Balón largo a la espalda de la defensa. Tú y el central, 50 metros por delante.', [
    opt('correr', 'Correr como nunca', [fitness(-3)], { roll: roll(0.5, out('Le sacas dos metros y la colocas a la escuadra.', goal(), form(5)), out('Te alcanza justo en el área.', form(-1)), 'pace') }),
    opt('frenar', 'Frenar y esperar apoyos', [], { roll: roll(0.55, out('Esperas, abres a tu compañero y la pone al segundo palo.', assist(), keyPass()), out('Llegan los defensas y se pierde la ocasión.', rel('fans', -2)), 'vision') }),
  ]),
  mev('at-falta-frontal', [ATTACKERS, { type: 'attribute', id: 'freeKicks', min: 55 }], 'Falta en la frontal', 'Falta a 22 metros, ligeramente escorada. El lanzador habitual se acerca, pero tú también quieres tirarla.', [
    opt('pedir', 'Pedir la falta', [tendency('ego', 2)], { roll: roll(0.25, out('¡Por encima de la barrera y a la escuadra!', goal(), followers(5), form(6)), out('A la barrera. Contragolpe rival.', rel('coach', -3)), 'freeKicks') }),
    opt('ensayada', 'Proponer la jugada ensayada', [], { roll: roll(0.4, out('Toque corto, pase atrás y gol de un compañero.', assist(), keyPass(), rel('coach', 4)), out('Sale mal. Risas en el banquillo.', morale(-1)), 'vision') }),
    opt('dejar', 'Dejar que la tire él', [rel('dressingRoom', 3)], { result: 'Al palo. Te miran, pero no dices nada.' }),
  ]),
  mev('at-media-luna', [MCO], 'Entre líneas', 'Recibes entre el centro del campo y la defensa rival. Tienes un segundo para decidir.', [
    opt('filtrar', 'Filtrar el pase al delantero', [], { roll: roll(0.55, out('Pase entre los centrales. El delantero solo tiene que empujarla.', assist(), keyPass(2), form(4)), out('El pase se queda corto.', keyPass()), 'vision') }),
    opt('girar', 'Girarte y chutar', [], { roll: roll(0.35, out('Te giras y la pones junto al palo.', goal(), form(5)), out('Te cierran el disparo.', form(-1)), 'shooting') }),
    opt('sostener', 'Aguantar y que suba el equipo', [keyPass(), rel('coach', 3), matchRating(0.3)], { result: 'Pausa y control. El equipo respira contigo.' }),
  ]),
  mev('at-rabona', [ATTACKERS, { type: 'attribute', id: 'ballControl', min: 65 }], 'Sin pierna buena', 'El balón te llega por la izquierda y tu pierna buena es la derecha. Hay que centrar ya.', [
    opt('rabona', 'Centro de rabona', [tendency('ego', 3)], { roll: roll(0.4, out('Rabona perfecta y remate de cabeza a gol. Las redes arden.', assist(), keyPass(), followers(10)), out('Sale fatal. Al lateral.', rel('coach', -4), followers(3)), 'crossing') }),
    opt('mala', 'Centrar con la mala', [], { roll: roll(0.5, out('Centro tenso con la izquierda. Gol.', assist(), keyPass()), out('Centro mordido.'), 'crossing') }),
  ]),
  mev('at-ruleta-final', [ATTACKERS, { type: 'attribute', id: 'dribbling', min: 65 }], 'Dos defensas encima', 'Te cierran dos defensas junto a la línea de fondo. No hay pase posible.', [
    opt('ruleta', 'Ruleta para salir', [], { roll: roll(0.5, out('Ruleta y te quedas solo. Centro atrás y gol.', dribble(2), assist(), followers(4)), out('Te la quitan. Saque de banda para ellos.', dribble()), 'agility') }),
    opt('falta', 'Proteger el balón y buscar la falta', [], { roll: roll(0.6, out('Falta. El equipo respira.', matchRating(0.2)), out('El árbitro dice que sigan.', form(-1)), 'strength') }),
  ]),
  mev('at-sombrero', [ATTACKERS, { type: 'attribute', id: 'ballControl', min: 70 }], 'El defensa sale a por ti', 'El central sale como un tren a por ti en el borde del área.', [
    opt('sombrero', 'Sombrerito', [tendency('ego', 2)], { roll: roll(0.4, out('Se lo pasas por encima y chutas de volea. ¡Golazo!', goal(), dribble(), followers(8), form(6)), out('Te lo roba en el aire.', dribble()), 'ballControl') }),
    opt('toque', 'Tocar de primeras', [keyPass(), rel('coach', 2)], { result: 'Sencillo y efectivo. El ataque sigue.' }),
  ]),
  mev('at-gol-cabeza', [FORWARDS, { type: 'attribute', id: 'heading', min: 60 }], 'Córner a favor', 'Córner en el minuto 80, empate a cero. Te marcan dos defensas.', [
    opt('arrastrar', 'Arrastrar marcas para un compañero', [], { roll: roll(0.45, out('Te llevas a los dos y {companero} cabecea solo.', keyPass(), rel('dressingRoom', 4)), out('Despeja el portero.')) }),
    opt('rematar', 'Pelear el remate', [], { roll: roll(0.35, out('Te elevas por encima de todos. ¡Gol!', goal(), form(6)), out('Te sujetan y no llegas.', form(-1)), 'jumping') }),
  ]),
  mev('at-asistencia-tacon', [ATTACKERS, minOverall(65)], 'De espaldas', 'Recibes de espaldas en el área. Un compañero llega desde atrás a toda velocidad.', [
    opt('tacon', 'Taconazo', [], { roll: roll(0.45, out('Taconazo sin mirar y gol de tu compañero. Jugada del año.', assist(), keyPass(), followers(6)), out('El tacón se queda corto.', rel('coach', -2)), 'vision') }),
    opt('girar', 'Girarte y chutar', [], { roll: roll(0.3, out('Te giras en un palmo y la cruzas. Gol.', goal(), form(4)), out('Te bloquea el central.'), 'agility') }),
  ]),
  mev('at-racha', [FORWARDS, { type: 'seasonStat', stat: 'goals', min: 5 }], 'En racha', 'Llevas varios partidos seguidos marcando. Todo lo que tocas acaba dentro.', [
    opt('confianza', 'Jugar con total confianza', [], { roll: roll(0.6, out('Otro gol. La racha sigue.', goal(), form(6), followers(3)), out('Hoy no entra, pero lo intentas todo.', form(-1)), 'finishing') }),
    opt('humilde', 'Pensar solo en el equipo', [keyPass(), rel('dressingRoom', 4)], { roll: roll(0.4, out('Marcas sin buscarlo.', goal()), out('No marcas; el equipo gana.')) }),
  ], { weight: 8 }),
  mev('at-sequia-penalti', [FORWARDS, { type: 'seasonStat', stat: 'goals', max: 1 }], 'Para romper la sequía', 'Llevas meses sin marcar. Penalti a favor y el capitán te ofrece el balón para que te quites la presión.', [
    opt('aceptar', 'Aceptar', [], { roll: roll(0.65, out('Gol. Lloras al celebrarlo. Se acabó la sequía.', goal(), morale(10), rel('dressingRoom', 4)), out('Lo fallas. El estadio se queda en silencio.', morale(-8)), 'penalties') }),
    opt('rechazar', 'Dejar que lo tire el capitán', [rel('dressingRoom', 2)], { result: 'Marca él. Tú sigues esperando tu momento.' }),
  ], { phases: ['secondHalf'] }),
  mev('at-ultimo-minuto-cabeza', [FORWARDS], 'Último centro', 'Minuto 92, perdéis 1-0. El portero rival sube a todos atrás. Último centro al área.', [
    opt('rematar', 'Rematar como sea', [], { roll: roll(0.3, out('¡Gol en el último segundo! Locura en {estadio}.', goal(), rel('fans', 10), news('{apodo} salva un punto en el descuento', 'positive')), out('Rozas el balón, pero no llega.', morale(-2)), 'heading') }),
    opt('dejar', 'Dejar pasar para el que viene detrás', [], { roll: roll(0.25, out('El compañero remata solo. ¡Empate!', assist(), keyPass()), out('Despejan.')) }),
  ]),
  mev('at-pase-de-la-muerte', [WINGERS], 'Línea de fondo', 'Llegas a línea de fondo tras ganar la espalda al lateral. El portero cubre el primer palo.', [
    opt('atras', 'Pase de la muerte atrás', [], { roll: roll(0.55, out('Pase atrás y gol del mediapunta.', assist(), keyPass(), dribble()), out('Lo despeja un defensa.', dribble()), 'crossing') }),
    opt('tirar', 'Tirar desde ángulo imposible', [tendency('ego', 2)], { roll: roll(0.15, out('¡Entra entre el portero y el palo!', goal(), dribble(), followers(5)), out('Al lateral de la red.', dribble(), rel('dressingRoom', -2)), 'finishing') }),
  ]),
  mev('at-asistencia-larga', [MCO], 'El pase de cuarenta metros', 'Ves al extremo sin marca al otro lado del campo.', [
    opt('cambio', 'Cambio de orientación al pie', [], { roll: roll(0.5, out('Le dejas solo. Control y gol.', assist(), keyPass(), form(4)), out('El balón sale por banda.', form(-1)), 'longPassing') }),
    opt('corto', 'Jugar corto', [keyPass(), rel('coach', 2)], { result: 'Prefieres no arriesgar.' }),
  ]),
  mev('at-pared', [ATTACKERS], 'La pared', '{companero} y tú os entendéis con la mirada. Estáis a punto de hacer una pared en el área.', [
    opt('devolver', 'Devolverla de primeras', [], { roll: roll(0.5, out('Pared perfecta y gol de {companero}.', assist(), keyPass(), rel('dressingRoom', 4)), out('Te la cortan.')) }),
    opt('quedartela', 'Quedártela y chutar', [], { roll: roll(0.4, out('Recibes la devolución y la cruzas. Gol.', goal(), form(4)), out('El portero la desvía a córner.'), 'finishing') }),
  ]),
  mev('at-revancha', [FORWARDS], 'El central que te pegó', 'El central que te lesionó la temporada pasada vuelve a marcarte. La grada lo sabe.', [
    opt('venganza', 'Hacerle sufrir con el balón', [tendency('temperamento', 3)], { roll: roll(0.5, out('Le dejas en el suelo y marcas. Tu mejor respuesta.', goal(), dribble(2), rel('fans', 6)), out('Te frustra y acabas amonestado.', tendency('temperamento', 3), dribble()), 'dribbling') }),
    opt('cabeza', 'Jugar con cabeza fría', [attr('composure', 1), keyPass()], { result: 'Le ganas sin buscar la pelea.' }),
  ]),
  mev('at-noche-europea', [ATTACKERS, { type: 'flag', id: 'continental' }], 'Noche de Europa', 'Partido continental con el estadio lleno. Los ojeadores de media Europa miran desde la grada.', [
    opt('brillar', 'Querer brillar', [tendency('ego', 2)], { roll: roll(0.45, out('Gol y asistencia. Tu nombre suena en otros países.', goal(), assist(), rep('world', 3), form(6)), out('Te precipitas en cada balón.', form(-4)), 'composure') }),
    opt('serio', 'Partido serio y táctico', [keyPass(), rel('coach', 4), matchRating(0.3)], { result: 'Notable alto. El entrenador te pone de ejemplo.' }),
  ]),
  mev('at-derbi-gol', [ATTACKERS, { type: 'derbyUpcoming' }], 'Ocasión en el derbi', 'Derbi igualado. Te llega un balón en el área con la grada rival a tu espalda.', [
    opt('rematar', 'Rematar de primeras', [], { roll: roll(0.45, out('¡Gol en el derbi! La ciudad es tuya esta semana.', goal(), rel('fans', 12), rep('local', 4)), out('El portero hace la parada del año.', morale(-2)), 'finishing') }),
    opt('controlar', 'Controlar y buscar mejor posición', [], { roll: roll(0.35, out('Controlas, regateas al central y marcas.', goal(), dribble(), rel('fans', 12)), out('Te tapan el disparo.', dribble()), 'ballControl') }),
  ], { weight: 14 }),
  mev('at-sustituto-gol', [ATTACKERS], 'Revulsivo', 'Sales desde el banquillo en el minuto 70 con el partido atascado.', [
    opt('intenso', 'Salir a morder', [], { roll: roll(0.4, out('Primer balón, primer gol. Diez minutos te bastan.', goal(), rel('coach', 6), form(6)), out('No te llega ni un balón.', form(-1)), 'acceleration') }),
    opt('asociarte', 'Asociarte con los de arriba', [], { roll: roll(0.45, out('Dos pases clave y una asistencia.', assist(), keyPass(2)), out('Mucho toque, poco peligro.', keyPass()), 'shortPassing') }),
  ]),
  mev('at-asistente-nato', [MCO, minOverall(62)], 'Ver lo que nadie ve', 'El rival defiende en bloque bajo. Solo un pase genial puede abrirlo.', [
    opt('genial', 'Buscar el pase imposible', [], { roll: roll(0.4, out('El pase atraviesa cuatro líneas. Gol.', assist(), keyPass(3), followers(4)), out('Lo cortan. Te dicen que no arriesgues.', keyPass(), rel('coach', -2)), 'vision') }),
    opt('paciencia', 'Mover el balón hasta que se abra', [keyPass(2), matchRating(0.3)], { roll: roll(0.4, out('A la vigésima posesión, se abre el hueco. Asistencia.', assist()), out('No se abre. Empate sin goles.')) }),
  ]),
  mev('at-gol-olimpico-2', [WINGERS, { type: 'attribute', id: 'crossing', min: 65 }], 'Córner con efecto', 'Viento a favor y el portero rival adelantado. Te toca sacar el córner.', [
    opt('directo', 'Directo a puerta', [], { roll: roll(0.15, out('¡Gol olímpico!', goal(), followers(10), rep('national', 3)), out('El portero la atrapa sin problemas.'), 'crossing') }),
    opt('cabeza', 'Al punto de penalti', [], { roll: roll(0.35, out('Remate de cabeza de tu central. Gol.', assist(), keyPass()), out('Despejan.'), 'crossing') }),
  ]),
  mev('at-error-portero', [FORWARDS], 'Presión al portero', 'El portero rival se complica sacando el balón jugado.', [
    opt('presionar', 'Presionarle a tope', [fitness(-2)], { roll: roll(0.35, out('Le robas el balón y marcas a puerta vacía.', goal(), rel('coach', 4)), out('Te regatea y sale jugando.', form(-1)), 'acceleration') }),
    opt('esperar', 'Esperar en tu posición', [], { result: 'Sale jugando sin problemas.' }),
  ]),
  mev('at-tiro-cruzado-cansado', [ATTACKERS], 'Piernas cansadas', 'Minuto 85, llevas el partido entero corriendo. Te queda una última arrancada.', [
    opt('ultima', 'Gastar la última bala', [fitness(-4)], { roll: roll(0.4, out('Arrancada de 40 metros y gol. No te quedan piernas para celebrarlo.', goal(), dribble(), rel('fans', 6)), out('Te faltan piernas y la pierdes.', dribble()), 'stamina') }),
    opt('pedir-cambio', 'Pedir el cambio', [rel('coach', 2), fitness(4)], { result: 'Sales ovacionado.' }),
  ]),
  mev('at-volea', [FORWARDS, minOverall(62)], 'Volea', 'Un despeje del rival cae del cielo justo en la frontal del área.', [
    opt('volea', 'Volea a la primera', [], { roll: roll(0.25, out('Volea perfecta. El balón ni toca el suelo hasta la red.', goal(), followers(8), rep('national', 2)), out('Le das con la espinilla. A la grada.', followers(1)), 'shooting') }),
    opt('controlar', 'Controlar con el pecho', [], { roll: roll(0.45, out('Control orientado y disparo raso. Gol.', goal()), out('Te la quitan antes de chutar.'), 'ballControl') }),
  ]),
  mev('at-cansado-de-pases', [STRIKERS], 'Sin balones', 'Llevas 60 minutos sin recibir un balón en condiciones. Te desesperas.', [
    opt('bajar', 'Bajar al medio a buscar el juego', [keyPass(), dribble(), rel('coach', -1)], { result: 'Tocas más balón, pero se nota tu ausencia en el área.' }),
    opt('paciencia', 'Esperar tu momento', [], { roll: roll(0.4, out('En la única que te llega, marcas.', goal(), attr('composure', 1)), out('No llega ninguna.', morale(-2))) }),
    opt('quejarte', 'Gritar a tus compañeros', [rel('dressingRoom', -4), tendency('ego', 3)], { result: 'Te dan más balones… y más miradas.' }),
  ]),
  mev('at-elastica', [WINGERS, { type: 'attribute', id: 'dribbling', min: 72 }], 'La elástica', 'Te encara el mejor lateral de la liga. Llevas toda la semana pensando en este duelo.', [
    opt('elastica', 'Elástica', [tendency('ego', 2)], { roll: roll(0.45, out('Elástica y le dejas sentado. Disparo al palo largo: gol.', goal(), dribble(2), followers(10)), out('Lo intuye y te roba.', dribble()), 'dribbling') }),
    opt('velocidad', 'Ganarle en carrera', [], { roll: roll(0.5, out('Le ganas por velocidad y centras. Asistencia.', assist(), dribble()), out('Te cierra bien.'), 'pace') }),
  ]),
  mev('at-bicicleta', [WINGERS], 'Bicicletas', 'El lateral rival es lento. La grada te pide espectáculo.', [
    opt('show', 'Dar espectáculo', [tendency('ego', 3), followers(3)], { roll: roll(0.55, out('Bicicletas, amagos y un centro que acaba en gol.', dribble(4), assist()), out('Mucho adorno y poca eficacia.', dribble(2), rel('coach', -3)), 'agility') }),
    opt('eficaz', 'Ser eficaz', [dribble(), keyPass(), rel('coach', 3)], { result: 'Dos centros buenos, ningún adorno.' }),
  ]),
  mev('at-cano', [ATTACKERS, { type: 'attribute', id: 'dribbling', min: 62 }], 'Las piernas abiertas', 'El defensa abre las piernas para tapar tu pase.', [
    opt('cano', 'Caño', [], { roll: roll(0.55, out('Caño y te plantas solo ante el portero. ¡Gol!', dribble(), goal(), followers(5)), out('Te la cierra con la rodilla.', dribble()), 'ballControl') }),
    opt('pase', 'Pase al compañero', [keyPass()], { result: 'Juego sencillo.' }),
  ]),
  mev('at-capitan-penalti', [ATTACKERS, { type: 'flag', id: 'captain' }], 'Penalti en la final de copa', 'Final de copa. Penalti a favor en el 85 con empate. Eres el capitán y todos te miran.', [
    opt('tirarlo', 'Asumirlo tú', [], { roll: roll(0.7, out('Gol. Levantáis la copa con tu penalti.', goal(), rel('fans', 12), rep('national', 4), morale(10)), out('Al palo. El partido se va a la prórroga.', morale(-8)), 'penalties') }),
    opt('elegir', 'Elegir al lanzador más en forma', [attr('leadership', 2)], { roll: roll(0.7, out('Gol de tu compañero. Tu decisión, acertada.', rel('dressingRoom', 8)), out('Lo falla. Te culpas por no tirarlo.', morale(-6))) }),
  ], { phases: ['secondHalf'], weight: 6 }),
  mev('at-primer-gol-liga', [ATTACKERS, { type: 'careerStat', stat: 'goals', max: 0 }], 'El primer gol', 'Todavía no has marcado con el primer equipo. Hoy tienes una ocasión clara.', [
    opt('calma', 'Con calma', [], { roll: roll(0.55, out('¡Tu primer gol como profesional! Corres hacia la grada sin saber qué hacer.', goal(), morale(12), followers(5)), out('El portero hace una gran parada. Ya llegará.', morale(-2)), 'composure') }),
    opt('potencia', 'Con toda la potencia', [], { roll: roll(0.45, out('¡Gol! La red casi se rompe.', goal(), morale(12)), out('Se va a la grada.', morale(-3)), 'shooting') }),
  ], { stages: ['breakthrough', 'establishment'], once: true, weight: 14 }),
  mev('at-jugada-individual', [ATTACKERS, minOverall(70)], 'Jugada individual', 'Recibes en tu campo. Ves espacio por delante y nadie te sale.', [
    opt('arrancar', 'Arrancar hasta el área', [], { roll: roll(0.3, out('Dejas atrás a cuatro rivales y marcas. Gol del año.', goal(), dribble(4), followers(12), rep('national', 4)), out('Llegas al área sin fuerzas y te la quitan.', dribble(2)), 'dribbling') }),
    opt('lanzar', 'Lanzar al delantero', [], { roll: roll(0.45, out('Pase en profundidad. Gol.', assist(), keyPass()), out('Se adelanta el central.', keyPass()), 'longPassing') }),
  ], { weight: 7 }),
  mev('at-lesion-jugando', [ATTACKERS], 'Jugando tocado', 'Notas un pinchazo en el gemelo a mitad de partido. Vais empatando.', [
    opt('seguir', 'Seguir', [], { roll: roll(0.5, out('Aguantas y das la asistencia del gol de la victoria.', assist(), rel('fans', 5)), out('Rotura. Tres semanas fuera.', injury(2, 3)), 'stamina') }),
    opt('salir', 'Pedir el cambio', [fitness(2)], { result: 'Prudente. El médico lo agradece.' }),
  ]),
  mev('at-juvenil-golea', [ATTACKERS], 'Goleada juvenil', 'Partido de juveniles contra el colista. Vais 3-0 al descanso.', [
    opt('mas', 'Seguir marcando', [tendency('ego', 2)], { roll: roll(0.55, out('Haces dos más. El entrenador del rival te felicita.', goalsAtLeast(2), followers(2)), out('Te cansas de intentarlo.', goal()), 'finishing') }),
    opt('repartir', 'Repartir juego para que marquen otros', [assist(2), keyPass(2), rel('dressingRoom', 5)], { result: 'Dos asistencias. Los suplentes también marcan.' }),
  ], { stages: ['academy'] }),
  mev('at-juvenil-final', [ATTACKERS], 'Final juvenil', 'Final del campeonato juvenil. Tus padres están en la grada.', [
    opt('decidir', 'Querer decidir la final', [], { roll: roll(0.45, out('Marcas el gol del título juvenil.', goal(), morale(10), rep('local', 4)), out('No te sale nada. Perdéis en la prórroga.', morale(-6)), 'composure') }),
    opt('equipo', 'Jugar para el equipo', [assist(), keyPass(2), rel('coach', 4)], { result: 'Das el pase del gol de la victoria. Campeones.' }),
  ], { stages: ['academy'], phases: ['secondHalf'] }),
  mev('at-tecnico-elogia', [ATTACKERS], 'Elogio del rival', 'Tras el partido, el entrenador rival dice en rueda de prensa que eres «el mejor jugador que ha visto este año».', [
    opt('humilde', 'Agradecerlo con humildad', [rel('press', 4), tendency('ego', -2)], { result: 'Te ganas a la prensa.' }),
    opt('crecido', 'Responder que eso es solo el principio', [tendency('ego', 4), followers(4)], { result: 'Titular del día siguiente.' }),
  ], { category: 'media', speaker: 'press' }),
  mev('at-tiro-palo', [ATTACKERS], 'Dos palos', 'Has estrellado dos balones en el palo. Llega una tercera ocasión clara.', [
    opt('mismo', 'Tirar igual: esta entra', [], { roll: roll(0.45, out('¡A la tercera va la vencida! Gol.', goal(), morale(6)), out('Tercer palo. Récord personal de mala suerte.', morale(-5), followers(4)), 'finishing') }),
    opt('cambiar', 'Buscar el pase', [], { roll: roll(0.5, out('Le das el gol a tu compañero.', assist(), keyPass()), out('Lo falla él también.')) }),
  ]),
  mev('at-noche-de-goles', [STRIKERS, minOverall(74)], 'Noche perfecta', 'Todo te sale. Llevas dos goles al descanso ante un rival fuerte.', [
    opt('poker', 'Ir a por más', [], { roll: roll(0.35, out('¡Póker! Cuatro goles en una noche.', goalsAtLeast(4), followers(15), rep('national', 5), news('Póker de {apodo}', 'positive')), out('Te quedas en dos, que no es poco.', goalsAtLeast(2)), 'finishing') }),
    opt('administrar', 'Administrar y asistir', [goalsAtLeast(2), assist(), rel('dressingRoom', 5)], { result: 'Doblete y asistencia. Partido completo.' }),
  ], { weight: 6 }),
  mev('at-fuera-de-juego', [FORWARDS], 'La línea del fuera de juego', 'La defensa rival adelanta mucho la línea. Te la juegas en cada desmarque.', [
    opt('arriesgar', 'Arriesgar al límite', [], { roll: roll(0.4, out('Rompes la línea y marcas. El VAR confirma.', goal(), form(4)), out('Tres fueras de juego. El entrenador se desespera.', rel('coach', -3)), 'positioning') }),
    opt('desde-atras', 'Salir desde atrás', [keyPass()], { roll: roll(0.35, out('Llegas desde segunda línea y marcas.', goal()), out('Te falta un metro.'), 'acceleration') }),
  ]),
  mev('at-pase-o-gol-amigo', [ATTACKERS], 'El récord de tu amigo', 'A {companero} le falta un gol para batir su récord personal. Tienes el balón con el portero vencido.', [
    opt('regalar', 'Regalárselo', [assist(), rel('dressingRoom', 8), tendency('solidaridad', 5)], { result: 'Récord para él. Te abraza llorando.' }),
    opt('marcar', 'Marcarlo tú', [goal(), tendency('ego', 3), rel('dressingRoom', -3)], { result: 'Gol tuyo. Él sonríe, pero no tanto.' }),
  ]),
  mev('at-lluvia-goles', [FORWARDS], 'Goleada', 'Vais ganando 4-0 y el rival ya no corre. Te quedan veinte minutos.', [
    opt('seguir', 'Seguir marcando', [], { roll: roll(0.6, out('Uno más para tu cuenta.', goal(), form(3)), out('No entra, pero da igual.'), 'finishing') }),
    opt('respeto', 'Bajar el ritmo por respeto', [tendency('solidaridad', 3), rel('press', 2), keyPass()], { result: 'El rival te lo agradece al acabar.' }),
  ]),
  mev('at-entrenador-cambia-posicion', [WINGERS], 'De extremo a nueve', 'El delantero centro está lesionado y {entrenador} te pone de nueve.', [
    opt('aceptar', 'Aceptar y fijar centrales', [rel('coach', 5)], { roll: roll(0.45, out('Te adaptas y marcas de nueve.', goal(), attr('positioning', 1)), out('Te sientes fuera de sitio.', form(-2))) }),
    opt('caer', 'Caer a banda como siempre', [], { roll: roll(0.55, out('Desde la banda das una asistencia.', assist(), dribble()), out('El equipo se queda sin referencia.', rel('coach', -3))) }),
  ]),
  mev('at-mediapunta-llegada', [MCO], 'Llegada desde segunda línea', 'El delantero fija a los dos centrales y deja libre la frontal.', [
    opt('llegar', 'Llegar desde atrás', [], { roll: roll(0.45, out('Llegas solo y la colocas. Gol.', goal(), form(4)), out('Llegas tarde por un paso.'), 'positioning') }),
    opt('quedarte', 'Quedarte para el rechace', [keyPass(), rel('coach', 2)], { result: 'Recuperas el rechace y el equipo sigue atacando.' }),
  ]),
  mev('at-joven-estrella-rival', [ATTACKERS], 'El duelo de jóvenes', 'La prensa vende el partido como el duelo entre tú y la joven estrella del rival.', [
    opt('demostrar', 'Demostrar que eres mejor', [tendency('ego', 3)], { roll: roll(0.45, out('Gol y asistencia. Ganas el duelo.', goal(), assist(), followers(6)), out('Él marca dos. Tú, nada.', morale(-5)), 'composure') }),
    opt('ignorar', 'Ignorar el ruido', [attr('concentration', 1), keyPass()], { result: 'Partido serio. Los medios se olvidan del duelo.' }),
  ]),
  mev('at-pase-atras-portero', [FORWARDS], 'Pase atrás', 'Un central rival hace una cesión corta a su portero.', [
    opt('anticipar', 'Anticiparte', [], { roll: roll(0.4, out('Llegas antes que el portero. Gol a puerta vacía.', goal()), out('El portero llega por centímetros.'), 'acceleration') }),
    opt('no', 'No arriesgar la amarilla', [], { result: 'El portero despeja sin problemas.' }),
  ]),
  mev('at-asistencias-temporada', [ATTACKERS, { type: 'seasonStat', stat: 'assists', min: 6 }], 'El rey de las asistencias', 'Eres el máximo asistente de la liga. Algunos dicen que deberías chutar más.', [
    opt('chutar', 'Chutar más', [tendency('ego', 2)], { roll: roll(0.4, out('Pruebas suerte y marcas.', goal()), out('Desperdicias ocasiones.', rel('dressingRoom', -2)), 'shooting') }),
    opt('seguir', 'Seguir dando pases', [assist(), keyPass(2), rel('dressingRoom', 4)], { result: 'Otra asistencia. Tu estilo es este.' }),
  ], { weight: 7 }),
  mev('at-capitan-rival-provoca', [ATTACKERS], 'Te llaman «niño»', 'El capitán rival se ríe de ti: «Vuelve al juvenil, niño».', [
    opt('responder', 'Responder con el balón', [], { roll: roll(0.5, out('Le haces un caño y marcas. No vuelve a hablar.', goal(), dribble(), followers(4)), out('Te sale todo mal. Él sonríe.', dribble()), 'dribbling') }),
    opt('ignorar', 'Ignorarle', [attr('composure', 1)], { result: 'Sin palabras. Ni goles.' }),
  ], { stages: ['breakthrough', 'establishment'] }),
  mev('at-asist-portero-fuera', [ATTACKERS], 'Portero fuera de su área', 'El portero rival sale a despejar fuera del área y falla.', [
    opt('vaselina', 'Vaselina desde lejos', [], { roll: roll(0.3, out('¡Desde 35 metros con el portero fuera! Golazo.', goal(), followers(8)), out('Se va por encima del larguero.'), 'shooting') }),
    opt('pase', 'Pase al compañero mejor situado', [], { roll: roll(0.55, out('Pase y gol a puerta vacía.', assist(), keyPass()), out('El defensa corta.'), 'vision') }),
  ]),
  mev('at-lluvia-penalti-fallado', [FORWARDS], 'Tras el penalti fallado', 'Fallaste un penalti en el partido anterior. Hoy hay otro.', [
    opt('repetir', 'Volver a tirarlo', [], { roll: roll(0.6, out('Gol. Respiras.', goal(), morale(8)), out('Otro fallo. La prensa se ceba.', morale(-10), rel('press', -4)), 'penalties') }),
    opt('ceder', 'Ceder el lanzamiento', [rel('dressingRoom', 2)], { result: 'Lo marca otro. Tú tendrás que esperar.' }),
  ]),
  mev('at-lanzamiento-rapido', [ATTACKERS], 'Falta rápida', 'Os pitan una falta en campo rival y la defensa rival está despistada.', [
    opt('rapida', 'Sacar rápido', [], { roll: roll(0.45, out('Sacas en corto y vuestro delantero se planta solo. Gol.', assist(), keyPass()), out('El árbitro la hace repetir.'), 'vision') }),
    opt('esperar', 'Esperar y colgarla', [], { roll: roll(0.25, out('Centro y remate de cabeza. Gol.', assist()), out('La despejan.'), 'crossing') }),
  ]),
  mev('at-duelo-aereo', [STRIKERS, { type: 'attribute', id: 'strength', min: 60 }], 'Balón largo', 'El portero de tu equipo saca en largo hacia ti. El central rival mide dos metros.', [
    opt('ganar', 'Ganarle el salto', [], { roll: roll(0.45, out('Ganas el salto, prolongas y el extremo marca.', assist(), keyPass()), out('Te gana siempre por arriba.'), 'jumping') }),
    opt('cuerpo', 'Ganar la posición con el cuerpo', [], { roll: roll(0.45, out('Proteges, te giras y disparas. Gol.', goal()), out('Falta en ataque.'), 'strength') }),
  ]),
  mev('at-gol-anulado-mano', [FORWARDS], 'Mano involuntaria', 'Marcas, pero en la repetición se ve que el balón te tocó en la mano antes de entrar.', [
    opt('confesar', 'Decírselo al árbitro', [tendency('solidaridad', 6), rep('world', 1), rel('dressingRoom', -3)], { result: 'Anulado. Juego limpio reconocido en todo el mundo.' }),
    opt('callar', 'Callar', [goal(), tendency('profesionalidad', -2)], { result: 'Sube al marcador. La polémica dura una semana.' }),
  ], { category: 'ethics' }),
];
