import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ContactSuccess() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>הפנייה נשלחה בהצלחה | ד״ר אנה ברמלי</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://ihaveallergy.com/contact/success" />
      </Helmet>

      <section className="section-spacing-lg">
        <div className="container-medical">
          <div className="max-w-xl mx-auto">
            <div className="bg-card rounded-2xl border border-border/60 p-7 md:p-9">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  הפנייה נשלחה בהצלחה!
                </h1>
                <p className="text-muted-foreground mb-6">
                  נחזור אליכם בהקדם האפשרי לתיאום התור.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/contact')} variant="outline">
                    שלח פנייה נוספת
                  </Button>
                  <Button onClick={() => navigate('/')}>
                    חזרה לדף הבית
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
