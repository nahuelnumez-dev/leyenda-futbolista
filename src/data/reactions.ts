/**
 * Reacciones del entorno tras cada vuelta. Se elige entre las que cumplen sus requisitos.
 * Mismas variables de texto que los eventos ({club}, {entrenador}, {apodo}...).
 */
import type { ReactionDef } from '@/engine/personality/personality';

const es = (text: string) => ({ es: text });

export const REACTIONS: ReactionDef[] = [
  // Rendimiento
  { id: 'goles-grada', source: 'fans', tone: 'positive', weight: 30, requires: [{ type: 'seasonStat', stat: 'goals', min: 8 }], text: es('La grada de {estadio} ya tiene canción para {apodo}.') },
  { id: 'goles-prensa', source: 'press', tone: 'positive', weight: 25, requires: [{ type: 'seasonStat', stat: 'goals', min: 12 }], text: es('{periodista}: "{apodo} está en estado de gracia. Nadie marca así en {division}."') },
  { id: 'asistencias', source: 'press', tone: 'positive', weight: 20, requires: [{ type: 'seasonStat', stat: 'assists', min: 7 }], text: es('Las estadísticas lo confirman: {apodo} es el jugador más generoso de {club}.') },
  { id: 'nota-alta', source: 'coach', tone: 'positive', weight: 25, requires: [{ type: 'seasonStat', stat: 'rating', min: 7.2 }, { type: 'seasonStat', stat: 'apps', min: 8 }], text: es('{entrenador}, en rueda de prensa: "Ahora mismo es imprescindible para nosotros."') },
  { id: 'nota-baja', source: 'press', tone: 'negative', weight: 25, requires: [{ type: 'seasonStat', stat: 'rating', max: 6.0 }, { type: 'seasonStat', stat: 'apps', min: 6 }], text: es('{periodista} es tajante: "{apodo} está muy lejos de su mejor nivel."') },
  { id: 'sin-minutos', source: 'social', tone: 'neutral', weight: 20, requires: [{ type: 'seasonStat', stat: 'apps', max: 3 }, { type: 'age', min: 19 }], text: es('En redes se preguntan por qué {apodo} no juega en {club}.') },
  { id: 'forma-alta', source: 'teammate', tone: 'positive', weight: 15, requires: [{ type: 'form', min: 75 }], text: es('{companero}: "En los entrenamientos es imparable. Da gusto jugar con él."') },
  { id: 'forma-baja', source: 'fans', tone: 'negative', weight: 15, requires: [{ type: 'form', max: 40 }], text: es('Murmullos en {estadio} cada vez que {apodo} pierde un balón.') },

  // Relaciones
  { id: 'idolo', source: 'fans', tone: 'positive', weight: 15, requires: [{ type: 'relation', who: 'fans', min: 50 }], text: es('Las camisetas con el nombre de {apodo} son las más vendidas en la tienda de {club}.') },
  { id: 'aficion-enfadada', source: 'fans', tone: 'negative', weight: 25, requires: [{ type: 'relation', who: 'fans', max: -30 }], text: es('Aparece una pancarta contra {apodo} en el fondo de {estadio}.') },
  { id: 'coach-confia', source: 'coach', tone: 'positive', weight: 15, requires: [{ type: 'relation', who: 'coach', min: 40 }], text: es('{entrenador}: "Es el primero que pongo en la pizarra."') },
  { id: 'coach-tension', source: 'press', tone: 'negative', weight: 25, requires: [{ type: 'relation', who: 'coach', max: -25 }], text: es('Se habla de mal ambiente entre {apodo} y {entrenador}. Ni se miran en los entrenamientos.') },
  { id: 'vestuario-bien', source: 'teammate', tone: 'positive', weight: 12, requires: [{ type: 'relation', who: 'dressingRoom', min: 40 }], text: es('{capitan}: "Es de los que hacen grupo. Todos le queremos."') },
  { id: 'vestuario-mal', source: 'press', tone: 'negative', weight: 20, requires: [{ type: 'relation', who: 'dressingRoom', max: -25 }], text: es('Fuentes del vestuario: "A algunos no les gusta cómo se comporta {apodo}."') },
  { id: 'directiva-mal', source: 'board', tone: 'negative', weight: 20, requires: [{ type: 'relation', who: 'board', max: -30 }], text: es('El presidente evita responder cuando le preguntan por el futuro de {apodo}.') },
  { id: 'familia', source: 'family', tone: 'positive', weight: 8, requires: [{ type: 'relation', who: 'family', min: 60 }], text: es('Tu familia viaja a {ciudad} para verte jugar. Se nota en tu sonrisa.') },

  // Personalidad
  { id: 'divo', source: 'social', tone: 'neutral', weight: 20, requires: [{ type: 'trait', id: 'divo' }], text: es('Tu última foto en redes, con gafas de sol en el avión, supera el millón de «me gusta».') },
  { id: 'divo-critica', source: 'press', tone: 'negative', weight: 15, requires: [{ type: 'tendency', id: 'ego', min: 50 }], text: es('Un columnista: "A {apodo} se le está subiendo la fama a la cabeza."') },
  { id: 'humilde', source: 'press', tone: 'positive', weight: 15, requires: [{ type: 'trait', id: 'humilde' }], text: es('{periodista} destaca la humildad de {apodo}: "Un ejemplo para los chavales."') },
  { id: 'rebelde', source: 'fans', tone: 'neutral', weight: 15, requires: [{ type: 'trait', id: 'rebelde' }], text: es('Media grada aplaude tu carácter. La otra media cree que te pasas.') },
  { id: 'leal', source: 'fans', tone: 'positive', weight: 15, requires: [{ type: 'trait', id: 'leal' }], text: es('"{apodo}, uno de los nuestros", canta la grada de {estadio}.') },
  { id: 'mercenario', source: 'fans', tone: 'negative', weight: 20, requires: [{ type: 'tendency', id: 'lealtad', max: -40 }], text: es('En los foros de {club} te llaman mercenario.') },
  { id: 'profesional', source: 'coach', tone: 'positive', weight: 12, requires: [{ type: 'trait', id: 'profesional' }], text: es('El preparador físico te pone como ejemplo ante los más jóvenes.') },
  { id: 'fiestero', source: 'social', tone: 'negative', weight: 18, requires: [{ type: 'trait', id: 'fiestero' }], text: es('Alguien te graba saliendo de una discoteca a las cuatro. El vídeo vuela.') },
  { id: 'temperamental', source: 'press', tone: 'negative', weight: 15, requires: [{ type: 'trait', id: 'temperamental' }], text: es('Otra discusión con el árbitro. Los comités te tienen en el punto de mira.') },
  { id: 'solidario', source: 'press', tone: 'positive', weight: 12, requires: [{ type: 'trait', id: 'solidario' }], text: es('Tu fundación aparece en el telediario por su labor con los chavales de {ciudadNatal}.') },
  { id: 'mediatico', source: 'social', tone: 'positive', weight: 12, requires: [{ type: 'trait', id: 'mediatico' }], text: es('Tu vídeo con un niño en la grada es lo más visto de la semana.') },

  // Situación
  { id: 'lesion', source: 'fans', tone: 'neutral', weight: 25, requires: [{ type: 'injured', value: true }], text: es('Mensajes de ánimo en redes: "¡Recupérate pronto, {apodo}!"') },
  { id: 'cedido', source: 'press', tone: 'neutral', weight: 18, requires: [{ type: 'onLoan', value: true }], text: es('En {club} están encantados con la cesión de {apodo}. Ya hablan de intentar quedárselo.') },
  { id: 'transferible', source: 'press', tone: 'neutral', weight: 25, requires: [{ type: 'flag', id: 'transferRequest' }], text: es('Tu nombre aparece en todas las quinielas del mercado.') },
  { id: 'capitan', source: 'teammate', tone: 'positive', weight: 10, requires: [{ type: 'flag', id: 'captain' }], text: es('Con el brazalete, {apodo} ha cambiado la cara del vestuario.') },
  { id: 'veterano', source: 'press', tone: 'neutral', weight: 10, requires: [{ type: 'age', min: 32 }], text: es('{periodista} se pregunta cuántos años le quedan a {apodo} al máximo nivel.') },
  { id: 'joven', source: 'press', tone: 'positive', weight: 10, requires: [{ type: 'age', max: 20 }, { type: 'seasonStat', stat: 'apps', min: 5 }], text: es('Los ojeadores de media Europa siguen a {apodo}, una de las promesas de {division}.') },
  { id: 'seguidores', source: 'social', tone: 'positive', weight: 10, requires: [{ type: 'followers', min: 1_000_000 }], text: es('Superas el millón de seguidores. Las marcas hacen cola.') },
];
