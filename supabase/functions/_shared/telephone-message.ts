import { visitLogistics, validMeetUrl, type VisitLogistics } from './visit-logistics.ts';

export function telephoneMessage(appointment: VisitLogistics, intakeUrl: string, visitUrl: string) {
  if (!appointment.meeting_url || !validMeetUrl(appointment.meeting_url)) throw new Error('Meeting not ready');
  const details = visitLogistics(appointment, { name: 'מרפאת ד״ר אנה ברמלי' });
  return [
    'שלום, נקבע לך תור טלפוני עם ד״ר אנה ברמלי.',
    `${details.date} בשעה ${details.time} (שעון ישראל), למשך ${appointment.duration_minutes} דקות.`,
    '',
    'לפני התור יש למלא פרטים ולהעלות תמונות בקישור האישי:',
    intakeUrl,
    'הקישור אישי. אין להעביר אותו לאחרים.',
    '',
    'פרטי התור והוספה ליומן:',
    visitUrl,
    '',
    'בשעת התור יש להיות זמינים בטלפון שמסרת למרפאה. אין צורך להגיע למרפאה.',
    'להצטרפות לווידאו ב-Google Meet:',
    appointment.meeting_url,
    'פתחו את הקישור בשעת התור, אפשרו שימוש במצלמה ובמיקרופון ולחצו על הצטרפות או בקשת הצטרפות. אם מופיעה המתנה, המתינו לאישור הרופאה. במחשב אפשר להצטרף דרך הדפדפן; בנייד ייתכן שתתבקשו לפתוח את אפליקציית Google Meet.',
    '',
    'לשאלות אפשר להשיב להודעה זו. טלפון המרפאה: 055-507-0399.',
  ].join('\n');
}

export function whatsappPhone(value: string) {
  const number = value.replace(/[\s()+-]/g, '').replace(/^00/, '').replace(/^0(?=\d{8,9}$)/, '972');
  return /^[1-9]\d{7,14}$/.test(number) ? number : null;
}
