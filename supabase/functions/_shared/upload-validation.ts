export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export function validUploadMetadata(type: string, size: number) {
  return UPLOAD_TYPES.includes(type) && size > 0 && size <= MAX_UPLOAD_SIZE;
}
export function validSignature(type: string, b: Uint8Array) {
  if (type === 'image/jpeg') return b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (type === 'image/png') return [137,80,78,71,13,10,26,10].every((v,i) => b[i] === v);
  if (type === 'image/webp') return new TextDecoder().decode(b.slice(0,4)) === 'RIFF' && new TextDecoder().decode(b.slice(8,12)) === 'WEBP';
  return type === 'application/pdf' && new TextDecoder().decode(b.slice(0,5)) === '%PDF-';
}
