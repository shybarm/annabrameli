import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useClinics } from '@/hooks/useClinics';

// Define distinct color themes for clinics
const clinicThemes = [
  { name: 'medical', bg: 'bg-blue-50', border: 'border-blue-200', accent: 'hsl(200, 70%, 50%)', headerBg: 'bg-blue-100/80' },
  { name: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'hsl(160, 60%, 45%)', headerBg: 'bg-emerald-100/80' },
  { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'hsl(270, 60%, 55%)', headerBg: 'bg-purple-100/80' },
  { name: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', accent: 'hsl(40, 80%, 50%)', headerBg: 'bg-amber-100/80' },
  { name: 'rose', bg: 'bg-rose-50', border: 'border-rose-200', accent: 'hsl(350, 70%, 55%)', headerBg: 'bg-rose-100/80' },
];

interface ClinicContextType {
  selectedClinicId: string;
  setSelectedClinicId: (id: string) => void;
  clinicTheme: typeof clinicThemes[0];
  clinicIndex: number;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { data: clinics } = useClinics();
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  useEffect(() => {
    const savedClinicId = localStorage.getItem('selectedClinicId');
    if (savedClinicId && clinics?.find(c => c.id === savedClinicId)) {
      setSelectedClinicId(savedClinicId);
    } else if (clinics && clinics.length > 0) {
      setSelectedClinicId(clinics[0].id);
      localStorage.setItem('selectedClinicId', clinics[0].id);
    }
  }, [clinics]);

  const handleSetSelectedClinicId = (id: string) => {
    setSelectedClinicId(id);
    localStorage.setItem('selectedClinicId', id);
  };

  // Get clinic index based on order in the list
  const foundIndex = clinics?.findIndex(c => c.id === selectedClinicId) ?? -1;
  const clinicIndex = foundIndex >= 0 ? foundIndex : 0;
  const clinicTheme = clinicThemes[clinicIndex % clinicThemes.length];

  return (
    <ClinicContext.Provider value={{ 
      selectedClinicId, 
      setSelectedClinicId: handleSetSelectedClinicId,
      clinicTheme,
      clinicIndex
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinicContext must be used within ClinicProvider');
  }
  return context;
}
