import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { saveTrainee, getAnalyses } from '../../lib/supabase-helpers';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  ModalCloseBtn,
  ModalBody,
} from '../../styles/modal';
import {
  CoachDashboardContainer,
  CoachHeader,
  CoachButton,
  TraineeGrid,
  TraineeCard,
  TraineeName,
  TraineeInfo,
  TraineeActions,
  TraineeActionButton,
  EmptyState,
  TraineeForm,
  FormInput,
  FormTextarea,
} from '../../styles/indexStyles';
import type { SavedAnalysis, Trainee, TrackId } from '../../types';

interface CoachDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainees: Trainee[];
  setTrainees: React.Dispatch<React.SetStateAction<Trainee[]>>;
  savedAnalyses: SavedAnalysis[];
  setSavedAnalyses: React.Dispatch<React.SetStateAction<SavedAnalysis[]>>;
  onTraineeSelect?: (traineeId: string) => void;
  onViewAnalysis?: (analysis: SavedAnalysis) => void;
  onExportReport?: (traineeId: string) => void;
}

export const CoachDashboardModal = ({
  isOpen,
  onClose,
  trainees,
  setTrainees,
  savedAnalyses,
  setSavedAnalyses,
  onTraineeSelect,
  onViewAnalysis,
  onExportReport
}: CoachDashboardModalProps) => {
  const { t } = useTranslation();
  const [isAddingTrainee, setIsAddingTrainee] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [viewingTraineeAnalyses, setViewingTraineeAnalyses] = useState<string | null>(null);

  const handleSaveTrainee = async () => {
    if (!formData.name.trim()) {
      alert(t('coachDashboard.enterTraineeName'));
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      alert(t('coachDashboard.loginRequired'));
      return;
    }

    try {
      if (editingTrainee) {
        // Update existing
        const { error } = await supabase
          .from('trainees')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
          })
          .eq('id', editingTrainee.id)
          .eq('coach_id', currentUser.id);

        if (error) throw error;

        setTrainees(prev => prev.map(t => 
          t.id === editingTrainee.id 
            ? { ...t, ...formData, email: formData.email || undefined, phone: formData.phone || undefined, notes: formData.notes || undefined }
            : t
        ));
        setEditingTrainee(null);
      } else {
        // Add new
        const newTraineeData = await saveTrainee({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          notes: formData.notes || undefined,
        });

        const newTrainee: Trainee = {
          id: newTraineeData.id,
          name: newTraineeData.name,
          email: newTraineeData.email || undefined,
          phone: newTraineeData.phone || undefined,
          notes: newTraineeData.notes || undefined,
          createdAt: new Date(newTraineeData.created_at),
          analyses: []
        };
        setTrainees(prev => [...prev, newTrainee]);
        setIsAddingTrainee(false);
      }
      
      setFormData({ name: '', email: '', phone: '', notes: '' });
    } catch (error) {
      console.error('Error saving trainee:', error);
      alert(t('coachDashboard.saveError'));
    }
  };

  const handleDeleteTrainee = async (id: string) => {
    if (!confirm(t('coachDashboard.deleteConfirm'))) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      alert(t('coachDashboard.loginRequired'));
      return;
    }

    try {
      const { error } = await supabase
        .from('trainees')
        .delete()
        .eq('id', id)
        .eq('coach_id', currentUser.id);

      if (error) throw error;

      setTrainees(prev => prev.filter(t => t.id !== id));
      
      // Reload analyses (they will be filtered automatically by trainee_id)
      const updatedAnalyses = await getAnalyses();
      setSavedAnalyses(updatedAnalyses.map(a => ({
        id: a.id,
        videoName: '',
        videoUrl: '',
        traineeId: a.trainee_id || undefined,
        traineeName: undefined,
        analysisDate: new Date(a.created_at),
        result: a.result,
        averageScore: a.average_score,
        track: a.track as TrackId,
        metadata: {
          prompt: a.prompt || undefined,
        },
      })));
    } catch (error) {
      console.error('Error deleting trainee:', error);
      alert(t('coachDashboard.deleteError'));
    }
  };

  const handleEditTrainee = (trainee: Trainee) => {
    setEditingTrainee(trainee);
    setFormData({
      name: trainee.name,
      email: trainee.email || '',
      phone: trainee.phone || '',
      notes: trainee.notes || ''
    });
    setIsAddingTrainee(true);
  };

  const getTraineeAnalysesCount = (traineeId: string) => {
    return savedAnalyses.filter(a => a.traineeId === traineeId).length;
  };

  // Export all data to JSON file
  const handleExportData = () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        trainees: trainees.map(t => ({
          ...t,
          createdAt: t.createdAt.toISOString()
        })),
        savedAnalyses: savedAnalyses.map(a => ({
          ...a,
          analysisDate: a.analysisDate.toISOString()
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viraly_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(t('coachDashboard.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      alert(t('coachDashboard.exportError'));
    }
  };

  // Import data from JSON file
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          if (!importedData.trainees || !Array.isArray(importedData.trainees)) {
            throw new Error(t('coachDashboard.importInvalidFormat'));
          }

          if (!importedData.savedAnalyses || !Array.isArray(importedData.savedAnalyses)) {
            throw new Error(t('coachDashboard.importInvalidAnalyses'));
          }

          const confirmMessage = t('coachDashboard.importConfirm', {
            trainees: importedData.trainees.length,
            analyses: importedData.savedAnalyses.length,
          });
          
          if (confirm(confirmMessage)) {
            // Convert dates back to Date objects
            const importedTrainees = importedData.trainees.map((t: any) => ({
              ...t,
              createdAt: new Date(t.createdAt || t.createdAt)
            }));
            
            const importedAnalyses = importedData.savedAnalyses.map((a: any) => ({
              ...a,
              analysisDate: new Date(a.analysisDate || a.analysisDate)
            }));

            // Update state (will trigger localStorage sync via useEffect)
            setTrainees(importedTrainees);
            setSavedAnalyses(importedAnalyses);
            
            alert(t('coachDashboard.importSuccess'));
            onClose(); // Close modal to show updated data
          }
        } catch (error: any) {
          console.error('Import error:', error);
          alert(t('coachDashboard.importError', { error: error.message }));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>{t('coachDashboard.modalTitle')}</ModalTitle>
          <ModalSubtitle>
            {t('coachDashboard.modalSubtitle')}
          </ModalSubtitle>
        </ModalHeader>
        
        <ModalBody>
          <CoachDashboardContainer>
            <CoachHeader>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 5px 0' }}>
                  {trainees.length} מתאמנים רשומים
                </h3>
                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                  סך הכל {savedAnalyses.length} ניתוחים שמורים
                </p>
              </div>
              {!isAddingTrainee && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <CoachButton onClick={handleExportData}>
                    ייצא נתונים
                  </CoachButton>
                  <CoachButton onClick={handleImportData}>
                    ייבא נתונים
                  </CoachButton>
                  <CoachButton onClick={() => {
                    setIsAddingTrainee(true);
                    setEditingTrainee(null);
                    setFormData({ name: '', email: '', phone: '', notes: '' });
                  }}>
                    + הוסף מתאמן חדש
                  </CoachButton>
                </div>
              )}
            </CoachHeader>

            {isAddingTrainee && (
              <TraineeForm style={{ background: 'rgba(212, 160, 67, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 160, 67, 0.2)' }}>
                <h3 style={{ color: '#D4A043', margin: '0 0 15px 0' }}>
                  {editingTrainee ? 'עריכת מתאמן' : 'מתאמן חדש'}
                </h3>
                <FormInput
                  placeholder="שם מלא *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <FormInput
                  type="email"
                  placeholder="אימייל (אופציונלי)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <FormInput
                  type="tel"
                  placeholder="טלפון (אופציונלי)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <FormTextarea
                  placeholder="הערות (אופציונלי)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <CoachButton onClick={handleSaveTrainee} style={{ flex: 1 }}>
                    {editingTrainee ? 'שמור שינויים' : 'שמור מתאמן'}
                  </CoachButton>
                  <TraineeActionButton onClick={() => {
                    setIsAddingTrainee(false);
                    setEditingTrainee(null);
                    setFormData({ name: '', email: '', phone: '', notes: '' });
                  }}>
                    ביטול
                  </TraineeActionButton>
                </div>
              </TraineeForm>
            )}

            {trainees.length === 0 && !isAddingTrainee ? (
              <EmptyState>
                <h3>אין מתאמנים רשומים</h3>
                <p>התחל בהוספת מתאמן חדש כדי להתחיל לעבוד</p>
                <CoachButton onClick={() => setIsAddingTrainee(true)}>
                  + הוסף מתאמן ראשון
                </CoachButton>
              </EmptyState>
            ) : (
              <TraineeGrid>
                {trainees.map(trainee => {
                  const analysesCount = getTraineeAnalysesCount(trainee.id);
                  return (
                    <TraineeCard key={trainee.id}>
                      <TraineeName>{trainee.name}</TraineeName>
                      {trainee.email && (
                        <TraineeInfo>
                          📧 {trainee.email}
                        </TraineeInfo>
                      )}
                      {trainee.phone && (
                        <TraineeInfo>
                          📱 {trainee.phone}
                        </TraineeInfo>
                      )}
                      <TraineeInfo>
                        📊 {analysesCount} ניתוחים שמורים
                      </TraineeInfo>
                      {trainee.notes && (
                        <TraineeInfo style={{ color: '#888', fontSize: '0.85rem', marginTop: '10px' }}>
                          {trainee.notes}
                        </TraineeInfo>
                      )}
                      <TraineeActions>
                        <TraineeActionButton onClick={() => {
                          setViewingTraineeAnalyses(viewingTraineeAnalyses === trainee.id ? null : trainee.id);
                        }}>
                          {viewingTraineeAnalyses === trainee.id ? 'הסתר ניתוחים' : 'צפה בניתוחים'}
                        </TraineeActionButton>
                        <TraineeActionButton onClick={() => {
                          if (onTraineeSelect) onTraineeSelect(trainee.id);
                          onClose();
                        }}>
                          בחר לניתוח
                        </TraineeActionButton>
                        <TraineeActionButton onClick={() => handleEditTrainee(trainee)}>
                          ערוך
                        </TraineeActionButton>
                        {analysesCount > 0 && onExportReport && (
                          <TraineeActionButton 
                            onClick={() => {
                              onExportReport(trainee.id);
                            }}
                            style={{ background: 'rgba(212, 160, 67, 0.1)', borderColor: '#D4A043', color: '#D4A043' }}
                          >
                            יצא דוח PDF
                          </TraineeActionButton>
                        )}
                        <TraineeActionButton 
                          className="delete"
                          onClick={() => handleDeleteTrainee(trainee.id)}
                        >
                          מחק
                        </TraineeActionButton>
                      </TraineeActions>
                      {viewingTraineeAnalyses === trainee.id && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #222' }}>
                          <h4 style={{ color: '#D4A043', margin: '0 0 10px 0', fontSize: '0.95rem' }}>
                            ניתוחים שמורים ({analysesCount})
                          </h4>
                          {analysesCount === 0 ? (
                            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                              אין ניתוחים שמורים עבור מתאמן זה
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {savedAnalyses
                                .filter(a => a.traineeId === trainee.id)
                                .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
                                .map(analysis => (
                                  <div 
                                    key={analysis.id}
                                    style={{
                                      background: 'rgba(212, 160, 67, 0.05)',
                                      border: '1px solid rgba(212, 160, 67, 0.2)',
                                      borderRadius: '6px',
                                      padding: '12px',
                                      cursor: onViewAnalysis ? 'pointer' : 'default'
                                    }}
                                    onClick={() => onViewAnalysis && onViewAnalysis(analysis)}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                      <span style={{ color: '#D4A043', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {analysis.videoName}
                                      </span>
                                      <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                        {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                      <span style={{ 
                                        background: '#D4A043', 
                                        color: '#000', 
                                        padding: '2px 8px', 
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: 700
                                      }}>
                                        ציון: {analysis.averageScore}
                                      </span>
                                      {onViewAnalysis && (
                                        <span style={{ color: '#888', fontSize: '0.85rem' }}>
                                          לחץ לצפייה →
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TraineeCard>
                  );
                })}
              </TraineeGrid>
            )}
          </CoachDashboardContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

