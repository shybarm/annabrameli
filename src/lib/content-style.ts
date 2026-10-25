const forbiddenDashes = new RegExp(`[${String.fromCodePoint(0x2013)}${String.fromCodePoint(0x2014)}]`, 'g');

/** Keep editor input and CMS output consistent with the owner's punctuation rule. */
export function normalizeSiteText(value: string): string {
  return value.replace(forbiddenDashes, '-')
    .replace(/&[mn]dash;|&#0*821[12];|&#x0*201[34];/gi, '-');
}

export function normalizeContentSections<T extends { heading: string; content: string }>(sections: T[]): T[] {
  return sections.map(section => ({
    ...section,
    heading: normalizeSiteText(section.heading),
    content: normalizeSiteText(section.content),
  }));
}
