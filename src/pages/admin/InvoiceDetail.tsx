import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useInvoice, useUpdateInvoiceStatus, useUpdateInvoice } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Printer, Mail, CheckCircle, Edit, Save, X, Plus, Trash2, Link2, Copy, MessageCircle, ExternalLink, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { openWhatsAppChat, normalizePhoneToE164 } from '@/lib/whatsapp';

interface EditableItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const updateInvoice = useUpdateInvoice();

  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPaymentLink, setEditPaymentLink] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('bit');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    if (invoice) {
      setEditItems((invoice as any).items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
      })) || []);
      setEditNotes(invoice.notes || '');
      setEditDueDate(invoice.due_date || '');
      setEditPaymentLink(invoice.payment_link || '');
    }
  }, [invoice]);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partially_paid: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    draft: 'טיוטה',
    sent: 'נשלחה',
    paid: 'שולמה',
    partially_paid: 'שולמה חלקית',
    overdue: 'באיחור',
    cancelled: 'בוטלה',
  };

  const canEdit = invoice?.status !== 'paid' && invoice?.status !== 'cancelled';

  const handleSendReminder = async () => {
    const patientData = invoice?.patients as any;
    if (!patientData?.email) {
      toast({ title: 'אין כתובת אימייל למטופל', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-invoice-reminder', {
        body: {
          invoiceId: invoice.id,
          patientEmail: patientData.email,
          patientName: `${patientData.first_name} ${patientData.last_name}`,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.total,
        },
      });

      if (error) throw error;
      toast({ title: 'התזכורת נשלחה בהצלחה' });
    } catch (error: any) {
      toast({ title: 'שגיאה בשליחת התזכורת', description: error.message, variant: 'destructive' });
    }
  };

  const handleOpenPaymentDialog = () => {
    setPaymentMethod('bit');
    setPaymentReference('');
    setShowPaymentDialog(true);
  };

  const handleCollectPayment = async () => {
    if (!id) return;
    
    try {
      // Update invoice status
      await updateStatus.mutateAsync({ id, status: 'paid', amount_paid: Number(invoice?.total) });
      
      // Record payment in payments table
      const { error } = await supabase.from('payments').insert({
        invoice_id: id,
        patient_id: invoice?.patient_id,
        amount: Number(invoice?.total),
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        status: 'completed',
      });
      
      if (error) throw error;
      
      toast({ title: 'התשלום נרשם בהצלחה' });
      setShowPaymentDialog(false);
    } catch (error: any) {
      toast({ title: 'שגיאה ברישום התשלום', description: error.message, variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (invoice) {
      setEditItems((invoice as any).items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
      })) || []);
      setEditNotes(invoice.notes || '');
      setEditDueDate(invoice.due_date || '');
      setEditPaymentLink(invoice.payment_link || '');
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    
    if (editItems.length === 0) {
      toast({ title: 'יש להוסיף לפחות פריט אחד', variant: 'destructive' });
      return;
    }

    if (editItems.some(item => !item.description.trim())) {
      toast({ title: 'יש למלא תיאור לכל הפריטים', variant: 'destructive' });
      return;
    }

    await updateInvoice.mutateAsync({
      id,
      input: {
        notes: editNotes || undefined,
        due_date: editDueDate || null,
        payment_link: editPaymentLink || null,
        items: editItems,
      },
    });

    setIsEditing(false);
  };

  const handleCopyPaymentLink = () => {
    if (invoice?.payment_link) {
      navigator.clipboard.writeText(invoice.payment_link);
      toast({ title: 'הקישור הועתק' });
    }
  };

  const handleShareWhatsApp = () => {
    const patientData = invoice?.patients as any;
    if (!patientData?.phone) {
      toast({ title: 'אין מספר טלפון למטופל', variant: 'destructive' });
      return;
    }
    
    const message = `שלום ${patientData.first_name},\n\nמצורף קישור לתשלום עבור חשבונית מספר ${invoice?.invoice_number} בסך ₪${Number(invoice?.total).toLocaleString()}:\n\n${invoice?.payment_link || ''}\n\nתודה,\nד״ר אנה ברמלי`;
    openWhatsAppChat(patientData.phone, message);
  };

  const handleItemChange = (index: number, field: keyof EditableItem, value: string | number) => {
    setEditItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleAddItem = () => {
    setEditItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateEditTotals = () => {
    const subtotal = editItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 18;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxRate, taxAmount, total };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!invoice) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">חשבונית לא נמצאה</p>
          <Button variant="link" onClick={() => navigate('/admin/billing')}>
            חזור לרשימת החשבוניות
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const editTotals = calculateEditTotals();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/billing')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                חשבונית #{invoice.invoice_number}
              </h1>
              <Badge className={statusColors[invoice.status]}>
                {statusLabels[invoice.status]}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">ביטול</span>
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateInvoice.isPending}>
                  <Save className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">{updateInvoice.isPending ? 'שומר...' : 'שמור'}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 sm:ml-1" />
                  <span className="hidden sm:inline">הדפסה</span>
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    <Edit className="h-4 w-4 sm:ml-1" />
                    <span className="hidden sm:inline">ערוך</span>
                  </Button>
                )}
                {invoice.status !== 'paid' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleSendReminder}>
                      <Mail className="h-4 w-4 sm:ml-1" />
                      <span className="hidden sm:inline">תזכורת</span>
                    </Button>
                    <Button size="sm" onClick={handleOpenPaymentDialog}>
                      <Wallet className="h-4 w-4 sm:ml-1" />
                      <span className="hidden sm:inline">גביית תשלום</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">ד״ר אנה ברמלי</h2>
                <p className="text-sm text-muted-foreground">מומחית לאלרגיה ואימונולוגיה</p>
                <p className="text-sm text-muted-foreground">רישיון מס׳: 12345</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">תאריך: {format(new Date(invoice.created_at), 'dd/MM/yyyy')}</p>
                {isEditing ? (
                  <div className="mt-2">
                    <Label className="text-xs">תאריך יעד</Label>
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="h-8 text-sm"
                      dir="ltr"
                    />
                  </div>
                ) : (
                  invoice.due_date && (
                    <p className="text-sm text-muted-foreground">תאריך יעד: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}</p>
                  )
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Patient Info */}
            <div className="bg-muted/50 p-4 rounded-lg print:bg-gray-50">
              <h3 className="font-semibold mb-2">פרטי מטופל</h3>
              {invoice.patients && (
                <div className="text-sm">
                  <p>{(invoice.patients as any).first_name} {(invoice.patients as any).last_name}</p>
                  {(invoice.patients as any).id_number && <p>ת.ז: {(invoice.patients as any).id_number}</p>}
                  {(invoice.patients as any).phone && <p>טלפון: {(invoice.patients as any).phone}</p>}
                  {(invoice.patients as any).email && <p>אימייל: {(invoice.patients as any).email}</p>}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">פירוט</h3>
                {isEditing && (
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 ml-1" />
                    הוסף פריט
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                        <div className="flex-1">
                          <Label className="text-xs">תיאור</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="תיאור השירות"
                          />
                        </div>
                        <div className="flex gap-2 sm:contents">
                          <div className="flex-1 sm:flex-none sm:w-20">
                            <Label className="text-xs">כמות</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              dir="ltr"
                            />
                          </div>
                          <div className="flex-1 sm:flex-none sm:w-28">
                            <Label className="text-xs">מחיר</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:contents">
                          <div className="sm:w-24 text-left sm:pt-6">
                            <span className="font-medium text-lg sm:text-base">₪{(item.quantity * item.unit_price).toLocaleString()}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="sm:mt-5 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                            disabled={editItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-2 font-medium">תיאור</th>
                      <th className="pb-2 font-medium">כמות</th>
                      <th className="pb-2 font-medium">מחיר יחידה</th>
                      <th className="pb-2 font-medium">סה״כ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(invoice as any).items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.description}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">₪{Number(item.unit_price).toLocaleString()}</td>
                        <td className="py-2 font-medium">₪{Number(item.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  {isEditing ? (
                    <>
                      <div className="flex justify-between">
                        <span>סכום ביניים:</span>
                        <span>₪{editTotals.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>מע״מ ({editTotals.taxRate}%):</span>
                        <span>₪{editTotals.taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>סה״כ לתשלום:</span>
                        <span>₪{editTotals.total.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>סכום ביניים:</span>
                        <span>₪{Number(invoice.subtotal).toLocaleString()}</span>
                      </div>
                      {invoice.tax_amount && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>מע״מ ({invoice.tax_rate}%):</span>
                          <span>₪{Number(invoice.tax_amount).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>סה״כ לתשלום:</span>
                        <span>₪{Number(invoice.total).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Link */}
            {isEditing ? (
              <div className="border-t pt-4 space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  קישור לתשלום (bit/paybox)
                </Label>
                <Input
                  value={editPaymentLink}
                  onChange={(e) => setEditPaymentLink(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  type="url"
                />
              </div>
            ) : (
              invoice.payment_link && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    קישור לתשלום
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono truncate" dir="ltr">
                      {invoice.payment_link}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={handleCopyPaymentLink}>
                        <Copy className="h-4 w-4 ml-1" />
                        העתק
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(invoice.payment_link!, '_blank')}>
                        <ExternalLink className="h-4 w-4 ml-1" />
                        פתח
                      </Button>
                      <Button variant="default" size="sm" onClick={handleShareWhatsApp} className="bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-4 w-4 ml-1" />
                        וואטסאפ
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Notes */}
            {isEditing ? (
              <div className="border-t pt-4">
                <Label>הערות</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="הערות לחשבונית"
                  rows={3}
                />
              </div>
            ) : (
              invoice.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">הערות</h3>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Collection Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">גביית תשלום</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center text-2xl font-bold text-primary">
              ₪{Number(invoice?.total).toLocaleString()}
            </div>
            
            <div className="space-y-3">
              <Label>אמצעי תשלום</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-3">
                <div>
                  <RadioGroupItem value="bit" id="bit" className="peer sr-only" />
                  <Label
                    htmlFor="bit"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Wallet className="mb-2 h-6 w-6" />
                    <span className="font-medium">Bit</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="paybox" id="paybox" className="peer sr-only" />
                  <Label
                    htmlFor="paybox"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-2 h-6 w-6" />
                    <span className="font-medium">PayBox</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="credit_card" id="credit_card" className="peer sr-only" />
                  <Label
                    htmlFor="credit_card"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <CreditCard className="mb-2 h-6 w-6" />
                    <span className="font-medium">כרטיס אשראי</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <Wallet className="mb-2 h-6 w-6" />
                    <span className="font-medium">מזומן</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">מספר אסמכתא (אופציונלי)</Label>
              <Input
                id="reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="הזן מספר אסמכתא..."
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleCollectPayment} disabled={updateStatus.isPending}>
              <CheckCircle className="h-4 w-4 ml-2" />
              {updateStatus.isPending ? 'מעבד...' : 'אשר תשלום'}
            </Button>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}