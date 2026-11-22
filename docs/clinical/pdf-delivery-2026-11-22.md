# Clinical PDF layout and WhatsApp delivery

Local PDF generated from approved snapshot using html2canvas and jsPDF. No remote renderer receives clinical data. Page slices protect text lines and stamp; 1-page and 2-page Hebrew fixtures visually inspected. No document IDs, revisions, browser URLs, print headings. Compact left signature with requested approval wording; image-based electronic approval, not certificate-based cryptographic signing.

Current document per appointment shown by default. Previous approved documents remain accessible; autosave history collapsed, never deleted.

WhatsApp is an explicit action after approval, with recipient confirmation. The server derives the phone from the patient record and compares it to the confirmed number. Only the configured signing physician may send. Sends multipart PDF through existing Green API; no text-only fallback. Unique document/kind prevents duplicate requests, including uncertain responses. Accepted means provider queued, not confirmed delivery. No real message sent for tests.

Validation: synthetic revision/RLS tests plus delivery recipient matching, signer restrictions and duplicate prevention; mocked Edge Function tests for auth, invalid PDF, upload, uncertain outcomes. Deno type check. Browser generation and rendered A4 PDF inspection. Full typecheck/content-style/build required before release.

Deployment: additive delivery migration applied. Edge function deployment and live assets tracked separately in release notes.
