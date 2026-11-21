/** Momentos de partido (v1.6): cantera, selección y jugadas por posición. Todo suma a las estadísticas. */
import type { Condition, GameEvent } from '@/engine/types/events';
import {
  ATTACKERS, CENTREBACKS, DEFENDERS, FORWARDS, FULLBACKS, KEEPER, MIDFIELDERS, OUTFIELD, STRIKERS, WINGERS, assist, attr, cleanSheet, dribble, fitness,
  followers, form, goal, goalsAtLeast, keyPass, matchRating, mev, morale, opt, out, rel, rep, roll, save, tackle, tendency,
} from './helpers';

const YOUTH = { stages: ['academy'] as GameEvent['stages'] };
const CAPPED: Condition = { type: 'internationalCaps', min: 1 };
const NT = { category: 'nationalTeam' as const, speaker: 'coach' as const };

export const MOMENT_EVENTS: GameEvent[] = [
  /* ── Cantera ─────────────────────────────────────── */
  mev('mo-juv-delantero', [FORWARDS], 'El nueve del juvenil', 'Partido de liga juvenil. El entrenador te dice que hoy toca hacer goles.', [
    opt('area', 'Vivir en el área', [], { roll: roll(0.55, out('Doblete en juveniles. Los ojeadores apuntan.', goalsAtLeast(2), rep('local', 2)), out('Un gol y muchos palos.', goal())) }),
    opt('asociarse', 'Asociarte con los mediapuntas', [assist(), keyPass(2)], { result: 'Asistencia y juego de equipo.' }),
  ], YOUTH),
  mev('mo-juv-extremo', [WINGERS], 'El extremo del juvenil', 'El lateral rival es lento. Tienes la banda para ti.', [
    opt('regatear', 'Regatearle siempre', [], { roll: roll(0.6, out('Cuatro regates, una asistencia y un gol.', dribble(4), assist(), goal()), out('Te cierra y te desesperas.', dribble())) }),
    opt('centrar', 'Centrar rápido', [assist(), keyPass(2)], { result: 'Dos centros buenos, uno acaba en gol.' }),
  ], YOUTH),
  mev('mo-juv-medio', [MIDFIELDERS], 'El cerebro del juvenil', 'Partido juvenil contra un rival que presiona mucho.', [
    opt('pausa', 'Poner pausa', [keyPass(3), matchRating(0.4)], { result: 'Superas la presión una y otra vez.' }),
    opt('vertical', 'Romper líneas en vertical', [], { roll: roll(0.5, out('Dos pases de gol.', assist(2), keyPass(2)), out('Pierdes muchos balones.', keyPass())) }),
  ], YOUTH),
  mev('mo-juv-defensa', [DEFENDERS], 'El muro del juvenil', 'El delantero rival juvenil ya entrena con su primer equipo.', [
    opt('anularle', 'Anularle', [], { roll: roll(0.55, out('No remata. Portería a cero.', tackle(4), cleanSheet()), out('Te marca uno.', tackle(2))) }),
    opt('salir', 'Salir jugando', [keyPass(2), tackle(1)], { result: 'Partido de central moderno.' }),
  ], YOUTH),
  mev('mo-juv-portero', [KEEPER], 'El portero del juvenil', 'Partido juvenil contra el máximo goleador de la categoría.', [
    opt('heroe', 'Partidazo', [], { roll: roll(0.5, out('Seis paradas. Portería a cero.', save(6), cleanSheet()), out('Te marca dos.', save(3))) }),
    opt('ordenar', 'Ordenar a la defensa', [save(2), attr('leadership', 1)], { result: 'Tu voz organiza a todos.' }),
  ], YOUTH),
  mev('mo-juv-convocado', [OUTFIELD], 'Convocado con el primer equipo', 'Entras en los últimos diez minutos con el primer equipo.', [
    opt('atreverse', 'Atreverte', [], { roll: roll(0.4, out('Un regate y un pase clave. El entrenador toma nota.', dribble(), keyPass(), rel('coach', 4)), out('Nervios. Pierdes dos balones.', form(-2))) }),
    opt('sencillo', 'Jugar sencillo', [keyPass(), rel('coach', 2)], { result: 'Sin errores. Bien.' }),
  ], { stages: ['academy', 'breakthrough'] }),

  /* ── Selección ───────────────────────────────────── */
  mev('mo-nt-gol', [ATTACKERS, CAPPED], 'Con la selección', 'Partido de clasificación con tu selección. El estadio canta el himno.', [
    opt('gol', 'Buscar tu gol con el país', [], { roll: roll(0.4, out('Gol con la selección. El país entero lo celebra.', goal(), rep('national', 4), followers(6)), out('El portero te lo para.')) }),
    opt('equipo', 'Juego de equipo', [keyPass(2), assist()], { result: 'Asistencia en la victoria.' }),
  ], NT),
  mev('mo-nt-defensa', [DEFENDERS, CAPPED], 'Defender a tu país', 'Partido decisivo de tu selección contra una potencia mundial.', [
    opt('muro', 'Ser un muro', [], { roll: roll(0.5, out('Portería a cero ante una potencia.', tackle(5), cleanSheet(), rep('national', 4)), out('Os marcan uno.', tackle(3))) }),
    opt('salir', 'Ayudar en ataque', [keyPass(), tackle(2)], { result: 'Partido completo.' }),
  ], NT),
  mev('mo-nt-portero', [KEEPER, CAPPED], 'Portero de la selección', 'Te toca ser titular con la selección en un partido clave.', [
    opt('paradas', 'Partido de paradas', [], { roll: roll(0.5, out('Paradas de mérito y portería a cero.', save(5), cleanSheet(), rep('national', 4)), out('Encajas uno de rebote.', save(3))) }),
    opt('juego', 'Salir jugando con los pies', [keyPass(), save(2)], { result: 'El seleccionador valora tu juego con los pies.' }),
  ], NT),
  mev('mo-nt-medio', [MIDFIELDERS, CAPPED], 'El medio de la selección', 'El seleccionador te pide que lleves el ritmo del partido.', [
    opt('ritmo', 'Dirigir el juego', [keyPass(3), matchRating(0.4)], { result: 'Noventa minutos de control.' }),
    opt('llegar', 'Llegar al área', [], { roll: roll(0.35, out('Gol desde segunda línea con tu país.', goal(), rep('national', 3)), out('Llegas, pero no remata nadie.')) }),
  ], NT),

  /* ── Delanteros ──────────────────────────────────── */
  mev('mo-del-rebote', [STRIKERS], 'El rebote', 'El portero rival despeja un disparo de un compañero hacia el área pequeña.', [
    opt('atento', 'Estar atento', [], { roll: roll(0.55, out('Empujas el rechace. Gol de nueve puro.', goal()), out('Te adelanta un defensa.')) }),
    opt('arrastrar', 'Arrastrar al central', [keyPass()], { result: 'Un compañero llega antes.' }),
  ]),
  mev('mo-del-cabeza-cerca', [STRIKERS, { type: 'attribute', id: 'heading', min: 62 }], 'Plancha', 'Un centro raso a media altura entra al área pequeña.', [
    opt('plancha', 'Tirarte en plancha', [], { roll: roll(0.4, out('¡Gol en plancha!', goal(), followers(3)), out('No llegas.')) }),
    opt('pierna', 'Esperar con la pierna', [], { roll: roll(0.45, out('Remate de primeras. Gol.', goal()), out('Te la quita el portero.')) }),
  ]),
  mev('mo-del-presion-portero', [FORWARDS], 'Presión al portero', 'El portero rival va a sacar con el pie y no te ha visto.', [
    opt('robar', 'Ir a por él', [fitness(-1)], { roll: roll(0.3, out('Le robas el balón y marcas. Humillación.', goal(), followers(4)), out('Le da tiempo a despejar.')) }),
    opt('posicion', 'Mantener la posición', [], { result: 'Saca en largo.' }),
  ]),
  mev('mo-del-asistente', [FORWARDS], 'El nueve generoso', 'Estás de espaldas en el área y un compañero llega libre.', [
    opt('dejarla', 'Dejarla de cara', [assist(), keyPass()], { result: 'Disparo de tu compañero, gol. Te abraza.' }),
    opt('girarte', 'Girarte', [], { roll: roll(0.35, out('Te giras y marcas.', goal()), out('Te la quitan.')) }),
  ]),
  mev('mo-del-doblete-derbi', [FORWARDS, { type: 'derbyUpcoming' }], 'Derbi en llamas', 'Llevas un gol en el derbi. La grada rival te silba cada vez que tocas el balón.', [
    opt('segundo', 'Buscar el segundo', [], { roll: roll(0.4, out('¡Doblete en el derbi! Los silbidos se apagan.', goalsAtLeast(2), rel('fans', 10)), out('Te quedas en uno. Ganáis.', goalsAtLeast(1))) }),
    opt('provocar', 'Mandar callar a la grada', [goalsAtLeast(1), tendency('ego', 3), followers(4)], { result: 'Polémica asegurada.' }),
  ]),

  /* ── Extremos ────────────────────────────────────── */
  mev('mo-ext-recorte', [WINGERS], 'El recorte', 'Te encara el lateral en el borde del área.', [
    opt('recorte', 'Recortar hacia dentro y chutar', [], { roll: roll(0.35, out('Recorte y rosca. Gol.', goal(), dribble()), out('Disparo bloqueado.', dribble())) }),
    opt('fuera', 'Ir por fuera y centrar', [], { roll: roll(0.45, out('Centro y gol de cabeza.', assist(), dribble()), out('Centro al portero.')) }),
  ]),
  mev('mo-ext-doble-lateral', [WINGERS], 'Doble marcaje', 'El rival te pone dos jugadores encima en cada balón.', [
    opt('arrastrar', 'Arrastrarles y liberar a otro', [keyPass(2), rel('coach', 3)], { result: 'Un compañero aprovecha el espacio que dejas.' }),
    opt('desafiar', 'Desafiarles igualmente', [], { roll: roll(0.35, out('Te zafas de los dos. Asistencia.', dribble(2), assist()), out('No pasas.', dribble())) }),
  ]),
  mev('mo-ext-carrera-final', [WINGERS, { type: 'attribute', id: 'pace', min: 70 }], 'Arrancada en el 90', 'Minuto 90, balón largo a tu espalda. El lateral rival está fundido.', [
    opt('correr', 'Correr', [], { roll: roll(0.5, out('Le sacas diez metros y marcas.', goal(), dribble()), out('Llegas sin fuerzas para chutar.')) }),
    opt('esperar', 'Esperar a los compañeros', [keyPass()], { result: 'Se pierde la ocasión, pero mantenéis la posesión.' }),
  ]),

  /* ── Medios ──────────────────────────────────────── */
  mev('mo-med-recuperacion', [MIDFIELDERS], 'Robo en el medio', 'El mediocentro rival recibe de espaldas y no te ve venir.', [
    opt('robar', 'Robársela por la espalda', [], { roll: roll(0.55, out('Robo limpio y contra.', tackle(), keyPass()), out('Falta y amarilla.')) }),
    opt('cerrar', 'Cerrarle el pase', [tackle()], { result: 'Le obligas a jugar atrás.' }),
  ]),
  mev('mo-med-tiro-lejano', [MIDFIELDERS, { type: 'attribute', id: 'shooting', min: 62 }], 'Desde 30 metros', 'Nadie te sale. Tienes 30 metros hasta la portería.', [
    opt('chutar', 'Probar', [], { roll: roll(0.2, out('¡Golazo desde 30 metros!', goal(), followers(6)), out('A las nubes.')) }),
    opt('avanzar', 'Avanzar con el balón', [dribble(), keyPass()], { result: 'Atraes rivales y abres a banda.' }),
  ]),
  mev('mo-med-pase-gol', [MIDFIELDERS, { type: 'attribute', id: 'vision', min: 62 }], 'Lectura perfecta', 'Ves el desmarque del delantero antes que nadie.', [
    opt('filtrar', 'Filtrar el pase', [], { roll: roll(0.5, out('Pase al hueco y gol.', assist(), keyPass()), out('Lo corta un central.', keyPass())) }),
    opt('esperar', 'Esperar mejor momento', [keyPass()], { result: 'No llega el momento.' }),
  ]),
  mev('mo-med-cansancio', [MIDFIELDERS], 'Pulmón', 'El equipo está fundido en el minuto 80. Tú aún tienes gasolina.', [
    opt('correr', 'Correr por todos', [fitness(-4)], { roll: roll(0.6, out('Tres robos en diez minutos. Mantenéis el resultado.', tackle(3), matchRating(0.4)), out('Te acalambras.', tackle(1))) }),
    opt('pedir-calma', 'Ordenar al equipo', [attr('leadership', 1), tackle(1)], { result: 'Cerráis el partido con orden.' }),
  ]),

  /* ── Defensas ────────────────────────────────────── */
  mev('mo-def-anticipacion', [DEFENDERS], 'Anticipación', 'El delantero rival va a recibir de espaldas en tu zona.', [
    opt('anticipar', 'Anticiparte', [], { roll: roll(0.55, out('Te adelantas y sales jugando.', tackle(), keyPass()), out('Te gira y se va.')) }),
    opt('esperar', 'Esperar y no dejarle girar', [tackle()], { result: 'Juega atrás.' }),
  ]),
  mev('mo-def-porteria-cero', [DEFENDERS], 'Defensa perfecta', 'El rival solo tiene balones largos. Tu línea lo controla todo.', [
    opt('mandar', 'Mandar en cada balón aéreo', [], { roll: roll(0.55, out('Portería a cero. Ni un remate.', tackle(4), cleanSheet()), out('Un balón se escapa y encajáis.', tackle(3))) }),
    opt('ordenar', 'Ordenar la línea', [tackle(2), attr('leadership', 1)], { result: 'Orden ante todo.' }),
  ]),
  mev('mo-def-lateral-asistencia', [FULLBACKS], 'El centro del lateral', 'Te llega el balón en tres cuartos de campo y ves al nueve desmarcado.', [
    opt('centro', 'Centro al primer toque', [], { roll: roll(0.45, out('Centro perfecto. Gol del nueve.', assist(), keyPass()), out('Se va largo.')) }),
    opt('conducir', 'Conducir hasta línea de fondo', [], { roll: roll(0.45, out('Pase atrás y gol.', assist(), dribble()), out('Te la quitan.')) }),
  ]),
  mev('mo-def-central-gol', [CENTREBACKS], 'Balón parado', 'Falta lateral. El especialista la va a poner al área.', [
    opt('rematar', 'Atacar el balón', [], { roll: roll(0.3, out('Cabezazo. Gol del central.', goal()), out('Despeja el portero.')) }),
    opt('bloqueo', 'Hacer un bloqueo para un compañero', [keyPass()], { result: 'Tu compañero remata solo.' }),
  ]),
  mev('mo-def-ultimo', [DEFENDERS], 'El despeje del año', 'Último minuto. El balón va a la escuadra y el portero no llega.', [
    opt('despejar', 'Saltar a por él', [], { roll: roll(0.4, out('Lo sacas con la cabeza en la línea. Portería a cero.', tackle(), cleanSheet(), rel('fans', 6)), out('No llegas. Empate.', morale(-2))) }),
    opt('quedar', 'Cubrir el rechace', [], { roll: roll(0.4, out('El balón da en el palo y lo despejas.', tackle()), out('Gol.')) }),
  ], { phases: ['secondHalf'] }),

  /* ── Porteros ────────────────────────────────────── */
  mev('mo-gk-reflejos', [KEEPER], 'Reflejos', 'Remate de cabeza a bocajarro tras un córner.', [
    opt('reflejo', 'Reflejo puro', [], { roll: roll(0.45, out('Mano salvadora. El estadio en pie.', save(), matchRating(0.6)), out('Imparable.')) }),
    opt('cuerpo', 'Hacerte grande', [], { roll: roll(0.45, out('El balón te da en el pecho y sale.', save()), out('Entra por encima.')) }),
  ]),
  mev('mo-gk-porteria-cero', [KEEPER], 'Partido tranquilo', 'El rival apenas ataca, pero cuando lo hace es peligroso.', [
    opt('concentrado', 'Estar concentrado todo el partido', [], { roll: roll(0.6, out('Dos paradas clave. Portería a cero.', save(2), cleanSheet()), out('Te pillan frío en la única.', save(1))) }),
    opt('participar', 'Participar en el juego', [keyPass(), save(1)], { result: 'Partido de portero moderno.' }),
  ]),
  mev('mo-gk-penalti-final', [KEEPER], 'Penalti en el descuento', 'Penalti en contra en el minuto 94. Ganáis 1-0.', [
    opt('lado', 'Elegir un lado', [], { roll: roll(0.35, out('¡Lo paras! Victoria y portería a cero.', save(), cleanSheet(), rel('fans', 10)), out('Gol. Empate.', morale(-4))) }),
    opt('centro', 'Quedarte en el centro', [], { roll: roll(0.25, out('¡Tiro al centro, atrapado! Portería a cero.', save(), cleanSheet(), followers(6)), out('Gol.', morale(-4))) }),
  ], { phases: ['secondHalf'] }),
  mev('mo-gk-noche-magica', [KEEPER, { type: 'form', min: 60 }], 'Noche mágica', 'Estás en racha: todo lo que te tiran lo paras.', [
    opt('seguir', 'Seguir igual', [], { roll: roll(0.6, out('Siete paradas. Portería a cero. Jugador del partido.', save(7), cleanSheet(), followers(5)), out('Te marcan uno al final.', save(5))) }),
    opt('provocar', 'Provocar a los delanteros', [tendency('ego', 2)], { roll: roll(0.45, out('Se ponen nerviosos y fallan todo.', save(4), cleanSheet()), out('Te marcan y te lo restriegan.', save(3))) }),
  ]),

  /* ── Todos (campo) ───────────────────────────────── */
  mev('mo-campo-revulsivo', [OUTFIELD], 'Revulsivo desde el banquillo', 'Sales en el minuto 65 para cambiar el partido.', [
    opt('energia', 'Salir con energía', [], { roll: roll(0.5, out('Cambias el partido: pase clave y robo decisivo.', keyPass(), tackle(), rel('coach', 4)), out('No entras en juego.')) }),
    opt('orden', 'Hacer lo que pide el entrenador', [keyPass(), tackle(), rel('coach', 2)], { result: 'Cumples tu papel.' }),
  ]),
  mev('mo-campo-gol-tacon', [ATTACKERS, { type: 'attribute', id: 'ballControl', min: 68 }], 'De tacón', 'Un centro raso te llega por detrás en el área pequeña.', [
    opt('tacon', 'Taconazo', [], { roll: roll(0.35, out('¡Gol de tacón! Te persigue todo el equipo.', goal(), followers(8)), out('No conectas.')) }),
    opt('controlar', 'Controlar', [], { roll: roll(0.4, out('Controlas y empujas.', goal()), out('Te tapan.')) }),
  ]),
  mev('mo-campo-asistencia-cabeza', [OUTFIELD], 'Asistencia de cabeza', 'Saltas en un balón aéreo en el área rival y ves a un compañero libre.', [
    opt('peinar', 'Peinarla para él', [], { roll: roll(0.45, out('La peinas y marca. Asistencia de cabeza.', assist()), out('No llega.')) }),
    opt('rematar', 'Rematar tú', [], { roll: roll(0.25, out('¡Gol de cabeza!', goal()), out('Fuera.')) }),
  ]),
  mev('mo-campo-titular-joven', [OUTFIELD, { type: 'age', max: 20 }], 'Titular con 20 años', 'Primera titularidad en un partido importante.', [
    opt('valiente', 'Jugar con valentía', [], { roll: roll(0.5, out('Partido de 8. Te quedas en el once.', keyPass(2), tackle(2), playingTimeFx()), out('Te come el partido.', form(-3))) }),
    opt('prudente', 'Jugar con prudencia', [keyPass(), tackle()], { result: 'Correcto. Volverás a jugar.' }),
  ], { stages: ['breakthrough'] }),
  mev('mo-campo-falta-sacada', [OUTFIELD], 'Saque rápido', 'Os pitan una falta en el medio y el rival está despistado.', [
    opt('rapido', 'Sacarla rápido', [], { roll: roll(0.45, out('Contragolpe que acaba en gol tras tu pase.', keyPass(), assist()), out('El árbitro la hace repetir.')) }),
    opt('esperar', 'Esperar', [keyPass()], { result: 'Ataque posicional.' }),
  ]),
  mev('mo-campo-partido-50', [OUTFIELD], 'Partido 50', 'Cumples 50 partidos con el club. Hay detalle en el palco.', [
    opt('celebrar', 'Celebrarlo con un buen partido', [], { roll: roll(0.55, out('Partidazo en tu partido 50.', keyPass(2), tackle(2), matchRating(0.5)), out('Un partido más.')) }),
    opt('dedicar', 'Dedicárselo a tu familia', [{ type: 'relation', who: 'family', delta: 5 }, keyPass()], { result: 'Tu madre guarda la camiseta.' }),
  ], { once: true, stages: ['breakthrough', 'establishment', 'prime'] }),
  mev('mo-campo-provocacion', [OUTFIELD], 'Te escupen', 'Un rival te escupe en una disputa. El árbitro no lo ve.', [
    opt('responder', 'Responderle', [tendency('temperamento', 5)], { roll: roll(0.3, out('Nadie lo ve.'), out('Roja directa para ti.', rel('coach', -8))) }),
    opt('denunciar', 'Decírselo al árbitro', [attr('composure', 1)], { roll: roll(0.4, out('El VAR lo revisa: roja para él.', matchRating(0.3)), out('No hay imágenes.')) }),
    opt('ignorar', 'Ganarle con fútbol', [], { roll: roll(0.45, out('Le dejas en evidencia toda la tarde.', dribble(2), keyPass()), out('Te afecta.')) }),
  ]),
  mev('mo-campo-asistencia-portero', [ATTACKERS], 'El portero adelantado', 'El portero rival sube a rematar un córner y el balón cae a tus pies.', [
    opt('chutar', 'Chutar desde tu campo', [], { roll: roll(0.4, out('¡Gol desde tu propio campo!', goal(), followers(10)), out('Se queda corto.')) }),
    opt('conducir', 'Conducir y asegurar', [], { roll: roll(0.7, out('Conduces y marcas a puerta vacía.', goal(), dribble()), out('Te alcanzan.')) }),
  ], { phases: ['secondHalf'] }),
  mev('mo-campo-regate-fiesta', [ATTACKERS, { type: 'attribute', id: 'dribbling', min: 70 }], 'Noche de regates', 'Estás inspirado. Cada vez que tocas el balón dejas a alguien atrás.', [
    opt('seguir', 'Seguir regateando', [tendency('ego', 2)], { roll: roll(0.55, out('Ocho regates, un gol y una asistencia.', dribble(8), goal(), assist()), out('Muchos regates, poco premio.', dribble(5))) }),
    opt('equipo', 'Usar los regates para crear ventajas', [dribble(4), keyPass(3)], { result: 'Partido completísimo.' }),
  ], { weight: 7 }),
  mev('mo-campo-recuperacion-tras-error', [OUTFIELD], 'Error y reacción', 'Pierdes un balón que acaba en gol rival.', [
    opt('reaccionar', 'Reaccionar en la siguiente', [], { roll: roll(0.45, out('Recuperas, avanzas y das el pase del empate.', tackle(), assist()), out('Sigues fuera del partido.', form(-2))) }),
    opt('simple', 'Jugar simple el resto', [keyPass(), tackle()], { result: 'Te recuperas poco a poco.' }),
  ]),
  mev('mo-campo-tiro-a-puerta-vacia', [ATTACKERS], 'Puerta vacía', 'El portero rival se cae y tienes la portería vacía a diez metros.', [
    opt('suave', 'Empujarla con suavidad', [], { roll: roll(0.85, out('Gol. Fácil.', goal()), out('¡La fallas! Meme del año.', followers(8), morale(-6))) }),
    opt('fuerte', 'Pegarle fuerte', [], { roll: roll(0.75, out('Gol.', goal()), out('Al larguero. Increíble.', morale(-6))) }),
  ]),
  mev('mo-campo-gol-cumple', [ATTACKERS], 'Tu cumpleaños', 'Hoy es tu cumpleaños y juegas en casa.', [
    opt('regalo', 'Hacerte el regalo', [], { roll: roll(0.35, out('Gol el día de tu cumpleaños. El estadio te canta.', goal(), rel('fans', 5), morale(6)), out('No hay gol, pero sí tarta en el vestuario.')) }),
    opt('equipo', 'Pensar en el equipo', [keyPass(), assist()], { result: 'Regalas tú: una asistencia.' }),
  ], { once: true }),
  mev('mo-campo-hat-trick-asist', [ATTACKERS, { type: 'seasonStat', stat: 'assists', min: 3 }], 'Hat-trick de asistencias', 'Llevas dos asistencias. Un compañero se desmarca y te pide el balón.', [
    opt('pase', 'Dársela', [], { roll: roll(0.55, out('¡Tercera asistencia! Hat-trick de pases.', assist(3), keyPass(3), followers(4)), out('Se queda en dos.', assist(2), keyPass(2))) }),
    opt('tirar', 'Tirar tú', [assist(2)], { roll: roll(0.35, out('Y además marcas.', goal()), out('Fuera.')) }),
  ]),
  mev('mo-campo-tarde-gris', [OUTFIELD], 'Tarde gris', 'Nada te sale. Llevas cuatro balones perdidos.', [
    opt('esconderse', 'Esconderte', [form(-2)], { result: 'Te sustituyen en el descanso.' }),
    opt('pedirla', 'Seguir pidiéndola', [], { roll: roll(0.45, out('Al final te sale una: pase clave.', keyPass(), morale(3)), out('Ni una. Mañana será otro día.')) }),
  ]),
];

/** Pequeño refuerzo de minutos, para usarlo dentro de una tirada. */
function playingTimeFx() {
  return { type: 'playingTime', delta: 6 } as const;
}
