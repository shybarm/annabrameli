import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePatients } from '@/hooks/usePatients';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';
import { useMarkPatientReviewed } from '@/hooks/useUnreviewedPatients';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, User, UserPlus, MessageCircle, MapPin, Sparkles, CheckCircle, MoreHorizontal, ChevronDown, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { PatientInviteDialog } from '@/components/admin/PatientInviteDialog';
import { useClinicContext } from '@/contexts/ClinicContext';
import { cn } from '@/lib/utils';

export default function PatientsList() {
  return (
    <AdminLayout>
      <PermissionGuard permission="canViewPatients">
        <PatientsListContent />
      </PermissionGuard>
    </AdminLayout>
  );
}

function PatientsListContent() {
  const navigate = useNavigate();
  const { selectedClinicId } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // When searching, show all patients; otherwise filter by clinic
  const isSearching = searchQuery.length >= 2;
  const { data: patients, isLoading } = usePatients(isSearching ? null : selectedClinicId);
  const { data: unreadCount } = useUnreadMessageCount();
  const markReviewed = useMarkPatientReviewed();

  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sort and filter patients - new patients always at top
  const sortedAndFilteredPatients = patients
    ?.filter(patient => {
      // Filter by new patients if toggle is on
      if (showOnlyNew) {
        // New patient = reviewed_at is null
        const isNew = !patient.reviewed_at;
        if (!isNew) return false;
      }
      
      if (!isSearching) return true;
      const query = searchQuery.toLowerCase();
      return (
        patient.first_name.toLowerCase().includes(query) ||
        patient.last_name.toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.id_number?.toLowerCase().includes(query)
      );
    })
    ?.sort((a, b) => {
      // New patients (not reviewed) always at top
      const aIsNew = !a.reviewed_at;
      const bIsNew = !b.reviewed_at;
      
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      // Then sort by created_at descending
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">מטופלים</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">ניהול רשימת המטופלים במרפאה</p>
        </div>
        <div className="flex gap-2">
          <PageHelpButton tutorial={pageTutorials['/admin/patients']} />
          <PatientInviteDialog 
            trigger={
              <Button variant="outline" size="sm" className="sm:size-default">
                <UserPlus className="h-4 w-4 sm:ml-2" />
                <span className="hidden sm:inline">הזמן מטופל</span>
              </Button>
            }
          />
          <Button onClick={() => navigate('/admin/patients/new')} size="sm" className="sm:size-default bg-primary text-primary-foreground hover:bg-primary/90" data-tutorial="new-patient-btn">
            <Plus className="h-4 w-4 sm:ml-2" />
            <span className="hidden sm:inline">מטופל חדש</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 max-w-md" data-tutorial="search-patients">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, טלפון או ת.ז..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-9 sm:h-10"
          />
        </div>
        <Button
          variant={showOnlyNew ? "default" : "outline"}
          onClick={() => setShowOnlyNew(!showOnlyNew)}
          size="sm"
          className={cn(
            "gap-1.5 sm:gap-2 h-9 sm:h-10",
            showOnlyNew && "bg-amber-500 hover:bg-amber-600 text-white"
          )}
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="text-sm">חדשים בלבד</span>
        </Button>
      </div>

      {/* Patients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sortedAndFilteredPatients.length > 0 ? (
        <div className="grid gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3" data-tutorial="patients-list">
          {sortedAndFilteredPatients.map((patient) => {
            const patientUnreadCount = unreadCount?.byPatient[patient.id] || 0;
            const isNewPatient = !patient.reviewed_at;
            const isExpanded = expandedCards.has(patient.id);
            
            return (
              <Card 
                key={patient.id} 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all",
                  isNewPatient && "ring-2 ring-amber-400 bg-amber-50/30",
                  "overflow-hidden"
                )}
                onClick={() => navigate(`/admin/patients/${patient.id}`)}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Top Row: Avatar, Name, Badges, Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Compact Avatar */}
                    <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary font-medium text-sm sm:text-base">
                      {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                      {patientUnreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground text-[10px] sm:text-xs rounded-full">
                          {patientUnreadCount}
                        </span>
                      )}
                    </div>
                    
                    {/* Name + Inline Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        {isNewPatient && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                            <Sparkles className="h-2.5 w-2.5 ml-0.5" />
                            חדש
                          </Badge>
                        )}
                        {patientUnreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                            <MessageCircle className="h-2.5 w-2.5 ml-0.5" />
                            {patientUnreadCount}
                          </Badge>
                        )}
                      </div>
                      {/* Secondary info row */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {patient.phone && (
                          <span dir="ltr" className="truncate">{patient.phone}</span>
                        )}
                        {patient.clinic && (
                          <span className="flex items-center gap-0.5 text-primary truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{patient.clinic.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Primary action for new patients */}
                      {isNewPatient && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            markReviewed.mutate(patient.id);
                          }}
                          disabled={markReviewed.isPending}
                          title="קבל למרפאה"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="hidden sm:inline mr-1 text-xs">קבל</span>
                        </Button>
                      )}
                      
                      {/* More menu on mobile */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 pointer-events-auto bg-popover">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/patients/${patient.id}`);
                          }}>
                            <Eye className="h-4 w-4 ml-2" />
                            צפה בפרטים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/appointments/new?patient=${patient.id}`);
                          }}>
                            <Calendar className="h-4 w-4 ml-2" />
                            קבע תור
                          </DropdownMenuItem>
                          {patient.phone && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${patient.phone}`, '_self');
                            }}>
                              <Phone className="h-4 w-4 ml-2" />
                              התקשר
                            </DropdownMenuItem>
                          )}
                          {patient.email && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              window.open(`mailto:${patient.email}`, '_self');
                            }}>
                              <Mail className="h-4 w-4 ml-2" />
                              שלח אימייל
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Collapsible Details - Mobile Only */}
                  <Collapsible open={isExpanded} onOpenChange={() => {}}>
                    <CollapsibleContent className="overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                      <div className="pt-2 mt-2 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
                        {patient.id_number && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span>ת.ז: {patient.id_number}</span>
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span>נוסף: {format(new Date(patient.created_at), 'd/M/yyyy')}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                    
                    {/* Expand/Collapse Toggle */}
                    <CollapsibleTrigger asChild>
                      <button
                        onClick={(e) => toggleExpanded(patient.id, e)}
                        className="w-full flex items-center justify-center gap-1 pt-2 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 sm:hidden"
                      >
                        <span>{isExpanded ? 'הצג פחות' : 'הצג עוד'}</span>
                        <ChevronDown className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                    </CollapsibleTrigger>
                  </Collapsible>
                  
                  {/* Desktop: Always show details */}
                  <div className="hidden sm:block pt-2 mt-2 border-t border-border/50 space-y-1.5 text-xs text-muted-foreground">
                    {patient.id_number && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        <span>ת.ז: {patient.id_number}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span>נוסף: {format(new Date(patient.created_at), 'd/M/yyyy')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-8 sm:py-12">
          <CardContent className="text-center">
            <User className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/30 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'לא נמצאו תוצאות' : 'אין מטופלים במערכת'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'נסה לחפש עם מילות מפתח אחרות' : 'התחל להוסיף מטופלים למרפאה'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/admin/patients/new')} size="sm">
                <Plus className="h-4 w-4 ml-2" />
                הוסף מטופל ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
