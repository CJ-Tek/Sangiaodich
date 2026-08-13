import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * PostgREST truncates at `db-max-rows` silently, so an unbounded list query is
 * a correctness bug and not just a slow one. This scan keeps new ones from
 * landing: every `.select()` must either be bounded or name the small config
 * table it reads in full.
 */

const SCAN_ROOTS = ['app', 'lib', 'components'];

/** Tables whose row count is fixed by configuration, not by user growth. */
const CONFIG_TABLES = new Set([
  'platform_fee_settings',
  'subscription_plans',
  'sale_membership_tiers',
  'guest_membership_tiers',
]);

const BOUND_MARKERS = [
  '.single()',
  '.maybeSingle()',
  '.limit(',
  '.range(',
  'head: true',
];

const WRITE_MARKERS = ['.insert(', '.update(', '.delete(', '.upsert('];

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

type Unbounded = { file: string; table: string; line: number };

/**
 * Builder-style queries apply their bound in a later statement
 * (`query = query.range(...)`), so the declared name has to be followed too.
 */
function boundAppliedLater(source: string, prefix: string): boolean {
  const declarations = [...prefix.matchAll(/(?:const|let|var)\s+(\w+)\s*=/g)];
  const declared = declarations.at(-1);
  if (!declared) return false;

  // The bound may sit at the end of a chain further down (`q.order(...).limit(...)`),
  // so every later statement mentioning the name is inspected.
  const name = declared[1];
  const uses = source.matchAll(new RegExp(`\\b${name}\\b`, 'g'));
  for (const use of uses) {
    const end = source.indexOf(';', use.index);
    const statement = source.slice(use.index, end === -1 ? undefined : end);
    if (statement.includes('.from(')) continue;
    if (BOUND_MARKERS.some((marker) => statement.includes(marker))) return true;
  }
  return false;
}

function findUnboundedSelects(): Unbounded[] {
  const root = process.cwd();
  const found: Unbounded[] = [];

  for (const scanRoot of SCAN_ROOTS) {
    for (const file of collectSourceFiles(path.join(root, scanRoot))) {
      const source = readFileSync(file, 'utf8');
      const pattern = /\.from\(\s*['"]([a-z_]+)['"]\s*\)/g;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(source)) !== null) {
        const table = match[1];
        if (CONFIG_TABLES.has(table)) continue;

        const end = source.indexOf(';', match.index);
        const chunk = source.slice(match.index, end === -1 ? undefined : end);

        if (!chunk.includes('.select(')) continue;
        if (WRITE_MARKERS.some((marker) => chunk.includes(marker))) continue;
        if (BOUND_MARKERS.some((marker) => chunk.includes(marker))) continue;

        const statementStart = Math.max(
          source.lastIndexOf(';', match.index),
          source.lastIndexOf('{', match.index),
          source.lastIndexOf('}', match.index)
        );
        const prefix = source.slice(statementStart + 1, match.index);
        if (boundAppliedLater(source, prefix)) continue;

        found.push({
          file: path.relative(root, file).replace(/\\/g, '/'),
          table,
          line: source.slice(0, match.index).split('\n').length,
        });
      }
    }
  }

  return found;
}

describe('supabase query bounds', () => {
  it('has no select without limit, range or single-row accessor', () => {
    const unbounded = findUnboundedSelects();
    const report = unbounded
      .map((u) => `${u.file}:${u.line} → ${u.table}`)
      .join('\n');
    expect(report).toBe('');
  });
});
