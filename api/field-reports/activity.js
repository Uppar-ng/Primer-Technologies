// ============================================================
// GET /api/field-reports/activity
// Reads click activity from the second Google Sheet (gviz)
// and returns it as clean JSON.
// ============================================================

const SHEET_ID = '1dawpQ4Po9h37RZtwaP9EuxJ7U1lsD3wEdM8TsXOmZHc';
const SHEET_TAB = 'Sheet1';

function gvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  return `${base}?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`;
}

function parseGviz(text) {
  const match = text.match(
    /google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/
  );
  if (!match) throw new Error('Unexpected response from Google Sheets');
  return JSON.parse(match[1]);
}

function cellValue(cell) {
  if (!cell) return '';
  if (cell.v === null || cell.v === undefined) return cell.f || '';
  if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
    const parts = cell.v.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (parts) {
      const [_, y, m, d, h = 0, mn = 0, s = 0] = parts;
      return new Date(
        Number(y), Number(m), Number(d),
        Number(h), Number(mn), Number(s)
      ).toISOString();
    }
  }
  return cell.v;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(gvizUrl(), { cache: 'no-store' });

    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: `Google Sheets returned ${upstream.status}. Make sure the Sheet is public.`
      });
    }

    const text = await upstream.text();
    const payload = parseGviz(text);

    const table = payload.table;
    if (!table) {
      return res.status(200).json({ ok: true, activity: [], count: 0 });
    }

    const headers = table.cols.map(c =>
      String(c.label || '').trim().toLowerCase().replace(/\s+/g, '_')
    );

    const rows = table.rows || [];
    const activity = rows.map(row => {
      const obj = {};
      (row.c || []).forEach((cell, i) => {
        const key = headers[i];
        if (!key) return;
        obj[key] = cellValue(cell);
      });
      return obj;
    });

    // Sort newest first
    activity.sort((a, b) => {
      const da = new Date(a.timestamp || 0).getTime();
      const db = new Date(b.timestamp || 0).getTime();
      return db - da;
    });

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return res.status(200).json({
      ok: true,
      count: activity.length,
      activity
    });

  } catch (err) {
    console.error('[field-reports/activity]', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal error'
    });
  }
}
