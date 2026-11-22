import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Pencil, Plus } from 'lucide-react';
import { clinicalDb } from './clinicalApi';
import { visitFields, visitTemplates, type VisitField, type VisitContent } from './visitModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

type Template = { id: string; name: string; field: VisitField; body: string };
type Selection = Pick<Template, 'field' | 'body'>;
type Preferences = { favorites: string[]; recent: string[] };
const builtins: Template[] = visitTemplates.map((t) => ({
  id: 'builtin-' + t.field + '-' + t.name,
  name: t.name,
  field: t.field,
  body: t.text,
}));
function preferences(key: string): Preferences {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const ids = (value: unknown) =>
      Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
    return { favorites: ids(data.favorites), recent: ids(data.recent) };
  } catch {
    return { favorites: [], recent: [] };
  }
}

export function ClinicalTemplates({
  selection,
  onInsert,
  onClose,
  identifiers,
}: {
  selection: Selection | null;
  onInsert: (sections: Partial<VisitContent>) => void;
  onClose: () => void;
  identifiers: string[];
}) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const prefKey = 'clinical-template-choices:' + user?.id;
  const [prefs, setPrefs] = useState(() => preferences(prefKey));
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(!!selection);
  const [name, setName] = useState('');
  const [field, setField] = useState<VisitField>(selection?.field || 'history');
  const [body, setBody] = useState(selection?.body || '');
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const q = useQuery({
    queryKey: ['clinical-templates', user?.id],
    queryFn: async () => {
      const r = await clinicalDb
        .from('clinical_templates')
        .select('id,name,field,body')
        .order('name', { ascending: true });
      if (r.error) throw r.error;
      return r.data as Template[];
    },
  });
  const remember = (next: Preferences) => {
    setPrefs(next);
    try {
      localStorage.setItem(prefKey, JSON.stringify(next));
    } catch {
      /* In-memory preferences still work. */
    }
  };
  const templates = [...builtins, ...(q.data ?? [])];
  const rank = (id: string) =>
    prefs.favorites.includes(id) ? -10 : prefs.recent.includes(id) ? prefs.recent.indexOf(id) : 20;
  const visible = templates
    .filter((t) => t.name.includes(search.trim()))
    .sort((a, b) => rank(a.id) - rank(b.id));
  const edit = (t?: Template) => {
    setEditing(true);
    setName(t ? t.name + ' (מותאם)' : '');
    setBody(t?.body || '');
    setField(t?.field || 'history');
    setError('');
    setReviewed(false);
  };
  const save = async () => {
    const text = name + ' ' + body;
    if (
      identifiers
        .flatMap((value) => value.split(/\s+/))
        .some((value) => value.length >= 2 && text.includes(value)) ||
      /[\w.+-]+@[\w.-]+|\b\d(?:[\s-]?\d){8,}\b/.test(text)
    ) {
      setError('יש להסיר מהתבנית פרטים מזהים ולהחליף אותם בשדות להשלמה.');
      return;
    }
    if (!reviewed || !name.trim() || !body.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await clinicalDb
        .from('clinical_templates')
        .insert({ name: name.trim(), field, body: body.trim() });
      if (r.error) throw r.error;
      await cache.invalidateQueries({ queryKey: ['clinical-templates', user?.id] });
      setEditing(false);
      setSearch(name.trim());
    } catch {
      setError('התבנית לא נשמרה. הנוסח נשאר כאן לניסיון נוסף.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        dir="rtl"
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing && !busy) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
        className="visit-template-dialog max-h-[86dvh] max-w-lg overflow-y-auto text-start"
      >
        <DialogTitle className="pe-2 ps-5 text-start">
          {editing ? 'עריכת תבנית אישית' : 'תבניות לביקור'}
        </DialogTitle>
        <DialogDescription className="text-start">
          {editing
            ? 'ניסוח כללי לשימוש חוזר. אפשר לסמן מקום להשלמה בסוגריים מרובעים.'
            : 'בחירת תבנית מוסיפה טקסט בסוף המקטע המתאים.'}
        </DialogDescription>
        {editing ? (
          <div className="grid gap-3">
            <label>
              שם התבנית
              <Input
                value={name}
                maxLength={100}
                onChange={(e) => {
                  setName(e.target.value);
                  setReviewed(false);
                }}
              />
            </label>
            <label>
              מקטע
              <select
                className="block w-full rounded-md border bg-background p-2"
                value={field}
                onChange={(e) => setField(e.target.value as VisitField)}
              >
                {visitFields.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              נוסח התבנית
              <Textarea
                rows={5}
                maxLength={20000}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setReviewed(false);
                }}
              />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              בדקתי שהנוסח כללי ואינו כולל פרטי מטופל.
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="flex gap-2">
              <Button disabled={busy || !reviewed || !body.trim() || !name.trim()} onClick={save}>
                שמירת תבנית
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
                חזרה
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Input
              autoFocus
              aria-label="חיפוש תבנית"
              placeholder="חיפוש לפי שם"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="divide-y">
              {visible.map((t) => (
                <div key={t.id} className="flex items-center gap-1 py-1">
                  <button
                    className="flex-1 rounded-md px-2 py-2 text-start hover:bg-muted focus-visible:ring-2"
                    onClick={() => {
                      remember({
                        ...prefs,
                        recent: [t.id, ...prefs.recent.filter((id) => id !== t.id)].slice(0, 6),
                      });
                      onInsert({ [t.field]: t.body });
                    }}
                  >
                    <strong className="block">{t.name}</strong>
                    <span className="block line-clamp-1 text-sm text-muted-foreground">
                      {t.body.split('\n')[0]}
                    </span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={'מועדפת: ' + t.name}
                    aria-pressed={prefs.favorites.includes(t.id)}
                    onClick={() =>
                      remember({
                        ...prefs,
                        favorites: prefs.favorites.includes(t.id)
                          ? prefs.favorites.filter((id) => id !== t.id)
                          : [...prefs.favorites, t.id],
                      })
                    }
                  >
                    <Bookmark
                      className={prefs.favorites.includes(t.id) ? 'size-4 fill-current' : 'size-4'}
                    />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={'עריכת עותק של ' + t.name}
                    onClick={() => edit(t)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {q.isError && <p role="alert">לא ניתן לטעון תבניות אישיות.</p>}
            {!visible.length && <p>אין תבניות תואמות.</p>}
            {!search && (
              <Button
                variant="outline"
                onClick={() =>
                  onInsert({ history: visitTemplates[0].text, plan: visitTemplates[2].text })
                }
              >
                הוספת מבנה לביקור ראשון
              </Button>
            )}
            <Button variant="ghost" onClick={() => edit()}>
              <Plus className="size-4 me-2" />
              תבנית אישית חדשה
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
