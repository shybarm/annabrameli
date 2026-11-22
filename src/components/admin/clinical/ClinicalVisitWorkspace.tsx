import {Stethoscope, Save, FileText} from "lucide-react";

import {ClinicalTemplates} from './ClinicalTemplates';
import { useBlocker } from 'react-router-dom';
import { ClinicalDocuments } from './ClinicalDocuments';
import { clinicalDb as db, type ClinicalDocument } from './clinicalApi';
import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readVisit, visitFields, visitTemplates, appendTemplate, type VisitContent } from './visitModel';

type VisitRow = { appointment_id: string; revision: number; content: VisitContent; updated_at: string };
type Version = { revision: number; content: VisitContent; saved_at: string };
export function ClinicalVisitWorkspace({ appointmentId, legacy }: { appointmentId: string; legacy: { visit_summary?: string | null; treatment_plan?: string | null; medications?: string | null } }) {
 const cache = useQueryClient();
 const inFlight = useRef(false);
 const [finalizing,setFinalizing] = useState(false);
 const [finalized,setFinalized] = useState(false);
 const ready = useQuery({queryKey:['clinical-signing-ready'],queryFn:async()=>{const r=await db.rpc('clinical_signing_ready');if(r.error)throw r.error;return r.data===true;}});
 const [draft, setDraft] = useState<VisitContent | null>(null);
 const [base, setBase] = useState<VisitContent | null>(null);
 const [revision, setRevision] = useState(0);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
 const query = useQuery({ queryKey: ['clinical-visit', appointmentId], queryFn: async () => {
  const { data, error } = await db.from('clinical_visits').select('*').eq('appointment_id', appointmentId).maybeSingle();
  if (error) throw error;
  return data as unknown as VisitRow | null;
 }, refetchOnWindowFocus: false });
 const versions = useQuery({ queryKey: ['clinical-versions', appointmentId], queryFn: async () => {
  const { data, error } = await db.from('clinical_visit_versions').select('revision,content,saved_at').eq('appointment_id', appointmentId).order('revision', { ascending: false });
  if (error) throw error;
  return data as unknown as Version[];
 } });
 useEffect(() => {
  if (!query.isSuccess || draft !== null) return;
  const initial = query.data ? readVisit(query.data.content) : readVisit({ assessment: legacy.visit_summary || '', plan: legacy.treatment_plan || '', medications: legacy.medications || '' });
  setDraft(initial); setBase(initial); setRevision(query.data?.revision || 0);
 }, [query.isSuccess, query.data, draft, legacy]);
 const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(base);
 const blocker=useBlocker(dirty || saving || finalizing);
 useEffect(()=>{if(blocker.state==='blocked'){if(window.confirm('יש שינויים שטרם נשמרו. לצאת בלי לשמור?'))blocker.proceed();else blocker.reset();}},[blocker]);
 useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty || saving || finalizing){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,saving,finalizing]);
 const save = async () => {
  if (!draft || inFlight.current) return;
  inFlight.current=true;
  const snapshot = { ...draft }; setSaving(true); setError('');
  try {
   const result = await db.rpc('save_clinical_visit', { p_appointment_id: appointmentId, p_expected_revision: revision, p_content: snapshot });
   if (result.error) throw result.error;
   const saved = result.data as VisitRow;
   setRevision(saved.revision); setBase(snapshot);
   cache.setQueryData(['clinical-visit', appointmentId], saved);
   await cache.invalidateQueries({ queryKey: ['clinical-versions', appointmentId] });
  } catch (e) {
   setError(String((e as { message?: string }).message).includes('CLINICAL_CONFLICT') ? 'הביקור השתנה בחלון אחר. הטקסט שלך נשאר כאן. פתחו את הגרסה העדכנית בחלון נוסף והשוו לפני המשך.' : 'השמירה לא הושלמה. הטקסט נשאר במסך. נסו לשמור שוב לפני היציאה.');
  } finally { inFlight.current=false; setSaving(false); }
 };
 const finalize=async()=>{
  if(!draft || inFlight.current || !ready.data)return;
  inFlight.current=true;setFinalizing(true);setError('');
  try{
   const r=await db.rpc('finalize_clinical_visit',{p_appointment_id:appointmentId,p_expected_revision:revision,p_content:draft});
   if(r.error)throw r.error;
   const doc=r.data as ClinicalDocument;setRevision(doc.revision);setBase({...draft});setFinalized(true);
   await Promise.all([cache.invalidateQueries({queryKey:['clinical-documents']}),cache.invalidateQueries({queryKey:['clinical-versions',appointmentId]}),cache.invalidateQueries({queryKey:['clinical-timeline']})]);
  }catch(e){const msg=(e as {message?:string}).message||'';setError(msg.includes('CLINICAL_CONFLICT')?'הביקור השתנה בחלון אחר. הטקסט שלך נשאר כאן; יש להשוות לגרסה העדכנית.':msg.includes('CLINICAL_PATIENT_ID_REQUIRED')?'יש להשלים שם ותעודת זהות בתיק המטופל לפני שמירת מסמך.':msg.includes('CLINICAL_EMPTY')?'יש להזין תוכן לביקור.':'הביקור לא אושר. הטקסט נשאר במסך; נסו שוב.');}
  finally{inFlight.current=false;setFinalizing(false);}
 };
 useEffect(() => {
  if (!dirty || saving || finalizing || error) return;
  const timer = window.setTimeout(() => { void save(); }, 1500);
  return () => window.clearTimeout(timer);
 }, [draft, dirty, saving, finalizing, error, revision]);
 if (query.isError) return <Card><CardContent className="p-6"><p role="alert">לא ניתן לטעון את סביבת הביקור. אין ליצור רשומה ריקה במקום המידע הקיים.</p><Button onClick={() => query.refetch()}>נסה שוב</Button></CardContent></Card>;
 if (!draft) return <p role="status">טוען את הביקור...</p>;
 return <div dir="rtl" className="grid gap-6 pb-28 lg:grid-cols-[1fr_280px]">
  <Card><CardHeader className="border-b bg-background"><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary"/>בדיקה וסיכום ביקור</CardTitle><p role="status" className="text-sm text-muted-foreground">{finalized && !dirty ? 'הביקור נשמר עם חותמת וחתימה' : saving ? 'שומר טיוטה...' : dirty ? 'יש שינויים שלא נשמרו' : revision ? `נשמר בשרת, גרסה ${revision}` : 'טרם נשמרה טיוטה חדשה'}</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</CardHeader>
  <CardContent className="space-y-6 pt-6"><p className="text-sm text-muted-foreground">לחיצה על שמור מאשרת את תוכן הביקור ומפיקה מסמך עם חותמת וחתימת הרופאה. שמירה אוטומטית שומרת טיוטה בלבד.</p>{ready.isSuccess && !ready.data && <p>אישור הביקור זמין בחשבון הרופאה בלבד.</p>}<fieldset disabled={finalizing} className="space-y-6">{visitFields.map(([key,label]) => <div key={key}><label htmlFor={`clinical-${key}`} className="mb-2 block font-medium">{label}</label><Textarea id={`clinical-${key}`} rows={key === 'history' ? 7 : 4} value={draft[key]} onChange={event => {setFinalized(false);setDraft({ ...draft, [key]: event.target.value });}} className="resize-y leading-7" /></div>)}</fieldset></CardContent></Card>
  <aside className="space-y-4"><Card><CardHeader><CardTitle className="text-lg">תבניות לבדיקה</CardTitle></CardHeader><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">התבנית מתווספת לטקסט הקיים. יש להשלים לפי הביקור.</p>{visitTemplates.map(t => <Button key={t.name} variant="outline" disabled={finalizing} className="w-full" onClick={() => setDraft({ ...draft, [t.field]: appendTemplate(draft[t.field],t.text) })}>{t.name}</Button>)}<ClinicalTemplates disabled={finalizing} onInsert={(field,body)=>setDraft({...draft,[field]:appendTemplate(draft[field],body)})}/></CardContent></Card>
  <Card><CardHeader><CardTitle className="text-lg">היסטוריית שמירה</CardTitle></CardHeader><CardContent><details><summary className="cursor-pointer text-sm">הצג שמירות קודמות</summary>{versions.isError ? <p role="alert">לא ניתן לטעון היסטוריית גרסאות.</p> : versions.data?.map(v => <Button key={v.revision} variant="ghost" className="h-auto w-full justify-start whitespace-normal" onClick={() => setSelectedVersion(v)}>גרסה {v.revision} · {new Date(v.saved_at).toLocaleString('he-IL')}</Button>)}{selectedVersion && <div className="mt-4 border-t pt-4"><p className="font-medium">גרסה {selectedVersion.revision}, לקריאה בלבד</p>{visitFields.map(([key,label]) => <div key={key} className="my-3"><strong>{label}</strong><p className="whitespace-pre-wrap text-sm">{readVisit(selectedVersion.content)[key] || 'לא תועד'}</p></div>)}<Button variant="outline" onClick={() => setSelectedVersion(null)}>סגור גרסה</Button></div>}</details></CardContent></Card>
  </aside>
  <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Save className="h-4 w-4"/><span>{saving ? 'שומר טיוטה...' : finalized && !dirty ? 'הביקור אושר ונחתם' : dirty ? 'שינויים ממתינים לשמירה' : 'השינויים נשמרים אוטומטית'}</span></div><div className="flex flex-wrap items-center gap-2"><ClinicalDocuments appointmentId={appointmentId} compact/><Button variant="outline" onClick={save} disabled={saving||finalizing||(!dirty&&revision>0)}><Save className="ml-2 h-4 w-4"/>שמור טיוטה</Button><Button onClick={finalize} disabled={saving||finalizing||!ready.data}>{finalizing?'שומר...':<><FileText className="ml-2 h-4 w-4"/>שמור ואשר ביקור</>}</Button></div></div></div>
 </div>;
}
