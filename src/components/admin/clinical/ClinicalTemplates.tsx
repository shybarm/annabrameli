import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {clinicalDb} from './clinicalApi';
import {visitFields,type VisitField} from './visitModel';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {toast} from 'sonner';
type Template={id:string;name:string;field:VisitField;body:string};
export function ClinicalTemplates({onInsert,disabled}:{onInsert:(field:VisitField,body:string)=>void;disabled:boolean}){
 const cache=useQueryClient(),[editing,setEditing]=useState(false),[name,setName]=useState(''),[body,setBody]=useState(''),[field,setField]=useState<VisitField>('history'),[busy,setBusy]=useState(false);
 const q=useQuery({queryKey:['clinical-templates'],queryFn:async()=>{const r=await clinicalDb.from('clinical_templates').select('*').order('name',{ascending:true});if(r.error)throw r.error;return r.data as Template[]}});
 const save=async()=>{setBusy(true);try{const r=await clinicalDb.from('clinical_templates').insert({name:name.trim(),field,body});if(r.error)throw r.error;await cache.invalidateQueries({queryKey:['clinical-templates']});setEditing(false);setName('');setBody('');}catch{toast.error('התבנית לא נשמרה. נסו שוב.')}finally{setBusy(false)}};
 return <div className="space-y-2">{q.isError&&<p role="alert">לא ניתן לטעון תבניות אישיות.</p>}{q.data?.map(t=><Button key={t.id} variant="outline" disabled={disabled} className="w-full" onClick={()=>onInsert(t.field,t.body)}>{t.name}</Button>)}<Button variant="ghost" disabled={disabled} onClick={()=>setEditing(!editing)}>תבנית חדשה</Button>{editing&&<div className="space-y-2"><Input aria-label="שם התבנית" placeholder="שם התבנית" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/><select aria-label="שדה יעד לתבנית" className="w-full border rounded p-2" value={field} onChange={e=>setField(e.target.value as VisitField)}>{visitFields.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><Textarea aria-label="תוכן התבנית" placeholder="טקסט כללי ללא פרטי מטופל" maxLength={20000} value={body} onChange={e=>setBody(e.target.value)}/><Button onClick={save} disabled={busy||!name.trim()||!body.trim()}>שמור תבנית</Button></div>}</div>;
}
