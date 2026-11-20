/** Eventos de mercado, contratos, agentes y cesiones (bloque de la Fase 11). */
import type { GameEvent } from '@/engine/types/events';
import { HALVES, PRO, SENIOR, chance, ev, family, flag, followers, fitness, form, minAge, minOverall, money, morale, news, opt, rel, rep, roll, tendency } from './helpers';

export const MARKET_EVENTS: GameEvent[] = [
  ev({
    id: 'mk-clausula', category: 'contract', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 16, cooldownSeasons: 3, requires: [minOverall(75)], speaker: 'board',
    title: 'La cláusula',
    text: 'El director deportivo quiere subir tu cláusula de rescisión porque varios clubes preguntan por ti. A cambio, mejora tu sueldo.',
    options: [
      opt('aceptar', 'Aceptar: más sueldo, más blindaje', [money(150000), rel('board', 10), tendency('lealtad', 6)], { result: 'Firmas la ampliación. Los rumores se enfrían.' }),
      opt('rechazar', 'Mantener la cláusula actual', [rel('board', -6), tendency('lealtad', -4)], { result: 'Las puertas quedan abiertas.' }),
    ],
  }),
  ev({
    id: 'mk-renovacion-larga', category: 'contract', stages: ['breakthrough'], phases: ['seasonEnd', 'winterWindow'], weight: 18, once: true, requires: [{ type: 'onLoan', value: false }, minOverall(62)], speaker: 'board',
    title: 'Contrato hasta los 28',
    text: 'El club te ofrece un contrato muy largo: seguridad absoluta, pero un sueldo modesto para lo que podrías llegar a cobrar.',
    options: [
      opt('seguridad', 'Firmar: la tranquilidad no tiene precio', [{ type: 'offer', kind: 'renewal' }, family(8), tendency('lealtad', 8)], { result: 'Tu familia respira tranquila.' }),
      opt('esperar', 'Esperar a demostrar más', [rel('board', -4), tendency('ego', 3)], { result: 'Apuestas por ti mismo.' }),
    ],
  }),
  ev({
    id: 'mk-comision', category: 'agent', stages: PRO, phases: ['seasonEnd'], weight: 15, cooldownSeasons: 3, requires: [{ type: 'hasAgent', value: true }], speaker: 'agent',
    title: '{agente} quiere más',
    text: '{agente} te pide subir su comisión: «Te he conseguido todo lo que tienes».',
    options: [
      opt('aceptar', 'Aceptar', [money(-60000), rel('agent', 15)], { result: 'Tu agente está más motivado que nunca.' }),
      opt('negociar', 'Negociar a la baja', [], { roll: roll(0.5, { text: 'Acordáis una subida pequeña.', effects: [money(-20000), rel('agent', 5)] }, { text: 'Se ofende. La relación se enfría.', effects: [rel('agent', -15)] }) }),
      opt('despedir', 'Despedirle', [{ type: 'setAgent', profile: 'none' }], { result: 'Te quedas sin agente.' }),
    ],
  }),
  ev({
    id: 'mk-eterno-rival', category: 'transfer', stages: SENIOR, phases: ['winterWindow', 'seasonEnd'], weight: 12, cooldownSeasons: 4, requires: [{ type: 'derbyUpcoming' }, minOverall(72)], speaker: 'agent',
    title: 'La llamada de {rival}',
    text: '{agente} te cuenta que {rival}, vuestro gran rival, estaría dispuesto a pagar tu cláusula.',
    options: [
      opt('rechazar', '«Jamás jugaré allí»', [rel('fans', 15), tendency('lealtad', 12), news('{apodo}: «Nunca jugaré en {rival}»', 'positive')], { result: 'La frase se convierte en pancarta.', key: true }),
      opt('escuchar', 'Escuchar sin compromiso', [rel('fans', -15), tendency('lealtad', -10)], { result: 'Se filtra. Te pitan en el siguiente partido en {estadio}.' }),
    ],
  }),
  ev({
    id: 'mk-cesion-exito', category: 'loan', stages: PRO, phases: ['secondHalf'], weight: 22, cooldownSeasons: 1, requires: [{ type: 'onLoan', value: true }, { type: 'seasonStat', stat: 'rating', min: 6.8 }], speaker: 'board',
    title: 'Te quieren comprar',
    text: 'Tu cesión en {club} está siendo un éxito. Su presidente quiere ficharte en propiedad a final de temporada.',
    options: [
      opt('quedarse', 'Decirle que te encantaría quedarte', [rel('fans', 10), rel('board', 8), { type: 'offer', kind: 'transfer', sameCountry: true }], { result: 'El club prepara una oferta formal.' }),
      opt('volver', 'Quieres triunfar en tu club de origen', [morale(4)], { result: 'Volverás en verano con más experiencia.' }),
    ],
  }),
  ev({
    id: 'mk-carta-libertad', category: 'contract', stages: ['veteran'], phases: ['seasonEnd'], weight: 18, cooldownSeasons: 2, requires: [minAge(32)], speaker: 'board',
    title: 'Un año más… o no',
    text: 'El club solo te ofrece un año más con la mitad de sueldo. Tu agente cree que otros clubes pagarían más.',
    options: [
      opt('aceptar', 'Quedarte aunque cobres menos', [rel('fans', 8), tendency('lealtad', 8), money(-100000)], { result: 'Firmas sin mirar la cifra.' }),
      opt('mercado', 'Escuchar otras ofertas', [{ type: 'offer', kind: 'transfer' }, tendency('lealtad', -4)], { result: 'Llega una propuesta interesante.' }),
    ],
  }),
  ev({
    id: 'mk-nuevo-presidente', category: 'contract', stages: PRO, phases: ['preseason'], weight: 12, cooldownSeasons: 4, requires: [chance(0.5)], speaker: 'board',
    title: 'Elecciones en el club',
    text: 'Hay elecciones en {club}. Uno de los candidatos quiere hacerse una foto contigo para su campaña.',
    options: [
      opt('neutral', 'Mantenerte neutral', [rel('board', 3), rel('press', 3)], { result: 'Gane quien gane, tú sigues siendo de todos.' }),
      opt('apoyar', 'Apoyarle públicamente', [], { roll: roll(0.5, { text: 'Gana tu candidato. Te tiene en un altar.', effects: [rel('board', 15)] }, { text: 'Pierde. El nuevo presidente no lo olvida.', effects: [rel('board', -15)] }) }),
    ],
  }),
  ev({
    id: 'mk-oferta-exotica', category: 'agent', stages: SENIOR, phases: ['winterWindow'], weight: 10, cooldownSeasons: 3, requires: [{ type: 'hasAgent', value: true }], speaker: 'agent',
    title: 'Una liga lejana',
    text: '{agente} tiene una oferta de una liga emergente de Asia: mucho dinero, poco nivel y un contrato de imagen enorme.',
    options: [
      opt('usar', 'Usarla para pedir una mejora a tu club', [{ type: 'offer', kind: 'renewal' }, rel('board', -3)], { result: 'Tu club reacciona rápido.' }),
      opt('no', 'Aún te queda mucho que demostrar en la élite', [tendency('ego', 3), morale(4)], { result: 'Rechazada.' }),
    ],
  }),
  ev({
    id: 'mk-sueldo-filtrado', category: 'media', stages: PRO, phases: HALVES, weight: 14, cooldownSeasons: 3, requires: [minOverall(70)], speaker: 'press',
    title: 'Tu sueldo, en portada',
    text: 'Un periódico publica tu sueldo y lo compara con el de un hospital entero. Las redes arden.',
    options: [
      opt('explicar', 'Explicar con calma lo que haces con tu dinero', [rel('press', 4), tendency('carisma', 4)], { result: 'Mencionas tu fundación y tus impuestos. La polémica se apaga.' }),
      opt('ignorar', 'No entrar al trapo', [rel('fans', -4)], { result: 'Pasa en una semana.' }),
      opt('donar', 'Anunciar una donación al hospital de tu ciudad natal', [money(-100000), rel('fans', 10), tendency('solidaridad', 10), news('{nombreCompleto} dona 100.000 € al hospital de {ciudadNatal}', 'positive')], { result: 'Titulares completamente distintos al día siguiente.' }),
    ],
  }),
  ev({
    id: 'mk-bonus-goles', category: 'contract', stages: PRO, phases: ['preseason'], weight: 14, cooldownSeasons: 3, requires: [{ type: 'positionGroup', in: ['forward', 'midfielder'] }], speaker: 'board',
    title: 'Contrato por objetivos',
    text: 'El club te propone cambiar parte de tu sueldo fijo por primas por goles y asistencias.',
    options: [
      opt('aceptar', 'Aceptar: confías en ti', [tendency('ego', 3), rel('board', 6), flag('goalBonusContract')], { result: 'Cada gol vale el doble esta temporada.' }),
      opt('fijo', 'Prefieres el fijo', [tendency('profesionalidad', 2)], { result: 'Nada cambia.' }),
    ],
  }),
  ev({
    id: 'mk-derechos-imagen', category: 'contract', stages: SENIOR, phases: ['seasonEnd'], weight: 12, cooldownSeasons: 4, requires: [{ type: 'reputation', scope: 'national', min: 50 }], speaker: 'board',
    title: 'Derechos de imagen',
    text: 'El club quiere quedarse con el 50 % de tus derechos de imagen. Tu agente se niega en redondo.',
    options: [
      opt('ceder', 'Ceder: el club te lo ha dado todo', [money(-80000), rel('board', 12), tendency('lealtad', 6)], { result: 'Firmas el acuerdo.' }),
      opt('pelear', 'Pelear por tus derechos', [], { roll: roll(0.55, { text: 'El club cede. Mantienes tus derechos.', effects: [money(80000), rel('board', -4)] }, { text: 'La negociación se enquista y llega a la prensa.', effects: [rel('board', -14), rel('fans', -4)] }) }),
    ],
  }),
  ev({
    id: 'mk-intermediario', category: 'ethics', stages: PRO, phases: ['winterWindow', 'seasonEnd'], weight: 10, once: true, requires: [minOverall(70)], speaker: 'agent',
    title: 'Una comisión «discreta»',
    text: 'Un intermediario te ofrece cobrar una comisión en una cuenta en el extranjero si fuerzas tu traspaso a un club concreto.',
    options: [
      opt('rechazar', 'Rechazarlo y contárselo a tu club', [rel('board', 10), tendency('profesionalidad', 6)], { result: 'Tu club te lo agradece. El intermediario desaparece.' }),
      opt('aceptar', 'Aceptar', [money(300000), tendency('profesionalidad', -15), flag('shadyCommission')], { roll: roll(0.6, { text: 'Nadie se entera… de momento.', effects: [] }, { text: 'Hacienda investiga. Multa y escándalo.', effects: [money(-500000), rep('national', -10), news('Hacienda investiga a {nombreCompleto}', 'negative')] }), key: true }),
    ],
  }),
  ev({
    id: 'mk-ultimo-dia', category: 'transfer', stages: PRO, phases: ['winterWindow'], weight: 14, cooldownSeasons: 2, requires: [{ type: 'any', of: [{ type: 'morale', max: 50 }, { type: 'relation', who: 'coach', max: 0 }] }], speaker: 'agent',
    title: 'Último día de mercado',
    text: 'Son las once de la noche del último día de mercado. {agente} te llama: «Hay un club que te quiere ya. Tenemos una hora».',
    options: [
      opt('escuchar', 'Escuchar la oferta', [{ type: 'offer', kind: 'transfer' }], { result: 'La oferta llega por correo a las 23:40.' }),
      opt('quedarse', 'Quedarte y pelear', [morale(-2), rel('coach', 3)], { result: 'Cuelgas y apagas el móvil.' }),
    ],
  }),
  ev({
    id: 'mk-antiguo-mister', category: 'transfer', stages: SENIOR, phases: ['seasonEnd'], weight: 12, cooldownSeasons: 3, requires: [{ type: 'seasonsAtClub', min: 2 }, chance(0.6)], speaker: 'coach',
    title: 'Tu antiguo entrenador te llama',
    text: 'Un entrenador que te tuvo en el pasado acaba de firmar por otro club y te quiere como pieza clave de su proyecto.',
    options: [
      opt('escuchar', 'Escuchar su proyecto', [{ type: 'offer', kind: 'transfer' }], { result: 'Te convence con una videollamada de una hora.' }),
      opt('no', 'Agradecérselo, pero estás bien aquí', [tendency('lealtad', 4)], { result: 'Os despedís con cariño.' }),
    ],
  }),
  ev({
    id: 'mk-gira', category: 'social', stages: PRO, phases: ['preseason'], weight: 14, cooldownSeasons: 2, requires: [{ type: 'clubPrestige', min: 75 }], speaker: 'board',
    title: 'Gira de pretemporada',
    text: '{club} se va de gira por Asia y Estados Unidos: partidos amistosos, actos con patrocinadores y miles de aficionados.',
    options: [
      opt('volcarse', 'Volcarte con los aficionados y los actos', [followers(15), tendency('carisma', 6), fitness(-5)], { result: 'Tus seguidores se disparan en Asia.' }),
      opt('futbol', 'Centrarte solo en el fútbol', [form(4), tendency('profesionalidad', 3)], { result: 'Llegas a la liga en plena forma.' }),
    ],
  }),
  ev({
    id: 'mk-rebaja', category: 'contract', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 12, cooldownSeasons: 3, requires: [{ type: 'clubPrestige', max: 65 }], speaker: 'board',
    title: 'El club pasa apuros',
    text: 'La situación económica de {club} es crítica. El presidente pide a la plantilla una rebaja salarial temporal.',
    options: [
      opt('aceptar', 'Aceptar la rebaja', [money(-60000), rel('board', 12), rel('fans', 8), tendency('solidaridad', 8)], { result: 'Eres de los primeros en firmar. Arrastras al resto.' }),
      opt('no', 'Negarte: tu contrato está para cumplirse', [rel('board', -10), rel('fans', -6), tendency('lealtad', -6)], { result: 'La noticia sale en la prensa local.' }),
    ],
  }),
  ev({
    id: 'mk-tras-descenso', category: 'transfer', stages: SENIOR, phases: ['seasonEnd'], weight: 25, cooldownSeasons: 2, requires: [{ type: 'divisionTier', min: 2 }, minOverall(72)], speaker: 'agent',
    title: '¿Quedarte en la categoría?',
    text: '{agente} cree que tu nivel está muy por encima de {division}. Hay clubes de primera interesados.',
    options: [
      opt('salir', 'Buscar un club de primera', [{ type: 'offer', kind: 'transfer', clubPrestige: { min: 60 } }, tendency('lealtad', -4)], { result: 'Llega una oferta de primera división.' }),
      opt('quedarse', 'Quedarte para devolver al club a su sitio', [rel('fans', 12), tendency('lealtad', 10)], { result: 'Te conviertes en el líder del proyecto.', key: true }),
    ],
  }),
  ev({
    id: 'mk-dorsal', category: 'dressingRoom', stages: PRO, phases: ['preseason'], weight: 18, cooldownSeasons: 3, requires: [{ type: 'seasonsAtClub', max: 0 }], speaker: 'teammate',
    title: 'El dorsal ocupado',
    text: 'Acabas de llegar a {club} y tu dorsal de siempre lo lleva {companero}, un veterano del vestuario.',
    options: [
      opt('pedir', 'Pedírselo amablemente', [], { roll: roll(0.5, { text: 'Te lo cede a cambio de una cena. Empezáis con buen pie.', effects: [rel('dressingRoom', 6)] }, { text: 'Se niega. Y te lo recuerda cada día.', effects: [rel('dressingRoom', -4)] }) }),
      opt('otro', 'Elegir otro número', [rel('dressingRoom', 4), tendency('ego', -3)], { result: 'Un número nuevo para una etapa nueva.' }),
    ],
  }),
  ev({
    id: 'mk-cedido-sin-minutos', category: 'loan', stages: PRO, phases: ['winterWindow'], weight: 22, cooldownSeasons: 1, requires: [{ type: 'onLoan', value: true }, { type: 'seasonStat', stat: 'apps', max: 6 }], speaker: 'agent',
    title: 'Cedido y sin jugar',
    text: 'Estás cedido en {club} pero apenas juegas. {agente} propone romper la cesión en este mercado.',
    options: [
      opt('otra', 'Buscar otra cesión', [{ type: 'offer', kind: 'loan' }], { result: 'Aparece otro club dispuesto a darte minutos.' }),
      opt('aguantar', 'Aguantar y ganarte el puesto', [rel('coach', 5), morale(-3)], { result: 'Te quedas a pelear.' }),
    ],
  }),
  ev({
    id: 'mk-competidor', category: 'coach', stages: PRO, phases: ['preseason', 'winterWindow'], weight: 16, cooldownSeasons: 2, requires: [chance(0.6)], speaker: 'press',
    title: 'Ha llegado un competidor',
    text: '{club} acaba de fichar a un jugador de tu misma posición por una cifra importante. La prensa ya habla de quién será titular.',
    options: [
      opt('competir', 'Competir sano y entrenar más que nunca', [rel('coach', 5), tendency('profesionalidad', 4), morale(-2)], { result: 'La competencia te hace mejor.' }),
      opt('salir', 'Pedir minutos o la salida', [{ type: 'transferRequest' }], { result: 'Pides una reunión con la dirección deportiva.' }),
    ],
  }),
];

