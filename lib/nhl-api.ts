import type { Season } from '@/types/nhl';

export function teamLogoUrl(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`;
}

export const SEASONS: { label: string; value: Season }[] = [
  { label: '2024-25', value: '20242025' },
  { label: '2023-24', value: '20232024' },
  { label: '2022-23', value: '20222023' },
];
