import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/usePatients';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, User, UserPlus, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { PatientInviteDialog } from '@/components/admin/PatientInviteDialog';

export default function PatientsList() {
  const navigate = useNavigate();
  const { data: patients, isLoading } = usePatients();
  const { data: unreadCount } = useUnreadMessageCount();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients?.filter(patient => {
    const query = searchQuery.toLowerCase();
    return (
      patient.first_name.toLowerCase().includes(query) ||
      patient.last_name.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query) ||
      patient.id_number?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">מטופלים</h1>
            <p className="text-muted-foreground">ניהול רשימת המטופלים במרפאה</p>
          </div>
          <div className="flex gap-2">
            <PageHelpButton tutorial={pageTutorials['/admin/patients']} />
            <PatientInviteDialog 
              trigger={
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 ml-2" />
                  הזמן מטופל
                </Button>
              }
            />
            <Button onClick={() => navigate('/admin/patients/new')} className="bg-primary text-primary-foreground hover:bg-primary/90" data-tutorial="new-patient-btn">
              <Plus className="h-4 w-4 ml-2" />
              מטופל חדש
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md" data-tutorial="search-patients">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, טלפון או ת.ז..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Patients List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600" />
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-tutorial="patients-list">
            {filteredPatients.map((patient) => {
              const patientUnreadCount = unreadCount?.byPatient[patient.id] || 0;
              return (
                <Card 
                  key={patient.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/patients/${patient.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-medical-100 text-medical-700 font-medium text-lg">
                          {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                          {patientUnreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full">
                              {patientUnreadCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {patient.first_name} {patient.last_name}
                          </CardTitle>
                          {patient.id_number && (
                            <p className="text-sm text-muted-foreground">ת.ז: {patient.id_number}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                          {patient.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        </Badge>
                        {patientUnreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            <MessageCircle className="h-3 w-3 ml-1" />
                            הודעה חדשה
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span dir="ltr">{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      נוסף: {format(new Date(patient.created_at), 'd/M/yyyy')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'לא נמצאו תוצאות' : 'אין מטופלים במערכת'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'נסה לחפש עם מילות מפתח אחרות' : 'התחל להוסיף מטופלים למרפאה'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/admin/patients/new')}>
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף מטופל ראשון
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
