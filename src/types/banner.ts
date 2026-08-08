export interface BannerCTA {
  label: string;
  href: string;
}

export interface Banner {
  id: string;
  src: string;
  alt: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  cta?: BannerCTA;
  ctaSecondary?: BannerCTA;
  align?: "left" | "center";
}
