const PUBLIC_BASE_URL = "https://wavetech-org.vercel.app";

export function getPublicBaseUrl() {
  return PUBLIC_BASE_URL;
}

export function getWebCardUrl(slug: string) {
  return `${getPublicBaseUrl()}/c/${encodeURIComponent(slug)}`;
}
