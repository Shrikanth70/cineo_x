/**
 * Brand Configuration for Cinéo
 * Single source of truth for branding, taglines, legal notices, and main navigation.
 */
export const BRAND_NAME = 'Cinéo';

export const BRAND_CONFIG = {
  name: BRAND_NAME,
  tagline: 'Every movie. Every show. Every answer.',
  subtitle: "What's trending, what's in cinemas, whether it's worth your evening.",
  watchPartyTagline: 'Watch together, / miles apart',
  watchPartySubtitle:
    'Start an online watch party with friends on Netflix, Prime Video, JioHotstar, YouTube or your own files. See faces, react, chat, and press play at the same second.',
  tmdbAttribution:
    'This product uses the TMDB API but is not endorsed or certified by TMDB.',
  version: '1.0.0',
};

export interface NavItem {
  label: string;
  href: string;
  badge?: 'AI' | 'Free';
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Discover', href: '/discover' },
  { label: 'Movies Like', href: '/movies-like' },
  { label: 'Watch Order', href: '/watch-order' },
  { label: 'Watch Party', href: '/watch-party', badge: 'Free' },
];

export const WATCH_PARTY_RULES = [
  'Be respectful: zero tolerance for hate speech, harassment, abuse, or illegal material.',
  '18+ or parental permission required: users confirm age eligibility before joining rooms.',
  'Private by design: rooms are accessible only by secret 12-character invite codes.',
  'No piracy: Cinéo does not host, stream, or circumvent DRM. Video streams play locally on individual devices or licensed embeds.',
];

