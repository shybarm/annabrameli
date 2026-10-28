import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { clarityEligible, startPublicClarity, stopPublicClarity } from '@/lib/clarity-public';

export function ClarityChoice() {
  useLocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  if (!mounted || typeof window === 'undefined' || (!active && !clarityEligible())) return null;
  return <div data-clarity-mask="true" className="container-medical py-3 text-sm text-muted-foreground">
    {active ? <button onClick={() => { stopPublicClarity(); setActive(false); setOpen(false); }}>הפסקת מדידת השימוש בדף</button> :
      <button onClick={() => setOpen(!open)}>אפשרויות מדידת שימוש</button>}
    {open && !active && <div className="mt-2 space-y-2 max-w-2xl">
      <p>אפשר לעזור בשיפור האתר באמצעות מדידת גלילה ולחיצות בדף זה ב־Microsoft Clarity. הטקסט מוסתר, והמדידה נעצרת במעבר דף או בכניסה לשדה הזנה. אין חובה להסכים. האפשרות מיועדת למבוגרים בלבד.</p>
      <button className="underline" onClick={async () => setActive(await startPublicClarity())}>אני מעל גיל 18 ומאשר מדידת שימוש בדף זה</button>
      <a className="underline ms-4" href="/privacy">פרטים במדיניות הפרטיות</a>
    </div>}
  </div>;
}
