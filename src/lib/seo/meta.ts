import type { Locale } from '$lib/i18n/config';
import {
	absoluteUrl,
	alternateLocale,
	getSiteOrigin,
	localePath,
	ogLocale,
	OG_IMAGE_PATH
} from './site';

export type SeoInput = {
	locale: Locale;
	title: string;
	description: string;
	/** Path under the site, e.g. `/es` or `/en/login` */
	path: string;
	robots?: string;
	ogType?: 'website' | 'article';
	ogImagePath?: string;
	jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export function buildSeo(input: SeoInput) {
	const origin = getSiteOrigin();
	const path = input.path.startsWith('/') ? input.path : `/${input.path}`;
	const canonical = absoluteUrl(path, origin);
	const other = alternateLocale(input.locale);
	const otherPath = path.replace(new RegExp(`^/${input.locale}(?=/|$)`), `/${other}`);
	const ogImage = absoluteUrl(input.ogImagePath ?? OG_IMAGE_PATH, origin);

	return {
		title: input.title,
		description: input.description,
		canonical,
		robots: input.robots ?? 'index,follow',
		ogType: input.ogType ?? 'website',
		ogLocale: ogLocale(input.locale),
		ogLocaleAlternate: ogLocale(other),
		ogImage,
		hreflang: [
			{ lang: input.locale, href: canonical },
			{ lang: other, href: absoluteUrl(otherPath, origin) },
			{ lang: 'x-default', href: absoluteUrl(localePath('es'), origin) }
		],
		jsonLd: input.jsonLd
			? Array.isArray(input.jsonLd)
				? input.jsonLd
				: [input.jsonLd]
			: []
	};
}

export function organizationJsonLd(opts: {
	name: string;
	email: string;
	addressLocality: string;
	addressCountry: string;
	telephone?: string;
}) {
	const origin = getSiteOrigin();
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: opts.name,
		alternateName: ['AMRAP Space', 'amrap.space'],
		url: origin,
		email: opts.email,
		...(opts.telephone ? { telephone: opts.telephone } : {}),
		logo: absoluteUrl('/pwa/icon-512.png', origin),
		address: {
			'@type': 'PostalAddress',
			addressLocality: opts.addressLocality,
			addressCountry: opts.addressCountry
		},
		sameAs: [] as string[]
	};
}

export function softwareApplicationJsonLd(opts: {
	name: string;
	description: string;
	locale: Locale;
}) {
	const origin = getSiteOrigin();
	const isEs = opts.locale === 'es';
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: opts.name,
		alternateName: isEs
			? ['AMRAP Space', 'software para gimnasios AMRAP', 'amrap.space']
			: ['AMRAP Space', 'AMRAP gym software', 'amrap.space'],
		applicationCategory: 'BusinessApplication',
		applicationSubCategory: isEs ? 'Software para gimnasios' : 'Gym management software',
		operatingSystem: 'Web',
		description: opts.description,
		url: absoluteUrl(localePath(opts.locale), origin),
		image: absoluteUrl(OG_IMAGE_PATH, origin),
		featureList: isEs
			? [
					'Check-in con QR',
					'Membresías y planes',
					'Recepción y altas',
					'Clases y cupos',
					'Multi-gimnasio'
				]
			: [
					'QR check-in',
					'Memberships and plans',
					'Front-desk sign-ups',
					'Classes and capacity',
					'Multi-gym'
				],
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'MXN',
			description: isEs ? 'Plan freemium disponible' : 'Freemium plan available'
		},
		publisher: {
			'@type': 'Organization',
			name: 'AMRAP',
			url: origin
		}
	};
}

export function faqPageJsonLd(items: { q: string; a: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: items.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.a
			}
		}))
	};
}

export function webSiteJsonLd(opts: { name: string; locale: Locale }) {
	const origin = getSiteOrigin();
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: opts.name,
		alternateName: ['AMRAP Space', 'amrap.space'],
		url: absoluteUrl(localePath(opts.locale), origin),
		inLanguage: opts.locale === 'es' ? 'es-MX' : 'en-US',
		publisher: {
			'@type': 'Organization',
			name: 'AMRAP',
			url: origin
		}
	};
}
