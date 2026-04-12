import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeoDashboard } from '@/components/admin/geo/GeoDashboard';
import { GeoPageAudit } from '@/components/admin/geo/GeoPageAudit';
import { GeoEntityLayer } from '@/components/admin/geo/GeoEntityLayer';
import { GeoTopicClusters } from '@/components/admin/geo/GeoTopicClusters';
import { GeoPageTemplates } from '@/components/admin/geo/GeoPageTemplates';
import { GeoScoringEngine } from '@/components/admin/geo/GeoScoringEngine';
import { GeoSprintPlanner } from '@/components/admin/geo/GeoSprintPlanner';
import { GeoChecklist } from '@/components/admin/geo/GeoChecklist';
import { GeoSprint4Clusters } from '@/components/admin/geo/GeoSprint4Clusters';
import { Brain } from 'lucide-react';

export default function GeoOptimizationPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 pt-14 lg:pt-0">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">GEO Optimization</h1>
            <p className="text-sm text-muted-foreground">מערכת אופטימיזציה למנועי AI — ihaveallergy.com</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1.5 rounded-xl">
            <TabsTrigger value="dashboard" className="text-xs rounded-lg">סקירה</TabsTrigger>
            <TabsTrigger value="pages" className="text-xs rounded-lg">ביקורת דפים</TabsTrigger>
            <TabsTrigger value="entity" className="text-xs rounded-lg">שכבת ישויות</TabsTrigger>
            <TabsTrigger value="clusters" className="text-xs rounded-lg">אשכולות</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs rounded-lg">תבניות</TabsTrigger>
            <TabsTrigger value="scoring" className="text-xs rounded-lg">ציון GEO</TabsTrigger>
            <TabsTrigger value="sprints" className="text-xs rounded-lg">ספרינטים</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs rounded-lg">רשימת בדיקה</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4"><GeoDashboard /></TabsContent>
          <TabsContent value="pages" className="mt-4"><GeoPageAudit /></TabsContent>
          <TabsContent value="entity" className="mt-4"><GeoEntityLayer /></TabsContent>
          <TabsContent value="clusters" className="mt-4"><GeoTopicClusters /></TabsContent>
          <TabsContent value="templates" className="mt-4"><GeoPageTemplates /></TabsContent>
          <TabsContent value="scoring" className="mt-4"><GeoScoringEngine /></TabsContent>
          <TabsContent value="sprints" className="mt-4"><GeoSprintPlanner /></TabsContent>
          <TabsContent value="checklist" className="mt-4"><GeoChecklist /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
