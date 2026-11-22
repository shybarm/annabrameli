import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readVisit } from './visitModel';
export function ClinicalPatientTimeline({patientId}: {patientId: string}) {
 const query = useQuery({queryKey:['clinical-timeline', patientId], queryFn: async () => {
  // Read through the existing patient-to-appointment relation; never accept patient IDs from clinical JSON.
  const {data: appointments,error} = await supabase.from('appointments').select('id,scheduled_at').eq('patient_id',patientId).order('scheduled_at',{ascending:false});
  if(error) throw error;
  if(!appointments?.length) return [];
  const result = await supabase.from('clinical_visits' as never).select('*').in('appointment_id',appointments.map(a=>a.id));
  if(result.error) throw result.error;
  const visits = result.data as unknown as {appointment_id:string;revision:number;content:unknown;updated_at:string}[];
  return appointments.flatMap(a=>visits.filter(v=>v.appointment_id===a.id).map(v=>({...v,date:a.scheduled_at})));
 }});
 return <Card><CardHeader><CardTitle>רצף הביקורים</CardTitle></CardHeader><CardContent className="space-y-4">{query.isPending ? <p>טוען ביקורים...</p> : query.isError ? <p role="alert">לא ניתן לטעון את רצף הביקורים.</p> : !query.data?.length ? <p>טרם נשמרו ביקורים בסביבת הבדיקה החדשה. סיכומים קודמים מופיעים בהמשך.</p> : query.data.map(v=><div key={v.appointment_id} className="border-s-2 border-primary ps-4"><Link className="font-medium underline" to={`/admin/appointments/${v.appointment_id}`}>{new Date(v.date).toLocaleDateString('he-IL')} · גרסה {v.revision}</Link><p className="whitespace-pre-wrap">{readVisit(v.content).assessment || 'טרם נכתב סיכום'}</p>{readVisit(v.content).followup && <p className="mt-2 whitespace-pre-wrap"><strong>המשך מעקב: </strong>{readVisit(v.content).followup}</p>}<p className="text-sm text-muted-foreground">טיוטת תיעוד, אינה מסמך חתום</p></div>)}</CardContent></Card>;
}
