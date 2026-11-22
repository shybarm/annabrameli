import { clinicalDb, type ClinicalDocument } from './clinicalApi';
import { visitFields } from './visitModel';
export type DocumentKind = 'summary' | 'prescription';
export const escapeClinicalHtml = (s:unknown) => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function clinicalDocumentHtml(doc:ClinicalDocument,kind:DocumentKind) {
 const s=doc.snapshot,e=escapeClinicalHtml;
 const stamp=/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.issuer.stamp_data)?s.issuer.stamp_data:'';
 if(kind==='prescription'&&!s.content.medications?.trim())throw new Error('אין תרופות במסמך המאושר');
 const fields=kind==='prescription'?visitFields.filter(([k])=>k==='medications'):visitFields;
 return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title></title><style>*{box-sizing:border-box}body{font:15px Arial,sans-serif;color:#172334;line-height:1.45;width:700px;margin:0;background:white}header{border-bottom:1px solid #ced5dd;padding-bottom:9px;font-size:13px}h1{font-size:22px;margin:14px 0 10px}h2{font-size:15px;margin:12px 0 3px}p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.signature{width:210px;margin:12px auto 0 0;text-align:center;break-inside:avoid;font-size:12px;line-height:1.3}.stamp{display:block;width:185px;height:125px;object-fit:contain;margin:0 auto}.signature p{margin:2px 0}section{margin:0 0 5px}</style></head><body><header><strong>${e(s.issuer.name)}</strong><div>${e(s.issuer.specialty)}</div><div>${e(s.issuer.address)}</div>${s.issuer.license?`<div>מספר רישיון: ${e(s.issuer.license)}</div>`:''}</header><h1>${kind==='summary'?'סיכום ביקור':'מרשם'}</h1><div>שם המטופל: ${e(s.patient.name)} | ת.ז.: ${e(s.patient.id_number)}</div><div>תאריך הביקור: ${e(new Date(s.visit_date).toLocaleDateString('he-IL',{timeZone:'Asia/Jerusalem'}))}</div>${fields.filter(([k])=>s.content[k]?.trim()).map(([k,label])=>`<section><h2>${e(label)}</h2><p>${e(s.content[k])}</p></section>`).join('')}<footer class="signature"><strong>${e(s.issuer.name)}</strong>${stamp?`<img class="stamp" src="${stamp}" alt="חותמת וחתימת הרופאה">`:''}<p>אושר ונחתם דיגיטלית</p></footer></body></html>`;
}
// Local PDF generation keeps clinical data in the browser and removes browser print headers.
export async function clinicalDocumentPdf(doc:ClinicalDocument,kind:DocumentKind):Promise<Blob>{
 const stampResult=await clinicalDb.rpc('clinical_document_stamp',{p_document:doc.id});
 if(stampResult.error||typeof stampResult.data!=='string')throw new Error('לא ניתן לטעון את החותמת המאושרת. נסו שוב.');
 doc={...doc,snapshot:{...doc.snapshot,issuer:{...doc.snapshot.issuer,stamp_data:stampResult.data}}};
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:700px;height:1000px;border:0;';document.body.append(frame);
 try{
  const d=frame.contentDocument!;d.open();d.write(clinicalDocumentHtml(doc,kind));d.close();await d.fonts.ready;
  await Promise.all(Array.from(d.images).map(i=>i.decode()));
  // Protect individual text lines and the complete stamp from pagination cuts.
  const protectedRects:Array<{top:number;bottom:number}>=[];
  const walker=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT);let node:Node|null;
  while((node=walker.nextNode())){if(!node.textContent?.trim())continue;const range=d.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())protectedRects.push({top:r.top,bottom:r.bottom});}
  const stamp=d.querySelector('.signature')!.getBoundingClientRect();protectedRects.push({top:stamp.top,bottom:stamp.bottom});
  const canvas=await html2canvas(d.body,{scale:2,backgroundColor:'#ffffff',logging:false,windowWidth:700});
  const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});const width=182,capacity=269*700/width;let y=0,page=0;
  while(y<canvas.height/2){let end=Math.min(y+capacity,canvas.height/2);let changed=true;
   while(changed){changed=false;for(const r of protectedRects){if(r.top<end&&r.bottom>end&&r.top>y+1){end=r.top;changed=true;}}}
   if(end<=y+1)throw new Error('לא ניתן לחלק את המסמך לעמודים');
   const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=Math.ceil((end-y)*2);slice.getContext('2d')!.drawImage(canvas,0,Math.round(y*2),canvas.width,slice.height,0,0,canvas.width,slice.height);
   if(page++)pdf.addPage();pdf.addImage(slice,'PNG',14,14,width,slice.height/canvas.width*width,undefined,'FAST');y=end;
  }
  return pdf.output('blob');
 }finally{frame.remove();}
}
export async function printClinicalDocument(doc:ClinicalDocument,kind:DocumentKind){
 const popup=window.open('','_blank');if(!popup)throw new Error('יש לאפשר חלונות קופצים להצגת המסמך');
 try{const blob=await clinicalDocumentPdf(doc,kind);const url=URL.createObjectURL(blob);popup.opener=null;popup.location.href=url;window.setTimeout(()=>URL.revokeObjectURL(url),300000);}catch(e){popup.close();throw e;}
}
