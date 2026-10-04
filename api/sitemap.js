// ============================================================
// Zaure — Dynamic Sitemap Generator
// Endpoint: https://zauretech.xyz/sitemap.xml
// Reads products.json + services.json + static pages
// ============================================================

import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://zauretech.xyz';

// ------------------------------------------------------------
// Static pages — hand-maintained
// ------------------------------------------------------------
const STATIC_PAGES = [
  { url: '/',                       changefreq: 'daily',   priority: 1.0 },
  { url: '/category.html?slug=all', changefreq: 'daily',   priority: 0.9 },
  { url: '/services.html',          changefreq: 'daily',   priority: 0.9 },
  { url: '/categories.html',        changefreq: 'weekly',  priority: 0.9 },
  { url: '/stores.html',            changefreq: 'weekly',  priority: 0.7 },
  { url: '/about.html',             changefreq: 'monthly', priority: 0.6 },
  { url: '/contact.html',           changefreq: 'monthly', priority: 0.6 },
  { url: '/careers.html',           changefreq: 'monthly', priority: 0.6 },
  { url: '/alamin-ahmed.html',      changefreq: 'monthly', priority: 0.5 },
  { url: '/help.html',              changefreq: 'monthly', priority: 0.5 },
  { url: '/faq.html',               changefreq: 'monthly', priority: 0.5 },
  { url: '/safety.html',            changefreq: 'monthly', priority: 0.5 },
  { url: '/privacy.html',           changefreq: 'yearly',  priority: 0.3 },
  { url: '/terms.html',             changefreq: 'yearly',  priority: 0.3 }
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Convert any date to YYYY-MM-DD
function toISODate(d) {
  try {
    const date = d ? new Date(d) : new Date();
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Safely load a JSON file from /data
function loadJSON(filename) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[sitemap] Could not load ${filename}:`, err.message);
    return [];
  }
}

// Build a <url> block
function urlBlock({ loc, lastmod, changefreq, priority, images = [] }) {
  const imageTags = images
    .filter(Boolean)
    .map(src => `
    <image:image>
      <image:loc>${escapeXml(src)}</image:loc>
    </image:image>`)
    .join('');

  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageTags}
  </url>`;
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------
export default function handler(req, res) {
  try {
    const today = toISODate(new Date());

    // 1. Static pages
    const staticUrls = STATIC_PAGES.map(p => urlBlock({
      loc: SITE_URL + p.url,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority
    })).join('');

    // 2. Products
    const products = loadJSON('products.json');
    const productUrls = products.map(p => {
      const images = [];
      if (Array.isArray(p.images) && p.images.length) images.push(p.images[0]);
      else if (p.image) images.push(p.image);

      return urlBlock({
        loc: `${SITE_URL}/detail.html?id=${encodeURIComponent(p.id)}`,
        lastmod: toISODate(p.updatedAt || p.date || today),
        changefreq: 'weekly',
        priority: p.featured ? 0.8 : 0.7,
        images
      });
    }).join('');

    // 3. Services
    const services = loadJSON('services.json');
    const serviceUrls = services.map(s => {
      const images = [];
      if (s.seller && s.seller.profilePic) images.push(s.seller.profilePic);
      else if (Array.isArray(s.images) && s.images.length) images.push(s.images[0]);
      else if (s.image) images.push(s.image);

      return urlBlock({
        loc: `${SITE_URL}/service.html?id=${encodeURIComponent(s.id)}`,
        lastmod: toISODate(s.updatedAt || s.date || today),
        changefreq: 'weekly',
        priority: s.featured ? 0.8 : 0.7,
        images
      });
    }).join('');

    // 4. Assemble
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls}
${productUrls}
${serviceUrls}
</urlset>`;

    // 5. Respond
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap] Fatal:', err);
    res.status(500).send('<!-- sitemap generation failed -->');
  }
}