import { TOPIC_CLUSTERS, GEO_PAGES } from '@/data/geo-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Link2, FileText } from 'lucide-react';

export function GeoTopicClusters() {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <h3 className="text-sm font-semibold mb-2">מפת אשכולות נושאיים</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          כל אשכול בנוי סביב דף עמוד (Pillar) שמקושר למאמרים לוויינים (Satellites).
          שלמות גבוהה = כיסוי נושאי מקיף שמגביר סמכות נושאית בעיני מערכות AI.
        </p>
      </div>

      <div className="grid gap-6">
        {TOPIC_CLUSTERS.map(cluster => {
          const pillarPage = GEO_PAGES.find(p => p.path === cluster.pillarPath);
          const satellitePages = cluster.satellites.map(s => GEO_PAGES.find(p => p.path === s)).filter(Boolean);

          return (
            <Card key={cluster.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cluster.color }}
                    />
                    {cluster.nameHe}
                  </CardTitle>
                  <Badge variant="outline">{cluster.completeness}% שלמות</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={cluster.completeness} className="h-2" />

                {/* Pillar */}
                {pillarPage && (
                  <div className="p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">דף עמוד (Pillar)</span>
                      <Badge className="text-xs">{pillarPage.geoScore}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{pillarPage.path}</p>
                  </div>
                )}

                {/* Satellites */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    מאמרים לוויינים ({satellitePages.length})
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {satellitePages.map(page => page && (
                      <div key={page.id} className="p-2 rounded-lg bg-muted/30 flex items-center justify-between">
                        <span className="text-xs truncate flex-1">{page.titleHe}</span>
                        <Badge variant="secondary" className="text-[10px] mr-2">{page.geoScore}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing Topics */}
                {cluster.missingTopics.length > 0 && (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      נושאים חסרים ({cluster.missingTopics.length})
                    </p>
                    <div className="space-y-1">
                      {cluster.missingTopics.map((topic, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {topic}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
