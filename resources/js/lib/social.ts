const known: [RegExp, string][] = [
    [/instagram\.com$/, 'Instagram'],
    [/tiktok\.com$/, 'TikTok'],
    [/facebook\.com$|fb\.com$/, 'Facebook'],
    [/(^|\.)(x|twitter)\.com$/, 'X'],
    [/youtube\.com$|youtu\.be$/, 'YouTube'],
    [/linkedin\.com$/, 'LinkedIn'],
    [/wa\.me$|whatsapp\.com$/, 'WhatsApp'],
    [/tokopedia\.com$/, 'Tokopedia'],
    [/shopee\.co\.id$/, 'Shopee'],
];

/** Short label for a vendor link: the social network if we know it, otherwise the host name. */
export function linkLabel(url: string): string {
    try {
        const host = new URL(url).hostname.replace(/^www\./, '');

        return known.find(([pattern]) => pattern.test(host))?.[1] ?? host;
    } catch {
        return 'Link';
    }
}
