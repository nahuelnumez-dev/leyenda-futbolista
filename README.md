# Leyenda: Carrera de Futbolista

Juego web de decisiones en el que vives la carrera de un futbolista desde la cantera hasta la retirada.
Clubes, ligas, ciudades y estadios reales; jugadores, entrenadores y periodistas ficticios.

> **Versión 1.3.0: las 11 fases están completadas y las ligas ampliadas.** 1011 clubes reales de 25 países:
> Europa (España, Inglaterra, Italia, Alemania, Francia, Portugal, Países Bajos, Turquía, Bélgica y Escocia),
> Sudamérica (Argentina, Brasil, Uruguay, Colombia, Chile, Ecuador, Paraguay y Perú), Norteamérica (México y
> Estados Unidos) y Asia (Japón, Corea del Sur, Arabia Saudí, Catar y Emiratos). Hasta tres divisiones por país. 279 eventos, 44 logros, copas, competiciones continentales, selecciones, premios,
> cinemáticas, estadísticas, resumen final exportable y Salón de la Fama.
> Las decisiones de diseño están en [DECISIONES.md](DECISIONES.md).

## Cómo se juega

1. **Nueva carrera**: elige origen, aspecto, posición, estilo y dos rasgos, y haz una prueba en una cantera real.
2. **Avanza** la temporada con el botón grande del hub (pretemporada, primera vuelta, mercado de invierno, segunda vuelta y
   fin de temporada). Todas las ligas se simulan partido a partido.
3. **Decide**: entre fases te llegan situaciones. Lo que eliges cambia tus relaciones, tu personalidad y tu carrera.
4. **Gestiona** las ofertas de traspaso, cesión y renovación en los mercados.
5. **Consulta** las pestañas del hub: clasificación, estadísticas, carrera, palmarés, logros, atributos, personalidad
   y partida (guardar y exportar).
6. **Retírate** (desde los 30 años, o como muy tarde tras la temporada de los 40): verás el resumen final, que se exporta
   como imagen o PDF, y entrarás en el Salón de la Fama.

Una carrera completa (unas 20 temporadas) dura entre 30 y 60 minutos.

## Requisitos

- Node.js 20 o superior (probado con Node 26) y npm.

## Instalar y ejecutar

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # tests unitarios (Vitest)
npm run typecheck  # comprobación de tipos
npm run build      # versión de producción en dist/
npm run build:web  # versión para publicar como página única (escudos empaquetados, requiere Python con Pillow)
npm run validate:data  # comprueba los datos de ligas, clubes y países
npm run balance    # simula 16 carreras completas e imprime la tabla de balance
npm run crests     # descarga los escudos que falten desde Wikipedia (ver más abajo)
npm run preview    # sirve la versión de producción
```

## Estructura

```
src/
├─ engine/        Lógica pura del juego (sin React ni navegador). Testeable con Vitest.
│  ├─ types/        Modelos de datos: club, jugador, eventos, carrera, partida
│  ├─ rng.ts        Generador aleatorio con semilla (sfc32), serializable
│  ├─ player/       Atributos, media, creación del personaje y pruebas de cantera
│  ├─ data/         Cargador y validador de los datos de /src/data
│  ├─ season/       Calendario, partidos, clasificaciones, ascensos y fases de la temporada
│  ├─ events/       Motor de eventos: requisitos, efectos, sorteo y decisiones
│  ├─ market/       Ofertas, traspasos, cesiones y renovaciones
│  ├─ personality/  Tendencias, rasgos ganados, consecuencias y reacciones
│  ├─ stats/        Totales, series por temporada, perfil de atributos
│  ├─ competitions/ Copas, competiciones continentales, selecciones, torneos y premios
│  ├─ cinematics/   Cola de cinemáticas y celebraciones
│  ├─ legacy/       Logros, retirada, puntuación de legado
│  ├─ world/        Creación de la partida, temporadas y edades
│  └─ save/         Serialización, validación (zod) y migraciones de partidas
├─ data/          Datos del juego (ligas, clubes, eventos, rasgos, logros). Se amplía sin tocar código.
├─ persistence/   localStorage: ranuras comprimidas, ajustes, Salón de la Fama
├─ store/         Zustand: estado de la partida y de la interfaz
├─ i18n/          Textos de la interfaz (es.json) y función t()
└─ ui/            Pantallas, componentes, tema y (más adelante) avatar y cinemáticas
public/crests/    Escudos reales de los clubes (ver más abajo)
scripts/          fetch-crests.ts: descarga de escudos
```

**Regla de oro:** `src/engine` nunca importa de `ui`, `store` ni `persistence`, y no usa
`Math.random` (todo el azar pasa por `Rng`). Un test (`architecture.test.ts`) lo comprueba.

## Publicar el juego

```bash
npm run build      # genera dist/
npm run preview    # la sirve en local para comprobarla
```

`dist/` usa rutas relativas: súbela a cualquier hosting estático (Netlify, GitHub Pages, un servidor propio...)
o a una subcarpeta. No funciona abriendo `index.html` directamente desde el disco, porque los navegadores
bloquean los módulos en `file://`. Recuerda que los escudos son marcas de cada club (ver más abajo).

## Partidas guardadas

- 3 ranuras manuales + autoguardado, comprimidas con lz-string en `localStorage`.
- **Exportar**: descarga un `.json` legible. **Importar**: Cargar partida → Importar partida.
- Cada partida lleva una versión. Si cambia el formato, añade una migración en
  `src/engine/save/migrations.ts` y sube `GAME_STATE_VERSION` en `src/engine/types/game.ts`.
- **Semilla**: opcional al crear la carrera. El estado del generador se guarda en la partida, así que
  recargar no cambia lo que ya ocurrió.
- **Ironman**: la partida solo se autoguarda; no hay guardado manual.

## Escudos reales

Los escudos están en `public/crests/<pais>/<club>.png` y se listan en `src/data/crests-manifest.json`.
El juego solo muestra los que aparecen en ese archivo. Si falta alguno, dibuja un **escudo genérico**
con los colores y el patrón reales de la primera equipación (`liso`, `rayas`, `bandas`, `mitades`,
`franja`, `cuadros`, `aros`) y su abreviatura.

```bash
npm run crests                    # descarga los que falten
npm run crests -- --country=arg   # solo un país
npm run crests -- --force         # vuelve a descargarlos todos
npm run crests -- --dry-run       # muestra qué imagen usaría, sin descargar
```

El script busca la imagen principal del artículo de Wikipedia del club: primero en la inglesa, luego en la del
idioma del país y, si no, con una búsqueda. Si un club tiene un nombre oficial ambiguo, indica el artículo en su
JSON con `"crest": { "wiki": "en:Athletic Bilbao" }`. El informe `scripts/crests-report.json` dice qué
artículo e imagen se usó para cada club.

**Escudo propio**: copia el archivo en `public/crests/<pais>/` y añade la línea correspondiente al manifiesto,
o pon `"crest": { "file": "crests/esp/mi-escudo.png" }` en el club (tiene prioridad).

Los escudos son marcas de cada club. Úsalos solo para uso personal; para distribuir el juego
necesitarías licencias o eliminarlos (el juego funciona igual sin ellos).

## Añadir contenido

Las guías detalladas se completan en cada fase. Resumen:

### Nuevos clubes o ligas
1. Edita o crea `src/data/leagues/<pais>.json` siguiendo el tipo `CountryLeagueFile`
   (`src/engine/types/club.ts`). Si es un país nuevo, impórtalo en `src/data/index.ts` y pon
   `hasLeagues: true` en `src/data/countries.json`. Indica sus copas en `cups` (deben existir en
   `competitions.json`) y sus plazas continentales en `continental` (puestos de primera división).
2. Cada club necesita: `id` (`<pais>.<slug>`, único), `name` (oficial), `shortName`, `abbr` (2-4 letras,
   única en el país), `city`, `region` (debe existir en countries.json), `stadium`, `colors`,
   `prestige`/`academy` (1-100), `budgetM` (millones de €) y `style`. Opcionales: `rivals` (basta con
   escribirlas en uno de los dos clubes), `parentClubId` (filiales), `crest`, `needsReview`.
3. Reglas de división: `promotion` y `relegation` (por grupo si hay `groups`). Los que bajan de una
   división deben ser tantos como los que suben de la siguiente, y la más baja no tiene descensos.
4. Si no estás seguro de algo, pon `"needsReview": true` (en el club o en la división).
5. Ejecuta `npm run validate:data`: comprueba ids, regiones, rivales, grupos, filiales y el cuadre de
   ascensos y descensos. Después, `npm run crests` para su escudo.

### Estilos de juego, rasgos y avatar
- Estilos: `src/data/playStyles.ts` (posiciones a las que aplica y bonus de atributos).
- Rasgos: `src/data/traits.ts` (`selectableAtStart`, incompatibilidades, multiplicadores de crecimiento
  y efectos pasivos). En la creación se eligen `STARTING_TRAIT_COUNT` (2).
- Avatar: opciones en `src/data/avatar.ts`, dibujo en `src/ui/avatar/Avatar.tsx` y nombres en `es.json`
  (`avatar.*`).

### Cinemáticas y celebraciones
- Celebraciones en `src/data/celebrations.ts` (nombre, cómo se desbloquea, animación y símbolo). Se
  desbloquean con el efecto `{ type: 'unlockCelebration', id }`.
- Un evento puede lanzar una cinemática con `{ type: 'cinematic', template: 'mi-momento' }`. Para un tipo nuevo,
  añádelo a `CinematicType`, encólalo con `queueCinematic` y añade sus textos en `es.json` (`cinematics.*`).

### Selecciones, torneos y premios
- `src/data/international.ts`: selecciones (fuerza en la escala de los clubes), torneos (`firstYear`, `every`,
  confederaciones, número de equipos, plazas), rivales continentales genéricos y premios.
- Para añadir un torneo, añade su entrada en `TOURNAMENTS` y su nombre en `competitions.json`.

### Tendencias y reacciones
- Tendencias en `src/data/tendencies.ts`: polos, umbral y rasgos asociados (`positiveTrait`, `negativeTrait`).
  Los eventos las mueven con el efecto `{ type: 'tendency', id: 'ego', delta: 8 }` (atajo `tendency('ego', 8)`).
- Reacciones en `src/data/reactions.ts`: fuente, tono, peso, requisitos y texto con variables.

### Nuevos eventos
Los eventos son datos (`GameEvent` en `src/engine/types/events.ts`) en `src/data/events/*.ts`. Los atajos
de `helpers.ts` permiten escribirlos de forma compacta:

```ts
ev({
  id: 'pro-penalti', category: 'keyMatch', stages: PRO, phases: ['secondHalf'], weight: 30, cooldownSeasons: 2,
  requires: [{ type: 'positionGroup', in: ['forward', 'midfielder'] }],
  title: 'Penalti en el minuto 93',
  text: 'Empate a uno, minuto 93... Todo {estadio} mira hacia ti.',
  options: [
    opt('tirar', 'Coger el balón', [], { roll: roll(0.65, { text: 'Gol', effects: [rel('fans', 10)] }, { text: 'Fallo', effects: [morale(-10)] }, 'penalties') }),
    opt('ceder', 'Dárselo a un compañero', [rel('dressingRoom', 4)]),
  ],
})
```

- **Requisitos** (`Condition`): edad, media, atributo, reputación, relación, rasgo, flag, evento visto,
  posición, país, club, lesión, cesión, agente, probabilidad, `any`/`not`...
- **Efectos** (`Effect`): atributos, relaciones, reputación, moral, dinero, seguidores, rasgos, flags,
  lesiones, ofertas, petición de traspaso, noticias, programar otro evento, celebraciones, agente...
- **Variables de texto**: {nombre}, {apodo}, {club}, {ciudad}, {estadio}, {division}, {rival}, {entrenador},
  {companero}, {capitan}, {agente}, {periodista}, {ciudadNatal}, {pais}, {temporada}.
- Añade el evento a la lista de `src/data/events/index.ts` y ejecuta `npm test`.

### Nuevos logros
Definidos con `AchievementDef` en `src/data/achievements.ts`: nivel (`bronze`, `silver`, `gold`, `legend`),
requisitos (los mismos que los eventos, más `careerStat`, `trophyCount` y `awardCount`), `progress` opcional y
`hidden` para los ocultos. Los tests comprueban que los ids no se repitan.

### Traducciones
Textos de la interfaz en `src/i18n/es.json`. Para otro idioma, crea `en.json` con las mismas claves y
regístralo en `src/i18n/index.ts`. Los textos de contenido usan `LocalizedText` (`{ "es": "...", "en": "..." }`).

## Fases de desarrollo

| # | Contenido | Estado |
|---|---|---|
| 1 | Base, modelos de datos, guardado y carga, menú principal | ✅ |
| 2 | Ligas y clubes reales (España, Inglaterra, Argentina, Brasil) + escudos | ✅ |
| 3 | Creación del personaje con avatar y lógica de origen y cantera | ✅ |
| 4 | Motor de temporada: partidos, ligas, ascensos/descensos, evolución | ✅ |
| 5 | Motor de eventos y decisiones, primer bloque de eventos | ✅ |
| 6 | Personalidad, tendencias y reacciones | ✅ |
| 7 | Estadísticas y gráficas | ✅ |
| 8 | Selecciones, competiciones internacionales y premios | ✅ |
| 9 | Cinemáticas y celebraciones | ✅ |
| 10 | Logros, resumen final y Salón de la Fama | ✅ |
| 11 | Pulido, balance, más eventos, rendimiento | ✅ |
| + | Ligas de Europa, Sudamérica y Asia (11 países más) | ✅ |
| + | 10 países más, segundas y terceras divisiones, Concachampions | ✅ |
