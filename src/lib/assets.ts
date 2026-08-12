export const ASSET_URLS = {
  heroBanners: "/homepage/banners",
  festivalLogos: "/homepage/logos/festival",
  wishingCardIcons: "/homepage/logos/wishing-card",
  businessCardIcons: "/homepage/logos/business-card",
  businessCategoryLogos: "/homepage/logos/business-category",
  calendarDateLogos: "/homepage/calendar/date",
  rathYatraBackground: "/homepage/backgrounds/rath-yatra.png",
} as const;

export function festivalTemplatesUrl(festivalId: string): string {
  return `/templates/festival/${festivalId}/templates`;
}

export function festivalMappingsUrl(festivalId: string): string {
  return `/templates/festival/${festivalId}/mapping`;
}

export function festivalFrameTemplatesUrl(festivalId: string, frame: "phone-frame" | "email-frame"): string {
  return `/templates/festival/${festivalId}/${frame}/templates`;
}

export function festivalFrameMappingsUrl(festivalId: string, frame: "phone-frame" | "email-frame"): string {
  return `/templates/festival/${festivalId}/${frame}/mapping`;
}

export function festivalLogoUrl(filename: string): string {
  return `${ASSET_URLS.festivalLogos}/${filename}`;
}

export function wishingCardIconUrl(filename: string): string {
  return `${ASSET_URLS.wishingCardIcons}/${filename}`;
}

export function businessCardIconUrl(filename: string): string {
  return `${ASSET_URLS.businessCardIcons}/${filename}`;
}

export function businessCategoryIconUrl(filename: string): string {
  return `${ASSET_URLS.businessCategoryLogos}/${filename}`;
}
