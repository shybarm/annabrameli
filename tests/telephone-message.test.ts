import { telephoneMessage, whatsappPhone } from '../supabase/functions/_shared/telephone-message.ts';
const assert = (value: unknown) => { if (!value) throw new Error('Assertion failed'); };
Deno.test('telephone invitation includes Israel time, all links and joining instructions', () => {
  const message = telephoneMessage({ id: 'test', scheduled_at: '2026-11-22T17:00:00Z', duration_minutes: 45,
    modality: 'telephone', meeting_url: 'https://meet.google.com/abc-defg-hij' },
    'https://ihaveallergy.com/intake/test-token', 'https://ihaveallergy.com/visit.html#test-visit');
  for (const expected of ['19:00','45','intake/test-token','visit.html#test-visit','https://meet.google.com/abc-defg-hij','במיקרופון','אין להעביר']) assert(message.includes(expected));
});
Deno.test('missing or untrusted meeting links prevent an incomplete invitation', () => {
  for (const url of [null, 'https://example.com/abc-defg-hij', 'https://meet.google.com/abc-defg-hij?redirect=evil']) {
    let rejected = false;
    try { telephoneMessage({id: 'test',scheduled_at: '2026-11-22T17:00:00Z',duration_minutes: 45,meeting_url:url}, 'intake','visit'); }
    catch { rejected = true; }
    assert(rejected);
  }
});
Deno.test('recipient normalization supports Israeli and international numbers, rejects malformed input', () => {
  assert(whatsappPhone('055-507-0399') === '972555070399');
  assert(whatsappPhone('+972 55 507 0399') === '972555070399');
  assert(whatsappPhone('00972555070399') === '972555070399');
  assert(whatsappPhone('+1 (212) 555-0123') === '12125550123');
  for (const value of ['', '123', 'hidden', '0555070399@c.us', '0555070399<script>']) assert(whatsappPhone(value) === null);
});
