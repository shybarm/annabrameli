import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      toast({ title: 'ההקלטה החלה', description: 'לחץ שוב לעצירה' });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ 
        title: 'שגיאה בהפעלת המיקרופון', 
        description: 'אנא ודא שיש הרשאה למיקרופון',
        variant: 'destructive' 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) return;

    setIsProcessing(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
          const { data, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          if (data?.transcription) {
            onTranscription(data.transcription);
            toast({ title: 'התמלול הושלם' });
          } else if (data?.error) {
            throw new Error(data.error);
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          toast({ 
            title: 'שגיאה בתמלול', 
            description: err.message || 'נסה שוב',
            variant: 'destructive' 
          });
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
      toast({ 
        title: 'שגיאה בעיבוד ההקלטה', 
        variant: 'destructive' 
      });
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          מעבד...
        </>
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4" />
          עצור הקלטה
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          הקלט
        </>
      )}
    </Button>
  );
}
