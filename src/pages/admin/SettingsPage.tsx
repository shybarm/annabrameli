import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Settings, Building, Clock, Users } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרות</h1>
          <p className="text-muted-foreground">הגדרות המרפאה והמערכת</p>
        </div>

        {/* Clinic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              פרטי המרפאה
            </CardTitle>
            <CardDescription>מידע בסיסי על המרפאה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="clinic_name">שם המרפאה</Label>
                <Input id="clinic_name" defaultValue="מרפאת ד״ר אנה ברמלי" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_phone">טלפון</Label>
                <Input id="clinic_phone" defaultValue="+972-XXX-XXXXXX" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_email">אימייל</Label>
                <Input id="clinic_email" type="email" defaultValue="clinic@example.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic_address">כתובת</Label>
                <Input id="clinic_address" defaultValue="רחוב הרופאים 1, תל אביב" />
              </div>
            </div>
            <Button className="bg-medical-600 hover:bg-medical-700">שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              שעות פעילות
            </CardTitle>
            <CardDescription>הגדרת שעות קבלה</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'].map((day, index) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-20 font-medium">{day}</span>
                  <Input type="time" defaultValue="08:00" className="w-32" dir="ltr" />
                  <span>עד</span>
                  <Input type="time" defaultValue={index === 4 ? "14:00" : "18:00"} className="w-32" dir="ltr" />
                </div>
              ))}
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="w-20 font-medium">שישי</span>
                <span>סגור</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="w-20 font-medium">שבת</span>
                <span>סגור</span>
              </div>
            </div>
            <Separator className="my-4" />
            <Button className="bg-medical-600 hover:bg-medical-700">שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              הגדרות תורים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buffer">הפסקה בין תורים (דקות)</Label>
                <Input id="buffer" type="number" defaultValue="10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_daily">מקסימום תורים ביום</Label>
                <Input id="max_daily" type="number" defaultValue="20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder">תזכורת שעות לפני</Label>
                <Input id="reminder" type="number" defaultValue="24" />
              </div>
            </div>
            <Button className="bg-medical-600 hover:bg-medical-700">שמור שינויים</Button>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              צוות המרפאה
            </CardTitle>
            <CardDescription>ניהול משתמשים והרשאות</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              ניהול משתמשי הצוות והרשאות הגישה שלהם למערכת
            </p>
            <Button variant="outline">ניהול צוות</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
