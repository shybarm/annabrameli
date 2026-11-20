import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { validUploadMetadata, validSignature } from './upload-validation.ts';

const Credential = z.object({ token: z.string().min(20).max(256), patientId: z.string().uuid().optional() });
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), n => n.toString(16).padStart(2,'0')).join('');
export async function uploadTokenDocument(req: Request, kind: 'intake' | 'guest') {
  const reply = (body: object, status = 200) => new Response(JSON.stringify(body), {status, headers: {...corsHeaders, 'Content-Type':'application/json'}});
  if (req.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (req.method !== 'POST') return reply({error:'Method not allowed'},405);
  try {
    const form = await req.formData();
    const parsed = Credential.safeParse({token:form.get(kind === 'intake' ? 'intake_token' : 'upload_token'), patientId:form.get('patient_id') || undefined});
    const file = form.get('file');
    if (!parsed.success || !(file instanceof File)) return reply({error:'Invalid upload credentials or file'},400);
    if (!validUploadMetadata(file.type,file.size)) return reply({error:'Only JPG PNG WEBP PDF, up to 10 MB each'},400);
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    let q = db.from(kind === 'intake' ? 'intake_tokens' : 'upload_tokens').select('id,patient_id').eq('token',parsed.data.token).gt('expires_at',new Date().toISOString()).is(kind === 'intake' ? 'completed_at' : 'used_at',null);
    if (parsed.data.patientId) q = q.eq('patient_id',parsed.data.patientId);
    const {data:token,error} = await q.maybeSingle();
    if (error || !token?.patient_id) return reply({error:'Invalid or expired token'},403);
    const {data:patient,error:pe} = await db.from('patients').select('id').eq('id',token.patient_id).maybeSingle();
    if (pe || !patient) return reply({error:'Invalid patient'},403);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validSignature(file.type,bytes)) return reply({error:'File content does not match type'},400);
    const hash = hex(await crypto.subtle.digest('SHA-256',bytes));
    const key = hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${kind}:${token.id}:${hash}`)));
    const ext = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[file.type];
    const path = `${patient.id}/token-${key}.${ext}`;
    // Never overwrite: a retry uses the same content-addressed path. Retain an orphan on DB failure so retry can finalize it.
    const {error:ue} = await db.storage.from('patient-documents').upload(path,bytes,{contentType:file.type,upsert:false});
    if (ue && !['Duplicate','409'].includes(String(ue.statusCode)) && !ue.message.toLowerCase().includes('already exists')) return reply({error:'File upload failed; retry this file'},500);
    const {data:did,error:de} = await db.rpc('record_token_document',{p_token:parsed.data.token,p_kind:kind,p_patient_id:patient.id,p_key:key,p_path:path,p_title:file.name,p_mime:file.type,p_size:file.size});
    if (de || !did) return reply({error:'File not finalized in chart; retry this file'},de?.message.includes('INVALID_TOKEN') ? 403 : 500);
    return reply({success:true,document:{id:did,file_path:path},scan_status:'pending'});
  } catch { return reply({error:'Upload failed; retry this file'},500); }
}
