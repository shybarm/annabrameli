import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const labels: Record<string,string>={reason:'סיבת הפנייה',current_appointment:'תור קיים',availability:'ימים ושעות מתאימים',notice:'זמינות בהתראה קצרה',format:'העדפת סוג הביקור'};
const stages: Record<string,string>={human:'ממתין לצוות',completed:'השאלון הושלם',stopped:'עדכונים הופסקו',reason:'איסוף סיבת הפנייה',current_appointment:'בירור תור קיים',availability:'בירור זמינות',notice:'בירור התראה',format:'העדפת סוג ביקור'};
const statuses: Record<string,string>={pending:'ממתינה לשליחה',processing:'בשליחה',accepted:'הועברה לשירות',sent:'נשלחה',delivered:'נמסרה',read:'נקראה',failed:'השליחה נכשלה',noAccount:'אין חשבון וואטסאפ',received:'התקבלה',cancelled:'בוטלה'};
export default function WhatsAppInbox() {
 const {hasPermission}=useAuth(); const allowed=hasPermission('canEditAppointments');
 const qc=useQueryClient(); const [selected,setSelected]=useState<string|null>(null); const [search,setSearch]=useState(''); const [reply,setReply]=useState('');
 const health=useQuery({queryKey:['clinic-whatsapp-health'],enabled:allowed,queryFn:async()=>{
  const {data,error}=await supabase.from('whatsapp_bot_settings').select('setup_state,updated_at,last_incoming_at,quota_exceeded_at').single();
  if(error)throw error; return data;
 },refetchInterval:10000});
 const conversations=useQuery({queryKey:['clinic-whatsapp'],enabled:allowed,queryFn:async()=>{
  const {data,error}=await supabase.from('whatsapp_conversations').select('*').order('updated_at',{ascending:false}).limit(200);
  if(error)throw error; return data;
 },refetchInterval:5000});
 const messages=useQuery({queryKey:['clinic-whatsapp-messages',selected],enabled:allowed&&!!selected,queryFn:async()=>{
  const {data,error}=await supabase.from('whatsapp_messages').select('*').eq('conversation_id',selected!).order('created_at',{ascending:false}).limit(100);
  if(error)throw error; return data.reverse();
 },refetchInterval:5000});
 const action=useMutation({mutationFn:async({id,kind,text}:{id:string;kind:string;text?:string})=>{
  const {error}=await supabase.rpc('staff_whatsapp_action',{p_conversation:id,p_action:kind,p_text:text||''}); if(error)throw error;
 },onSuccess:()=>{qc.invalidateQueries({queryKey:['clinic-whatsapp']});qc.invalidateQueries({queryKey:['clinic-whatsapp-messages']});},onError:()=>toast({title:'הפעולה לא נשמרה. נסו שוב.',variant:'destructive'})});
 const current=conversations.data?.find(c=>c.id===selected);
 if(!allowed)return <p>אין הרשאה לצפייה בפניות המרפאה.</p>;
 return <div dir="rtl" className="space-y-4">
  <h1 className="text-2xl font-bold">הודעות וואטסאפ</h1>
  <p className="text-sm text-muted-foreground">מספר המרפאה: 055-507-0399. התשובות נשמרות לצוות; תור מוקדם נקבע רק לאחר בדיקה ואישור.</p>
  {health.data?.last_incoming_at&&<p className="text-xs text-muted-foreground">הודעה נכנסת אחרונה התקבלה במערכת: {new Date(health.data.last_incoming_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})}</p>}
  {health.data?.quota_exceeded_at&&<p role="alert" className="rounded-lg border border-amber-400 bg-amber-50 p-3">GREEN API דיווח על חריגה ממגבלת אנשי הקשר. ייתכן שחלק מההודעות אינן מתקבלות. יש לבדוק את המסלול בחשבון GREEN API.</p>}
  {conversations.isError&&<p role="alert">לא ניתן לטעון פניות כרגע.</p>}
  <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
   <aside className="space-y-2"><Input placeholder="חיפוש לפי שם או טלפון" value={search} onChange={e=>setSearch(e.target.value)}/>
    {conversations.isPending&&<p>טוען פניות…</p>}
    {conversations.data?.filter(c=>(c.name+' '+c.phone).includes(search)).map(c=><button key={c.id} onClick={()=>{setSelected(c.id);setReply('');action.mutate({id:c.id,kind:'read'});}} className={'w-full rounded-lg border p-3 text-right '+(selected===c.id?'bg-muted':'bg-white')}>
     <strong>{c.name||c.phone}</strong>{c.unread&&<span className="mr-2 text-primary">● חדש</span>}
     <p dir="ltr" className="text-right text-sm">{c.phone}</p><p className="text-sm">{stages[c.bot_stage]||c.bot_stage} · {c.source==='waitlist'?'רשימת המתנה':'פנייה בוואטסאפ'}</p>
    </button>)}
    {conversations.data?.length===0&&<p>עדיין אין פניות.</p>}
   </aside>
   <section className="space-y-4">{current?<>
    <div className="rounded-lg border bg-white p-4 space-y-3"><h2 className="font-bold">סיכום הפנייה: {current.name||current.phone}</h2>
     {Object.entries((current.answers||{}) as Record<string,string>).map(([key,value])=><p key={key} className="whitespace-pre-wrap"><strong>{labels[key]||key}: </strong>{value}</p>)}
     <p className="text-sm">{current.whatsapp_consent_at ? `הסכמה לעדכוני רשימת המתנה בוואטסאפ: ${new Date(current.whatsapp_consent_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})}` : 'לא תועדה הסכמה חדשה לעדכוני רשימת המתנה'}</p>
     <p>{stages[current.bot_stage]}{current.opted_out?' · התקבלה בקשת הפסקה':''}</p>
     <Button variant="outline" disabled={action.isPending} onClick={()=>action.mutate({id:current.id,kind:'pause'})}>סימון להמשך טיפול הצוות</Button>
    </div>
    <div className="max-h-[500px] overflow-auto space-y-3 rounded-lg border p-4 bg-white">
     {messages.isError&&<p role="alert">לא ניתן לטעון הודעות.</p>}
     {messages.data?.map(m=><div key={m.id} className={'rounded-lg p-3 '+(m.direction==='incoming'?'bg-muted':'bg-primary/10')}>
      <p className="text-xs text-muted-foreground">{m.direction==='incoming'?'פונה':'המרפאה'} · {new Date(m.created_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'})} · {statuses[m.status]||m.status}</p>
      <p className="whitespace-pre-wrap break-words">{m.body}</p>
     </div>)}
    </div>
    <Textarea value={reply} maxLength={4000} onChange={e=>setReply(e.target.value)} placeholder="תשובת צוות המרפאה בוואטסאפ"/>
    <p className="text-xs text-muted-foreground">תשובות הפונים נשמרות כאן למענה אנושי. יש לכבד בקשות הסרה ולא לשלוח שוב הודעה שמסירתה אינה ודאית לפני בדיקה בוואטסאפ.</p>
    <Button disabled={!reply.trim()||action.isPending} onClick={()=>action.mutate({id:current.id,kind:'reply',text:reply},{onSuccess:()=>setReply('')})}>שליחה ממספר המרפאה</Button>
   </>:<p>בחרו פנייה לצפייה בתשובות ובהודעות.</p>}</section>
  </div>
 </div>;
}
