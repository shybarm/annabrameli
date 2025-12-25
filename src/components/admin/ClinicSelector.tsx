import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinics } from '@/hooks/useClinics';
import { Building2 } from 'lucide-react';

interface ClinicSelectorProps {
  onClinicChange?: (clinicId: string) => void;
}

export function ClinicSelector({ onClinicChange }: ClinicSelectorProps) {
  const { data: clinics, isLoading } = useClinics();
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  useEffect(() => {
    // Set default clinic from localStorage or first available
    const savedClinicId = localStorage.getItem('selectedClinicId');
    if (savedClinicId && clinics?.find(c => c.id === savedClinicId)) {
      setSelectedClinicId(savedClinicId);
    } else if (clinics && clinics.length > 0) {
      setSelectedClinicId(clinics[0].id);
      localStorage.setItem('selectedClinicId', clinics[0].id);
    }
  }, [clinics]);

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    localStorage.setItem('selectedClinicId', clinicId);
    onClinicChange?.(clinicId);
  };

  if (isLoading || !clinics || clinics.length <= 1) {
    return null;
  }

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);

  return (
    <div className="bg-muted/50 border-b px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">מרפאה נוכחית:</span>
        <Select value={selectedClinicId} onValueChange={handleClinicChange}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="בחר מרפאה" />
          </SelectTrigger>
          <SelectContent>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedClinic?.city && (
          <span className="text-xs text-muted-foreground">({selectedClinic.city})</span>
        )}
      </div>
    </div>
  );
}
