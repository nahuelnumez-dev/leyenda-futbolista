import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT } from '@/data';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from '../player/defaults';
import { chooseOption } from '../events/engine';
import { templateVars } from '../events/context';
import { applyTendencyTraits, reactions, relationConsequences, seedTendencies, seasonDrift } from './personality';

const C = ENGINE_CONTENT;

function game(traits: string[] = ['profesional', 'leal']) {
  return createNewGame({
    seed: 'personalidad',
    createdAt: '2026-11-19T10:00:00.000Z',
    name: 'Leo Arrieta',
    character: {
      name: 'Leo Arrieta', birthDay: 5, birthMonth: 5, birthPlace: { country: 'ARG', region: 'Santa Fe', city: 'Rosario' }, nationalities: ['ARG'],
      foot: 'izquierdo', appearance: defaultAppearance(), mainPosition: 'MCO', secondaryPositions: [], style: 'enganche', traits, preferredNumber: 10,
    },
    content: { styles: C.styles, traits: C.traits, tendencies: C.tendencies },
    academy: { clubId: 'arg.newells', budgetM: 25, prestige: 66 },
  });
}

describe('tendencias', () => {
  it('los rasgos iniciales fijan las tendencias', () => {
    const g = game(['profesional', 'leal']);
    expect(g.player.tendencies['profesionalidad']).toBe(30);
    expect(g.player.tendencies['lealtad']).toBe(30);
  });

  it('cruzar el umbral da el rasgo y bajar de la mitad lo quita', () => {
    const g = game(['creativo', 'competitivo']);
    g.player.tendencies['ego'] = 45;
    let changes = applyTendencyTraits(g, C);
    expect(g.player.traits.some((t) => t.id === 'divo')).toBe(true);
    expect(changes.some((c) => c.key === 'effects.traitAdd' && c.value === 'divo')).toBe(true);
    g.player.tendencies['ego'] = 10;
    changes = applyTendencyTraits(g, C);
    expect(g.player.traits.some((t) => t.id === 'divo')).toBe(false);
  });

  it('no quita los rasgos elegidos al crear el personaje', () => {
    const g = game(['profesional', 'leal']);
    g.player.tendencies['profesionalidad'] = 0;
    applyTendencyTraits(g, C);
    expect(g.player.traits.some((t) => t.id === 'profesional')).toBe(true);
  });

  it('ganar un rasgo quita su opuesto', () => {
    const g = game(['profesional', 'leal']);
    g.player.tendencies['profesionalidad'] = -60;
    applyTendencyTraits(g, C);
    expect(g.player.traits.some((t) => t.id === 'fiestero')).toBe(true);
    expect(g.player.traits.some((t) => t.id === 'profesional')).toBe(false);
  });

  it('una decisión puede cambiar la personalidad', () => {
    const g = game(['creativo', 'competitivo']);
    g.player.tendencies['temperamento'] = 35;
    g.activeEvent = { eventId: 'pro-sustitucion-enfado', vars: templateVars(g, C) };
    const out = chooseOption(g, 'patada', C);
    expect(out.player.tendencies['temperamento']).toBe(47);
    expect(out.player.traits.some((t) => t.id === 'temperamental')).toBe(true);
    expect(out.lastOutcome?.changes.some((c) => c.key === 'effects.traitAdd')).toBe(true);
  });
});

describe('relaciones y reacciones', () => {
  it('una relación rota con el entrenador baja el rol una vez por temporada', () => {
    const g = game();
    g.player.contract!.role = 'titular';
    g.player.relations.coach = -60;
    expect(relationConsequences(g).length).toBeGreaterThan(0);
    expect(g.player.contract!.role).toBe('rotacion');
    relationConsequences(g);
    expect(g.player.contract!.role).toBe('rotacion');
  });

  it('la directiva enfadada pone al jugador en el mercado', () => {
    const g = game();
    g.player.relations.board = -60;
    relationConsequences(g);
    expect(g.flags['transferRequest']).toBe(true);
  });

  it('las relaciones y tendencias se suavizan cada temporada', () => {
    const g = game();
    g.player.relations.coach = 50;
    g.player.relations.family = 50;
    g.player.tendencies['ego'] = 40;
    seasonDrift(g);
    expect(g.player.relations.coach).toBe(45);
    expect(g.player.relations.family).toBe(50);
    expect(g.player.tendencies['ego']).toBe(38);
  });

  it('las reacciones llegan al buzón con las variables rellenas', () => {
    const g = game();
    g.player.relations.fans = 60;
    reactions(g, C, Rng.fromSeed('r'), 3);
    expect(g.inbox.length).toBeGreaterThan(0);
    for (const n of g.inbox) expect(n.headline).not.toMatch(/\{\w+\}/);
  });

  it('seedTendencies es acumulable y acotado', () => {
    const g = game();
    g.player.tendencies['lealtad'] = 90;
    seedTendencies(g, C.tendencies);
    expect(g.player.tendencies['lealtad']).toBe(100);
  });
});
