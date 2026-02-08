import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { UpdateCard } from "@/components/ui/update-card";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { useMedicalUpdates } from "@/hooks/useMedicalUpdates";
import { Loader2 } from "lucide-react";

const Updates = () => {
  const { data: updates, isLoading } = useMedicalUpdates();

  // Format date to Hebrew month
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <>
      <Helmet>
        <title>עדכונים אחרונים באלרגיה | ד״ר אנה ברמלי</title>
        <meta 
          name="description" 
          content="עדכונים אחרונים וחידושים בעולם האלרגיה - מחקרים, הנחיות חדשות וסקירות רפואיות מסוכמות בשפה פשוטה וברורה להורים." 
        />
      </Helmet>
      <SchemaMarkup type="medicalWebPage" />

      {/* Hero */}
      <section className="gradient-hero py-20 md:py-28">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-bold text-foreground mb-6">
              עדכונים אחרונים באלרגיה
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              מדענים ורופאים חוקרים מדי שנה אלרגיות חדשות, טיפולים מתקדמים ושיטות אבחון משופרות. בדף זה תמצאו תקצירים ברורים, אמינים ונגישים לכל הורה.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Updates List */}
      <section className="section-spacing-lg">
        <div className="container-medical">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : updates && updates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {updates.map((update, index) => (
                <UpdateCard
                  key={update.id}
                  title={update.title_he}
                  date={formatDate(update.published_date)}
                  source={update.source}
                  summary={update.summary_he}
                  link={update.source_url || undefined}
                  delay={index * 0.08}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                עדכונים חדשים ייטענו בקרוב. המערכת מעדכנת מידע חדש באופן אוטומטי.
              </p>
            </div>
          )}

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 bg-surface rounded-2xl p-7 md:p-9 text-center border border-border/60"
          >
            <p className="text-muted-foreground">
              כל מאמר כולל תאריך פרסום, מקור רפואי מוסמך, תקציר בשפה פשוטה והמלצות פרקטיות.
              <br />
              <span className="text-sm">המידע מתעדכן באופן אוטומטי ממקורות רפואיים מוסמכים (PubMed).</span>
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Updates;
