import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { extractJson, sampleClaudePrompts } from '../src/deep-grade';

describe('extractJson', () => {
  it('parses clean JSON', () => {
    expect(extractJson('{"signalClarity": 60}')).toEqual({ signalClarity: 60 });
  });
  it('strips <think> tags (reasoning models)', () => {
    expect(extractJson('<think>hmm let me decide</think>\n{"decisionWeight": 40}')).toEqual({
      decisionWeight: 40,
    });
  });
  it('extracts JSON embedded in prose', () => {
    expect(extractJson('Sure, here is the grade: {"signalClarity": 71} — done')).toEqual({
      signalClarity: 71,
    });
  });
  it('returns null on no/invalid JSON', () => {
    expect(extractJson('no json here')).toBeNull();
    expect(extractJson('{not valid}')).toBeNull();
  });
});

describe('sampleClaudePrompts', () => {
  const dir = path.join(os.tmpdir(), `th-deep-${process.pid}`);
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  const j = (o: unknown) => JSON.stringify(o);
  const userMsg = (text: string) => j({ type: 'user', message: { role: 'user', content: text } });

  it('keeps only substantive instruction prompts, spread across projects', () => {
    for (const proj of ['proj-a', 'proj-b']) {
      const p = path.join(dir, proj);
      fs.mkdirSync(p, { recursive: true });
      fs.writeFileSync(
        path.join(p, 's.jsonl'),
        [
          userMsg(`fix the failing auth test in ${proj} and add a regression case for the edge`),
          userMsg('ok'), // too short → skipped
          userMsg(
            'Story: Demon Slayer world ingest payload that is long enough but not an instruction really'
          ), // payload → skipped
          userMsg('/clear'), // slash command → skipped
          userMsg(`refactor the ${proj} ingest pipeline to stream instead of buffering everything`),
        ].join('\n')
      );
    }
    const { sample, projects } = sampleClaudePrompts(dir);
    expect(projects).toBe(2);
    // 2 instruction prompts per project survive the filter
    expect(sample.length).toBeGreaterThanOrEqual(2);
    expect(sample.every((p) => p.length >= 60)).toBe(true);
    expect(sample.some((p) => p.startsWith('Story:'))).toBe(false);
    expect(sample.some((p) => p === 'ok')).toBe(false);
  });

  it('returns nothing for an empty/absent dir', () => {
    expect(sampleClaudePrompts(path.join(dir, 'nope')).sample).toHaveLength(0);
  });
});
