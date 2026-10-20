/** Educational notice shared by all routes and article introductions. */
export const MedicalDisclaimer = () => (
  <aside aria-label="הבהרה רפואית" className="bg-muted/60 border-y border-border text-foreground" dir="rtl">
    <p className="container-medical py-4 text-sm leading-relaxed">
      <strong>המידע באתר אינו ייעוץ רפואי.</strong>{" "}
      התכנים וכללי האצבע נועדו למידע כללי בלבד ואינם תחליף לאבחון, לטיפול או להנחיות אישיות מרופא.
      אין לשנות טיפול, תרופות או תזונה על סמך האתר. במצב חירום יש לפנות מיד לעזרה רפואית ולחייג 101.
    </p>
  </aside>
);
