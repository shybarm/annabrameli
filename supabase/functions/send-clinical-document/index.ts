import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
const cors={'Access-Control-Allow-Origin':'https://ihaveallergy.com','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return reply({error:'method'},405);
 const auth=req.headers.get('authorization')||'';
 const userDb=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await userDb.auth.getUser();if(!user)return reply({error:'unauthorized'},401);
 const {data:ready}=await userDb.rpc('clinical_signing_ready');if(!ready)return reply({error:'forbidden'},403);
 const token=Deno.env.get('GREEN_API_TOKEN');if(!token)return reply({error:'not_configured'},503);
 if(Number(req.headers.get('content-length'))>12000000)return reply({error:'file_too_large'},413);
 let form:FormData;try{form=await req.formData();}catch{return reply({error:'invalid'},400);}
 const id=String(form.get('document_id')||''),kind=String(form.get('kind')||''),file=form.get('file'),confirmed=String(form.get('phone')||'');
 if(!['summary','prescription'].includes(kind)||!(file instanceof File)||file.size>10000000||file.type!=='application/pdf')return reply({error:'invalid_pdf'},400);
 if(await file.slice(0,5).text()!=='%PDF-')return reply({error:'invalid_pdf'},400);
 // The RPC derives the recipient from the stored patient, never from arbitrary caller input.
 const {data:job,error}=await userDb.rpc('claim_clinical_delivery',{p_document:id,p_kind:kind,p_confirmed_phone:confirmed});
 if(error)return reply({error:error.message.includes('ALREADY')?'already_requested':'recipient_or_document_invalid'},409);
 const service=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 let state='uncertain',messageId:string|null=null;
 try{
  const payload=new FormData();payload.append('chatId',job.phone+'@c.us');payload.append('file',file,kind==='summary'?'visit-summary.pdf':'prescription.pdf');payload.append('fileName',kind==='summary'?'visit-summary.pdf':'prescription.pdf');
  payload.append('caption', (kind==='summary'?'מצורף סיכום הביקור':'מצורף המרשם')+' ממרפאת ד״ר אנה ברמלי. לכל שאלה אפשר להשיב כאן או להתקשר ל־055-507-0399.');
  const response=await fetch('https://7107.api.greenapi.com/waInstance710722808546/sendFileByUpload/'+encodeURIComponent(token),{method:'POST',body:payload,signal:AbortSignal.timeout(20000)});
  const result=await response.json().catch(()=>({}));
  if(response.ok&&typeof result.idMessage==='string'){state='accepted';messageId=result.idMessage;}
  else if(response.status>=400&&response.status<500)state='failed';
 }catch{/* An uncertain provider result must not trigger automatic resend. */}
 const {error:saveError}=await service.from('clinical_document_deliveries').update({state,provider_message_id:messageId,updated_at:new Date().toISOString()}).eq('document_id',id).eq('kind',kind);
 if(saveError)return reply({state:'uncertain'},202);
 return reply({state},state==='accepted'?200:202);
});
