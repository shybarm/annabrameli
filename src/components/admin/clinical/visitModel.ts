export const visitFields = [
 ['complaint', 'סיבת הפנייה'], ['history', 'סיפור המחלה ורקע רפואי'],
 ['exam', 'ממצאי הבדיקה'], ['assessment', 'הערכה וסיכום'],
 ['plan', 'תוכנית טיפול'], ['medications', 'תרופות'], ['followup', 'המשך מעקב'],
] as const;
export type VisitField = typeof visitFields[number][0];
export type VisitContent = Record<VisitField, string>;
export function readVisit(value: unknown): VisitContent {
 const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
 return Object.fromEntries(visitFields.map(([key]) => [key, typeof source[key] === 'string' ? source[key] : ''])) as VisitContent;
}
export const visitTemplates = [
 { name: 'ביקור ראשון', field: 'history' as VisitField, text: 'תיאור התסמינים:\nמועד התחלה ותדירות:\nחשיפות אפשריות:\nבירור וטיפולים קודמים:\nרקע רפואי ותרופות קבועות:\n' },
 { name: 'ביקורת', field: 'history' as VisitField, text: 'שינוי מאז הביקור הקודם:\nתגובה לטיפול:\nאירועים נוספים:\nשאלות המטופל:\n' },
 { name: 'סיכום והמשך', field: 'plan' as VisitField, text: 'הנחיות שנמסרו:\nתוכנית מוסכמת:\nמועד ומטרת המעקב:\n' },
];
export function appendTemplate(value: string, template: string) { return value ? `${value}\n\n${template}` : template; }
