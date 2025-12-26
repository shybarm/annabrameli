import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eraser, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onSign: (signatureData: string, signerName: string, signerRole: string, signatureMeaning: string) => void;
  onCancel: () => void;
  defaultName?: string;
  defaultRole?: string;
}

export function SignaturePad({ onSign, onCancel, defaultName = '', defaultRole = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState(defaultName);
  const [signerRole, setSignerRole] = useState(defaultRole);
  const [signatureMeaning, setSignatureMeaning] = useState('approval');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !signerName || !signerRole) return;
    
    const signatureData = canvas.toDataURL('image/png');
    onSign(signatureData, signerName, signerRole, signatureMeaning);
  };

  const roleLabels: Record<string, string> = {
    doctor: 'רופא',
    admin: 'מנהל',
    secretary: 'מזכירה'
  };

  const meaningLabels: Record<string, string> = {
    approval: 'אישור',
    review: 'סקירה',
    authorship: 'כותב'
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">חתימה דיגיטלית</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>שם החותם</Label>
            <Input 
              value={signerName} 
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="שם מלא"
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label>תפקיד</Label>
            <Select value={signerRole} onValueChange={setSignerRole}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">רופא</SelectItem>
                <SelectItem value="admin">מנהל</SelectItem>
                <SelectItem value="secretary">מזכירה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>משמעות החתימה</Label>
          <Select value={signatureMeaning} onValueChange={setSignatureMeaning}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approval">אישור סיכום הביקור</SelectItem>
              <SelectItem value="review">סקירה ואישור</SelectItem>
              <SelectItem value="authorship">אימות כותב המסמך</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>חתימה</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSignature}
              className="h-8"
            >
              <Eraser className="h-4 w-4 ml-1" />
              נקה
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={350}
              height={150}
              className="touch-none cursor-crosshair w-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            חתום עם העכבר או האצבע
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 ml-1" />
            ביטול
          </Button>
          <Button 
            onClick={handleSign}
            disabled={!hasSignature || !signerName || !signerRole}
          >
            <Check className="h-4 w-4 ml-1" />
            חתום
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
