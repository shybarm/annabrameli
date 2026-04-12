import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  EXPERT_PROFILE, PUBLICATIONS, type Publication,
} from '@/data/expert-authority';
import {
  BookOpen, ExternalLink, FileText, GraduationCap,
  Landmark, LinkIcon, Shield,
} from 'lucide-react';

/* ── Expert Authority Card (compact, reusable) ── */
export function ExpertAuthorityCard({ className = '' }: { className?: string }) {
  const p = EXPERT_PROFILE;
  return (
    <div className={`bg-card rounded-2xl border border-border/60 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">סמכות מקצועית מאומתת</h3>
      </div>

      <div className="space-y-3 text-sm">
        {/* Institutional affiliation */}
        <div className="flex items-start gap-3">
          <Landmark className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Clinical Fellow - Allergy & Immunology</p>
            <p className="text-xs text-muted-foreground">Vanderbilt University Medical Center, Nashville, TN</p>
          </div>
        </div>

        {/* Training */}
        <div className="flex items-start gap-3">
          <GraduationCap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">רפואת ילדים - מרכז שניידר</p>
            <p className="text-xs text-muted-foreground">M.D. - אוניברסיטת בן גוריון בנגב</p>
          </div>
        </div>

        {/* Publications count */}
        <div className="flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">{PUBLICATIONS.length} פרסומים מחקריים</p>
            <p className="text-xs text-muted-foreground">אלרגיה בילדים, אלרגיה לתרופות</p>
          </div>
        </div>

        {/* Credentials */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {p.credentials.map((c, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">{c.label}</Badge>
          ))}
        </div>
      </div>

      {/* Vanderbilt link */}
      <a
        href={p.vanderbiltProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        פרופיל מאומת - Vanderbilt University
      </a>
    </div>
  );
}

/* ── Single Publication Card ── */
function PublicationCard({ pub }: { pub: Publication }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      {/* Title & journal */}
      <div>
        <a
          href={pub.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors leading-snug"
        >
          {pub.title}
          <ExternalLink className="w-3 h-3 inline mr-1.5 text-muted-foreground" />
        </a>
        <p className="text-xs text-muted-foreground mt-1">
          {pub.journal} ({pub.year})
        </p>
        <p className="text-xs text-muted-foreground">{pub.authors}</p>
      </div>

      {/* Hebrew topic relevance */}
      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
        <p className="text-xs font-semibold text-primary mb-1">רלוונטיות קלינית</p>
        <p className="text-xs text-foreground leading-relaxed">{pub.topicRelevanceHe}</p>
      </div>

      {/* Why it matters */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">למה זה חשוב למטופלים</p>
        <p className="text-xs text-foreground leading-relaxed">{pub.whyItMattersHe}</p>
      </div>

      {/* Related site pages */}
      {pub.relatedPages.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <LinkIcon className="w-3 h-3 text-muted-foreground" />
          {pub.relatedPages.map((rp, i) => (
            <Link
              key={i}
              to={rp.path}
              className="text-[11px] text-primary hover:underline"
            >
              {rp.label}
            </Link>
          ))}
        </div>
      )}

      {/* DOI / PubMed badges */}
      <div className="flex items-center gap-2">
        {pub.doi && (
          <Badge variant="outline" className="text-[9px]">DOI: {pub.doi}</Badge>
        )}
        {pub.pubmedId && (
          <Badge variant="outline" className="text-[9px]">PubMed: {pub.pubmedId}</Badge>
        )}
      </div>
    </div>
  );
}

/* ── Research & Publications Section (for bio page) ── */
export function ResearchPublicationsSection() {
  return (
    <section className="py-16 md:py-24" id="research">
      <div className="container-medical">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            מחקר ופרסומים אקדמיים
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ד״ר ברמלי משלבת עבודה קלינית עם מחקר אקדמי. הפרסומים המחקריים שלה מתמקדים בנושאים ישירות רלוונטיים לטיפול במטופלים - אלרגיה בילדים והערכת אלרגיה לתרופות.
          </p>
        </motion.div>

        {/* Trust context box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-10"
        >
          <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">למה מחקר חשוב למטופלים?</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  רופאה שחוקרת ומפרסמת מאמרים בכתבי עת שפיטים מביאה למרפאה ידע עדכני ומבוסס ראיות. 
                  זה מבטיח שהאבחון והטיפול שאתם מקבלים תואמים את הסטנדרטים הבינלאומיים העדכניים ביותר - 
                  לא רק ניסיון קליני, אלא גם שותפות פעילה בבניית הידע הרפואי.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Publications */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {PUBLICATIONS.map((pub, index) => (
            <motion.div
              key={pub.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <PublicationCard pub={pub} />
            </motion.div>
          ))}
        </div>

        {/* Institutional verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <a
            href={EXPERT_PROFILE.vanderbiltProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Landmark className="w-4 h-4" />
            צפו בפרופיל המאומת - Vanderbilt University Medical Center
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
