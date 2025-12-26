import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePatients } from '@/hooks/usePatients';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { ArrowRight, Save, Search, Plus, X, Link2 } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function NewInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patient');
  
  const { data: patients } = usePatients();
  const createInvoice = useCreateInvoice();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  const filteredPatients = patients?.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.first_name.toLowerCase().includes(query) ||
           p.last_name.toLowerCase().includes(query) ||
           p.phone?.includes(query);
  }).slice(0, 10) || [];

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 18;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatientId || items.some(i => !i.description || i.unit_price <= 0)) return;

    await createInvoice.mutateAsync({
      patient_id: selectedPatientId,
      items: items.map(i => ({
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total,
      })),
      notes: notes || undefined,
      payment_link: paymentLink || undefined,
    });

    navigate('/admin/billing');
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/billing')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">חשבונית חדשה</h1>
            <p className="text-muted-foreground">יצירת חשבונית למטופל</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>בחירת מטופל</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedPatient ? (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש מטופל לפי שם או טלפון..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  {searchQuery && (
                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <div
                            key={patient.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setSearchQuery('');
                            }}
                          >
                            <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          לא נמצאו מטופלים
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-4 bg-medical-50 rounded-lg border border-medical-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-medical-200 text-medical-700 font-medium">
                      {selectedPatient.first_name.charAt(0)}{selectedPatient.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPatientId('')}>
                    שנה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>פריטים</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף פריט
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-12 items-end p-4 border rounded-lg">
                  <div className="sm:col-span-5 space-y-2">
                    <Label>תיאור</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="תיאור השירות"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>כמות</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>מחיר</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>סה״כ</Label>
                    <Input
                      value={`₪${item.total.toLocaleString()}`}
                      readOnly
                      className="bg-gray-50"
                      dir="ltr"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    {items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>סיכום</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-left" dir="ltr">
                <div className="flex justify-between">
                  <span>סכום ביניים</span>
                  <span>₪{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>מע״מ ({taxRate}%)</span>
                  <span>₪{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>סה״כ לתשלום</span>
                  <span>₪{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  קישור לתשלום (bit/paybox)
                </Label>
                <Input
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  הכנס קישור לתשלום ידני כגון bit, paybox או אחר
                </p>
              </div>

              <div className="space-y-2">
                <Label>הערות</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערות לחשבונית..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/billing')}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              disabled={!selectedPatientId || createInvoice.isPending}
            >
              <Save className="h-4 w-4 ml-2" />
              {createInvoice.isPending ? 'יוצר...' : 'צור חשבונית'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}