import { PAGE_TEMPLATES } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, Layout, List } from 'lucide-react';

export function GeoPageTemplates() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <h3 className="text-sm font-semibold mb-2">תבניות דף לתוכן רפואי</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          כל תבנית מותאמת לפורמט answer-first שמערכות AI מעדיפות לצטט.
          השתמשו בתבניות האלו ליצירת תוכן חדש ולשיפור דפים קיימים.
        </p>
      </div>

      <div className="grid gap-6">
        {PAGE_TEMPLATES.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4 text-primary" />
                  {template.nameHe}
                  <span className="text-xs text-muted-foreground font-normal">({template.nameEn})</span>
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sections */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <List className="h-3 w-3" />
                  מבנה הדף
                </h4>
                <ol className="space-y-1">
                  {template.sections.map((section, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary font-mono text-xs mt-0.5 w-5">{i + 1}.</span>
                      {section}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <FileCode className="h-3 w-3" />
                  {template.schemaType}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {template.answerFormat}
                </Badge>
              </div>

              {/* Used By */}
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold">משמשת: </span>
                {template.usedBy.map((path, i) => (
                  <span key={i}>
                    <code className="bg-muted px-1 py-0.5 rounded text-[11px]">{path}</code>
                    {i < template.usedBy.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
