// ============================================================
// GET /api/field-reports/list
// Fetches Field Report data from Google Sheets (gviz endpoint)
// and returns it to the browser as clean JSON.
//
// The Sheet ID never reaches the client.
// ============================================================

// ⚠️ Sheet ID and tab name live on the server only
const SHEET_ID = '14kqMfMrZM9XAisqy7vg7mmb89wK-2DEyV0brzmSeOXM';
const SHEET_TAB = 'Sheet1';

// ------------------------------------------------------------
// Build the gviz URL
// ------------------------------------------------------------
function gvizUrl() {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;
  return `${base}?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`;
}

// ------------------------------------------------------------
// Parse Google's gviz response (wrapped in a JS call)
// ------------------------------------------------------------
function parseGviz(text) {
  const match = text.match(
    /google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/
  );
  if (!match) throw new Error('Unexpected response from Google Sheets');
  return JSON.parse(match[1]);
}

// ------------------------------------------------------------
// Normalize a value from a gviz cell
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Main handler
// ------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(gvizUrl(), { cache: 'no-store' });

    if (!upstream.ok) {
      console.error('[field-reports/list] Google returned', upstream.status);
      return res.status(502).json({
        ok: false,
        error: `Google Sheets returned ${upstream.status}. Make sure the Sheet is set to "Anyone with the link can view."`
      });
    }

    const text = await upstream.text();
    const payload = parseGviz(text);

    const table = payload.table;
    if (!table) {
      return res.status(200).json({ ok: true, reports: [], count: 0 });
    }

    // Header labels
    const headers = table.cols.map(c =>
      String(c.label || '').trim().toLowerCase().replace(/\s+/g, '_')
    );

    // Data rows
    const rows = table.rows || [];
    const reports = rows.map(row => {
      const obj = {};
      (row.c || []).forEach((cell, i) => {
        const key = headers[i];
        if (!key) return;
        obj[key] = cellValue(cell);
      });
      return obj;
    });

    // Sort newest first
    reports.sort((a, b) => {
      const da = new Date(a.timestamp || 0).getTime();
      const db = new Date(b.timestamp || 0).getTime();
      return db - da;
    });

    // Cache 30s at the edge to reduce Google hits
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return res.status(200).json({
      ok: true,
      count: reports.length,
      reports
    });

  } catch (err) {
    console.error('[field-reports/list]', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal error'
    });
  }
}
