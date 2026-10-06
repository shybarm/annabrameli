import { Link } from "react-router-dom";
import { CLINIC, CLINIC_SERVICES } from "@/data/clinic";

export function ClinicDetails({ showServices = false }: { showServices?: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 my-6" aria-label="פרטי המרפאה הפרטית">
      <h2 className="text-xl font-bold mb-3">המרפאה הפרטית בהוד השרון</h2>
      <p className="text-sm leading-relaxed"><a href={CLINIC.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{CLINIC.address}</a></p>
      <p className="text-sm leading-relaxed">שעות קבלה: {CLINIC.hoursLabel}, בתיאום מראש.</p>
      <p className="text-sm leading-relaxed">{CLINIC.accessLabel}.</p>
      {showServices && <>
        <h3 className="font-semibold mt-4 mb-2">שירותים המבוצעים במרפאה</h3>
        <ul className="list-disc ps-5 text-sm space-y-1">{CLINIC_SERVICES.map(service => <li key={service}>{service}</li>)}</ul>
        <p className="text-sm text-muted-foreground mt-3">הבחירה בבדיקה או בטיפול נעשית לאחר הערכה רפואית. יש לתאם מראש את סוג הביקור וההכנה הנדרשת.</p>
      </>}
      <p className="text-sm mt-3"><Link to="/contact" className="text-primary underline">פרטי קשר ופנייה למרפאה</Link></p>
    </section>
  );
}
