import { clinicalDb, type ClinicalDocument } from './clinicalApi';
import { visitFields } from './visitModel';
export type DocumentKind = 'summary' | 'prescription';
export const escapeClinicalHtml = (s: unknown) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function clinicalDocumentHtml(doc: ClinicalDocument, kind: DocumentKind, reading = false) {
  const s = doc.snapshot,
    e = escapeClinicalHtml;
  const stamp = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(s.issuer.stamp_data)
    ? s.issuer.stamp_data
    : '';
  if (kind === 'prescription' && !s.content.medications?.trim())
    throw new Error('אין תרופות במסמך המאושר');
  const fields =
    kind === 'prescription' ? visitFields.filter(([k]) => k === 'medications') : visitFields;
  const date = e(new Date(s.visit_date).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' }));
  const css = `
   *{box-sizing:border-box}html{color-scheme:light}body{margin:0;width:700px;background:#fff;color:#232b36;font:16px/1.55 Arial,sans-serif}
   header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:2px solid #385673;padding-bottom:12px}
   header strong{display:block;font-size:19px}header div,header small{font-size:13px}header small{text-align:end;color:#485461}
   h1{font-size:27px;line-height:1.2;margin:22px 0 12px}h2{font-size:14px;font-weight:700;color:#36536f;line-height:1.4;margin:16px 0 4px}
   .patient{display:flex;flex-wrap:wrap;gap:4px 20px;padding-bottom:12px;border-bottom:1px solid #dce0e5}
   .patient span{font-size:14px}.patient b{font-weight:normal;color:#505b67}
   p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}section{margin:0 0 4px}
   .signature{width:172px;max-width:100%;margin:12px auto 0 0;text-align:center;break-inside:avoid;font-size:12px}
   .stamp{display:block;width:155px;height:88px;object-fit:contain;margin:0 auto}
   ${reading ? 'html{background:#f1f2f4;padding:clamp(8px,3vw,28px)}body{width:100%;max-width:780px;min-height:90vh;margin:auto;padding:clamp(18px,5vw,52px);box-shadow:0 1px 4px #18202c20;border-radius:4px}@media(max-width:520px){header{gap:8px;flex-wrap:wrap}h1{font-size:24px}.patient{gap:3px 12px}header small{text-align:start}}' : ''}
 `;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${kind === 'summary' ? 'סיכום ביקור' : 'מרשם'}</title><style>${css}</style></head><body>
 <header><div><strong>${e(s.issuer.name)}</strong>${e(s.issuer.specialty)}</div><small>${e(s.issuer.address)}${s.issuer.license ? `<br>מספר רישיון: <bdi>${e(s.issuer.license)}</bdi>` : ''}</small></header>
 <h1>${kind === 'summary' ? 'סיכום ביקור' : 'מרשם'}</h1><div class="patient"><span><b>שם המטופל</b> ${e(s.patient.name)}</span><span><b>ת״ז</b> <bdi>${e(s.patient.id_number)}</bdi></span><span><b>תאריך הביקור</b> <bdi>${date}</bdi></span></div>
 ${fields
   .filter(([k]) => s.content[k]?.trim())
   .map(([k, label]) => `<section><h2>${e(label)}</h2><p>${e(s.content[k])}</p></section>`)
   .join('')}
 <footer class="signature"><strong>${e(s.issuer.name)}</strong>${stamp ? `<img class="stamp" src="${stamp}" alt="חותמת וחתימת הרופאה">` : ''}<p>אושר ונחתם על ידי הרופאה</p></footer></body></html>`;
}

export async function loadApprovedRendering(doc: ClinicalDocument): Promise<ClinicalDocument> {
  const result = await clinicalDb.rpc('clinical_document_stamp', { p_document: doc.id });
  if (result.error || typeof result.data !== 'string') throw new Error('טעינת החותמת נכשלה');
  return {
    ...doc,
    snapshot: { ...doc.snapshot, issuer: { ...doc.snapshot.issuer, stamp_data: result.data } },
  };
}
// Local PDF generation keeps clinical data in the browser and removes browser print headers.
export async function renderApprovedPdf(doc: ClinicalDocument, kind: DocumentKind): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:700px;height:1000px;border:0;';
  document.body.append(frame);
  try {
    const d = frame.contentDocument!;
    d.open();
    d.write(clinicalDocumentHtml(doc, kind));
    d.close();
    await d.fonts.ready;
    await Promise.all(Array.from(d.images).map((i) => i.decode()));
    // Protect individual text lines and the complete stamp from pagination cuts.
    const protectedRects: Array<{ top: number; bottom: number }> = [];
    const walker = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = d.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) protectedRects.push({ top: r.top, bottom: r.bottom });
    }
    // Keep a section heading with the first line of its paragraph.
    for (const heading of d.querySelectorAll('section h2')) {
      const paragraph = heading.nextElementSibling;
      if (!paragraph) continue;
      const range = d.createRange();
      range.selectNodeContents(paragraph);
      const firstLine = range.getClientRects()[0];
      if (firstLine)
        protectedRects.push({ top: heading.getBoundingClientRect().top, bottom: firstLine.bottom });
    }
    const stamp = d.querySelector('.signature')!.getBoundingClientRect();
    const lastLine = protectedRects
      .filter((r) => r.bottom <= stamp.top)
      .sort((a, b) => b.bottom - a.bottom)[0];
    protectedRects.push({ top: lastLine?.top ?? stamp.top, bottom: stamp.bottom });
    const canvas = await html2canvas(d.body, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 700,
      height: Math.ceil(d.body.getBoundingClientRect().height) + 2,
    });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const width = 182,
      capacity = (269 * 700) / width;
    const pixels = canvas.getContext('2d')!;
    let y = 0,
      page = 0;
    while (y < canvas.height / 2) {
      let end = Math.min(y + capacity, canvas.height / 2);
      if (end < canvas.height / 2) {
        // Use the whitespace above a text line. Rounding through its glyphs can cut a Hebrew character.
        let previous;
        do {
          previous = end;
          for (const rect of protectedRects) {
            const safeTop = Math.floor(rect.top) - 3;
            if (safeTop > y + 1 && safeTop < end && rect.bottom + 3 > end) end = safeTop;
          }
        } while (end < previous);
        // The canvas font baseline can differ from DOM metrics. Cut the actual
        // painted page on a white scanline, including for mixed Hebrew/Latin text.
        const pixelEnd = Math.floor(end * 2);
        const pixelStart = Math.max(Math.ceil(y * 2) + 1, pixelEnd - 64);
        const stripHeight = pixelEnd - pixelStart + 1;
        if (stripHeight > 0) {
          const strip = pixels.getImageData(0, pixelStart, canvas.width, stripHeight).data;
          for (let row = stripHeight - 1; row >= 0; row--) {
            const start = row * canvas.width * 4;
            let empty = true;
            for (let x = start; x < start + canvas.width * 4; x += 4) {
              if (Math.min(strip[x], strip[x + 1], strip[x + 2]) < 248) {
                empty = false;
                break;
              }
            }
            if (empty) {
              end = (pixelStart + row) / 2;
              break;
            }
          }
        }
      }
      if (end <= y + 1) throw new Error('לא ניתן לחלק את המסמך לעמודים');
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.ceil((end - y) * 2);
      slice
        .getContext('2d')!
        .drawImage(
          canvas,
          0,
          Math.round(y * 2),
          canvas.width,
          slice.height,
          0,
          0,
          canvas.width,
          slice.height,
        );
      if (page++) pdf.addPage();
      pdf.addImage(
        slice,
        'PNG',
        14,
        14,
        width,
        (slice.height / canvas.width) * width,
        undefined,
        'FAST',
      );
      y = end;
    }
    return pdf.output('blob');
  } finally {
    frame.remove();
  }
}
export async function clinicalDocumentPdf(doc: ClinicalDocument, kind: DocumentKind) {
  return renderApprovedPdf(await loadApprovedRendering(doc), kind);
}
export async function printClinicalDocument(doc: ClinicalDocument, kind: DocumentKind) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('יש לאפשר חלונות קופצים להצגת המסמך');
  try {
    const blob = await clinicalDocumentPdf(doc, kind);
    const url = URL.createObjectURL(blob);
    popup.opener = null;
    popup.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 300000);
  } catch (e) {
    popup.close();
    throw e;
  }
}
