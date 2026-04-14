import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeoDashboard } from '@/components/admin/geo/GeoDashboard';
import { GeoSprint4Clusters } from '@/components/admin/geo/GeoSprint4Clusters';
import { GeoSprint5Scoring } from '@/components/admin/geo/GeoSprint5Scoring';
import { GeoTemplatesAndChecklist } from '@/components/admin/geo/GeoTemplatesAndChecklist';
import { GeoSprint6Planner } from '@/components/admin/geo/GeoSprint6Planner';
import { GeoWorkspace } from '@/components/admin/geo/GeoWorkspace';
import { GeoContentTransform } from '@/components/admin/geo/GeoContentTransform';
import { GeoLiveDataProvider } from '@/contexts/GeoLiveDataContext';
import { Brain, BarChart3, Layers, Target, Layout, CalendarDays, PenLine, Microscope } from 'lucide-react';

export default function GeoOptimizationPage() {
  return (
    <AdminLayout>
      <GeoLiveDataProvider>
        <div className="space-y-6 pt-14 lg:pt-0">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">GEO Operating System</h1>
              <p className="text-sm text-muted-foreground">אופטימיזציה למנועי AI - ihaveallergy.com</p>
            </div>
          </div>

          {/* 5 unified tabs */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1.5 rounded-xl">
              <TabsTrigger value="dashboard" className="text-xs rounded-lg gap-1">
                <BarChart3 className="h-3 w-3" />סקירה
              </TabsTrigger>
              <TabsTrigger value="workspace" className="text-xs rounded-lg gap-1">
                <PenLine className="h-3 w-3" />תוכניות שכתוב
              </TabsTrigger>
              <TabsTrigger value="clusters" className="text-xs rounded-lg gap-1">
                <Layers className="h-3 w-3" />אשכולות
              </TabsTrigger>
              <TabsTrigger value="scoring" className="text-xs rounded-lg gap-1">
                <Target className="h-3 w-3" />ציון GEO
              </TabsTrigger>
              <TabsTrigger value="toolkit" className="text-xs rounded-lg gap-1">
                <Layout className="h-3 w-3" />תבניות ובדיקה
              </TabsTrigger>
              <TabsTrigger value="transform" className="text-xs rounded-lg gap-1">
                <Microscope className="h-3 w-3" />טרנספורמציה
              </TabsTrigger>
              <TabsTrigger value="execution" className="text-xs rounded-lg gap-1">
                <CalendarDays className="h-3 w-3" />תוכנית 90 יום
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4"><GeoDashboard /></TabsContent>
            <TabsContent value="workspace" className="mt-4"><GeoWorkspace /></TabsContent>
            <TabsContent value="clusters" className="mt-4"><GeoSprint4Clusters /></TabsContent>
            <TabsContent value="scoring" className="mt-4"><GeoSprint5Scoring /></TabsContent>
            <TabsContent value="toolkit" className="mt-4"><GeoTemplatesAndChecklist /></TabsContent>
            <TabsContent value="transform" className="mt-4"><GeoContentTransform /></TabsContent>
            <TabsContent value="execution" className="mt-4"><GeoSprint6Planner /></TabsContent>
          </Tabs>
        </div>
      </GeoLiveDataProvider>
    </AdminLayout>
  );
}
