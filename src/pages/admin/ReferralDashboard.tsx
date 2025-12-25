import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReferralStats } from '@/hooks/useReferralSources';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ReferralDashboard() {
  const { data: stats, isLoading } = useReferralStats();

  const chartData = stats 
    ? Object.entries(stats).map(([name, count]) => ({ name, value: count }))
    : [];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">מקורות הפניה</h1>
          <p className="text-muted-foreground">מעקב אחר איך מטופלים שמעו עלינו</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">סה״כ מטופלים עם מקור</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">מקור מוביל</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {chartData.length > 0 
                  ? chartData.sort((a, b) => b.value - a.value)[0]?.name 
                  : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>התפלגות מקורות הפניה</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">אין נתונים להצגה</p>
                <p className="text-sm text-muted-foreground">הוסף שדה ״איך שמעת עלינו״ לטופס קליטת מטופלים</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Table */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>פירוט לפי מקור</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="text-right border-b">
                    <th className="pb-3 font-medium">מקור</th>
                    <th className="pb-3 font-medium">מספר מטופלים</th>
                    <th className="pb-3 font-medium">אחוז</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {chartData.sort((a, b) => b.value - a.value).map((item, index) => (
                    <tr key={item.name}>
                      <td className="py-3 flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
                      </td>
                      <td className="py-3">{item.value}</td>
                      <td className="py-3">{((item.value / total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
