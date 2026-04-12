import { useState } from 'react';
import { GEO_TEMPLATES, GeoTemplate, TemplateSection } from '@/data/geo-sprint2-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Sparkles, FileText, Eye, PenLine, Info, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Lightbulb, Copy, RotateCcw,
} from 'lucide-react';

// ── Section Editor ─────────────────────────────────────────────────────

function SectionEditor({
  section,
  value,
  onChange,
  isEditing,
  onToggleEdit,
}: {
  section: TemplateSection;
  value: string;
  onChange: (val: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}) {
  const hasContent = value.trim().length > 0;
  const formatIcon = {
    paragraph: '¶',
    bullets: '•',
    heading: 'H1',
    faq: 'Q&A',
    meta: 'ℹ️',
    links: '🔗',
    schema: '{ }',
  }[section.format];

  return (
    <div className={`rounded-xl border transition-colors ${
      isEditing ? 'border-primary/30 bg-primary/5' : 'border-border/30 hover:border-border/50'
    }`}>
      <button
        onClick={onToggleEdit}
        className="w-full text-right p-3.5 flex items-start gap-3"
      >
        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
          hasContent ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
        }`}>
          {hasContent ? <CheckCircle className="h-3.5 w-3.5" /> : formatIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{section.labelHe}</span>
            <span className="text-[10px] text-muted-foreground font-mono">({section.labelEn})</span>
            {section.required && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-rose-200 text-rose-600 dark:border-rose-800 dark:text-rose-400">חובה</Badge>
            )}
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{section.format}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
        </div>
        {isEditing ? <ChevronDown className="h-4 w-4 mt-1 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-1 shrink-0" />}
      </button>

      {isEditing && (
        <div className="px-3.5 pb-3.5 space-y-3">
          {/* AI Tip */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">{section.aiTip}</p>
          </div>

          {/* Editor */}
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={section.placeholder}
            className="min-h-[120px] text-sm leading-relaxed resize-y"
            dir="rtl"
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => onChange(section.placeholder)}
            >
              <RotateCcw className="h-3 w-3 ml-1" />
              טען דוגמה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigator.clipboard.writeText(value)}
            >
              <Copy className="h-3 w-3 ml-1" />
              העתק
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Side-by-Side View ──────────────────────────────────────────────────

function SideBySide({ template }: { template: GeoTemplate }) {
  // Simulate "current" state as mostly empty for demonstration
  const currentStructure = [
    { label: 'כותרת H1', status: 'exists' as const, note: 'גנרית — לא ממוקדת כוונה' },
    { label: 'פסקת פתיחה', status: 'weak' as const, note: 'שיווקית, לא answer-first' },
    { label: 'גוף תוכן', status: 'exists' as const, note: 'טקסט חופשי ללא מבנה ברור' },
    { label: 'FAQ', status: 'missing' as const, note: 'חסר לחלוטין' },
    { label: 'AuthorBadge', status: 'exists' as const, note: 'קיים אך ללא credentials' },
    { label: 'Disclaimer', status: 'weak' as const, note: 'גנרי — לא ספציפי לנושא' },
    { label: 'Schema', status: 'weak' as const, note: 'MedicalWebPage בלבד' },
    { label: 'קישורים פנימיים', status: 'weak' as const, note: '1 קישור — צריך 3-5' },
  ];

  const statusIcon = {
    exists: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    weak: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
    missing: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Current */}
      <Card className="border-amber-200/50 dark:border-amber-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Eye className="h-4 w-4" />
            מבנה נוכחי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {currentStructure.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
              {statusIcon[item.status]}
              <span className="text-xs font-medium flex-1">{item.label}</span>
              <span className="text-[10px] text-muted-foreground max-w-[180px] truncate">{item.note}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended */}
      <Card className="border-emerald-200/50 dark:border-emerald-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-4 w-4" />
            מבנה GEO מומלץ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {template.sections.map((section, i) => (
            <div key={section.id} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[10px] font-mono text-emerald-600 w-5">{String.fromCharCode(65 + i)}</span>
              <span className="text-xs font-medium flex-1">{section.labelHe}</span>
              <Badge variant="outline" className="text-[9px] h-4">{section.format}</Badge>
              {section.required && <span className="text-[9px] text-rose-500">*</span>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────────

function TemplateCard({ template, isSelected, onSelect }: { template: GeoTemplate; isSelected: boolean; onSelect: () => void }) {
  const requiredCount = template.sections.filter(s => s.required).length;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-right p-3.5 rounded-xl border transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border/30 hover:border-primary/20 hover:bg-muted/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{template.nameHe}</p>
          <p className="text-[10px] text-muted-foreground">{template.nameEn}</p>
        </div>
        <div className="text-left shrink-0">
          <p className="text-xs text-muted-foreground">{template.sections.length} סקציות</p>
          <p className="text-[10px] text-muted-foreground">{requiredCount} חובה</p>
        </div>
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function GeoSprint2Templates() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(GEO_TEMPLATES[0].id);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionValues, setSectionValues] = useState<Record<string, Record<string, string>>>({});

  const selectedTemplate = GEO_TEMPLATES.find(t => t.id === selectedTemplateId)!;

  const getValue = (templateId: string, sectionKey: string) =>
    sectionValues[templateId]?.[sectionKey] || '';

  const setValue = (templateId: string, sectionKey: string, value: string) => {
    setSectionValues(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], [sectionKey]: value },
    }));
  };

  const filledCount = selectedTemplate.sections.filter(
    s => getValue(selectedTemplateId, s.key).trim().length > 0
  ).length;

  const completionPct = Math.round((filledCount / selectedTemplate.sections.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Sprint 2 — תבניות תוכן GEO
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          7 תבניות לתוכן רפואי מותאם AI • מבנה answer-first • עריכה ושכתוב
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Template Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">בחרו תבנית</p>
          {GEO_TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              isSelected={t.id === selectedTemplateId}
              onSelect={() => { setSelectedTemplateId(t.id); setEditingSection(null); }}
            />
          ))}
        </div>

        {/* Template Content */}
        <div className="space-y-4">
          {/* Template Header */}
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <h3 className="text-base font-bold">{selectedTemplate.nameHe}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedTemplate.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTemplate.schemaTypes.map(s => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  {selectedTemplate.examplePages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-muted-foreground">דפים לדוגמה:</span>
                      {selectedTemplate.examplePages.map(p => (
                        <code key={p.path} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{p.titleHe}</code>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-center shrink-0">
                  <div className="relative w-14 h-14">
                    <svg width={56} height={56} className="-rotate-90">
                      <circle cx={28} cy={28} r={22} fill="none" stroke="hsl(var(--muted))" strokeWidth={3} />
                      <circle cx={28} cy={28} r={22} fill="none" stroke="hsl(var(--primary))"
                        strokeWidth={3} strokeDasharray={2 * Math.PI * 22}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - completionPct / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                      {completionPct}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{filledCount}/{selectedTemplate.sections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Mode Tabs */}
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="bg-muted/30 p-1 rounded-xl">
              <TabsTrigger value="editor" className="text-xs rounded-lg gap-1">
                <PenLine className="h-3 w-3" />
                עורך סקציות
              </TabsTrigger>
              <TabsTrigger value="sidebyside" className="text-xs rounded-lg gap-1">
                <Eye className="h-3 w-3" />
                נוכחי מול מומלץ
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs rounded-lg gap-1">
                <FileText className="h-3 w-3" />
                תצוגה מקדימה
              </TabsTrigger>
            </TabsList>

            {/* Editor */}
            <TabsContent value="editor" className="mt-4 space-y-2">
              {selectedTemplate.sections.map(section => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  value={getValue(selectedTemplateId, section.key)}
                  onChange={val => setValue(selectedTemplateId, section.key, val)}
                  isEditing={editingSection === section.id}
                  onToggleEdit={() => setEditingSection(editingSection === section.id ? null : section.id)}
                />
              ))}
            </TabsContent>

            {/* Side by Side */}
            <TabsContent value="sidebyside" className="mt-4">
              <SideBySide template={selectedTemplate} />
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="p-6 prose prose-sm max-w-none dark:prose-invert" dir="rtl">
                  {selectedTemplate.sections.map(section => {
                    const val = getValue(selectedTemplateId, section.key) || section.placeholder;
                    return (
                      <div key={section.id} className="mb-6">
                        {section.format === 'heading' ? (
                          <h1 className="text-xl font-bold border-b pb-2">{val}</h1>
                        ) : section.format === 'meta' ? (
                          <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded">
                            {val}
                          </div>
                        ) : section.format === 'schema' ? (
                          <div className="text-xs font-mono bg-muted/30 p-2 rounded border border-border/30">
                            <span className="text-primary">Schema:</span> {val}
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-semibold text-primary mb-1">{section.labelHe}</h3>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">{val}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
