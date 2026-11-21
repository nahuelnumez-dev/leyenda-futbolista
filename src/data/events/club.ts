/** Vida de club (v1.6): vestuario, entrenador, directiva, mercado, agente, selección y final de carrera. */
import type { GameEvent } from '@/engine/types/events';
import type { SeasonPhase } from '@/engine/types/common';
import {
  HALVES, PRO, SENIOR, attr, family, fitness, flag, followers, form, hasFlag, mev, minAge, minOverall, money, morale, news, noFlag, opt, out,
  playingTime, rel, rep, roll, tendency,
} from './helpers';

const ANY: SeasonPhase[] = ['preseason', 'firstHalf', 'winterWindow', 'secondHalf', 'seasonEnd'];
const MARKET: SeasonPhase[] = ['winterWindow', 'seasonEnd'];
const DR = { category: 'dressingRoom' as const, phases: ANY, speaker: 'teammate' as const };
const CO = { category: 'coach' as const, phases: ANY, speaker: 'coach' as const };
const TR = { category: 'transfer' as const, phases: MARKET, speaker: 'agent' as const };
const CT = { category: 'contract' as const, phases: MARKET, speaker: 'board' as const };
const NT = { category: 'nationalTeam' as const, phases: HALVES, speaker: 'coach' as const };
const RT = { category: 'retirement' as const, phases: ['seasonEnd'] as SeasonPhase[], speaker: 'family' as const, stages: ['veteran'] as GameEvent['stages'] };

export const CLUB_EVENTS: GameEvent[] = [
  /* ── Vestuario ───────────────────────────────────── */
  mev('cl-grupo-whatsapp', [], 'El grupo del equipo', 'En el grupo de mensajes del equipo se critica a {companero} cuando no está.', [
    opt('defender', 'Defenderle', [rel('dressingRoom', 2), tendency('solidaridad', 4)], { result: 'Se acaban las bromas pesadas.' }),
    opt('reir', 'Reírte con los demás', [rel('dressingRoom', 2), tendency('solidaridad', -3)], { result: 'Él se entera días después.' }),
    opt('salir', 'Salirte del grupo', [rel('dressingRoom', -3)], { result: 'Te llaman raro. Paz mental.' }),
  ], { ...DR, stages: PRO, cd: 4 }),
  mev('cl-apuesta-vestuario', [], 'La porra', 'El vestuario hace una porra con dinero sobre quién marcará más esta temporada.', [
    opt('entrar', 'Entrar', [money(-500), rel('dressingRoom', 4)], { result: 'Risas aseguradas toda la temporada.' }),
    opt('no', 'No entrar', [rel('dressingRoom', -1)], { result: 'Te llaman aburrido.' }),
  ], { ...DR, phases: ['preseason'], stages: PRO, cd: 3 }),
  mev('cl-veterano-retira', [], 'Se retira un mito', 'El jugador más veterano anuncia que esta es su última temporada.', [
    opt('homenaje', 'Organizarle un homenaje sorpresa', [rel('dressingRoom', 8), money(-3000)], { result: 'Lágrimas en el vestuario.' }),
    opt('consejo', 'Pedirle consejo antes de que se vaya', [attr('composure', 1), attr('positioning', 1)], { result: 'Te regala sus mejores trucos.' }),
  ], { ...DR, phases: ['winterWindow', 'secondHalf'], stages: PRO, cd: 4 }),
  mev('cl-novato-tímido', [minAge(24)], 'El nuevo no habla', 'Ha llegado un chaval del filial que no se atreve a decir ni una palabra.', [
    opt('integrar', 'Integrarle en el grupo', [rel('dressingRoom', 5), tendency('solidaridad', 3), attr('leadership', 1)], { result: 'En un mes, es el alma de las fiestas.' }),
    opt('novatada', 'Gastarle una novatada', [rel('dressingRoom', 3)], { result: 'Se ríe. Rompe el hielo.' }),
  ], { ...DR, stages: SENIOR, cd: 3 }),
  mev('cl-pelea-companeros', [], 'Dos compañeros a golpes', 'Dos compañeros llegan a las manos en el entrenamiento.', [
    opt('separar', 'Separarles', [rel('dressingRoom', 4), rel('coach', 3)], { result: 'Evitas que la cosa vaya a más.' }),
    opt('mediar', 'Sentarles a hablar después', [attr('leadership', 2), rel('dressingRoom', 5)], { result: 'Terminan dándose la mano.' }),
    opt('apartarse', 'No meterte', [], { result: 'Los separa el entrenador. Multa para ambos.' }),
  ], { ...DR, stages: PRO, cd: 3 }),
  mev('cl-musica', [], 'La música del vestuario', 'Hay guerra por quién elige la música antes de los partidos.', [
    opt('dj', 'Proponerte como DJ', [rel('dressingRoom', 4), tendency('carisma', 2)], { roll: roll(0.6, out('Tu lista es un éxito.', rel('dressingRoom', 3)), out('Nadie soporta tu música.', rel('dressingRoom', -3))) }),
    opt('turnos', 'Proponer turnos', [rel('dressingRoom', 2)], { result: 'Justicia musical.' }),
  ], { ...DR, stages: PRO, once: true }),
  mev('cl-cena-equipo', [], 'Cena del equipo', 'Cena de equipo en un buen restaurante. Nadie quiere pagar la cuenta.', [
    opt('pagar', 'Invitar tú', [money(-4000), rel('dressingRoom', 6)], { result: 'Brindis en tu honor.' }),
    opt('dividir', 'Proponer dividirla', [rel('dressingRoom', 1)], { result: 'Justo y aburrido.' }),
  ], { ...DR, stages: SENIOR, cd: 3 }),
  mev('cl-rival-amigo', [], 'Tu amigo, en el banquillo', 'Tu mejor amigo del equipo no juega. Tú sí. Se le nota triste.', [
    opt('apoyar', 'Apoyarle', [rel('dressingRoom', 4), tendency('solidaridad', 3)], { result: 'Seguís siendo inseparables.' }),
    opt('espacio', 'Darle espacio', [], { result: 'Se le pasa con el tiempo.' }),
  ], { ...DR, stages: PRO, cd: 3 }),
  mev('cl-capitan-elegido', [noFlag('captain'), minAge(25), minOverall(70), { type: 'seasonsAtClub', min: 3 }], 'El brazalete', 'El capitán se marcha y el vestuario vota al nuevo. Tu nombre suena.', [
    opt('presentarte', 'Presentarte', [], { roll: roll(0.5, out('Te eligen capitán.', flag('captain'), attr('leadership', 3), rel('dressingRoom', 5)), out('Eligen a otro. Le apoyas.', rel('dressingRoom', 2))) }),
    opt('otro', 'Apoyar a otro compañero', [rel('dressingRoom', 4)], { result: 'Tu candidato gana. Te nombra subcapitán.' }),
  ], { ...DR, phases: ['preseason'], stages: SENIOR, cd: 3 }),
  mev('cl-capitan-decision', [hasFlag('captain')], 'Primas de la temporada', 'Como capitán, te toca negociar las primas del equipo con la directiva.', [
    opt('duro', 'Negociar duro', [rel('dressingRoom', 6), rel('board', -5)], { result: 'Primas altas. La directiva te tiene fichado.' }),
    opt('acuerdo', 'Buscar un acuerdo razonable', [rel('dressingRoom', 2), rel('board', 2)], { result: 'Todos medio contentos.' }),
  ], { ...DR, phases: ['preseason'], stages: SENIOR, cd: 2, speaker: 'board' }),
  mev('cl-capitan-jugador-problema', [hasFlag('captain')], 'El jugador conflictivo', 'Un compañero llega tarde a todo y contagia al resto.', [
    opt('hablar', 'Hablar con él como capitán', [attr('leadership', 2)], { roll: roll(0.55, out('Cambia de actitud.', rel('dressingRoom', 4)), out('Te ignora.', rel('dressingRoom', -2))) }),
    opt('entrenador', 'Llevarlo al entrenador', [rel('coach', 4), rel('dressingRoom', -2)], { result: 'Le aparta unas semanas.' }),
  ], { ...DR, stages: SENIOR, cd: 3 }),
  mev('cl-amigo-fichaje', [], 'Recomendar a un amigo', 'La dirección deportiva te pregunta por un amigo tuyo que juega en otro club.', [
    opt('recomendar', 'Recomendarle', [rel('board', 2)], { roll: roll(0.5, out('Le fichan y triunfa.', rel('dressingRoom', 4), morale(4)), out('Le fichan y fracasa. Te miran a ti.', rel('board', -4))) }),
    opt('neutral', 'Ser neutral', [], { result: 'Prefieres no mezclar amistad y negocios.' }),
  ], { ...DR, phases: MARKET, stages: SENIOR, cd: 4, speaker: 'board' }),

  /* ── Entrenador ──────────────────────────────────── */
  mev('cl-entrenador-castigo', [], 'Castigo colectivo', 'Tras una derrota, {entrenador} cancela el día libre de todo el equipo.', [
    opt('aceptar', 'Aceptarlo sin rechistar', [rel('coach', 4), rel('dressingRoom', -2)], { result: 'Entrenáis el domingo. Algunos te miran raro.' }),
    opt('protestar', 'Protestar en nombre del grupo', [rel('coach', -6), rel('dressingRoom', 6)], { result: 'No cambia nada, pero el grupo te lo agradece.' }),
  ], { ...CO, phases: HALVES, stages: PRO, cd: 3 }),
  mev('cl-entrenador-favorito', [], 'El favorito', 'El vestuario dice que eres el favorito del entrenador.', [
    opt('distancia', 'Tomar distancia del entrenador', [rel('coach', -3), rel('dressingRoom', 4)], { result: 'Se acaban los comentarios.' }),
    opt('ignorar', 'Ignorar los comentarios', [rel('dressingRoom', -3)], { result: 'Siguen las bromas.' }),
  ], { ...CO, stages: PRO, cd: 4, speaker: 'teammate' }),
  mev('cl-entrenador-confia', [{ type: 'relation', who: 'coach', min: 40 }], 'Confianza total', '{entrenador} te dice que eres la pieza clave de su proyecto.', [
    opt('responder', 'Responder en el campo', [playingTime(6), morale(5)], { result: 'Juegas todos los minutos.' }),
    opt('exigir', 'Pedirle más protagonismo táctico', [rel('coach', 2), tendency('ego', 2)], { result: 'El equipo gira a tu alrededor.' }),
  ], { ...CO, stages: PRO, cd: 3 }),
  mev('cl-entrenador-sin-minutos', [{ type: 'relation', who: 'coach', max: 10 }], 'Sin minutos', 'Llevas un mes sin jugar. {entrenador} no te da explicaciones.', [
    opt('hablar', 'Pedirle una reunión', [], { roll: roll(0.5, out('Te explica lo que espera de ti. Vuelves a jugar.', playingTime(8), rel('coach', 5)), out('Discusión. Te quedas igual.', rel('coach', -4))) }),
    opt('trabajar', 'Entrenar el doble', [tendency('profesionalidad', 4), fitness(-2)], { roll: roll(0.5, out('Te ganas una oportunidad.', playingTime(6)), out('Sigues sin jugar.', morale(-4))) }),
    opt('salir', 'Pedir salir en el mercado', [{ type: 'transferRequest' }], { result: 'Tu agente se pone a buscar equipo.' }),
  ], { ...CO, phases: HALVES, stages: PRO, cd: 3 }),
  mev('cl-entrenador-tactica-nueva', [], 'Sistema nuevo', '{entrenador} quiere cambiar a un sistema que no conoces.', [
    opt('aprender', 'Estudiar vídeos y aprender rápido', [attr('positioning', 1), attr('vision', 1), rel('coach', 4)], { result: 'Eres el primero en dominarlo.' }),
    opt('dudar', 'Expresar tus dudas', [rel('coach', -2)], { result: 'Lo escucha, pero no cambia.' }),
  ], { ...CO, phases: ['preseason', 'winterWindow'], stages: PRO, cd: 3 }),
  mev('cl-entrenador-ayudante', [], 'El segundo entrenador', 'El segundo entrenador te pide que le cuentes lo que se dice en el vestuario.', [
    opt('no', 'Negarte', [rel('dressingRoom', 4)], { result: 'Lo que pasa en el vestuario se queda allí.' }),
    opt('si', 'Contárselo', [rel('coach', 5), rel('dressingRoom', -6)], { result: 'Te ganas al cuerpo técnico. Al vestuario, no.' }),
  ], { ...CO, stages: PRO, once: true }),
  mev('cl-entrenador-adios', [{ type: 'relation', who: 'coach', min: 30 }], 'Se va tu entrenador', 'El entrenador que más ha confiado en ti se marcha a otro club. Te quiere llevar con él.', [
    opt('seguirle', 'Pedir seguirle', [rel('coach', 6), { type: 'offer', kind: 'transfer' }], { result: 'Tu agente estudia la operación.' }),
    opt('quedarse', 'Quedarte', [rel('board', 4), tendency('lealtad', 4)], { result: 'Le despides con un abrazo.' }),
  ], { ...CO, phases: ['seasonEnd'], stages: PRO, cd: 4 }),
  mev('cl-entrenador-juvenil-recuerdo', [], 'Tu primer entrenador', 'Tu primer entrenador de niño está enfermo y te escribe una carta.', [
    opt('visitar', 'Ir a visitarle', [family(4), morale(4)], { result: 'Llora al verte. Recordáis tu primer gol.' }),
    opt('camiseta', 'Mandarle tu camiseta firmada', [morale(2)], { result: 'La cuelga sobre su cama.' }),
  ], { category: 'personal', phases: ANY, stages: PRO, once: true, speaker: 'family' }),
  mev('cl-entrenador-personalidad', [], 'Choque de caracteres', '{entrenador} es muy autoritario y tú necesitas libertad para jugar.', [
    opt('adaptarse', 'Adaptarte', [rel('coach', 5), attr('teamwork', 1)], { result: 'Juegas más ordenado.' }),
    opt('hablar', 'Pedir algo de libertad', [], { roll: roll(0.45, out('Te da libertad en el último tercio.', rel('coach', 3)), out('No le gusta.', rel('coach', -5))) }),
  ], { ...CO, stages: PRO, cd: 4 }),

  /* ── Directiva ───────────────────────────────────── */
  mev('cl-presidente-elecciones', [], 'Elecciones en el club', 'Hay elecciones a presidente. Un candidato quiere que le apoyes públicamente.', [
    opt('apoyar', 'Apoyarle', [rel('fans', -3), rel('board', -2)], { roll: roll(0.5, out('Gana. Te debe una.', rel('board', 10)), out('Pierde. El nuevo presidente no te olvida.', rel('board', -8))) }),
    opt('neutral', 'Mantenerte neutral', [rel('board', 2)], { result: 'Prudencia.' }),
  ], { category: 'coach', phases: ['seasonEnd', 'preseason'], stages: SENIOR, cd: 5, speaker: 'board' }),
  mev('cl-directiva-imagen', [], 'Acto de patrocinadores', 'La directiva te pide asistir a una cena con patrocinadores la víspera de un partido.', [
    opt('ir', 'Ir', [rel('board', 5), fitness(-3)], { result: 'Los patrocinadores encantados. Tú, cansado.' }),
    opt('no', 'Excusarte', [rel('board', -4), fitness(2)], { result: 'Mandan a otro.' }),
  ], { category: 'coach', phases: HALVES, stages: PRO, cd: 3, speaker: 'board' }),
  mev('cl-directiva-venta', [], 'Te quieren vender', 'Te enteras de que la directiva quiere venderte para cuadrar las cuentas.', [
    opt('aceptar', 'Aceptarlo', [{ type: 'offer', kind: 'transfer' }], { result: 'Llegan ofertas.' }),
    opt('luchar', 'Pedir quedarte', [rel('board', -3), rel('fans', 5)], { result: 'La afición se moviliza por ti.' }),
  ], { category: 'transfer', phases: MARKET, stages: PRO, cd: 4, speaker: 'board' }),
  mev('cl-directiva-promesa', [], 'Promesas de fichajes', 'El presidente te promete fichajes de nivel si renuevas.', [
    opt('creer', 'Creerle y renovar', [{ type: 'offer', kind: 'renewal' }, rel('board', 4)], { result: 'Ya veremos si cumple.' }),
    opt('pruebas', 'Pedir hechos antes', [rel('board', -2)], { result: 'Espera al mercado.' }),
  ], { ...CT, stages: SENIOR, cd: 3 }),

  /* ── Mercado ─────────────────────────────────────── */
  mev('cl-oferta-rival', [minOverall(68)], 'El eterno rival', 'El eterno rival te ofrece el doble de sueldo.', [
    opt('escuchar', 'Escuchar la oferta', [{ type: 'offer', kind: 'transfer', sameCountry: true }, rel('fans', -10)], { result: 'Tu afición arde.' }),
    opt('rechazar', 'Rechazarla públicamente', [rel('fans', 12), tendency('lealtad', 6)], { result: 'Eres un ídolo.' }),
  ], { ...TR, stages: SENIOR, cd: 4 }),
  mev('cl-oferta-extranjero', [minOverall(70)], 'Oferta del extranjero', 'Un club de otra liga quiere ficharte. Tendrías que aprender otro idioma.', [
    opt('escuchar', 'Escucharla', [{ type: 'offer', kind: 'transfer', sameCountry: false }], { result: 'Tu agente viaja a negociar.' }),
    opt('no', 'Quedarte en tu país', [family(4)], { result: 'Tu familia respira.' }),
  ], { ...TR, stages: PRO, cd: 3 }),
  mev('cl-cesion-joven', [{ type: 'age', max: 21 }], 'Salir cedido', 'Juegas poco. El club te propone salir cedido a un equipo de una categoría inferior.', [
    opt('si', 'Aceptar la cesión', [{ type: 'offer', kind: 'loan' }], { result: 'Llegan propuestas.' }),
    opt('no', 'Pelear tu sitio', [tendency('ego', 2), playingTime(2)], { result: 'Te quedas a luchar.' }),
  ], { ...TR, stages: ['breakthrough'], cd: 2, speaker: 'board' }),
  mev('cl-agente-presiona', [{ type: 'hasAgent', value: true }], 'Tu agente presiona', '{agente} quiere que pidas el traspaso: hay un club pagando mucho más.', [
    opt('pedir', 'Pedir el traspaso', [{ type: 'transferRequest' }, rel('agent', 6), rel('board', -6)], { result: 'Comienza el culebrón.' }),
    opt('no', 'Decirle que estás bien', [rel('agent', -6), tendency('lealtad', 3)], { result: 'Se enfada, pero lo acepta.' }),
  ], { ...TR, stages: PRO, cd: 3 }),
  mev('cl-ultimo-dia', [], 'Último día de mercado', 'Último día del mercado. Tu agente te llama a medianoche con una oferta de última hora.', [
    opt('escuchar', 'Escucharla', [{ type: 'offer', kind: 'transfer' }], { result: 'Tienes horas para decidir.' }),
    opt('dormir', 'Irte a dormir', [fitness(2)], { result: 'Mañana será otro día.' }),
  ], { ...TR, stages: PRO, cd: 3 }),
  mev('cl-reconocimiento-medico', [], 'Reconocimiento médico', 'En el reconocimiento médico de un posible fichaje detectan una pequeña lesión.', [
    opt('tratar', 'Tratarla antes de firmar', [fitness(4), { type: 'injuryProneness', delta: -3 }], { result: 'Mejor prevenir.' }),
    opt('ocultar', 'Restarle importancia', [], { roll: roll(0.6, out('No pasa nada.'), out('Se agrava. Un mes fuera.', { type: 'injury', severity: 2, weeks: 4 })) }),
  ], { category: 'injury', phases: MARKET, stages: PRO, cd: 4, speaker: 'narrator' }),
  mev('cl-traspaso-record', [minOverall(80)], 'Traspaso récord', 'Un club ofrece la mayor cantidad pagada nunca por un jugador de tu país.', [
    opt('aceptar', 'Querer ir', [{ type: 'offer', kind: 'transfer' }, rep('world', 3)], { result: 'Las portadas hablan de ti.' }),
    opt('no', 'Quedarte', [rel('fans', 10), tendency('lealtad', 5)], { result: 'Tu club te lo agradecerá siempre.' }),
  ], { ...TR, stages: SENIOR, cd: 4 }),

  /* ── Contratos ───────────────────────────────────── */
  mev('cl-renovacion-larga', [minOverall(70)], 'Contrato de por vida', 'El club te ofrece un contrato hasta los 35 años.', [
    opt('firmar', 'Firmar', [{ type: 'offer', kind: 'renewal' }, tendency('lealtad', 6), rel('board', 6)], { result: 'Tu carrera, ligada a este escudo.' }),
    opt('corto', 'Pedir algo más corto', [rel('board', -2)], { result: 'Prefieres mantener opciones.' }),
  ], { ...CT, stages: SENIOR, once: true }),
  mev('cl-clausula-baja', [minOverall(72)], 'Cláusula baja', 'Tu agente te recomienda pedir una cláusula de salida baja para poder irte si llega un grande.', [
    opt('pedir', 'Pedirla', [rel('agent', 4), rel('board', -4)], { result: 'El club acepta a regañadientes.' }),
    opt('no', 'Confiar en el club', [rel('board', 4)], { result: 'Te quedas atado.' }),
  ], { ...CT, stages: SENIOR, cd: 4, speaker: 'agent' }),
  mev('cl-prima-fidelidad', [{ type: 'seasonsAtClub', min: 5 }], 'Prima de fidelidad', 'El club premia tus cinco temporadas con una prima.', [
    opt('aceptar', 'Aceptarla', [money(100000), tendency('lealtad', 4)], { result: 'Merecida.' }),
    opt('donar', 'Donarla a la cantera', [tendency('solidaridad', 6), rel('board', 6), rel('fans', 6)], { result: 'La cantera tiene nuevo material para años.' }),
  ], { ...CT, phases: ['seasonEnd'], stages: SENIOR, once: true }),
  mev('cl-variable', [], 'Bonus por partidos', 'La directiva propone que cobres más cuantos más partidos juegues.', [
    opt('aceptar', 'Aceptar', [rel('board', 4), flag('appsBonus')], { result: 'Cada partido cuenta.' }),
    opt('fijo', 'Mantener el fijo', [], { result: 'Seguridad.' }),
  ], { ...CT, stages: PRO, cd: 4 }),

  /* ── Agente ──────────────────────────────────────── */
  mev('cl-agente-comision', [{ type: 'hasAgent', value: true }], 'La comisión del agente', 'Descubres que {agente} se lleva una comisión más alta de lo acordado.', [
    opt('despedir', 'Despedirle', [{ type: 'setAgent', profile: 'none' }, money(20000)], { result: 'Recuperas parte del dinero.' }),
    opt('renegociar', 'Renegociar', [rel('agent', -6), money(10000)], { result: 'Baja la comisión. La relación se enfría.' }),
    opt('dejar', 'Dejarlo estar', [rel('agent', 4)], { result: 'Prefieres no tener líos.' }),
  ], { category: 'agent', phases: ANY, stages: PRO, once: true, speaker: 'narrator' }),
  mev('cl-agente-marca', [{ type: 'hasAgent', value: true }], 'Tu marca personal', '{agente} quiere crear una marca con tu nombre y tu logotipo.', [
    opt('si', 'Crearla', [money(-20000), followers(6)], { roll: roll(0.6, out('Se vende bien.', money(60000)), out('No despega.')) }),
    opt('no', 'No te interesa', [], { result: 'Tu nombre, sin logotipos.' }),
  ], { category: 'agent', phases: ['seasonEnd', 'preseason'], stages: SENIOR, once: true, speaker: 'agent' }),
  mev('cl-agente-mentir', [{ type: 'hasAgent', value: true }], 'Un agente mentiroso', '{agente} filtra a la prensa un falso interés de un grande para subir tu precio.', [
    opt('aprovechar', 'Aprovecharlo', [rel('agent', 4), rel('board', -4)], { result: 'Tu club te sube el sueldo para retenerte.' }),
    opt('desmentir', 'Desmentirlo', [rel('agent', -6), rel('board', 4)], { result: 'Tu club agradece la honestidad.' }),
  ], { category: 'agent', phases: MARKET, stages: PRO, cd: 4, speaker: 'press' }),

  /* ── Selección ───────────────────────────────────── */
  mev('cl-seleccion-primera', [{ type: 'internationalCaps', max: 0 }, minOverall(74)], 'Prelista', 'Apareces en la prelista de la selección absoluta.', [
    opt('ilusion', 'Ilusionarte', [morale(6)], { roll: roll(0.5, out('Entras en la lista definitiva.', rep('national', 4)), out('Te quedas fuera por poco.', morale(-4))) }),
    opt('calma', 'No pensar en ello', [attr('composure', 1)], { result: 'Sigues a lo tuyo.' }),
  ], { ...NT, stages: PRO, cd: 2 }),
  mev('cl-seleccion-concentracion', [{ type: 'internationalCaps', min: 1 }], 'Concentración', 'En la concentración te toca compartir habitación con el jugador más famoso del país.', [
    opt('amistad', 'Hacerte su amigo', [followers(4), morale(4)], { result: 'Os hacéis inseparables.' }),
    opt('respeto', 'Respetar su espacio', [attr('composure', 1)], { result: 'Correcto, sin más.' }),
  ], { ...NT, stages: PRO, cd: 3, speaker: 'teammate' }),
  mev('cl-seleccion-capitan', [{ type: 'internationalCaps', min: 25 }, noFlag('ntCaptain')], 'Capitán de tu país', 'El seleccionador te ofrece el brazalete de la selección.', [
    opt('aceptar', 'Aceptarlo', [flag('ntCaptain'), attr('leadership', 3), rep('national', 5)], { result: 'Llevar el brazalete de tu país. Piel de gallina.', key: true }),
    opt('otro', 'Proponer a un compañero más veterano', [rel('dressingRoom', 4)], { result: 'Humildad que el país aplaude.' }),
  ], { ...NT, stages: SENIOR, once: true }),
  mev('cl-seleccion-polemica', [{ type: 'internationalCaps', min: 1 }], 'Polémica con la federación', 'La federación quiere que juegues un amistoso con molestias.', [
    opt('jugar', 'Jugar', [rep('national', 2), fitness(-4)], { roll: roll(0.6, out('Todo bien.'), out('Te resientes y tu club se enfada.', rel('coach', -6), { type: 'injury', severity: 1, weeks: 2 })) }),
    opt('no', 'Pedir no jugar', [rel('coach', 4), rep('national', -1)], { result: 'Tu club te lo agradece.' }),
  ], { ...NT, stages: PRO, cd: 3 }),
  mev('cl-seleccion-hinchas', [{ type: 'internationalCaps', min: 5 }], 'Silbidos en casa', 'Parte de la afición de la selección te silba porque juegas en un club rival suyo.', [
    opt('ignorar', 'Ignorarlo', [attr('composure', 1)], { result: 'Juegas para todos.' }),
    opt('responder', 'Responder en la rueda de prensa', [tendency('temperamento', 3), rel('press', 3)], { result: 'Debate nacional.' }),
  ], { ...NT, stages: PRO, cd: 4, speaker: 'press' }),

  /* ── Lesiones y recuperación ─────────────────────── */
  mev('cl-lesion-segunda-opinion', [{ type: 'injured', value: true }], 'Segunda opinión', 'El médico del club dice que necesitas operarte. Un especialista privado dice que no.', [
    opt('operar', 'Operarte', [{ type: 'recovery', weeks: 2 }, { type: 'injuryProneness', delta: -6 }], { result: 'Más tiempo fuera, pero vuelves como nuevo.' }),
    opt('conservador', 'Tratamiento conservador', [{ type: 'recovery', weeks: -1 }], { roll: roll(0.6, out('Funciona.'), out('Recaída.', { type: 'recovery', weeks: 3 })) }),
  ], { category: 'injury', phases: ANY, stages: PRO, cd: 3, speaker: 'narrator' }),
  mev('cl-lesion-animo', [{ type: 'injured', value: true }], 'La grada te espera', 'Llevas semanas lesionado. La afición te dedica una pancarta.', [
    opt('agradecer', 'Agradecerlo en redes', [rel('fans', 5), morale(6)], { result: 'Te da fuerzas.' }),
    opt('visita', 'Visitar el estadio en muletas', [rel('fans', 8), morale(4)], { result: 'Ovación de pie.' }),
  ], { category: 'injury', phases: HALVES, stages: PRO, cd: 3, speaker: 'fans' }),
  mev('cl-lesion-gimnasio', [{ type: 'injured', value: true }], 'Rehabilitación', 'El fisio te propone aprovechar la lesión para fortalecer el tren superior.', [
    opt('si', 'Hacerlo', [attr('strength', 2), fitness(2)], { result: 'Vuelves más fuerte.' }),
    opt('descanso', 'Descansar del todo', [morale(4)], { result: 'Cabeza despejada.' }),
  ], { category: 'injury', phases: ANY, stages: PRO, cd: 3, speaker: 'narrator' }),

  /* ── Final de carrera ────────────────────────────── */
  mev('cl-retirada-mls', [minAge(32)], 'Una liga exótica', 'Te llega una oferta para terminar tu carrera en una liga lejana con mucho dinero y poca presión.', [
    opt('escuchar', 'Escucharla', [{ type: 'offer', kind: 'transfer', sameCountry: false }], { result: 'Tu agente se frota las manos.' }),
    opt('no', 'Quieres seguir compitiendo', [tendency('lealtad', 2)], { result: 'Aún te queda fútbol del bueno.' }),
  ], { ...RT, phases: MARKET, speaker: 'agent' }),
  mev('cl-retirada-entrenador', [minAge(33)], 'Futuro en el banquillo', 'El club te ofrece entrenar en la cantera cuando te retires.', [
    opt('aceptar', 'Aceptar', [flag('futureCoach'), rel('board', 6)], { result: 'Tu futuro, asegurado.' }),
    opt('pensar', 'Pensarlo más adelante', [], { result: 'Aún no quieres pensar en el final.' }),
  ], { ...RT, speaker: 'board', once: true }),
  mev('cl-retirada-despedida', [minAge(34), hasFlag('farewellSeason')], 'La despedida', 'Último partido en casa. El club quiere hacerte un homenaje.', [
    opt('grande', 'Homenaje por todo lo alto', [rel('fans', 10), morale(10), followers(6)], { result: 'Vuelta al campo con tus hijos. El estadio llora contigo.', key: true }),
    opt('sencillo', 'Algo sencillo', [rel('fans', 6), family(6)], { result: 'Un aplauso eterno. Suficiente.' }),
  ], { ...RT, phases: ['secondHalf'], once: true, speaker: 'board' }),
  mev('cl-retirada-cuerpo', [minAge(33)], 'El cuerpo dice basta', 'Cada mañana te cuesta más levantarte. El médico te pregunta cuánto quieres seguir.', [
    opt('seguir', 'Un año más', [morale(3), fitness(-3)], { result: 'Mientras disfrutes…' }),
    opt('cuidarse', 'Cambiar tu preparación para alargar', [fitness(5), { type: 'injuryProneness', delta: -4 }], { result: 'Pilates, dieta y descanso. Ganas años.' }),
  ], { ...RT, phases: ['preseason', 'seasonEnd'], speaker: 'narrator', once: true }),
  mev('cl-retirada-libro', [minAge(33)], 'Tus memorias', 'Una editorial te pide escribir tus memorias.', [
    opt('escribir', 'Escribirlas con un periodista', [money(80000), rel('press', 4), followers(4)], { result: 'Libro del año en deportes.' }),
    opt('no', 'Todavía no', [], { result: 'Quedan capítulos por escribir.' }),
  ], { ...RT, speaker: 'press', once: true }),
  mev('cl-retirada-pupilo', [minAge(31)], 'Tu heredero', 'Un chaval del filial juega en tu posición y te recuerda a ti de joven.', [
    opt('mentor', 'Hacerte su mentor', [attr('leadership', 2), rel('dressingRoom', 4), tendency('solidaridad', 3)], { result: 'Le enseñas todo lo que sabes.' }),
    opt('competir', 'Verle como un rival', [tendency('ego', 2), form(2)], { result: 'Te motiva a seguir.' }),
  ], { ...DR, stages: ['veteran'], once: true }),
  mev('cl-retirada-ultima-temporada', [minAge(35), noFlag('farewellSeason')], '¿La última?', 'A tus 35 años, la prensa te pregunta si esta será tu última temporada.', [
    opt('anunciar', 'Anunciar que sí', [flag('farewellSeason'), rel('fans', 6), news('{apodo} anuncia su última temporada', 'neutral')], { result: 'Comienza la gira de despedida.' }),
    opt('no', 'No ponerte fecha', [], { result: '«Mientras el cuerpo aguante».' }),
  ], { ...RT, phases: ['preseason'], speaker: 'press', once: true }),

  /* ── Varios ──────────────────────────────────────── */
  mev('cl-dorsal-cambio', [], 'Cambio de dorsal', 'Queda libre el dorsal más mítico del club. Te lo ofrecen.', [
    opt('aceptar', 'Aceptarlo', [rel('fans', 5), tendency('ego', 2)], { result: 'Presión extra. Ilusión extra.' }),
    opt('no', 'Seguir con el tuyo', [], { result: 'Tu número es tu número.' }),
  ], { category: 'dressingRoom', phases: ['preseason'], stages: SENIOR, once: true, speaker: 'board' }),
  mev('cl-pretemporada-dura', [], 'Pretemporada en la montaña', 'El nuevo preparador lleva al equipo a una pretemporada durísima en la montaña.', [
    opt('todo', 'Darlo todo', [attr('stamina', 2), fitness(-4), rel('coach', 4)], { result: 'Vuelves como una moto.' }),
    opt('dosificar', 'Dosificarte', [fitness(2)], { result: 'Llegas fresco, pero menos en forma.' }),
  ], { category: 'training', phases: ['preseason'], stages: PRO, cd: 3, speaker: 'coach' }),
  mev('cl-gira-asia', [{ type: 'clubPrestige', min: 75 }], 'Gira por Asia', 'Gira de verano por Asia: tres partidos, diez actos comerciales y mucho avión.', [
    opt('actos', 'Ir a todos los actos', [followers(8), rel('board', 4), fitness(-4)], { result: 'Miles de fans gritan tu nombre en Tokio.' }),
    opt('descanso', 'Priorizar el descanso', [fitness(3), rel('board', -2)], { result: 'Llegas fresco a la liga.' }),
  ], { category: 'social', phases: ['preseason'], stages: PRO, cd: 3, speaker: 'board' }),
  mev('cl-camiseta-diseno', [{ type: 'followers', min: 50000 }], 'Diseña la camiseta', 'La marca deportiva del club te invita a diseñar la tercera equipación.', [
    opt('diseñar', 'Diseñarla', [followers(5), rel('fans', 3)], { roll: roll(0.6, out('Se agota en un día.', money(20000)), out('Los aficionados la odian.', rel('fans', -4))) }),
    opt('no', 'Mejor no', [], { result: 'Dejas el diseño a los profesionales.' }),
  ], { category: 'social', phases: ['seasonEnd', 'preseason'], stages: SENIOR, once: true, speaker: 'agent' }),
  mev('cl-visita-hospital-club', [], 'Visita navideña', 'El club organiza la visita navideña al hospital infantil.', [
    opt('ir', 'Ir con ilusión', [tendency('solidaridad', 4), rel('fans', 3), morale(4)], { result: 'Haces magia con un balón para los niños.' }),
    opt('regalos', 'Comprar regalos para todos', [money(-5000), tendency('solidaridad', 5)], { result: 'Doscientos regalos. Doscientas sonrisas.' }),
  ], { category: 'social', phases: ['winterWindow'], stages: PRO, cd: 2, speaker: 'board' }),
  mev('cl-club-centenario', [], 'Centenario del club', 'El club cumple cien años. Hay una gala con todas sus leyendas.', [
    opt('discurso', 'Dar un discurso', [rel('fans', 6), tendency('carisma', 3)], { result: 'Hablas de lo que el escudo significa para ti.' }),
    opt('escuchar', 'Escuchar a las leyendas', [attr('composure', 1), morale(4)], { result: 'Sales con ganas de ser una de ellas.' }),
  ], { category: 'social', phases: ANY, stages: PRO, once: true, speaker: 'board' }),
  mev('cl-ascenso-celebracion', [{ type: 'divisionTier', min: 2 }], 'Rúa del ascenso', 'Si ascendéis, la ciudad prepara una rúa. El autobús descubierto ya está reservado.', [
    opt('fiesta', 'Prometer fiesta si ascendéis', [rel('fans', 5), morale(4)], { result: 'Motivación extra para el final de temporada.' }),
    opt('calma', 'Pedir calma: aún no hay nada', [attr('composure', 1)], { result: 'Paso a paso.' }),
  ], { category: 'social', phases: ['secondHalf'], stages: PRO, cd: 2, speaker: 'fans' }),
  mev('cl-descenso-miedo', [], 'Miedo al descenso', 'El equipo está en puestos de descenso a falta de diez jornadas.', [
    opt('liderar', 'Dar un paso al frente', [attr('leadership', 2), rel('dressingRoom', 4)], { result: 'Tu actitud contagia al grupo.' }),
    opt('callar', 'Centrarte en lo tuyo', [form(2)], { result: 'Cada uno a lo suyo.' }),
  ], { category: 'dressingRoom', phases: ['winterWindow', 'secondHalf'], stages: PRO, cd: 2, speaker: 'teammate' }),
  mev('cl-nuevo-estadio-nombre', [], 'Venta del nombre del estadio', 'La directiva quiere vender el nombre del estadio a una empresa. La afición está en contra.', [
    opt('afición', 'Ponerte del lado de la afición', [rel('fans', 8), rel('board', -6)], { result: 'Se retrasa la operación.' }),
    opt('club', 'Entender al club', [rel('board', 4), rel('fans', -4)], { result: 'El estadio cambia de nombre.' }),
  ], { category: 'media', phases: ANY, stages: SENIOR, once: true, speaker: 'press' }),
  mev('cl-tecnologia-datos', [], 'Los datos', 'El club contrata a un analista de datos que te enseña tus números al detalle.', [
    opt('estudiar', 'Estudiarlos y corregir', [attr('positioning', 1), attr('concentration', 1)], { result: 'Descubres patrones que ni imaginabas.' }),
    opt('ignorar', 'El fútbol no son números', [tendency('rebeldia', 2)], { result: 'Sigues jugando por instinto.' }),
  ], { category: 'training', phases: ANY, stages: PRO, once: true, speaker: 'coach' }),
];
