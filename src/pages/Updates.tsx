import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";

const Updates = () => {
  return (
    <>
      <Helmet>
        <title>עדכונים ומחקרים באלרגיה | ד״ר אנה ברמלי</title>
        <meta name="description" content="מדור המחקרים והעדכונים של ד״ר אנה ברמלי נמצא כעת בעריכה מקצועית." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://ihaveallergy.com/updates" />
      </Helmet>

      <section className="gradient-hero py-20 md:py-28">
        <div className="container-medical">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="font-bold text-foreground mb-6">
              עדכונים ומחקרים באלרגיה
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              המדור נמצא כעת בעריכה מקצועית. סקירות נבחרות ומקורות רפואיים מדויקים יפורסמו כאן לאחר בדיקה.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Updates;
