import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {clinicalDb,type ClinicalDocument} from './clinicalApi';
import {printClinicalDocument} from './clinicalDocument';
import {toast} from 'sonner';
export function ClinicalDocuments({appointmentId,patientId}:{appointmentId?:string;patientId?:string}) {
 const q=useQuery({queryKey:['clinical-documents',appointmentId,patientId],queryFn:async()=>{
  let query=clinicalDb.from('clinical_documents').select('*').order('signed_at',{ascending:false});
  if(appointmentId)query=query.eq('appointment_id',appointmentId);if(patientId)query=query.eq('patient_id',patientId);
  const r=await query;if(r.error)throw r.error;return r.data as ClinicalDocument[];
 }});
 const print=(d:ClinicalDocument,k:'summary'|'prescription')=>{try{printClinicalDocument(d,k)}catch(e){toast.error((e as Error).message)}};
 return <section dir="rtl" className="space-y-3"><h2 className="!text-lg font-semibold">סיכומים ומרשמים שנשמרו</h2>{q.isPending?<p>טוען מסמכים...</p>:q.isError?<p role="alert">לא ניתן לטעון מסמכים שמורים.</p>:!q.data?.length?<p className="text-sm text-muted-foreground">אין עדיין מסמכים בסביבת הביקור החדשה.</p>:q.data.map(d=><div key={d.id} className="rounded-lg border p-3 space-y-2"><p>גרסה {d.revision} · {new Date(d.signed_at).toLocaleString('he-IL')}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>print(d,'summary')}>סיכום ביקור</Button>{d.snapshot.content.medications?.trim()&&<Button variant="outline" onClick={()=>print(d,'prescription')}>מרשם</Button>}</div></div>)}</section>;
}
