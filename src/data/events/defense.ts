/** Decisiones de centrocampistas y defensas (v1.6). Lo que pasa en el campo suma a las estadísticas. */
import type { Condition, GameEvent } from '@/engine/types/events';
import {
  CENTREBACKS, DEFENDERS, FULLBACKS, MIDFIELDERS, assist, attr, cleanSheet, dribble, fitness, followers, form, goal, injury, keyPass, matchRating,
  mev, morale, opt, out, rel, rep, roll, tackle, tendency,
} from './helpers';

const PIVOTE: Condition = { type: 'position', in: ['MCD', 'MC'] };
const BACKLINE: Condition = { type: 'position', in: ['DFC', 'LD', 'LI', 'MCD'] };

export const DEFENSE_EVENTS: GameEvent[] = [
  /* ── Centrocampistas ─────────────────────────────── */
  mev('mi-presion-alta', [MIDFIELDERS], 'Presión tras pérdida', 'Perdéis el balón en campo rival. Tienes al mediocentro rival a dos metros.', [
    opt('morder', 'Morder al instante', [fitness(-2)], { roll: roll(0.55, out('Robas y lanzas la contra. Acaba en gol.', tackle(), keyPass(), assist()), out('Te supera con un control y os pillan a la espalda.', rel('coach', -3)), 'aggression') }),
    opt('replegar', 'Replegar y cerrar líneas', [tackle(), rel('coach', 2)], { result: 'Orden ante todo.' }),
  ]),
  mev('mi-pase-vertical', [MIDFIELDERS], 'El pase vertical', 'El delantero te pide el balón al espacio. El pase es arriesgado.', [
    opt('vertical', 'Pase vertical', [], { roll: roll(0.5, out('Le dejas solo ante el portero. Gol.', assist(), keyPass(2)), out('Interceptado. Contraataque rival.', keyPass(), rel('coach', -2)), 'vision') }),
    opt('horizontal', 'Pase de seguridad', [keyPass(), matchRating(0.2)], { result: 'Mantenéis la posesión.' }),
  ]),
  mev('mi-llegada', [MIDFIELDERS], 'Llegar al área', 'El extremo centra desde la izquierda y nadie ataca el punto de penalti.', [
    opt('llegar', 'Llegar desde atrás', [fitness(-2)], { roll: roll(0.35, out('Llegas solo y cabeceas a gol.', goal(), form(5)), out('Llegas un paso tarde.'), 'positioning') }),
    opt('cubrir', 'Quedarte cubriendo la contra', [tackle(), rel('coach', 2)], { result: 'Cortas la contra que vino después.' }),
  ]),
  mev('mi-chut-frontal', [MIDFIELDERS], 'Rechace en la frontal', 'Un despeje de la defensa rival cae a tus pies en la frontal del área.', [
    opt('chutar', 'Chutar de primeras', [], { roll: roll(0.25, out('¡Golazo desde fuera del área!', goal(), followers(6), form(6)), out('Se va a la grada.'), 'shooting') }),
    opt('abrir', 'Abrir a la banda', [keyPass(), rel('coach', 1)], { result: 'Mantienes el ataque vivo.' }),
  ]),
  mev('mi-organizador', [PIVOTE], 'El metrónomo', 'El partido es un caos. {entrenador} te pide que pongas pausa.', [
    opt('pausa', 'Bajar a recibir y ordenar', [keyPass(3), rel('coach', 5), matchRating(0.4)], { result: 'Noventa pases, ninguno perdido. El equipo se ordena contigo.' }),
    opt('ritmo', 'Subir el ritmo para aprovechar el caos', [], { roll: roll(0.45, out('Dos pases clave y una asistencia.', assist(), keyPass(2)), out('Perdéis el control del partido.', rel('coach', -3))) }),
  ]),
  mev('mi-ancla', [{ type: 'position', in: ['MCD'] }], 'Delante de la defensa', 'El mediapunta rival se mueve entre líneas y os hace daño.', [
    opt('perseguir', 'Perseguirle por todo el campo', [fitness(-3)], { roll: roll(0.55, out('Le anulas: cinco robos y ni un pase suyo.', tackle(5), matchRating(0.4)), out('Te saca de sitio y aprovechan el hueco.', tackle(), rel('coach', -3)), 'stamina') }),
    opt('zona', 'Defender en zona', [], { roll: roll(0.5, out('Cortas líneas de pase toda la tarde.', tackle(3), keyPass()), out('Se mueve libre a tu espalda.', tackle()), 'positioning') }),
  ]),
  mev('mi-falta-tactica', [PIVOTE], 'Falta táctica', 'Contraataque rival de tres contra dos. Puedes cortar con una falta y ver la amarilla.', [
    opt('falta', 'Hacer la falta', [tackle(), rel('coach', 3), tendency('profesionalidad', 1)], { result: 'Amarilla, pero el peligro desaparece.' }),
    opt('defender', 'Intentar robar limpio', [], { roll: roll(0.45, out('Robo limpio y salida jugando.', tackle(), keyPass()), out('Te supera y acaban marcando.', rel('coach', -4)), 'pace') }),
  ]),
  mev('mi-box-to-box', [MIDFIELDERS, { type: 'attribute', id: 'stamina', min: 65 }], 'De área a área', 'El partido está roto y hay espacios por todas partes.', [
    opt('todo', 'Estar en las dos áreas', [fitness(-4)], { roll: roll(0.5, out('Robas en tu área y das la asistencia en la otra.', tackle(2), assist()), out('Te vacías y te cambian en el 70.', tackle()), 'stamina') }),
    opt('posicion', 'Mantener la posición', [tackle(), keyPass(), rel('coach', 2)], { result: 'Partido de equilibrio.' }),
  ]),
  mev('mi-capitan-medio', [MIDFIELDERS, { type: 'flag', id: 'captain' }], 'El equipo se cae', 'Vais perdiendo y tus compañeros esconden la cabeza. Nadie pide el balón.', [
    opt('asumir', 'Pedirlas todas', [], { roll: roll(0.5, out('Tiras del carro: un gol y un pase clave.', goal(), keyPass(2), rel('dressingRoom', 6)), out('No basta, pero lo intentaste.', keyPass()), 'leadership') }),
    opt('gritar', 'Hablar con cada compañero', [attr('leadership', 1), rel('dressingRoom', 3)], { result: 'El equipo se levanta en la segunda parte.' }),
  ]),
  mev('mi-penalti-centrocampista', [MIDFIELDERS, { type: 'attribute', id: 'penalties', min: 60 }], 'El lanzador designado', 'Penalti a favor. Eres el lanzador designado del equipo.', [
    opt('tirar', 'Tirarlo', [], { roll: roll(0.7, out('Gol. Sin temblar.', goal()), out('Lo para el portero.', morale(-4)), 'penalties') }),
    opt('ceder', 'Cedérselo al delantero, que necesita confianza', [rel('dressingRoom', 5)], { result: 'Marca y te lo agradece.' }),
  ]),
  mev('mi-cambio-juego', [MIDFIELDERS, { type: 'attribute', id: 'longPassing', min: 62 }], 'Cambio de juego', 'Todo el equipo rival está volcado en una banda. En la otra, vuestro lateral está solo.', [
    opt('cambio', 'Cambio de juego de 50 metros', [], { roll: roll(0.55, out('El lateral recibe solo y centra. Gol.', keyPass(2), assist()), out('El pase se va fuera.'), 'longPassing') }),
    opt('corto', 'Seguir por el lado fuerte', [keyPass()], { result: 'Seguís insistiendo.' }),
  ]),
  mev('mi-regate-salida', [MIDFIELDERS], 'Presión al mediocentro', 'Dos rivales te presionan al recibir de espaldas.', [
    opt('girar', 'Girarte con un regate', [], { roll: roll(0.5, out('Te zafas de los dos y lanzas al extremo.', dribble(), keyPass()), out('Te roban y casi os marcan.', rel('coach', -3)), 'agility') }),
    opt('devolver', 'Devolver de primeras', [keyPass(), matchRating(0.2)], { result: 'Seguro y sencillo.' }),
  ]),
  mev('mi-juvenil-medio', [MIDFIELDERS], 'El dueño del juvenil', 'En juveniles todo pasa por tus botas. El entrenador te pide que no te escondas.', [
    opt('mandar', 'Mandar en el partido', [], { roll: roll(0.55, out('Gol y dos pases clave.', goal(), keyPass(2), morale(4)), out('Te pasas de revoluciones.', keyPass()), 'vision') }),
    opt('simple', 'Juego simple', [keyPass(2), tackle(2), rel('coach', 3)], { result: 'Partido redondo, sin adornos.' }),
  ], { stages: ['academy'] }),
  mev('mi-asistencia-banda', [MIDFIELDERS], 'Balón al espacio', 'El extremo arranca por la banda. Tienes el pase en profundidad.', [
    opt('profundidad', 'Ponérsela al espacio', [], { roll: roll(0.55, out('Le dejas solo. Centro y gol: la jugada empezó en ti.', keyPass(2)), out('Se va larga.'), 'longPassing') }),
    opt('pie', 'Al pie', [keyPass()], { result: 'El ataque sigue sin profundidad.' }),
  ]),
  mev('mi-segunda-jugada', [MIDFIELDERS], 'Segunda jugada', 'Saque de portería rival en largo. Te toca ganar la segunda jugada.', [
    opt('pelear', 'Pelear el rechace', [], { roll: roll(0.55, out('Ganas todas las segundas jugadas.', tackle(4), matchRating(0.3)), out('Llegas siempre tarde.', tackle()), 'aggression') }),
    opt('anticipar', 'Anticiparte a la caída', [], { roll: roll(0.5, out('Lees cada rebote antes que nadie.', tackle(3), keyPass()), out('Te equivocas de lado.'), 'positioning') }),
  ]),
  mev('mi-golazo-falta', [MIDFIELDERS, { type: 'attribute', id: 'freeKicks', min: 65 }], 'Falta directa', 'Falta a 25 metros, centrada. Eres el especialista.', [
    opt('rosca', 'Rosca por encima de la barrera', [], { roll: roll(0.3, out('¡A la escuadra! Golazo de falta.', goal(), followers(6), form(5)), out('Pega en la barrera.'), 'freeKicks') }),
    opt('potente', 'Disparo potente por abajo', [], { roll: roll(0.2, out('La barrera salta y el balón pasa por debajo. ¡Gol!', goal(), followers(4)), out('Al portero.'), 'shooting') }),
  ]),
  mev('mi-mediocentro-defensa', [PIVOTE], 'Bajar a central', 'Expulsan a un central. {entrenador} te pide que retrases tu posición.', [
    opt('aceptar', 'Jugar de central', [rel('coach', 5)], { roll: roll(0.5, out('Partido de central perfecto. Portería a cero.', tackle(4), matchRating(0.5)), out('Sufres por arriba. Encajáis.', tackle(2)), 'positioning') }),
    opt('preferir', 'Pedir que baje otro', [rel('coach', -3)], { result: 'Baja otro. Te quedas en tu sitio.' }),
  ]),

  /* ── Centrales ───────────────────────────────────── */
  mev('de-cruce', [CENTREBACKS], 'El cruce', 'El delantero rival se te escapa en velocidad. Va hacia el área.', [
    opt('cruce', 'Cruce al límite', [], { roll: roll(0.5, out('Cruce limpio en el último segundo. La grada se levanta.', tackle(), matchRating(0.5)), out('Penalti. Le derribas.', rel('coach', -4)), 'pace') }),
    opt('cubrir', 'Cubrir y esperar al portero', [], { roll: roll(0.5, out('Le obligas a abrirse y el portero la atrapa.', tackle()), out('Te recorta y marca.'), 'positioning') }),
  ]),
  mev('de-porteria-cero', [CENTREBACKS], 'Asedio final', 'Ganáis 1-0 y el rival lanza balones al área en los últimos diez minutos.', [
    opt('mandar', 'Mandar en el área', [], { roll: roll(0.55, out('Despejas todo. Portería a cero.', cleanSheet(), tackle(3), rel('fans', 4)), out('Uno se te escapa. Empate.', tackle(2), morale(-3)), 'heading') }),
    opt('ordenar', 'Ordenar la línea defensiva', [attr('leadership', 1)], { roll: roll(0.5, out('Nadie remata. Portería a cero.', cleanSheet(), tackle()), out('Se cuela un balón.', tackle()), 'concentration') }),
  ], { weight: 12 }),
  mev('de-gol-corner', [CENTREBACKS], 'Córner a favor', 'Subes al remate de un córner. Te marca el delantero rival, más bajo que tú.', [
    opt('rematar', 'Rematar fuerte', [], { roll: roll(0.35, out('Cabezazo imparable. ¡Gol del central!', goal(), form(5), rel('fans', 5)), out('Al larguero.'), 'heading') }),
    opt('prolongar', 'Peinarla al segundo palo', [], { roll: roll(0.35, out('La peinas y marca un compañero.', assist()), out('No llega nadie.'), 'jumping') }),
  ]),
  mev('de-salida-balon', [CENTREBACKS], 'Salir jugando', 'El rival presiona arriba. El portero te la da con un delantero encima.', [
    opt('regatear', 'Regatear al delantero', [], { roll: roll(0.45, out('Le superas y lanzas la contra.', dribble(), keyPass()), out('Te roba y os marcan.', rel('coach', -6)), 'ballControl') }),
    opt('largo', 'Pelotazo arriba', [rel('coach', -1)], { result: 'Sin riesgo, sin ideas.' }),
    opt('pase', 'Pase entre líneas', [], { roll: roll(0.45, out('Superas la presión de un pase.', keyPass()), out('Interceptado.', rel('coach', -3)), 'shortPassing') }),
  ]),
  mev('de-delantero-tanque', [CENTREBACKS], 'El delantero tanque', 'Os enfrentáis a un delantero que pesa veinte kilos más que tú.', [
    opt('anticipar', 'Anticiparte siempre', [], { roll: roll(0.5, out('Le ganas cada balón por anticipación.', tackle(5), matchRating(0.4)), out('Te gana la posición y marca.', tackle(2)), 'positioning') }),
    opt('chocar', 'Chocar con él', [], { roll: roll(0.4, out('No te mueve. Le ganas el duelo físico.', tackle(4)), out('Te arrolla una y otra vez.', tackle(1), form(-3)), 'strength') }),
  ]),
  mev('de-rojo-rival', [DEFENDERS], 'Segunda amarilla', 'El delantero rival, con amarilla, busca el contacto para que te expulsen.', [
    opt('frenar', 'No entrar más', [attr('composure', 1)], { roll: roll(0.55, out('Defiendes sin tocarle. Portería a cero.', tackle(), cleanSheet()), out('Te gana la espalda y marca.'), 'concentration') }),
    opt('entrar', 'Entrar fuerte igualmente', [tendency('temperamento', 3)], { roll: roll(0.4, out('Robo limpio. Él se desespera.', tackle(2)), out('Amarilla para ti también.', tackle()), 'aggression') }),
  ]),
  mev('de-barrida', [DEFENDERS], 'Barrida', 'El extremo rival entra en el área a toda velocidad.', [
    opt('barrida', 'Tirarte al suelo', [], { roll: roll(0.5, out('Barrida perfecta. Te llevas el balón limpio.', tackle(), matchRating(0.4), rel('fans', 3)), out('Penalti y amarilla.', rel('coach', -4)), 'aggression') }),
    opt('aguantar', 'Aguantar de pie', [], { roll: roll(0.55, out('Le acompañas hasta línea de fondo y despejas.', tackle()), out('Te recorta y centra.'), 'agility') }),
  ]),
  mev('de-linea-adelantada', [CENTREBACKS, { type: 'attribute', id: 'leadership', min: 55 }], 'La línea', 'Diriges la línea defensiva. El rival intenta romperla con balones largos.', [
    opt('adelantar', 'Adelantar la línea', [], { roll: roll(0.5, out('Seis fueras de juego. Portería a cero.', cleanSheet(), tackle(2), attr('leadership', 1)), out('Uno rompe la línea y marca.', tackle()), 'concentration') }),
    opt('hundir', 'Hundir la línea', [tackle(3)], { result: 'Sufrís, pero aguantáis.' }),
  ]),
  mev('de-gol-propia', [DEFENDERS], 'Gol en propia', 'Un centro raso te rebota y entra en tu portería.', [
    opt('levantarse', 'Levantarte y seguir', [attr('composure', 1)], { roll: roll(0.5, out('Haces el partido de tu vida tras el error.', tackle(4), matchRating(0.5)), out('No consigues olvidarlo.', morale(-4)), 'composure') }),
    opt('disculpa', 'Pedir perdón al equipo', [rel('dressingRoom', 4)], { result: 'Te arropan. Nadie te reprocha nada.' }),
  ]),
  mev('de-anular-goleador', [CENTREBACKS, { type: 'attribute', id: 'concentration', min: 60 }], 'El pichichi', 'Enfrente está el máximo goleador de la liga.', [
    opt('marcaje', 'Marcaje individual', [], { roll: roll(0.5, out('No remata ni una vez. Portería a cero.', cleanSheet(), tackle(4), rep('national', 2)), out('Marca un gol, pero poco más.', tackle(2)), 'concentration') }),
    opt('zona', 'Defender en zona con tu pareja', [], { roll: roll(0.55, out('La pareja funciona. Ni una ocasión clara.', tackle(3), matchRating(0.3)), out('Se mueve entre los dos y os hace daño.'), 'teamwork') }),
  ]),
  mev('de-juvenil-central', [CENTREBACKS], 'Central de juveniles', 'El delantero del rival juvenil es el más rápido de la categoría.', [
    opt('distancia', 'Darle distancia', [], { roll: roll(0.55, out('No pasa ni una vez. Portería a cero.', cleanSheet(), tackle(3)), out('Te gana la carrera.'), 'positioning') }),
    opt('encima', 'Estar encima de él', [], { roll: roll(0.45, out('Le anticipas y le desesperas.', tackle(4)), out('Te gira y se va.'), 'aggression') }),
  ], { stages: ['academy'] }),

  /* ── Laterales ───────────────────────────────────── */
  mev('de-lateral-centro', [FULLBACKS], 'Subida por banda', 'El extremo de tu equipo se mete por dentro y te deja toda la banda.', [
    opt('subir', 'Subir hasta línea de fondo', [fitness(-2)], { roll: roll(0.45, out('Centro perfecto y gol de cabeza.', assist(), keyPass(), form(4)), out('El centro lo despejan.', keyPass()), 'crossing') }),
    opt('quedarse', 'Quedarte atrás', [tackle(), rel('coach', 2)], { result: 'Equilibrio defensivo.' }),
  ]),
  mev('de-lateral-extremo', [FULLBACKS], 'El extremo más rápido', 'Te toca defender al extremo más rápido de la liga.', [
    opt('distancia', 'Darle metros', [], { roll: roll(0.55, out('No te supera ni una vez.', tackle(3), matchRating(0.4)), out('Centra a placer y marcan.', tackle()), 'positioning') }),
    opt('presion', 'Presionarle arriba', [], { roll: roll(0.45, out('Le cortas antes de que reciba.', tackle(4)), out('Te gana la espalda una y otra vez.', form(-3)), 'pace') }),
  ]),
  mev('de-lateral-gol', [FULLBACKS], 'Lateral llegador', 'Llegas por sorpresa al borde del área tras una combinación.', [
    opt('chutar', 'Chutar', [], { roll: roll(0.25, out('¡Gol del lateral! Nadie te esperaba.', goal(), followers(4)), out('Fuera.'), 'shooting') }),
    opt('centrar', 'Centrar', [], { roll: roll(0.45, out('Centro atrás y gol.', assist(), keyPass()), out('Lo despejan.'), 'crossing') }),
  ]),
  mev('de-lateral-doble', [FULLBACKS, { type: 'attribute', id: 'stamina', min: 65 }], 'Carrilero', '{entrenador} cambia a línea de cinco y te convierte en carrilero.', [
    opt('aceptar', 'Ocupar toda la banda', [fitness(-3), rel('coach', 4)], { roll: roll(0.5, out('Asistencia y cuatro recuperaciones.', assist(), tackle(4)), out('Llegas fundido al final.', tackle(2)), 'stamina') }),
    opt('defensivo', 'Priorizar defender', [tackle(3)], { result: 'Sólido, sin aportar en ataque.' }),
  ]),
  mev('de-saque-banda', [FULLBACKS], 'Saque de banda largo', 'Tienes un saque de banda muy potente. Estáis cerca del área rival.', [
    opt('largo', 'Lanzarlo al área como un córner', [], { roll: roll(0.35, out('Peinada en el primer palo y gol.', assist(), keyPass()), out('La despeja el portero.'), 'strength') }),
    opt('corto', 'Sacar en corto', [keyPass()], { result: 'Posesión mantenida.' }),
  ]),

  /* ── Defensa en general ──────────────────────────── */
  mev('de-penalti-cometido', [BACKLINE], 'Mano en el área', 'Un centro te golpea en el brazo dentro del área. El árbitro va al VAR.', [
    opt('protestar', 'Protestar', [tendency('temperamento', 3)], { roll: roll(0.4, out('No es penalti. Sigue el juego.', matchRating(0.1)), out('Penalti y amarilla por protestar.', rel('coach', -4))) }),
    opt('calma', 'Esperar con calma', [attr('composure', 1)], { roll: roll(0.45, out('El VAR dice que no hay nada.'), out('Penalti. Encajáis.')) }),
  ]),
  mev('de-heroico', [BACKLINE], 'Sobre la línea', 'El portero está batido y el balón va hacia la portería vacía.', [
    opt('tirarse', 'Tirarte a por él', [], { roll: roll(0.45, out('Lo sacas sobre la línea con la cabeza. Heroico.', tackle(), matchRating(0.6), rel('fans', 8)), out('No llegas por centímetros.'), 'agility') }),
    opt('mano', 'Sacarlo con la mano', [tendency('profesionalidad', -3)], { result: 'Roja directa y penalti. Lo fallan, pero te pierdes tres partidos.' }),
  ]),
  mev('de-contra-defensa', [BACKLINE], 'Robas y sales', 'Robas el balón en tu área y ves un pasillo libre hasta el centro del campo.', [
    opt('conducir', 'Conducir tú', [], { roll: roll(0.45, out('Superas a dos rivales y das un pase de gol.', dribble(2), assist(), keyPass()), out('Te la quitan en el medio.', dribble(), rel('coach', -2)), 'dribbling') }),
    opt('soltar', 'Soltarla rápido', [tackle(), keyPass()], { result: 'Robo y pase. Lo que pide el entrenador.' }),
  ]),
  mev('de-uno-contra-uno', [DEFENDERS], 'El delantero te encara', 'El mejor regateador rival te encara en tu área.', [
    opt('esperar', 'Esperar su movimiento', [], { roll: roll(0.55, out('Le lees el amago y le robas.', tackle(), matchRating(0.3)), out('Te deja sentado. Gol.', form(-3)), 'concentration') }),
    opt('entrar', 'Entrarle rápido', [], { roll: roll(0.45, out('Robo limpio.', tackle()), out('Penalti.', rel('coach', -4)), 'aggression') }),
  ]),
  mev('de-juego-aereo-final', [CENTREBACKS], 'El balón del final', 'Último minuto de la final, ganáis 1-0. El portero rival sube al área.', [
    opt('despejar', 'Despejar como sea', [], { roll: roll(0.6, out('Despejas de cabeza. Pitido final. ¡Campeones!', tackle(), cleanSheet(), rel('fans', 10)), out('Remate rival y prórroga.', morale(-6)), 'heading') }),
    opt('portero', 'Dejársela al portero', [], { roll: roll(0.5, out('El portero la atrapa. Fin. Portería a cero.', cleanSheet()), out('Choque en el aire y gol.', morale(-6))) }),
  ], { phases: ['secondHalf'], weight: 6 }),
  mev('de-lesion-choque', [DEFENDERS], 'Choque de cabezas', 'Saltas a por un balón y chocas con un rival. Sangras por la ceja.', [
    opt('vendar', 'Que te venden y seguir', [rel('fans', 4)], { roll: roll(0.6, out('Juegas con turbante. Partido de guerrero.', tackle(3), matchRating(0.5)), out('Te mareas y tienes que salir.', injury(1, 1)), 'stamina') }),
    opt('salir', 'Salir del campo', [fitness(2)], { result: 'Prudencia. Siete puntos y a casa.' }),
  ]),
  mev('de-capitan-defensa', [DEFENDERS, { type: 'flag', id: 'captain' }], 'Charla en el descanso', 'Os han hecho dos goles en la primera parte. La defensa está nerviosa.', [
    opt('calmar', 'Calmar a la defensa', [attr('leadership', 1)], { roll: roll(0.55, out('Segunda parte sin encajar. Remontáis.', tackle(3), rel('dressingRoom', 5)), out('Encajáis otro.', tackle()), 'leadership') }),
    opt('exigir', 'Exigir más intensidad', [tendency('temperamento', 2)], { roll: roll(0.45, out('Mordéis cada balón.', tackle(4)), out('Os pasáis de frenada: dos amarillas.'), 'aggression') }),
  ]),
  mev('de-goleador-central', [CENTREBACKS, { type: 'seasonStat', stat: 'goals', min: 2 }], 'El central goleador', 'Llevas varios goles esta temporada. El rival te marca al hombre en cada córner.', [
    opt('arrastrar', 'Arrastrar marcas', [], { roll: roll(0.5, out('Tu movimiento deja solo a un compañero. Gol.', assist()), out('No sale.')) }),
    opt('pelear', 'Pelear el remate', [], { roll: roll(0.3, out('Te liberas en el último segundo. ¡Otro gol!', goal()), out('Te agarran sin que el árbitro lo vea.'), 'strength') }),
  ]),
  mev('de-penalti-central', [CENTREBACKS, { type: 'attribute', id: 'penalties', min: 65 }], 'El central que tira penaltis', 'Penalti a favor. Eres el lanzador designado, aunque seas central.', [
    opt('tirar', 'Tirarlo', [], { roll: roll(0.65, out('Gol. Los centrales también saben.', goal()), out('Lo para.', morale(-3)), 'penalties') }),
    opt('ceder', 'Cederlo', [rel('dressingRoom', 3)], { result: 'Prefieres no arriesgar.' }),
  ]),
  mev('de-duelo-veterano', [DEFENDERS, { type: 'age', min: 31 }], 'Piernas viejas, cabeza joven', 'El delantero rival tiene 19 años y es rapidísimo. Tú ya no tienes esas piernas.', [
    opt('cabeza', 'Ganarle con la cabeza', [], { roll: roll(0.6, out('Le anticipas cada vez. La experiencia gana.', tackle(4), matchRating(0.4)), out('Una vez te gana la carrera.', tackle(2)), 'positioning') }),
    opt('falta', 'Cortar con faltas', [tendency('profesionalidad', -1), tackle(2)], { result: 'Amarilla en el 30, pero no pasa.' }),
  ]),
];
