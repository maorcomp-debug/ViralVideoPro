import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  ComparisonContainer,
  ComparisonHeader,
  ComparisonSelection,
  AnalysisSelector,
  SelectorHeader,
  SelectorName,
  SelectorScore,
  SelectorMeta,
  ComparisonTable,
  ComparisonTableHeader,
  ComparisonTableRow,
  TableHeaderCell,
  TableCell,
  TableLabel,
  ScoreCell,
  ComparisonSummary,
  SummaryTitle,
  SummaryText,
  EmptyState,
} from '../../styles/indexStyles';
import type { SavedAnalysis, Trainee } from '../../types';

function normalizeExpertRole(role: string): string {
  return (role || '').replace(/\bWeb\s+Screenwriter\b/gi, 'Screenwriter').replace(/^תסריטאי רשת$/, 'תסריטאי');
}

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAnalyses: SavedAnalysis[];
  trainees: Trainee[];
}

export const ComparisonModal = ({
  isOpen,
  onClose,
  savedAnalyses,
  trainees
}: ComparisonModalProps) => {
  const { t } = useTranslation();
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const getTraineeName = (traineeId?: string) => {
    if (!traineeId) return t('comparison.unassigned');
    const trainee = trainees.find(tr => tr.id === traineeId);
    return trainee?.name || t('comparison.notFound');
  };

  const toggleAnalysisSelection = (analysisId: string) => {
    setSelectedAnalyses(prev => {
      if (prev.includes(analysisId)) {
        return prev.filter(id => id !== analysisId);
      } else {
        if (prev.length >= 4) {
          alert(t('comparison.maxAnalyses'));
          return prev;
        }
        return [...prev, analysisId];
      }
    });
  };

  // Filter and deduplicate analyses by ID to prevent showing duplicates
  const uniqueSavedAnalyses = Array.from(
    new Map(savedAnalyses.map(a => [a.id, a])).values()
  );
  
  // Helper function to check if two analyses are for the same video (by file_size)
  const isSameVideo = (analysis1: SavedAnalysis, analysis2: SavedAnalysis): boolean => {
    const fileSize1 = analysis1.metadata?.fileSize || analysis1.result?.metadata?.fileSize;
    const fileSize2 = analysis2.metadata?.fileSize || analysis2.result?.metadata?.fileSize;
    if (fileSize1 && fileSize2) {
      return fileSize1 === fileSize2;
    }
    // Fallback: check video name if file_size not available
    return analysis1.videoName === analysis2.videoName;
  };
  
  // Filter selected analyses and sort by date (oldest first) for proper trend calculation
  const selectedAnalysesData = uniqueSavedAnalyses
    .filter(a => selectedAnalyses.includes(a.id))
    .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime());
  
  // Check if any selected analyses are for the same video
  const hasDuplicateVideos = selectedAnalysesData.length >= 2 && 
    selectedAnalysesData.some((analysis, idx) => 
      selectedAnalysesData.slice(idx + 1).some(other => isSameVideo(analysis, other))
    );

  const generateComparison = () => {
    if (selectedAnalysesData.length < 2) {
      return null;
    }

    // Compare by expert roles (normalize "Web Screenwriter" -> "Screenwriter")
    const allExpertRoles = new Set<string>();
    selectedAnalysesData.forEach(analysis => {
      analysis.result.expertAnalysis?.forEach(expert => {
        allExpertRoles.add(normalizeExpertRole(expert.role));
      });
    });

    return Array.from(allExpertRoles).map(role => {
      const comparisonRow: any = { role, scores: [] };
      selectedAnalysesData.forEach(analysis => {
        const expert = analysis.result.expertAnalysis?.find(e => normalizeExpertRole(e.role) === role);
        if (expert) {
          comparisonRow.scores.push(expert.score);
        } else {
          comparisonRow.scores.push(null);
        }
      });
      return comparisonRow;
    });
  };

  const comparisonData = generateComparison();
  // Calculate averages in chronological order (oldest first)
  const overallAverages = selectedAnalysesData.map(a => a.averageScore);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
        <ModalCloseBtn onClick={onClose}>✕</ModalCloseBtn>
        <ModalHeader>
          <ModalTitle>{t('comparison.modalTitle')}</ModalTitle>
          <ModalSubtitle>
            {t('comparison.modalSubtitle')}
          </ModalSubtitle>
        </ModalHeader>
        
        <ModalBody>
          <ComparisonContainer>
            <ComparisonHeader>
              <div>
                <h3 style={{ color: '#D4A043', margin: '0 0 5px 0' }}>
                  {t('comparison.selectAnalyses', { count: selectedAnalyses.length })}
                </h3>
                <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                  {t('comparison.selectUpTo4')}
                </p>
              </div>
            </ComparisonHeader>

            {uniqueSavedAnalyses.length === 0 ? (
              <EmptyState>
                <h3>{t('comparison.noSavedAnalyses')}</h3>
                <p>{t('comparison.saveAnalysesToCompare')}</p>
              </EmptyState>
            ) : (
              <>
                <ComparisonSelection>
                  {uniqueSavedAnalyses
                    .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
                    .map(analysis => (
                      <AnalysisSelector
                        key={analysis.id}
                        $selected={selectedAnalyses.includes(analysis.id)}
                        onClick={() => toggleAnalysisSelection(analysis.id)}
                      >
                        <SelectorHeader>
                          <SelectorName>
                            {analysis.videoName}
                            {uniqueSavedAnalyses.some(other => 
                              other.id !== analysis.id && isSameVideo(analysis, other)
                            ) && (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: '#FFC107', 
                                marginRight: '5px',
                                fontWeight: 600
                              }}>
                                {t('comparison.sameVideo')}
                              </span>
                            )}
                          </SelectorName>
                          <SelectorScore>{analysis.averageScore}</SelectorScore>
                        </SelectorHeader>
                        <SelectorMeta>
                          {getTraineeName(analysis.traineeId)}
                          {' • '}
                          {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                        </SelectorMeta>
                      </AnalysisSelector>
                    ))}
                </ComparisonSelection>

                {selectedAnalysesData.length >= 2 && (
                  <>
                    <ComparisonTable>
                      <ComparisonTableHeader>
                        <TableHeaderCell>{t('comparison.expert')}</TableHeaderCell>
                        {selectedAnalysesData.map(analysis => (
                          <TableHeaderCell key={analysis.id}>
                            {getTraineeName(analysis.traineeId)}
                            <br />
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                              {new Date(analysis.analysisDate).toLocaleDateString('he-IL')}
                            </span>
                          </TableHeaderCell>
                        ))}
                      </ComparisonTableHeader>

                      {comparisonData?.map((row, idx) => (
                        <ComparisonTableRow key={idx}>
                          <TableLabel>{row.role}</TableLabel>
                          {row.scores.map((score: number | null, scoreIdx: number) => (
                            <TableCell key={scoreIdx}>
                              {score !== null ? (
                                <ScoreCell $score={score}>{score}</ScoreCell>
                              ) : (
                                <span style={{ color: '#666' }}>-</span>
                              )}
                            </TableCell>
                          ))}
                        </ComparisonTableRow>
                      ))}

                      <ComparisonTableRow style={{ background: 'rgba(212, 160, 67, 0.1)', fontWeight: 700 }}>
                        <TableLabel style={{ color: '#D4A043', fontWeight: 700 }}>{t('comparison.overallAverage')}</TableLabel>
                        {overallAverages.map((avg, idx) => (
                          <TableCell key={idx}>
                            <ScoreCell $score={avg}>{avg}</ScoreCell>
                          </TableCell>
                        ))}
                      </ComparisonTableRow>
                    </ComparisonTable>

                    <ComparisonSummary>
                      <SummaryTitle>{t('comparison.summaryTitle')}</SummaryTitle>
                      <SummaryText>
                        {selectedAnalysesData.length > 0 && (
                          <>
                            {hasDuplicateVideos && (
                              <>
                                <div style={{ 
                                  background: 'rgba(255, 193, 7, 0.2)', 
                                  border: '1px solid #FFC107', 
                                  borderRadius: '8px', 
                                  padding: '10px', 
                                  marginBottom: '15px',
                                  color: '#FFC107',
                                  fontWeight: 600
                                }}>
                                  {t('comparison.sameVideoNote')}
                                </div>
                              </>
                            )}
                            <strong>{t('comparison.traineesCompared')}</strong>{' '}
                            {Array.from(new Set(selectedAnalysesData.map(a => getTraineeName(a.traineeId)))).join(', ')}
                            <br />
                            <strong>{t('comparison.dateRange')}</strong>{' '}
                            {new Date(Math.min(...selectedAnalysesData.map(a => new Date(a.analysisDate).getTime()))).toLocaleDateString('he-IL')}
                            {' - '}
                            {new Date(Math.max(...selectedAnalysesData.map(a => new Date(a.analysisDate).getTime()))).toLocaleDateString('he-IL')}
                            <br />
                            <strong>{t('comparison.scoreChange')}</strong>{' '}
                            {overallAverages.length > 1 && (
                              <>
                                {overallAverages[overallAverages.length - 1] > overallAverages[0] ? t('comparison.changeUp') : 
                                 overallAverages[overallAverages.length - 1] < overallAverages[0] ? t('comparison.changeDown') : t('comparison.changeSame')}
                                {' '}({overallAverages[0]} → {overallAverages[overallAverages.length - 1]})
                                {hasDuplicateVideos && overallAverages.length > 1 && 
                                 Math.abs(overallAverages[overallAverages.length - 1] - overallAverages[0]) > 2 && (
                                  <span style={{ color: '#F44336', marginRight: '5px' }}>
                                    {' '}{t('comparison.largeChangeWarning')}
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </SummaryText>
                    </ComparisonSummary>
                  </>
                )}
              </>
            )}
          </ComparisonContainer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

