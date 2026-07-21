import { locales } from '$lib/i18n/config';
import { getPublicSeoOrigin, localePath } from '$lib/seo/site';

const PUBLIC_PATHS = ['', 'login', 'register'] as const;

export const prerender = true;

export function GET() {
	const origin = getPublicSeoOrigin();
	const lastmod = new Date().toISOString().slice(0, 10);

	const urls = locales.flatMap((locale) =>
		PUBLIC_PATHS.map((suffix) => {
			const path = localePath(locale, suffix);
			const priority = suffix === '' ? '1.0' : '0.7';
			const changefreq = suffix === '' ? 'weekly' : 'monthly';
			return `  <url>
    <loc>${origin}${path}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${origin}${localePath('es', suffix)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${origin}${localePath('en', suffix)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${localePath('es', suffix)}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
		})
	);

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
}
