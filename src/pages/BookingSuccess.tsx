import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface BookingSuccessState {
  email?: string;
  clinicName?: string;
  typeName?: string;
  dateLabel?: string;
  time?: string;
}

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as BookingSuccessState;
  const { email, clinicName, typeName, dateLabel, time } = state;

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white flex items-center justify-center p-4" dir="rtl">
      <Helmet>
        <title>התור נקבע בהצלחה | ד״ר אנה ברמלי</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://ihaveallergy.com/book/success" />
      </Helmet>
      <Card className="w-full max-w-md border-medical-200">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">התור נקבע בהצלחה!</h1>
          <p className="text-muted-foreground mb-6">
            פרטי התור נשמרו במערכת.
            {email && <><br />אישור נשלח לכתובת <strong>{email}</strong>.</>}
          </p>
          {(clinicName || typeName || dateLabel) && (
            <div className="bg-muted p-4 rounded-lg mb-6 text-right">
              <p className="text-sm text-muted-foreground">פרטי התור:</p>
              {clinicName && <p className="font-medium">{clinicName}</p>}
              {typeName && <p className="font-medium">{typeName}</p>}
              {dateLabel && (
                <p className="text-sm text-muted-foreground">
                  {dateLabel}{time && <> בשעה {time}</>}
                </p>
              )}
            </div>
          )}
          <Button onClick={() => navigate('/')} className="w-full">
            חזרה לאתר
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
