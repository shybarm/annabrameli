import { 
  LayoutDashboard, Users, Calendar, Receipt, FileText, 
  MessageSquare, Settings, Stethoscope, History, UserPlus,
  ClipboardList, Wallet, PenTool, Calculator, Share2, File,
  Mic, ListOrdered
} from 'lucide-react';

export interface TutorialStepData {
  title: string;
  description: string;
  icon: any;
  highlightSelector?: string; // CSS selector to highlight element on page
}

export interface PageTutorial {
  pageId: string;
  pageName: string;
  steps: TutorialStepData[];
}

export const onboardingSteps: TutorialStepData[] = [
  {
    title: 'ברוכים הבאים! 🎉',
    description: 'שמחים שהצטרפת למערכת ניהול המרפאה! בוא נלמד יחד איך להשתמש בכל הכלים העוצמתיים שלנו.',
    icon: Stethoscope
  },
  {
    title: 'לוח הבקרה',
    description: 'כאן תראה את כל המידע החשוב במבט אחד - תורים להיום, סטטיסטיקות, ועוד. זו נקודת ההתחלה שלך.',
    icon: LayoutDashboard
  },
  {
    title: 'ניהול מטופלים',
    description: 'כאן תוכל להוסיף מטופלים חדשים, לראות את ההיסטוריה שלהם, ולשלוח טפסי קליטה. לחץ על "מטופלים" בתפריט.',
    icon: Users
  },
  {
    title: 'ניהול תורים',
    description: 'קבע תורים, עדכן סטטוסים, וכתוב סיכומי ביקור. אחרי הביקור תוכל לחתום דיגיטלית ולשלוח למטופל.',
    icon: Calendar
  },
  {
    title: 'חיוב וחשבוניות',
    description: 'צור חשבוניות, עקוב אחרי תשלומים, ונהל את ההכנסות שלך בקלות.',
    icon: Receipt
  },
  {
    title: 'צריך עזרה?',
    description: 'בכל דף יש כפתור "עזרה" 💡 שיראה לך הדרכה ספציפית לאותו דף. אל תהסס להשתמש בו!',
    icon: MessageSquare
  }
];

export const pageTutorials: Record<string, PageTutorial> = {
  '/admin': {
    pageId: 'dashboard',
    pageName: 'לוח בקרה',
    steps: [
      {
        title: 'סקירה כללית',
        description: 'כאן תראה את כל הנתונים החשובים - תורים להיום, כמה מטופלים חדשים, והכנסות.',
        icon: LayoutDashboard,
        highlightSelector: '[data-tutorial="stats-cards"]'
      },
      {
        title: 'תורים להיום',
        description: 'ברשימה תראה את כל התורים המתוכננים להיום. לחץ על תור כדי לראות פרטים ולכתוב סיכום.',
        icon: Calendar,
        highlightSelector: '[data-tutorial="today-appointments"]'
      }
    ]
  },
  '/admin/patients': {
    pageId: 'patients',
    pageName: 'מטופלים',
    steps: [
      {
        title: 'רשימת המטופלים',
        description: 'כאן תראה את כל המטופלים במרפאה. תוכל לחפש לפי שם, טלפון או מייל.',
        icon: Users,
        highlightSelector: '[data-tutorial="patients-list"]'
      },
      {
        title: 'הוספת מטופל חדש',
        description: 'לחץ על "מטופל חדש" כדי להוסיף מטופל. מלא את הפרטים הבסיסיים ושלח טופס קליטה.',
        icon: UserPlus,
        highlightSelector: '[data-tutorial="new-patient-btn"]'
      },
      {
        title: 'טופס קליטה',
        description: 'אחרי יצירת מטופל, לחץ על "שלח טופס קליטה" כדי לשלוח לינק למטופל למילוי ההיסטוריה הרפואית.',
        icon: ClipboardList,
        highlightSelector: '[data-tutorial="intake-btn"]'
      }
    ]
  },
  '/admin/appointments': {
    pageId: 'appointments',
    pageName: 'תורים',
    steps: [
      {
        title: 'לוח התורים',
        description: 'כאן תראה את כל התורים. תוכל לסנן לפי תאריך וסטטוס.',
        icon: Calendar,
        highlightSelector: '[data-tutorial="calendar-view"]'
      },
      {
        title: 'קביעת תור חדש',
        description: 'לחץ על "תור חדש" כדי לקבוע תור. בחר מטופל, סוג תור, תאריך ושעה.',
        icon: Calendar,
        highlightSelector: '[data-tutorial="new-appointment-btn"]'
      },
      {
        title: 'סטטוס תור',
        description: 'שנה סטטוס בתפריט הנפתח: מתוכנן → בחדר המתנה → בטיפול → הושלם (ירוק). הסטטוס מעודכן אוטומטית ונראה לכל הצוות.',
        icon: Stethoscope,
        highlightSelector: '[data-tutorial="appointment-status"]'
      },
      {
        title: 'סיכום ביקור',
        description: 'לאחר הביקור, לחץ על התור וכתוב סיכום. תוכל גם לחתום דיגיטלית ולשלוח למטופל.',
        icon: FileText,
        highlightSelector: '[data-tutorial="appointments-list"]'
      }
    ]
  },
  '/admin/billing': {
    pageId: 'billing',
    pageName: 'חיוב וחשבוניות',
    steps: [
      {
        title: 'רשימת החשבוניות',
        description: 'כאן תראה את כל החשבוניות. תוכל לסנן לפי סטטוס (טיוטה, נשלחה, שולמה).',
        icon: Receipt,
        highlightSelector: '[data-tutorial="invoices-list"]'
      },
      {
        title: 'יצירת חשבונית',
        description: 'לחץ על "חשבונית חדשה". בחר מטופל, הוסף פריטים עם מחירים, ושמור.',
        icon: Receipt,
        highlightSelector: '[data-tutorial="new-invoice-btn"]'
      },
      {
        title: 'שליחת חשבונית',
        description: 'אחרי יצירת חשבונית, תוכל לשלוח אותה במייל או WhatsApp למטופל.',
        icon: MessageSquare,
        highlightSelector: '[data-tutorial="invoice-actions"]'
      }
    ]
  },
  '/admin/expenses': {
    pageId: 'expenses',
    pageName: 'הוצאות',
    steps: [
      {
        title: 'מעקב הוצאות',
        description: 'כאן תוכל לתעד את כל ההוצאות של המרפאה - שכירות, ציוד, חומרים ועוד.',
        icon: Wallet,
        highlightSelector: '[data-tutorial="expenses-list"]'
      },
      {
        title: 'הוספת הוצאה',
        description: 'לחץ על "הוצאה חדשה", בחר קטגוריה, הזן סכום ותיאור.',
        icon: Wallet,
        highlightSelector: '[data-tutorial="new-expense-btn"]'
      }
    ]
  },
  '/admin/messages': {
    pageId: 'messages',
    pageName: 'הודעות',
    steps: [
      {
        title: 'תיבת הודעות',
        description: 'כאן תראה הודעות מהמטופלים. תוכל לקרוא ולהשיב להודעות.',
        icon: MessageSquare
      }
    ]
  },
  '/admin/settings': {
    pageId: 'settings',
    pageName: 'הגדרות',
    steps: [
      {
        title: 'הגדרות המרפאה',
        description: 'כאן תוכל לערוך את פרטי המרפאה, שעות פעילות, וסוגי תורים.',
        icon: Settings
      },
      {
        title: 'תזכורות אוטומטיות',
        description: 'הגדר תזכורות שיישלחו אוטומטית למטופלים לפני התור.',
        icon: Calendar
      }
    ]
  },
  '/admin/audit-log': {
    pageId: 'audit-log',
    pageName: 'יומן ביקורת',
    steps: [
      {
        title: 'מעקב שינויים',
        description: 'כאן תוכל לראות את כל השינויים שנעשו במערכת - מי שינה, מה שינה, ומתי.',
        icon: History
      },
      {
        title: 'סינון',
        description: 'תוכל לסנן לפי טבלה (מטופלים, תורים וכו׳), סוג פעולה, ותאריכים.',
        icon: History
      }
    ]
  }
};

// For appointment detail page
export const appointmentDetailTutorial: PageTutorial = {
  pageId: 'appointment-detail',
  pageName: 'פרטי תור',
  steps: [
    {
      title: 'סטטוס התור',
      description: 'בראש הדף יש תפריט נפתח לשינוי סטטוס: מתוכנן (כחול) → בחדר המתנה (צהוב) → בטיפול (סגול) → הושלם (ירוק). הסטטוס נראה לכל הצוות בזמן אמת!',
      icon: ListOrdered,
      highlightSelector: '[data-tutorial="status-dropdown"]'
    },
    {
      title: 'פרטי התור',
      description: 'כאן תראה את כל המידע על התור - פרטי המטופל, תאריך, שעה וסוג התור.',
      icon: Calendar,
      highlightSelector: '[data-tutorial="appointment-info"]'
    },
    {
      title: 'כלי מדידה ⭐',
      description: 'השתמש בכלי המדידה לחישוב ציונים רפואיים כמו ACT, SCORAD, SNOT-22. לחץ על הכפתור הרלוונטי, מלא את השאלון והציון יתווסף אוטומטית לסיכום. תוכל גם להוסיף כלי מדידה מותאם אישית!',
      icon: Calculator,
      highlightSelector: '[data-tutorial="scoring-toolbar"]'
    },
    {
      title: 'סיכום הביקור',
      description: 'בלשונית "סיכום ביקור" תוכל לכתוב את ממצאי הביקור. 🎤 טיפ: לחץ על כפתור ההקלטה כדי להקליט קולית במקום להקליד - המערכת תתמלל אוטומטית!',
      icon: Stethoscope,
      highlightSelector: '[data-tutorial="visit-summary-form"]'
    },
    {
      title: 'מילוי טופס קליטה',
      description: 'לפני הביקור, שלח למטופל טופס קליטה דיגיטלי. המטופל ימלא היסטוריה רפואית, אלרגיות ותרופות מהבית - והמידע יופיע אוטומטית בכרטיס שלו.',
      icon: ClipboardList,
      highlightSelector: '[data-tutorial="intake-link"]'
    },
    {
      title: 'חתימה דיגיטלית',
      description: 'אחרי שכתבת סיכום, לחץ על "חתום דיגיטלית" כדי לאשר את הסיכום. זה חשוב לתיעוד רפואי!',
      icon: PenTool,
      highlightSelector: '[data-tutorial="signature-section"]'
    },
    {
      title: 'שליחה למטופל',
      description: 'תוכל לשלוח את הסיכום למטופל באימייל או WhatsApp, או להדפיס אותו.',
      icon: Share2,
      highlightSelector: '[data-tutorial="share-buttons"]'
    },
    {
      title: 'מסמכים',
      description: 'בלשונית "מסמכים" תוכל להעלות ולצפות במסמכים של המטופל - הפניות, בדיקות, תמונות ועוד.',
      icon: File,
      highlightSelector: '[data-tutorial="documents-tab"]'
    }
  ]
};

// For patient detail page
export const patientDetailTutorial: PageTutorial = {
  pageId: 'patient-detail',
  pageName: 'פרטי מטופל',
  steps: [
    {
      title: 'פרופיל המטופל',
      description: 'כאן תראה את כל המידע על המטופל - פרטים אישיים, היסטוריה רפואית, ואלרגיות.',
      icon: Users
    },
    {
      title: 'טופס קליטה',
      description: 'אם המטופל עוד לא מילא טופס קליטה, תוכל לשלוח לו לינק מכאן.',
      icon: ClipboardList
    },
    {
      title: 'היסטוריית תורים',
      description: 'בלשונית "תורים" תראה את כל התורים של המטופל - עברו ועתידיים.',
      icon: Calendar
    },
    {
      title: 'מסמכים',
      description: 'בלשונית "מסמכים" תוכל להעלות ולצפות במסמכים של המטופל.',
      icon: FileText
    }
  ]
};
