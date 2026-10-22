const forbiddenDash = String.fromCodePoint(0x2014);

/** Keep editor input and CMS output consistent with the owner's punctuation rule. */
export function normalizeSiteText(value: string): string {
  return value.split(forbiddenDash).join('-')
    .replace(/&mdash;|&#0*8212;|&#x0*2014;/gi, '-');
}

export function normalizeContentSections<T extends { heading: string; content: string }>(sections: T[]): T[] {
  return sections.map(section => ({
    ...section,
    heading: normalizeSiteText(section.heading),
    content: normalizeSiteText(section.content),
  }));
}
