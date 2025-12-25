import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useExpenses, useExpenseStats, useCreateExpense, useDeleteExpense, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { Plus, Trash2, Receipt, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    recurring_interval: '',
  });

  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: expenses, isLoading } = useExpenses(startDate, endDate);
  const { data: stats } = useExpenseStats(startDate, endDate);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpense.mutateAsync({
      category: newExpense.category,
      description: newExpense.description || null,
      amount: Number(newExpense.amount),
      expense_date: newExpense.expense_date,
      recurring: newExpense.recurring,
      recurring_interval: newExpense.recurring_interval || null,
    });
    setNewExpense({
      category: '',
      description: '',
      amount: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      recurring: false,
      recurring_interval: '',
    });
    setIsDialogOpen(false);
  };

  const getCategoryLabel = (value: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">הוצאות</h1>
            <p className="text-muted-foreground">ניהול הוצאות המרפאה</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 ml-2" />
                הוצאה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת הוצאה</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>קטגוריה</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(v) => setNewExpense(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="תיאור ההוצאה"
                  />
                </div>
                <div className="space-y-2">
                  <Label>סכום (₪)</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תאריך</Label>
                  <Input
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תדירות</Label>
                  <Select
                    value={newExpense.recurring ? newExpense.recurring_interval : 'one_time'}
                    onValueChange={(v) => {
                      if (v === 'one_time') {
                        setNewExpense(prev => ({ ...prev, recurring: false, recurring_interval: '' }));
                      } else {
                        setNewExpense(prev => ({ ...prev, recurring: true, recurring_interval: v }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר תדירות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">חד פעמי</SelectItem>
                      <SelectItem value="weekly">שבועי</SelectItem>
                      <SelectItem value="monthly">חודשי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={!newExpense.category || !newExpense.amount}>
                  הוסף הוצאה
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">סה״כ החודש</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">₪{(stats?.total || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stats?.count || 0} הוצאות</p>
            </CardContent>
          </Card>
          
          {EXPENSE_CATEGORIES.slice(0, 3).map(cat => (
            <Card key={cat.value}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{cat.label}</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₪{(stats?.byCategory?.[cat.value] || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>הוצאות החודש - {format(new Date(), 'MMMM yyyy', { locale: he })}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-right border-b">
                      <th className="pb-3 font-medium">תאריך</th>
                      <th className="pb-3 font-medium">קטגוריה</th>
                      <th className="pb-3 font-medium">תיאור</th>
                      <th className="pb-3 font-medium">סכום</th>
                      <th className="pb-3 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-muted/50">
                        <td className="py-3">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</td>
                        <td className="py-3">{getCategoryLabel(expense.category)}</td>
                        <td className="py-3 text-muted-foreground">{expense.description || '-'}</td>
                        <td className="py-3 font-semibold">₪{Number(expense.amount).toLocaleString()}</td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteExpense.mutate(expense.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">אין הוצאות החודש</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
