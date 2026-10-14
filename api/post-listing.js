// ============================================================
// POST /api/post-listing
// Forwards a listing submission to Google Apps Script
// ============================================================

const APPS_SCRIPT_URL = process.env.ZAURE_LISTINGS_WEBHOOK;

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  try {
    const body = req.body || {};

    // Validate required
    const required = ['category', 'subcategory', 'title', 'description', 'state', 'contactName', 'contactPhone'];
    for (const key of required) {
      if (!body[key] || !String(body[key]).trim()) {
        return res.status(400).json({ ok: false, error: `Missing: ${key}` });
      }
    }

    // Limit photos
    const photos = Array.isArray(body.photos) ? body.photos.slice(0, 5) : [];

    const payload = {
      category: String(body.category).trim(),
      subcategory: String(body.subcategory).trim(),
      title: String(body.title).trim().slice(0, 200),
      description: String(body.description).trim().slice(0, 4000),
      price: String(body.price || '').trim().slice(0, 40),
      priceType: String(body.priceType || 'fixed').trim(),
      state: String(body.state).trim(),
      city: String(body.city || '').trim().slice(0, 100),
      contactName: String(body.contactName).trim().slice(0, 100),
      contactPhone: String(body.contactPhone).trim().slice(0, 20),
      whatsapp: body.whatsapp === true,
      extra: body.extra && typeof body.extra === 'object' ? body.extra : {},
      photos: photos.map(p => ({
        type: String(p.type || 'image/jpeg'),
        base64: String(p.base64 || '')
      })),
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim(),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 250)
    };

    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    let result;
    try { result = JSON.parse(text); } catch { result = { ok: false, error: 'Invalid response' }; }

    if (!upstream.ok || !result.ok) {
      return res.status(502).json({ ok: false, error: result.error || 'Upstream error' });
    }

    return res.status(200).json({
      ok: true,
      listingId: result.listingId,
      photoCount: result.photoCount || 0
    });

  } catch (err) {
    console.error('[post-listing]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
}