# Decisiones de diseño

Registro de decisiones tomadas ante ambigüedades. Cada entrada indica la fase en que se tomó.
Las marcadas con **[REVISAR]** necesitan tu validación.

## Generales (plan aprobado)

1. **Ubicación del proyecto**: `Claude Juego/leyenda-futbolista`, separado de otros juegos.
2. **Simulación de partidos**: modelo Poisson con fuerza de ataque/defensa derivada del prestigio
   dinámico del club y ventaja de local. Todas las ligas se simulan completas cada temporada; solo el
   club del jugador se simula con detalle individual (minutos, nota, goles, asistencias).
3. **Minutos de juego**: dependen de la media del jugador frente al nivel esperado de su posición en el
   club, de la relación con el entrenador y de su forma.
4. **Calendarios**: Sudamérica usa año natural y Europa agosto-mayo. El motor usa una temporada
   abstracta de 5 fases (`preseason`, `firstHalf`, `winterWindow`, `secondHalf`, `seasonEnd`) y solo
   cambia la etiqueta (`2026` o `2026-27`).
5. **Formatos reales complejos se simplifican** y se documentan por país en su JSON (`notes`).
6. **Personas ficticias**: compañeros, entrenadores, presidentes, periodistas y estrellas rivales
   (que compiten por los premios) son ficticios y generados. Clubes, ligas, ciudades y estadios son reales.
7. **Datos de clubes**: base en la temporada 2025-26. Las divisiones de las que no tenga certeza se
   marcan con `needsReview: true` y se listan aquí. Las terceras divisiones regionales o amateurs se
   reducen o se omiten.
8. **Semilla**: opcional. El estado del generador (`rngState`) se guarda en la partida, por lo que
   recargar no altera resultados ya producidos.
9. **Guardado compacto**: del mundo solo se guarda el histórico de campeones, ascensos y descensos, no
   las tablas completas de temporadas pasadas.
10. **Textos**: UI en `src/i18n/es.json`; contenido narrativo con `LocalizedText` en los datos.
11. **Eventos en TypeScript declarativo** (sin funciones): tipado al compilar + test de referencias.
    Ligas y clubes en JSON para revisarlos fácilmente.

## Escudos

12. **Escudos reales** (petición del usuario): archivos en `public/crests/<pais>/<club>.png` descargados
    desde Wikipedia/Wikimedia con un script (Fase 2), con permiso previo. Si falta un escudo se usa
    uno genérico SVG con los colores y el patrón reales. Los escudos son marcas registradas: uso personal.

## Fase 1

13. **React 19** en lugar de React 18 (versión estable actual; sin cambios de API relevantes).
    TypeScript 7, Vite 8, Vitest 5, Zustand 5, zod 4.
14. **Identificadores**: países con código FIFA de 3 letras (`ESP`, `ENG`, `ARG`, `BRA`, `SCO`...),
    porque Inglaterra, Escocia o Gales no tienen código ISO propio. Clubes y divisiones con
    `<pais>.<slug>` (`esp.real-madrid`, `esp.laliga`) para que sean únicos sin coordinación.
15. **Ids de atributos en inglés** (`finishing`, `pace`...) y nombres visibles en español vía i18n.
    Facilita la traducción y el código; los datos siguen siendo legibles.
16. **Primera temporada: 2026-27**; el jugador empieza con **15 años** (cumplidos a 1 de julio).
17. **Edad**: se calcula a 1 de julio del año de inicio de cada temporada.
18. **Validación de partidas**: zod comprueba la estructura imprescindible (calendario, jugador,
    generador, listas). Se devuelve el objeto original para no perder campos aún no validados.
19. **Sin router**: la navegación es una máquina de pantallas en Zustand (es un juego, no una web con URLs).
20. **Ironman**: opción por carrera. Si está activo, no se muestra el guardado manual (solo
    autoguardado). En la Fase 5 el autoguardado ocurrirá tras cada decisión.
21. **"Continuar"** carga la ranura más reciente que no sea de una carrera retirada.
22. **Fuentes incluidas en el bundle** (`@fontsource`): Barlow Condensed (títulos) e Inter (texto),
    para que el juego funcione sin conexión.
23. **Tamaño del bundle**: ~510 KB (~160 KB gzip), sobre todo framer-motion y zod. Se dividirá con
    carga diferida en la Fase 11 si hace falta.
24. **Creación provisional**: en la Fase 1 la "Nueva carrera" solo pide nombre, apodo, posición, semilla
    e Ironman, con atributos aleatorios de prueba. La Fase 3 la sustituye por la creación completa.

## Fase 2

25. **Composiciones de liga**: la «última temporada completa conocida» de cada país. Europa usa 2025-26 y
    Sudamérica 2025 (año natural). La partida empieza en 2026-27 / 2026 con esas plantillas de clubes, y a
    partir de ahí ascensos y descensos los decide la simulación.
26. **Divisiones incluidas**: tres niveles por país. España: LaLiga, LaLiga Hypermotion y Primera Federación
    (2 grupos). Inglaterra: Premier League, Championship y League One. Argentina: Liga Profesional, Primera
    Nacional y Primera B Metropolitana (el Federal A queda fuera). Brasil: Série A, B y C.
27. **La división más baja no tiene descensos** (no existe una cuarta). Los clubes que bajan desde arriba
    ocupan las plazas de los que suben. El validador comprueba que bajan tantos como suben.
28. **Formatos simplificados**: Liga Profesional argentina, Primera Nacional y Série C se juegan a una vuelta,
    sin zonas ni segundas fases. Los playoffs (Segunda, Championship, Primera Federación, reducido argentino)
    se respetan como reglas `promotion.playoff`. Los campeonatos estatales brasileños no se simulan.
29. **Filiales** (`parentClubId`): Castilla, Bilbao Athletic, Real Sociedad B, etc. No pueden compartir
    división con su primer equipo. La Fase 4 aplicará la regla en ascensos y descensos.
30. **Clubes galeses y andorrano**: Cardiff, Swansea y Wrexham van en la liga inglesa con región «Gales»;
    el FC Andorra en la española con región «Andorra». El país de nacimiento sigue siendo Gales o Andorra.
31. **Prestigio, presupuesto, cantera y estilo** son estimaciones propias (1-100 y M€ aproximados), en una
    escala común a todos los países para que los traspasos internacionales tengan sentido. Se ajustarán
    en la Fase 11 (balance).
32. **Rivalidades**: se escriben una vez y el cargador las hace simétricas. Las de intensidad 3 son los
    grandes clásicos (Clásico, Superclásico, Fla-Flu, Gre-Nal, derbi de Merseyside...).
33. **Abreviatura `abbr`** (2-4 letras, única por país) para tablas en móvil y para el escudo genérico.
34. **Escudos**: el script consulta la imagen principal del artículo de Wikipedia (inglesa primero, luego
    la del idioma del país) y la guarda como PNG de 256 px. El juego solo usa los escudos listados en
    `src/data/crests-manifest.json`, así que no hay peticiones fallidas si falta alguno. Los clubes con
    nombre oficial ambiguo (dos «Botafogo Futebol Clube», «Athletic Club»...) llevan `crest.wiki` explícito.
    Resultado de la descarga: 286 escudos (9,9 MB, miniaturas de 250 px). Los filiales sin escudo propio
    usan el de su primer equipo. Quedan con escudo genérico: Colegiales, Central Norte, Defensores Unidos,
    J. J. Urquiza y Juventud Torremolinos. Se revisó a mano la lista de artículos usados
    (`scripts/crests-report.json`); el de Talleres (RE) apuntaba al de Córdoba y se corrigió.
35. **Pantalla «Clubes y ligas»** en el menú principal: explorador de la base de datos (países, divisiones,
    grupos, ficha de club, búsqueda). Sirve para revisar los datos y, más adelante, como consulta en partida.
36. **Países sin ligas** (Portugal, Francia, Italia, Alemania, Uruguay, Colombia...) ya están en
    `countries.json` con regiones y ciudades para poder nacer allí (Fase 3). Sus ligas llegarán en los
    lotes 2b-2d.

## Fase 3

37. **Asistente en 6 pasos**: origen, aspecto, posición, estilo, personalidad y cantera, con vista previa
    del avatar y de la media inicial en todo momento. Se puede volver atrás en cualquier paso.
38. **Talento oculto** (potencial 58-95) sale de la semilla (distribución normal centrada en 76). Los
    ojeadores muestran un rango amplio (p. ej. 70-85) que se estrechará con la edad en la Fase 4.
39. **Atributos iniciales** (media ~38-55 a los 15 años): base según el talento, más peso en los atributos
    de la posición principal (y algo menos en las secundarias), bonus del estilo de juego, pequeños bonus
    por rasgo y ajustes por altura, complexión y pie. Los de portero son muy bajos para jugadores de campo.
40. **2 rasgos a elegir** entre 15 disponibles, con incompatibilidades (Profesional/Fiestero,
    Líder/Tímido, Leal/Ambicioso...). Otros rasgos (Acomodado, Frágil, Ídolo) solo se ganan en la carrera.
41. **Pruebas de cantera**: hasta 4 ofertas según el lugar de nacimiento (club de la ciudad, grande de la
    región, cantera de élite del país y un ojeador), cada una con su probabilidad visible. Solo se puede
    hacer **una prueba**; si falla, se empieza en el club cercano más accesible (plan B, siempre visible).
    La probabilidad depende del talento frente a la dificultad del club (cantera + prestigio) y de la
    cercanía. El resultado es determinista para la semilla: no se puede repetir la misma prueba.
42. **Tras la prueba se bloquean la semilla y el lugar de nacimiento** para que no se pueda «tirar otra vez».
43. **Nacidos en países sin liga** (Uruguay, Portugal, Escocia...) prueban en los países vecinos con liga.
    Galeses y andorranos tienen como cercanos a los clubes de su región (Cardiff, Swansea, Wrexham, Andorra).
44. **Los filiales no ofrecen pruebas**: la cantera es la del primer equipo.
45. **Segunda nacionalidad opcional**: sirve para elegir selección en la Fase 8 (también cuenta el país de
    nacimiento).
46. **Contrato de juvenil**: 3 temporadas, rol «cantera», beca de ~3.000-35.000 € al año según el club.
47. **Avatar**: SVG por capas (pelo trasero, camiseta con los colores y el patrón del club, cuello, cabeza,
    cara, vello facial, pelo delantero y complemento). 8 tonos de piel, 10 peinados, 9 colores de pelo,
    5 tipos de vello facial, 6 colores de ojos, 3 complementos, altura 160-200 cm y 3 complexiones.
    La altura y la complexión afectan a los atributos (los altos cabecean mejor; los bajos son más ágiles).
48. **Etiqueta de temporada** según la liga del club: «2026» en Argentina y Brasil, «2026-27» en Europa.

## Fase 4

49. **Cinco fases por temporada**: pretemporada → 1.ª vuelta → mercado de invierno → 2.ª vuelta → fin de
    temporada. Cada pulsación de «Continuar» avanza una fase y autoguarda. La Fase 5 enganchará eventos y
    decisiones en cada fase.
50. **Se simulan todas las ligas** (12 divisiones, 14 tablas con los grupos) partido a partido: calendario de
    todos contra todos por el método del círculo (el orden depende solo de la semilla y la temporada) y goles
    con un modelo de Poisson. Fuerza del equipo = 44 + prestigio × 0,45; ventaja de campo de 1,15.
    Resultado medio: ~2,8 goles por partido; campeones con 76-92 puntos en ligas de 20.
51. **El jugador solo se simula en detalle en su club**: titularidad según media frente al nivel del equipo,
    relación con el entrenador, forma y rol; minutos, nota (1-10), goles y asistencias (salen de los goles de
    su equipo, así que siempre cuadran con el marcador).
52. **Canteranos**: juegan la liga de juveniles (14 partidos por vuelta, nivel según la edad) y pueden ser
    convocados con el primer equipo si su media se acerca. Suben al primer equipo a los 18 años o antes si
    su media llega a 10 puntos del nivel del equipo. Las promesas muy lejos del nivel siguen jugando en el
    filial.
53. **Evolución anual**: cada atributo se acerca a un objetivo que depende del potencial oculto y de su
    importancia en la posición. Ritmo del 17 % del hueco a los 15-19 años, que baja hasta 0 a los 29;
    jugar más acelera hasta un 20 %. Rasgos y estilo multiplican el crecimiento. Declive físico desde los 30
    y general desde los 31; la mentalidad (visión, compostura, liderazgo) mejora hasta los 31.
    Resultado típico: un potencial 95 llega a ~89-91 hacia los 25; quien no juega se queda 5-10 puntos por
    debajo de su potencial.
54. **Rol en la plantilla** según la diferencia entre su media y el nivel del equipo (estrella ≥ +6,
    titular ≥ −2, rotación ≥ −8, promesa si es joven). **Contratos**: renovación automática al terminar
    (la negociación llega en la Fase 5). Sueldo según media y presupuesto del club.
55. **Ascensos y descensos** con playoffs simulados (gana más a menudo el de más prestigio). Filiales: no
    suben a la división de su primer equipo (sube el siguiente) y bajan si su primer equipo desciende a su
    categoría. Los clubes que llegan a una división con grupos se reparten buscando grupo con hueco y con
    más clubes de su región.
56. **Prestigio dinámico**: sube o baja según el puesto frente al esperado, ±3 por ascenso/descenso, +1,5
    por campeonato y vuelve un 10 % por temporada hacia su prestigio histórico. El presupuesto sube un 25 %
    al ascender y baja un 20 % al descender.
57. **Valor de mercado** exponencial con la media (1,16^(media−40) × 50.000 €) y ajustado por edad,
    margen de potencial y prestigio del club. Un 90 de 25 años en un grande vale ~100 M€.
58. **Guardado**: se guardan las tablas de la temporada en curso, los partidos del jugador en esa temporada
    y el historial compacto (campeón, ascensos y descensos de cada tabla y temporada).
59. **Copas** (Copa del Rey, FA Cup...) no se juegan aún: llegan con las competiciones de la Fase 8.

## Fase 5

60. **Eventos como datos** (`src/data/events/*.ts`): requisitos, opciones, efectos y tiradas, sin funciones.
    Un test valida ids, número de opciones, referencias a otros eventos, rasgos, atributos y variables de texto.
    Primer bloque: **59 eventos** (cantera, carrera profesional, vida fuera del campo, ética y veteranía).
    El resto hasta superar los 150 llega en las fases 6 y 11.
61. **Sorteo por fase**: 1 en pretemporada, 1-2 en cada vuelta, 0-1 en el mercado de invierno y 1 al final
    de temporada, ponderado por peso y filtrado por etapa de la carrera (cantera, irrupción, consolidación,
    plenitud, veteranía), requisitos, `once` y `cooldownSeasons`. Los eventos programados por decisiones
    anteriores salen primero.
62. **No se puede avanzar con decisiones pendientes.** Tras cada decisión se muestran el texto del
    resultado y los cambios (relaciones, atributos, dinero...). En Ironman se autoguarda tras cada decisión
    (en realidad se autoguarda siempre; el Ironman solo quita el guardado manual).
63. **Tiradas**: probabilidad base más 1 % por cada punto del atributo indicado por encima de 50
    (limitada a 5-95 %). La interfaz marca con 🎲 las opciones con riesgo, sin mostrar la probabilidad.
64. **Personas ficticias**: entrenador (cambia cada temporada), capitán, compañeros, agente y periodista
    se generan con la semilla a partir de listas de nombres por idioma (`src/data/names.ts`).
65. **Mercado**: las ofertas llegan en el mercado de invierno y al final de la temporada, y también por
    eventos. Le quieren los clubes en los que sería al menos rotación y que pueden pagar su valor (≤ 45 %
    del presupuesto). Los clubes de otros países pesan menos salvo con reputación mundial o un agente con
    contactos. Los jóvenes con pocos minutos reciben ofertas de cesión. En el último año de contrato, su club
    ofrece renovar. Las ofertas caducan al cambiar de fase. Aceptar un traspaso o una cesión anula el resto.
66. **Traspaso en invierno**: el cambio es inmediato (la segunda vuelta la juega con el club nuevo). Al final
    de temporada, desde la siguiente. **Cesión**: una temporada; al terminar vuelve con su contrato anterior.
67. **Contrato que termina sin renovar**: el club le renueva un año con el mismo sueldo (la agencia libre
    llegará con el pulido de la Fase 11).
68. **Lesiones en partidos**: 1,2 % por partido jugado, más con propensión, rasgos (Frágil, Físico de hierro)
    y mala forma física. Leves 1-3 semanas, medias 4-8, graves 18-32. Cada jornada cuenta como una semana.
69. **Reputación** local, nacional y mundial: se acerca cada temporada a un objetivo según media,
    rendimiento y prestigio del club. Los rasgos mueven las relaciones cada temporada y la fama hace crecer
    los seguidores.
70. **Agentes**: un evento ofrece una gran agencia (más contactos, 10 % de comisión) o un agente local de
    confianza (5 %). Se puede despedir al agente.

## Fase 6

71. **Siete tendencias** de -100 a 100 con dos polos: Ego/Humildad, Rebeldía/Disciplina, Lealtad/Mercenarismo,
    Profesionalidad/Dejadez, Temperamento/Calma, Carisma/Reserva y Solidaridad/Individualismo
    (`src/data/tendencies.ts`). Los rasgos elegidos al crear el personaje las fijan en ±30.
72. **Umbral 40**: al cruzarlo se gana el rasgo del polo (Divo, Humilde, Rebelde, Leal, Ambicioso,
    Profesional, Fiestero, Temperamental, Sangre fría, Mediático, Tímido, Solidario) y se pierde el opuesto.
    Si la tendencia vuelve por debajo de la mitad del umbral, se pierde el rasgo, **salvo los elegidos en la
    creación**, que solo pueden perderse al ganar su opuesto.
73. **Qué mueve las tendencias**: 47 opciones de eventos existentes, 20 eventos nuevos de personalidad y el
    mercado (aceptar un traspaso −6 de lealtad, renovar +8, rechazar a un club más grande +5, pedir el
    traspaso −12 de lealtad y +6 de rebeldía).
74. **Consecuencias de las relaciones rotas** (se revisan tras cada vuelta): entrenador ≤ −50 → baja un
    escalón de rol (una vez por temporada); directiva ≤ −50 → lista de transferibles (llegan ofertas);
    vestuario ≤ −40 → −8 de moral; afición ≤ −50 → −5 de reputación local; familia ≤ −30 → −5 de moral.
75. **Deriva anual**: las relaciones (salvo la familia) vuelven un 10 % hacia 0, las tendencias un 5 % y la
    opinión en redes un 30 %, para que el pasado pese pero no condene para siempre.
76. **Reacciones del entorno**: tras cada vuelta llegan 1-2 mensajes de afición, prensa, redes, entrenador,
    compañeros, directiva o familia, elegidos entre 34 plantillas según rendimiento, relaciones, rasgos y
    situación (`src/data/reactions.ts`). Cada una mueve la opinión en redes (±6).
77. **Pestaña Personalidad** en el hub: rasgos con intensidad y origen, tendencias como barras de dos polos,
    relaciones, seguidores, opinión en redes y últimas reacciones.
78. **Eventos**: 79 en total tras este bloque (17 de cantera, 25 de carrera, 17 fuera del campo y 20 de
    personalidad).

## Fase 7

79. **Gráficas propias en SVG** (`src/ui/charts/Charts.tsx`), sin librerías: línea, columnas agrupadas,
    radar y cifras destacadas. Mantiene el paquete pequeño y el estilo coherente con el juego.
80. **Guía de visualización aplicada**: líneas de 2 px, columnas de ≤24 px con 4 px redondeados arriba y
    2 px de separación, rejilla fina y recesiva, punto final con anillo del color de fondo, etiqueta solo en el
    último valor o en el máximo, leyenda solo con dos o más series, tooltip al pasar el ratón y **vista de
    tabla** en cada gráfica. Un solo eje por gráfica (el valor de mercado va en una gráfica aparte).
81. **Paleta de series** (azul #3987e5, naranja #d95926) validada con el script de la guía en modo oscuro
    sobre el fondo del juego (#141c25): pasa luminosidad, croma, separación para daltonismo
    (ΔE 26,8), separación normal (31,8) y contraste ≥3:1. El texto nunca usa el color de la serie.
82. **Pestaña Estadísticas**: cifras de carrera (partidos, goles, asistencias, nota, media y valor máximos,
    traspaso récord, hat-tricks), notas partido a partido de la temporada en curso, evolución de la media
    (desde el inicio de la carrera), goles y asistencias por temporada, valor de mercado, perfil de
    atributos en radar (ahora frente al inicio de la carrera) y resumen por clubes.
83. **Datos guardados por temporada**: atributos, reputación y seguidores al cerrar cada temporada, y los
    atributos iniciales de la carrera. Las partidas creadas antes de esta fase no tienen el radar
    (les faltan los atributos iniciales); el resto de gráficas funciona.
84. **Estadísticas de primer equipo**: los totales de carrera excluyen juveniles/filial (que siguen visibles
    en la pestaña Carrera).

## Fase 8

85. **Copas nacionales** (Copa del Rey, FA Cup, Copa Argentina, Copa do Brasil): todos los clubes del país
    en el juego salvo los filiales, ronda previa para dejar una potencia de 2 y eliminatorias a partido único
    en casa del más modesto, con penaltis si hay empate. Hasta octavos se juega en la 1.ª vuelta; de cuartos
    a la final, en la 2.ª. La Copa de la Liga inglesa y las supercopas no se juegan.
86. **Competiciones continentales**: se clasifican los primeros de cada primera división (España e
    Inglaterra: 1-4 Champions, 5-6 Europa League, 7.º Conference; Argentina 1-5 y Brasil 1-6 Libertadores,
    los siguientes Sudamericana). En la primera temporada, por prestigio. Formato: fase de liga de 6
    partidos (1.ª vuelta), playoff si hace falta y eliminatorias a partido único hasta la final (2.ª vuelta).
87. **Rivales de ligas que aún no están en el juego** se describen de forma genérica («el campeón de
    Italia», «el subcampeón de Alemania») para no inventar clubes. Cuando lleguen esas ligas (lotes 2b-2d)
    serán clubes reales.
88. **Selecciones** (55 con su fuerza en `src/data/international.ts`): tras cada vuelta hay ventana
    internacional. La convocatoria depende de la media frente al nivel de cada categoría (absoluta, sub-21,
    sub-20, sub-17), la reputación nacional, la forma y las lesiones. Dos partidos por ventana.
89. **Doble nacionalidad**: puede jugar las categorías inferiores con su primera nacionalidad; antes de la
    primera convocatoria absoluta debe elegir selección (decisión definitiva, bloquea el avance).
90. **Torneos de verano** (Mundial desde 2030, Eurocopa y Copa América desde 2028, cada 4 años), jugados al
    cerrar la temporada anterior: clasificación por fuerza con algo de azar (Mundial con plazas por
    confederación; Copa América con todas las sudamericanas e invitadas de CONCACAF y Asia), grupos de 4 y
    eliminatorias. Va convocado si ha jugado con la absoluta esa temporada o tiene 5 o más
    internacionalidades y no está lesionado.
91. **Estrellas rivales ficticias** (1-3 por club grande de primera): evolucionan cada año y se renuevan al
    retirarse. Compiten con el jugador por los premios.
92. **Premios**: Balón de Oro (puestos 1-30), mejor jugador joven del mundo (≤21) y, en cada primera
    división, máximo goleador, mejor jugador y mejor joven. Puntuación según media, nota, goles,
    asistencias, títulos y prestigio del club; el Balón de Oro y el premio al mejor joven dan ventaja a
    LaLiga y la Premier (escaparate mundial) y penalizan las ligas sudamericanas y las categorías inferiores.
93. **Palmarés**: títulos (liga de cualquier división, copa, continental, torneos de selección), premios,
    historial con la selección y últimos ganadores del Balón de Oro.
94. **Partidos con la selección**: no cuentan en las estadísticas de club; se guardan aparte por temporada.
95. **Eventos**: 87 tras añadir 8 de selección, noches continentales, copa y gala de premios.

## Fase 9

96. **`<Cinematic type data />`** (`src/ui/cinematics/Cinematic.tsx`): escenas a pantalla completa con Framer
    Motion para 13 momentos: debut, primer gol, hat-trick, presentación tras un fichaje, cesión, título,
    torneo de selecciones, premio, debut internacional, ascenso, descenso, lesión grave y momentos de eventos.
    Copa dorada y balón dorado en SVG, confeti, flashes de cámara en las presentaciones y lluvia en los
    malos momentos. Sin imágenes externas.
97. **El motor solo encola** (`game.cinematics`, máximo 6) con sus datos; la interfaz decide cómo se ven. Cada
    una se marca como importante o menor. El ajuste «Cinemáticas» de Opciones elige todas, solo las
    importantes o ninguna; las que no se van a ver se descartan solas para no bloquear nada.
98. **Orden en pantalla**: primero las cinemáticas, después el resumen de temporada y por último las
    decisiones pendientes. Se cierran solas (5,2 s las importantes, 3,8 s las menores) o con clic, Intro,
    Espacio o Escape. Con «Reducir animaciones» se muestran como tarjeta estática y duran algo más.
99. **Celebraciones**: 10 en `src/data/celebrations.ts`. Puño al aire y De rodillas desde el principio; el
    resto se desbloquean con eventos (corazón, avión, silencio, cielo, besar el escudo, chupete, voltereta,
    baile). Se elige en la pestaña Personalidad y se ve en las cinemáticas de gol, cada una con su
    animación del avatar. No se usan celebraciones características de futbolistas reales.

## Fase 10

100. **44 logros** (`src/data/achievements.ts`): 11 de bronce, 12 de plata, 11 de oro, 7 de leyenda y 3 ocultos.
     Son datos declarativos con los mismos requisitos que los eventos, más tres nuevos: estadística de
     carrera, número de títulos (por tipo o competición) y veces en el podio de un premio. Se comprueban tras
     cada vuelta, al cerrar la temporada y al retirarse. Los que tienen métrica muestran una barra de
     progreso. Los de oro y leyenda tienen cinemática.
101. **Retirada**: sí o sí tras la temporada de los 40 años; por decisión propia desde los 30, al final de una
     temporada (botón «Retirarme» con confirmación); por el evento de veteranía («retirarte al final de esta
     temporada» o anunciar la temporada de despedida, que retira al terminar la siguiente). Al retirarse se
     cierran las etapas, se evalúan los logros, se lanza la cinemática y la carrera ya no avanza.
102. **Puntuación de legado**: goles y asistencias, partidos, títulos (Mundial 90, otro torneo de selecciones 55,
     Champions/Libertadores 45, otra continental 20, liga de primera 25, liga inferior 8, copa 12), premios
     (Balón de Oro 100, podio 30, top 10 10, mejor joven 20, premios de liga 10), selección, pico de media por
     encima de 70 y logros. Rango: Leyenda mundial (≥1600), Mito del fútbol (≥1000), Estrella (≥600), Gran
     profesional (≥320), Jugador de club (≥140) y Una carrera honrada.
103. **Resumen final** (pantalla propia): relato generado solo a partir de los datos de la carrera (origen,
     debut, cifras, títulos, selección, Balones de Oro y retirada), cifras, trayectoria por clubes, títulos,
     hasta 8 decisiones clave, logros y desglose del legado.
104. **Exportar**: imagen PNG con `html-to-image` (única dependencia nueva) y PDF con la impresión del
     navegador («Guardar como PDF»), con una hoja de estilos de impresión que deja solo el resumen.
105. **Salón de la Fama**: cada carrera retirada se añade al autoguardarse (una entrada por partida) y se
     ordena por legado, con los escudos de sus clubes. Cargar una partida retirada abre su resumen final.

## Fase 11

106. **152 eventos** en total: 22 de día de partido y entrenamiento, 20 de mercado, contratos y agentes, y 23 de
     vida personal, medios, lesiones y final de carrera, que se suman a los 87 anteriores. Todos pasan el
     validador de datos.
107. **Prueba de balance** (`npm run balance`): simula 16 carreras completas con 8 perfiles (clubes de los cuatro
     países, todas las líneas, portero incluido) y comprueba que todas terminan en retirada, que el pico de
     media se acerca al potencial, que los Balones de Oro son escasos y que la duración estimada está entre 20
     y 75 minutos. Resultado típico: 20-23 temporadas, unas 5,5 decisiones por temporada y 30-45 minutos de
     juego.
108. **Retirada natural**: desde los 36 años hay una probabilidad creciente de que el cuerpo diga basta (25 %
     por año por encima de 35, más si el nivel ha caído mucho). Sin esto, casi todas las carreras llegaban a
     los 40.
109. **Un traspaso por temporada como máximo**: tras fichar o salir cedido no llegan ofertas de traspaso ni
     cesión hasta cumplir una temporada (salvo que pida salir). Antes un jugador podía cambiar de club en
     cada mercado.
110. **Rendimiento**: las pantallas se cargan de forma diferida y el código se separa en trozos cacheables
     (React, librerías, datos, motor y cada pantalla). El trozo más grande pesa 275 KB (72 KB comprimido)
     y el build ya no da avisos.
111. **Versión publicable**: `base: './'` en Vite. La carpeta `dist/` funciona en cualquier hosting estático
     o subcarpeta. Al abrir `index.html` directamente desde el disco no funciona, porque los navegadores
     bloquean los módulos en `file://`.
112. **Pulido**: «Cómo se juega» en el menú principal, metadatos de la página y versión 1.0.0. Revisadas las
     nueve pestañas del hub, el resumen final y el asistente a 375 px de ancho, sin desbordamientos. Las
     partidas de la Fase 1 se pueden seguir jugando: el motor les asigna cantera, mundo, celebraciones y
     clasificaciones continentales.
113. **Sonido**: no se ha añadido (era opcional). El juego funciona sin él y se puede incorporar con Howler.js
     en una iteración futura.

## Ampliación: ligas de Europa, Sudamérica y Asia

114. **Once países nuevos, 250 clubes** (546 en total, en 15 países). Con dos divisiones: Italia (Serie A y B),
     Alemania (Bundesliga y 2. Bundesliga) y Francia (Ligue 1 y 2). Solo con primera división: Portugal,
     Países Bajos, Uruguay, Colombia, Chile, Japón (J1), Corea del Sur (K League 1) y Arabia Saudí (Saudi Pro
     League). Composición de 2025-26 en Europa y Arabia Saudí; de 2026 (2026-27 en Japón) en el resto.
115. **Ligas de una sola división**: no tienen ascensos ni descensos, porque su segunda categoría no está en el
     juego. Las segundas divisiones nuevas tampoco tienen descensos.
116. **Formatos simplificados**: los torneos cortos (Apertura y Clausura) y las fases finales de Uruguay,
     Colombia y Corea se juegan como una liga a doble vuelta. Los playoffs de permanencia entre primera y
     segunda (Alemania, Francia) pasan a ser un descenso directo más y un playoff de ascenso.
117. **Japón con calendario europeo**: la J1 pasa a jugar de agosto a mayo desde 2026-27, y así se modela.
     Uruguay, Colombia, Chile y Corea usan temporadas anuales, como Argentina y Brasil.
118. **Corea sin el Gimcheon Sangmu**: es el equipo del ejército y no puede fichar, así que su plaza la ocupa el
     Suwon FC.
119. **Plazas continentales en los datos**: cada liga declara en su JSON (`continental`) qué puestos van a cada
     competición; el motor ya no tiene una tabla por país. Champions: 4 plazas para España, Inglaterra, Italia y
     Alemania; 3 para Francia; 2 para Portugal y Países Bajos. Libertadores: 5 para Argentina, 6 para Brasil y 4
     para Uruguay, Colombia y Chile. AFC Champions League Elite: 3 para Japón, Corea y Arabia Saudí, y el
     cuarto va a la AFC Champions League Two.
120. **Competiciones asiáticas**: AFC Champions League Elite y Two, con el mismo formato que las demás (fase de
     liga y eliminatorias). Las eliminatorias asiáticas son algo más flojas que las sudamericanas.
121. **Rivales genéricos**: Italia, Alemania, Francia, Portugal, Países Bajos, Uruguay, Colombia y Chile ya no
     aparecen como «el campeón de…», porque sus clubes son reales. Siguen siendo genéricos Turquía, Bélgica,
     Escocia, Ecuador, Paraguay, Catar, Emiratos, Irán, China, Australia, etc.
122. **Copa de cada país**: la primera copa de su lista que sea de tipo «copa» (Coppa Italia, DFB-Pokal, Copa de
     Francia, Copa del Emperador, Copa del Rey de Campeones...). Las supercopas solo figuran en los datos.
123. **Balón de Oro**: el escaparate favorece a España e Inglaterra (+4), luego Italia y Alemania (+3) y Francia
     (+2). Portugal y Países Bajos restan 3; el resto de Europa, 5; Sudamérica, 7; Asia, 9.
124. **Nombres ficticios en el idioma del país** del club: italiano, alemán, francés, neerlandés, japonés,
     coreano y árabe, además de español, inglés y portugués.
125. **Canteras**: un uruguayo, colombiano, chileno, japonés, coreano o saudí prueba en su país. Un austriaco
     prueba en Alemania o Italia, que son sus vecinos con liga.
126. **Partidas guardadas antes de la ampliación**: los clubes nuevos se incorporan al empezar la siguiente
     temporada (nunca a mitad, para no descuadrar las tablas), con sus estrellas rivales.
127. **Escudos**: los 250 clubes nuevos tienen escudo de Wikipedia. Se corrigieron el filtro que descartaba los
     escudos con «Stade» en el nombre (Rennes, Reims, Laval) y el de la Universidad de Concepción, que traía el
     emblema de la universidad.
128. **Pantalla de clubes**: con 15 países, el selector de país pasa a ser una lista desplegable agrupada por
     continente.

## Segunda ampliación: más países y divisiones inferiores

129. **1011 clubes en 25 países con liga** (51 divisiones). Se añaden 465 clubes:
     - **Segundas divisiones** de Portugal, Países Bajos, Uruguay, Colombia, Chile, Japón, Corea del Sur y Arabia Saudí.
     - **Terceras divisiones** de las grandes ligas de cada continente que no la tenían: Serie C (Italia, en tres
       grupos de 20), 3. Liga (Alemania), Championnat National (Francia) y J3 (Japón). España, Inglaterra,
       Argentina y Brasil ya tenían tercera.
     - **Países nuevos**: Turquía, Bélgica y Escocia (con dos divisiones); Ecuador, Paraguay, Perú, México, Estados
       Unidos, Catar y Emiratos Árabes Unidos (solo primera).
130. **Ligas cerradas**: la Liga MX no tiene ascensos ni descensos desde 2020 y la MLS nunca los ha tenido, así que
     solo tienen primera división. Por eso Norteamérica no tiene tercera división en el juego.
131. **MLS**: incluye sus tres clubes canadienses (Toronto, Montreal y Vancouver), que figuran con su provincia
     dentro de los datos de Estados Unidos, como el Mónaco en Francia. Se juega a una vuelta (29 jornadas).
132. **Concachampions** (Copa de Campeones de la Concacaf): seis plazas para México y seis para la MLS, con
     rivales genéricos de Costa Rica, Honduras, Panamá, Guatemala, Canadá y Jamaica.
133. **Filiales nuevos**: Inter U23, Juventus Next Gen y Atalanta U23 (Serie C); Hoffenheim II y Stuttgart II
     (3. Liga); Benfica B, Porto B y Sporting B (Liga Portugal 2); Jong Ajax, Jong PSV, Jong AZ y Jong Utrecht
     (Eerste Divisie); Club NXT, Jong Genk y RSCA Futures (Challenger Pro League). No pueden subir a la
     división de su primer equipo.
134. **Ascensos y descensos simplificados**: donde hay playoffs de promoción entre divisiones, bajan tantos como
     suben (un descenso directo más por el playoff). Los descensos por promedios (Uruguay, Colombia) pasan a ser
     por la tabla del año. Las divisiones más bajas del juego no tienen descensos.
135. **Estrellas rivales en todas las ligas**: los dos clubes más fuertes de cada primera división tienen al menos
     una estrella ficticia, aunque su prestigio sea modesto (MLS, Perú...). Así siempre hay candidatos a los
     premios de la liga.
136. **Ofertas del extranjero equilibradas**: con 25 países, las ofertas del extranjero eran el 75-90 % del total.
     Ahora su peso conjunto equivale al de tres países extranjeros (como cuando solo había cuatro ligas), y las
     ofertas nacionales vuelven a ser aproximadamente la mitad.
137. **Rivales genéricos**: dejan de serlo Turquía, Bélgica, Escocia, Ecuador, Paraguay, Perú, Catar y Emiratos.
     Se añaden Austria, Grecia, Polonia, Suecia o Hungría (UEFA), Bolivia y Venezuela (CONMEBOL), e Irán, China,
     Australia, Tailandia, Uzbekistán y Malasia (AFC).
138. **Nombres en turco** para los clubes de Turquía; Catar y Emiratos usan la lista árabe y Bélgica la neerlandesa.
139. **Rendimiento**: los datos de los 1011 clubes ocupan un trozo de 571 KB (132 KB comprimido) que el navegador
     cachea. El límite de aviso del build sube a 1000 KB.
140. **Escudos**: 981 de los 1011 clubes tienen escudo de Wikipedia (10 filiales usan el de su primer equipo). Los 30 restantes, casi todos de divisiones inferiores, usan el escudo genérico porque Wikipedia limitó las búsquedas; `npm run crests` los vuelve a intentar. Se corrigió el del Francs Borains, que traía el del RFC Seraing. Los escudos ocupan unos 34 MB en `public/crests`.

141. **Potencial independiente del club y del país**: el potencial oculto ya dependía solo de la semilla, pero los
     minutos jugados multiplicaban el crecimiento entre ×0,8 y ×1,2, y eso castigaba a los jugadores de clubes
     pequeños o con poca rotación. Ahora el efecto es mínimo (×0,95 a ×1,05). Un test compara la misma semilla en el
     Barcelona y en el Villa Dálmine: la media a los 22 años difiere como mucho 3 puntos.
142. **279 eventos** (ampliados después a 344, ver 147): 127 nuevos en `pitch.ts` (campo, entrenamiento, vestuario, lesiones) y `world.ts` (prensa,
     redes, vida personal, mercado, selección, ética y retirada). La pareja pasa a ser una marca (`partner`) que activan
     la boda y el nuevo evento «Alguien especial», y de la que dependen otros eventos (hijo, mudanza).
143. **Versión web publicada**: una página publicada no admite cientos de archivos sueltos, así que `npm run build:web`
     empaqueta los 971 escudos en un único `crests-pack.json` (WebP de 128 px). La versión normal sigue usando los PNG.

144. **Medias más altas, más fácil** (petición del usuario): potencial medio 79 (antes 76, rango 60-97), media
     inicial algo más alta, crecimiento anual un 25-30 % más rápido y objetivos de los atributos más altos (clave:
     potencial + 5; secundarios: potencial − 3). Ahora la media máxima suele igualar el potencial en lugar de quedarse
     3-5 puntos por debajo. El declive desde los 30 no cambia.

145. **Rasgos equilibrados y todos elegibles**: los 22 rasgos se pueden elegir al crear el personaje. Cada uno tiene el
     mismo «presupuesto»: unos +35-40 % de crecimiento en 2-3 atributos de su temática (un +1 % general cuenta como
     +10 % en un atributo), un efecto pasivo favorable y un pequeño inconveniente, y +6 puntos iniciales repartidos.
     «Acomodado» pasa a «Despreocupado» y «Frágil» a «Ligero y explosivo», con ventajas propias. La moral pasiva de
     los rasgos, que no se aplicaba, ahora suma al cerrar la temporada. Un test vigila el equilibrio.
146. **Estadísticas de detalle**: cada partido genera regates completados, pases clave (incluyen las asistencias),
     entradas ganadas y, para porteros, paradas. Salen de una tasa por posición multiplicada por la calidad del jugador
     frente al nivel del partido. Solo la parte que se sale de lo normal mueve la nota, para no inflarla. Las porterías a
     cero ya existían. Las partidas anteriores a la v1.3 tienen estas cifras a 0 en las temporadas ya jugadas.
147. **344 eventos**: 65 más en `choices.ts` (cantera, porteros, defensas, centrocampistas, delanteros, táctica,
     cesiones, derbis, contrato, selección) con cadenas de dos pasos (la promesa al abuelo, el mentor, la apuesta).

148. **Especialidades** (v1.4): 36 rasgos de juego ligados a los atributos (`src/data/specialties.ts`), en 7 grupos:
     tiro, pase, regate (con 6 regates característicos: ruleta, sombrerito, elástica, bicicleta, caño y rabona),
     físico, defensa, mental y portería. Se consiguen solas al llegar a los umbrales de sus atributos; el nivel élite
     pide 14 puntos más en cada uno. Se pierden si un atributo baja 3 puntos del umbral, para que el declive de la
     edad se note sin que aparezcan y desaparezcan cada año. El estilo de juego afín rebaja los umbrales 4 puntos y
     los rasgos afines 3. Cada especialidad da un bonus en los partidos (más goles, asistencias, regates, pases
     clave, entradas o paradas, o nota). El jugador puede «entrenar» una: sus atributos crecen un 15 % más rápido.
     Los regates característicos salen a veces en las noticias de la jornada. En pruebas, un jugador medio tiene
     2-4 especialidades a los 21 años y 4-7 en su mejor momento; las élite llegan a partir de los 23-25 años.

149. **iPhone y iPad** (v1.5): (1) «Código de partida»: el guardado comprimido (lz-string) como texto para copiar y
     pegar; funciona donde no se pueden descargar archivos (página publicada, iOS) y para pasar la partida entre
     dispositivos. La importación acepta el código aunque se cuelen espacios o saltos de línea. (2) Exportar abre el
     menú de compartir del sistema en pantallas táctiles («Guardar en Archivos»); si no se puede, descarga normal.
     (3) La imagen del resumen final se comparte o, si no, se muestra para guardarla manteniéndola pulsada.
     (4) `mobile.css`: zonas seguras (muesca, isla dinámica y barra de inicio), alturas `dvh` para la barra de
     Safari, campos de 16 px para que Safari no haga zoom, sin retardo de doble toque, botones de 44 px.
     (5) Icono, manifiesto y etiquetas de Apple para «Añadir a pantalla de inicio» (pantalla completa, como una app).
     En la Partida se avisa de que Safari puede borrar los datos de las webs que no se usan en unos días.

150. **GitHub Pages**: el juego se publica con GitHub Actions en cada subida a `main` (tests, compilación y despliegue
     de `dist`). Se usa la compilación normal, con los escudos en PNG sueltos (34 MB, muy por debajo del límite de
     Pages). Las rutas relativas (`base: './'`) hacen que funcione en la subcarpeta `/leyenda-futbolista/`.

## Pendiente de revisión

Marcado con `needsReview: true` en los JSON. El juego funciona igual; son datos que no he podido
confirmar con certeza. Lo más dudoso es la composición de las terceras categorías.

- **Primera Federación** (ESP, 2025-26): reparto de clubes entre los grupos 1 y 2 por confirmar.
  Datos de club por confirmar: Guadalajara, Ourense CF, Mérida, Cacereño, Ibiza, Torremolinos, Teruel, Europa, Sant Andreu.
- **LaLiga Hypermotion**: colores del FC Andorra.
- **Primera Nacional** (ARG, 2025): lista de los 36 equipos por confirmar (algunos pueden estar en Primera B o el Federal A).
  Datos de club por confirmar: Agropecuario, Almagro, Chaco For Ever, Colegiales, Deportivo Maipú, Deportivo Madryn,
  Estudiantes (RC), Gimnasia y Tiro, Güemes, Racing (C), San Telmo, Talleres (RE), Tristán Suárez, Central Norte, Ciudad de Bolívar.
- **Primera B Metropolitana** (ARG, 2025): composición y estadios de los 20 equipos por confirmar.
- **Série B** (BRA): estadio del Athletic (MG) y colores del Botafogo-SP.
- **Série C** (BRA, 2025): composición por confirmar. Datos de club por confirmar: Brusque, Floresta, Itabaiana,
  Maringá, Retrô, Tombense, Anápolis.
- **Primera División de Uruguay, Liga BetPlay (COL), Liga de Primera (CHI), J1 League y K League 1** (2026):
  composición por confirmar (ascensos y descensos de la temporada 2025).
- **Ligue 2** (FRA, 2025-26): composición por confirmar.
- **Divisiones inferiores nuevas** (composición por confirmar, sobre todo ascensos y descensos de la temporada
  anterior): Serie C, 3. Liga, Championnat National, Liga Portugal 2, Eerste Divisie, Segunda de Uruguay, Torneo
  BetPlay, Primera B de Chile, J2, J3, K League 2, First Division League saudí, 1. Lig turca y Challenger Pro League.
- **Ecuador, Paraguay, Perú, Catar y Emiratos** (primera división): composición por confirmar.
- **Mazatlán FC** (MEX): su plaza puede pasar al Atlante en 2026-27.
- **Saudi Pro League**: estadios y aforos de los clubes medianos y pequeños por confirmar.
- **Prestigio, presupuesto y cantera** de los clubes nuevos: estimaciones mías en la escala del juego.
- **Aforos**: son aproximados en todos los países (redondeados a la cifra oficial más reciente que conozco).

