// ============================================================
// Zaure — Field Report Endpoint
// Receives a report from the field operator's phone, forwards
// it to Google Apps Script, which saves it to a Google Sheet
// and uploads the photo to Google Drive.
// ============================================================

const APPS_SCRIPT_URL = process.env.ZAURE_FIELD_REPORT_WEBHOOK;

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (!APPS_SCRIPT_URL) {
      console.error('[field-report] Missing ZAURE_FIELD_REPORT_WEBHOOK env var');
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    const body = req.body || {};

    // Validate required fields
    const required = ['operatorName', 'location', 'photoBase64'];
    for (const key of required) {
      if (!body[key]) {
        return res.status(400).json({ ok: false, error: `Missing field: ${key}` });
      }
    }

    // Forward to Apps Script
    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorName: body.operatorName,
        sellersCount: Number(body.sellersCount) || 0,
        prosCount:    Number(body.prosCount) || 0,
        location:     body.location,
        blockers:     body.blockers || '',
        intel:        body.intel || '',
        photoName:    body.photoName || 'photo.jpg',
        photoType:    body.photoType || 'image/jpeg',
        photoBase64:  body.photoBase64,
        timestamp:    new Date().toISOString()
      })
    });

    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { ok: upstream.ok, raw: text }; }

    if (!upstream.ok || result.ok === false) {
      console.error('[field-report] Apps Script error:', result);
      return res.status(502).json({
        ok: false,
        error: result.error || 'Upstream error'
      });
    }

    return res.status(200).json({ ok: true, row: result.row || null });

  } catch (err) {
    console.error('[field-report] Fatal:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}