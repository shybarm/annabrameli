import { useState } from 'react';
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
import { usePatientDirectory } from '@/hooks/usePatients';
import { useUnreadMessageCount } from '@/hooks/useAdminMessages';
import { useMarkPatientReviewed } from '@/hooks/useUnreviewedPatients';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Mail, User, UserPlus, MessageCircle, MapPin, Sparkles, CheckCircle, MoreHorizontal, ChevronDown, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { PageHelpButton } from '@/components/tutorial/PageHelpButton';
import { pageTutorials } from '@/components/tutorial/tutorialData';
import { PatientInviteDialog } from '@/components/admin/PatientInviteDialog';
import { useClinicContext } from '@/contexts/ClinicContext';
import { cn } from '@/lib/utils';

export default function PatientsList() {
  return (
    <>
      <PermissionGuard permission="canViewPatients">
        <PatientsListContent />
      </PermissionGuard>
    </>
  );
}

function PatientsListContent() {
  const navigate = useNavigate();
  const { selectedClinicId } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // When searching, show all patients; otherwise filter by clinic
  const query = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  const isSearching = query.length >= 2;
  const { data: patients, isLoading, isError, refetch } = usePatientDirectory(isSearching ? null : selectedClinicId);
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

  // Search across the directory, then page the matching rows.
  const sortedAndFilteredPatients = patients
    ?.filter(patient => {
      if (!isSearching) return true;
      return (
        [patient.first_name, patient.last_name].join(' ').toLowerCase().includes(query) ||
        patient.phone?.toLowerCase().includes(query) ||
        patient.id_number?.toLowerCase().includes(query)
      );
    })
    ?.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }) || [];

  const pageSize = 25;
  const lastPage = Math.max(1, Math.ceil(sortedAndFilteredPatients.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const rows = sortedAndFilteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">מטופלים</h1>

        </div>
        <div className="flex flex-wrap gap-2">
          <PageHelpButton tutorial={pageTutorials['/admin/patients']} />
          <PatientInviteDialog 
            trigger={
              <Button variant="outline" size="sm" className="sm:size-default">
                <UserPlus className="h-4 w-4 sm:ml-2" />
                <span>הזמנת מטופל</span>
              </Button>
            }
          />
          <Button onClick={() => navigate('/admin/patients/new')} size="sm" className="sm:size-default bg-primary text-primary-foreground hover:bg-primary/90" data-tutorial="new-patient-btn">
            <Plus className="h-4 w-4 sm:ml-2" />
            <span>מטופל חדש</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 max-w-md" data-tutorial="search-patients">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="חיפוש מטופלים" placeholder="שם, טלפון או מספר זהות"
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value);setPage(1)}}
            className="pr-10 h-9 sm:h-10"
          />
        </div>

      </div>

      {lastPage > 1 && <nav className="flex items-center justify-between" aria-label="עמודי מטופלים">
        <Button variant="outline" size="sm" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>הקודם</Button>
        <span className="text-sm">עמוד {currentPage} מתוך {lastPage}</span>
        <Button variant="outline" size="sm" disabled={currentPage===lastPage} onClick={()=>setPage(currentPage+1)}>הבא</Button>
      </nav>}
      {/* Patients List */}
      {isError ? <p role="alert">טעינת הרשימה נכשלה. <Button variant="outline" onClick={() => refetch()}>ניסיון נוסף</Button></p> : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sortedAndFilteredPatients.length > 0 ? (
        <div className="patient-directory" data-tutorial="patients-list">
          {rows.map((patient) => {
            const patientUnreadCount = unreadCount?.byPatient[patient.id] || 0;
            const isNewPatient = !patient.reviewed_at;
            const isExpanded = expandedCards.has(patient.id);
            
            return (
              <Card 
                key={patient.id} 
                className="patient-directory-row"
              >
                <CardContent className="patient-row-body">
                  {/* Top Row: Avatar, Name, Badges, Actions */}
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    {/* Name + Inline Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                          <Link className="patient-name-link" to={`/admin/patients/${patient.id}`}>{patient.first_name} {patient.last_name}</Link>
                        </h3>
                        {isNewPatient && (
                          <Badge className="bg-muted text-foreground text-xs px-1.5 py-0 h-4 flex-shrink-0">
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
                    <div className="relative z-[1] flex items-center gap-1 flex-shrink-0">
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
                          <Button aria-label={'פעולות עבור ' + patient.first_name + ' ' + patient.last_name} variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="patient-row-menu w-40 pointer-events-auto bg-popover">
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
                        className="relative z-[1] w-full flex items-center justify-center gap-1 pt-2 mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors border-t border-border/30 sm:hidden"
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
                  <div className="patient-row-meta hidden min-w-0 text-xs text-muted-foreground sm:grid">
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
              {isSearching ? 'לא נמצאו תוצאות' : 'אין מטופלים במערכת'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isSearching ? 'אפשר לחפש לפי שם, טלפון או מספר זהות.' : 'אפשר להוסיף את המטופל הראשון.'}
            </p>
            {!isSearching && (
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
