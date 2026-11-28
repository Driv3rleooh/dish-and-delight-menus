const DEFAULT_PUBLIC_BASE_URL = "https://dish-and-delight-menus.vercel.app";

export function getPublicBaseUrl() {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  return (configured || DEFAULT_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

export function getWebCardUrl(slug: string) {
  return `${getPublicBaseUrl()}/c/${encodeURIComponent(slug)}`;
}
