// ============================================================
// GET /api/listings/list
// Reads all listings from the Apps Script (which reads the Sheet)
// ============================================================

const APPS_SCRIPT_URL = process.env.ZAURE_LISTINGS_WEBHOOK;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  try {
    const upstream = await fetch(APPS_SCRIPT_URL, { method: 'GET' });
    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch { throw new Error('Invalid response'); }

    if (!result.ok) {
      return res.status(502).json({ ok: false, error: result.error || 'Upstream error' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      ok: true,
      count: result.count || 0,
      listings: result.listings || []
    });

  } catch (err) {
    console.error('[listings/list]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}