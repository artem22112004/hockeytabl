type Season = string;

export function teamLogoUrl(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`;
}

export const SEASONS: { label: string; value: Season }[] = [
  { label: '2025-26', value: '20252026' },
  { label: '2024-25', value: '20242025' },
];
