import { ACTScoreDialog } from './ACTScoreDialog';
import { SCORADScoreDialog } from './SCORADScoreDialog';
import { SNOT22ScoreDialog } from './SNOT22ScoreDialog';
import { PUCAIScoreDialog } from './PUCAIScoreDialog';
import { CustomScoringDialog } from './CustomScoringDialog';
import { CustomToolButton } from './CustomToolButton';
import { Calculator } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ScoringToolbarProps {
  onScoreAdd: (toolName: string, score: number, interpretation: string) => void;
}

interface CustomScoringTool {
  id: string;
  name: string;
  description: string;
}

export function ScoringToolbar({ onScoreAdd }: ScoringToolbarProps) {
  // Fetch saved custom scoring tools
  const { data: customTools } = useQuery({
    queryKey: ['custom-scoring-tools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_scoring_tools')
        .select('id, name, description')
        .order('name');
      if (error) throw error;
      return data as CustomScoringTool[];
    },
  });

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg flex-wrap" data-tutorial="scoring-toolbar">
      <Calculator className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">כלי מדידה:</span>
      <ACTScoreDialog 
        onScoreComplete={(score, interpretation) => onScoreAdd('ACT', score, interpretation)} 
      />
      <SCORADScoreDialog 
        onScoreComplete={(score, interpretation) => onScoreAdd('SCORAD', score, interpretation)} 
      />
      <SNOT22ScoreDialog 
        onScoreComplete={(score, interpretation) => onScoreAdd('SNOT-22', score, interpretation)} 
      />
      <PUCAIScoreDialog 
        onScoreComplete={(score, interpretation) => onScoreAdd('PUCAI', score, interpretation)} 
      />
      {customTools && customTools.length > 0 && (
        <>
          {customTools.map((tool) => (
            <CustomToolButton
              key={tool.id}
              name={tool.name}
              description={tool.description}
              onScoreComplete={(score, interpretation) => onScoreAdd(tool.name, score, interpretation)}
            />
          ))}
        </>
      )}
      <div className="border-r border-border h-4 mx-1" />
      <CustomScoringDialog />
    </div>
  );
}
