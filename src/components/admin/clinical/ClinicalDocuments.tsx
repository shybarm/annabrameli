import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {clinicalDb,type ClinicalDocument} from './clinicalApi';
import {type DocumentKind} from './clinicalDocument';
import {ClinicalDocumentViewer} from './ClinicalDocumentViewer';
import {toast} from 'sonner';
export function ClinicalDocuments({appointmentId,patientId,compact=false}:{appointmentId?:string;patientId?:string;compact?:boolean}) {
 const [selected,setSelected]=useState<ClinicalDocument|null>(null);
 const cache=useQueryClient();const [busy,setBusy]=useState(false);const [history,setHistory]=useState(false);
 const ready=useQuery({queryKey:['clinical-signing-ready'],queryFn:async()=>{const r=await clinicalDb.rpc('clinical_signing_ready');return r.data===true;}});
 const q=useQuery({queryKey:['clinical-documents',appointmentId,patientId],queryFn:async()=>{
  let query=clinicalDb.from('clinical_documents').select('*').order('signed_at',{ascending:false});
  if(appointmentId)query=query.eq('appointment_id',appointmentId);if(patientId)query=query.eq('patient_id',patientId);
  const r=await query;if(r.error)throw r.error;return r.data as ClinicalDocument[];
 }});
 const deliveries=useQuery({queryKey:['clinical-deliveries',appointmentId,patientId],enabled:!!ready.data,queryFn:async()=>{const r=await clinicalDb.from('clinical_document_deliveries').select('document_id,kind,state');if(r.error)throw r.error;return r.data as {document_id:string;kind:string;state:string}[];}});
 const send=async(d:ClinicalDocument,k:DocumentKind,blob:Blob)=>{
  if(busy)return;setBusy(true);
  try{
   const {data:patient,error}=await supabase.from('patients').select('phone').eq('id',d.patient_id).single();if(error)throw error;
   let phone=(patient.phone||'').replace(/\D/g,'');if(phone.startsWith('0'))phone='972'+phone.slice(1);
   if(!/^9725\d{8}$/.test(phone))throw new Error('יש לעדכן מספר נייד תקין בתיק המטופל');
   if(!window.confirm(`לשלוח ${k==='summary'?'סיכום ביקור':'מרשם'} כקובץ PDF ל-${d.snapshot.patient.name}, למספר +${phone}?`))return;
   const form=new FormData();form.append('document_id',d.id);form.append('kind',k);form.append('phone',phone);form.append('file',blob,k==='summary'?'visit-summary.pdf':'prescription.pdf');
   const result=await supabase.functions.invoke('send-clinical-document',{body:form});
   if(result.error)throw new Error('השליחה לא אושרה. בדקו את מצב השליחה לפני ניסיון נוסף.');
   if(result.data?.state==='accepted')toast.success('קובץ ה-PDF התקבל לשליחה בוואטסאפ');else toast.error('אין אישור לשליחה. יש לבדוק בוואטסאפ לפני ניסיון נוסף.');
  }catch(e){toast.error((e as Error).message)}finally{setBusy(false);await cache.invalidateQueries({queryKey:['clinical-deliveries']});}
 };
 const seen=new Set<string>();const current=(q.data||[]).filter(d=>{if(seen.has(d.appointment_id))return false;seen.add(d.appointment_id);return true;});const docs=history?q.data||[]:current;
 const state=(d:ClinicalDocument,k:DocumentKind)=>deliveries.data?.find(x=>x.document_id===d.id&&x.kind===k)?.state;
 return <section dir="rtl" className={compact?"flex items-center gap-2":"space-y-3"}>{!compact&&<h2 className="!text-lg font-semibold">סיכומים ומרשמים מאושרים</h2>}{q.isPending?<p>טוען מסמכים...</p>:q.isError?<p role="alert">לא ניתן לטעון מסמכים שמורים.</p>:!docs.length?<> {compact?<span className="text-xs text-muted-foreground">אין מסמך מאושר</span>:<p className="text-sm text-muted-foreground">אין עדיין מסמכים מאושרים.</p>}</>:docs.map(d=><div key={d.id} className={compact?"flex items-center gap-2":"rounded-lg border p-3 space-y-2"}><p className={compact?"hidden":"text-sm"}>אושר ב-{new Date(d.signed_at).toLocaleString('he-IL')}</p><Button size={compact?"sm":"default"} variant="outline" onClick={()=>setSelected(d)}>הצג מסמך</Button></div>)}{(q.data?.length||0)>current.length&&<Button variant="ghost" onClick={()=>setHistory(!history)}>{history?'הסתר מסמכים קודמים':'הצג מסמכים קודמים'}</Button>}{selected&&<ClinicalDocumentViewer key={selected.id} doc={selected} onClose={()=>setSelected(null)} canSend={!!ready.data&&!deliveries.isPending&&!deliveries.isError} sending={busy} deliveryState={k=>state(selected,k)} onSend={(k,blob)=>send(selected,k,blob)}/>}</section>;
}
