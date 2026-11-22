import { supabase } from '@/integrations/supabase/client';
import type { VisitContent } from './visitModel';
export type ClinicalDocument = {id:string;appointment_id:string;patient_id:string;revision:number;signed_at:string;signed_by:string;snapshot:{content:VisitContent;visit_date:string;patient:{name:string;id_number:string;date_of_birth:string|null};issuer:{name:string;specialty:string;license:string;address:string;stamp_data:string}}};
type Query = PromiseLike<{data: unknown; error: {message: string} | null}> & { select(columns: string): Query; eq(column: string, value: string): Query; maybeSingle(): Query; order(column: string, options: {ascending: boolean}): Query; insert(value:unknown):Query; delete():Query };
export const clinicalDb = supabase as unknown as {from(name:string):Query;rpc(name:string,args?:Record<string,unknown>):PromiseLike<{data:unknown;error:{message:string}|null}>};
