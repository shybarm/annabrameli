import { uploadTokenDocument } from '../_shared/token-document-upload.ts';
Deno.serve(req => uploadTokenDocument(req, 'guest'));
