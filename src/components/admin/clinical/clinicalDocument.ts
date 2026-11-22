import type { ClinicalDocument } from './clinicalApi';
import { visitFields } from './visitModel';
export const escapeClinicalHtml = (s:unknown) => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function clinicalDocumentHtml(doc:ClinicalDocument,kind:'summary'|'prescription') {
 const s=doc.snapshot, e=escapeClinicalHtml;
 const stamp=/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.issuer.stamp_data)?s.issuer.stamp_data:'';
 if(kind==='prescription'&&!s.content.medications?.trim()) throw new Error('אין תרופות בגרסה השמורה');
 const fields=kind==='prescription' ? visitFields.filter(([k])=>k==='medications') : visitFields;
 return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${kind==='summary'?'סיכום ביקור':'מרשם'}</title><style>@page{size:A4;margin:18mm}body{font:16px Arial,sans-serif;color:#172334;line-height:1.65;max-width:800px;margin:auto;padding:24px}header{border-bottom:2px solid #253e59;padding-bottom:16px}h1{font-size:25px}h2{font-size:17px;margin-bottom:4px}section{break-inside:avoid}p{white-space:pre-wrap;margin-top:4px}.meta{font-size:13px;color:#475569}.stamp{display:block;width:280px;max-height:240px;object-fit:contain;margin-top:12px}footer{margin-top:28px;border-top:1px solid #ddd;padding-top:12px}@media print{button{display:none}body{padding:0}}</style></head><body><header><strong>${e(s.issuer.name)}</strong><div>${e(s.issuer.specialty)}</div><div>${e(s.issuer.address)}</div>${s.issuer.license?`<div>מספר רישיון: ${e(s.issuer.license)}</div>`:''}</header><h1>${kind==='summary'?'סיכום ביקור':'מרשם'}</h1><div>שם המטופל: ${e(s.patient.name)} | ת.ז.: ${e(s.patient.id_number)}</div><div>תאריך הביקור: ${e(new Date(s.visit_date).toLocaleDateString('he-IL',{timeZone:'Asia/Jerusalem'}))}</div>${fields.filter(([k])=>s.content[k]?.trim()).map(([k,label])=>`<section><h2>${e(label)}</h2><p>${e(s.content[k])}</p></section>`).join('')}<footer><strong>${e(s.issuer.name)}</strong>${stamp?`<img class="stamp" src="${stamp}" alt="חותמת וחתימת הרופאה">`:''}<p class="meta">אושר ונשמר על ידי הרופאה ב-${e(new Date(doc.signed_at).toLocaleString('he-IL',{timeZone:'Asia/Jerusalem'}))}<br>מסמך ${e(doc.id)} | גרסה ${doc.revision}</p></footer></body></html>`;
}
export function printClinicalDocument(doc:ClinicalDocument,kind:'summary'|'prescription') {
 const popup=window.open('','_blank');if(!popup) throw new Error('יש לאפשר חלונות קופצים כדי להדפיס');
 popup.opener=null;popup.document.write(clinicalDocumentHtml(doc,kind));popup.document.close();
 Promise.all(Array.from(popup.document.images).map(img=>img.decode().catch(()=>undefined))).then(()=>{popup.focus();popup.print();});
}
