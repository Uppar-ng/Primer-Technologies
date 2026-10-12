// ============================================================
// GET /api/field-reports/activity
// Returns click activity rows from the second Google Sheet.
// No auth — Sheet must be set to "Anyone with the link → Viewer"
// ============================================================

const SHEET_ID = '1dawpQ4Po9h37RZtwaP9EuxJ7U1lsD3wEdM8TsXOmZHc';
const SHEET_TAB = 'Sheet1';

function gvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  return `${base}?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`;
}

function parseGviz(text) {
  const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
  if (!m) throw new Error('Unexpected response from Google Sheets');
  return JSON.parse(m[1]);
}

function cellValue(cell) {
  if (!cell) return '';
  if (cell.v === null || cell.v === undefined) return cell.f || '';
  if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
    const p = cell.v.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (p) {
      const [, y, m, d, h = 0, mn = 0, s = 0] = p;
      return new Date(+y, +m, +d, +h, +mn, +s).toISOString();
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
      console.error('[field-reports/activity] Google returned', upstream.status);
      return res.status(502).json({
        ok: false,
        error: `Google Sheets returned ${upstream.status}. Make sure the Sheet is public.`
      });
    }

    const text = await upstream.text();
    const payload = parseGviz(text);

    const table = payload.table;
    if (!table) {
      return res.status(200).json({ ok: true, count: 0, activity: [] });
    }

    const headers = table.cols.map(c =>
      String(c.label || '').trim().toLowerCase().replace(/\s+/g, '_')
    );

    const activity = (table.rows || []).map(row => {
      const obj = {};
      (row.c || []).forEach((cell, i) => {
        if (headers[i]) obj[headers[i]] = cellValue(cell);
      });
      return obj;
    });

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
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}