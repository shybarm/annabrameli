import { ACTScoreDialog } from './ACTScoreDialog';
import { SCORADScoreDialog } from './SCORADScoreDialog';
import { SNOT22ScoreDialog } from './SNOT22ScoreDialog';
import { Calculator } from 'lucide-react';

interface ScoringToolbarProps {
  onScoreAdd: (toolName: string, score: number, interpretation: string) => void;
}

export function ScoringToolbar({ onScoreAdd }: ScoringToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
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
    </div>
  );
}
