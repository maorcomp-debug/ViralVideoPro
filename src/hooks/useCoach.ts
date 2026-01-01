import { useState, useCallback } from 'react';
import type { TrackId, Trainee, SavedAnalysis } from '../types';

interface UseCoachReturn {
  coachMode: 'coach' | 'trainee' | null;
  coachTrainingTrack: TrackId;
  analysisDepth: 'standard' | 'deep';
  trainees: Trainee[];
  savedAnalyses: SavedAnalysis[];
  selectedTrainee: string | null;
  showCoachDashboard: boolean;
  showComparison: boolean;
  showCoachGuide: boolean;
  setCoachMode: (mode: 'coach' | 'trainee' | null) => void;
  setCoachTrainingTrack: (track: TrackId) => void;
  setAnalysisDepth: (depth: 'standard' | 'deep') => void;
  setTrainees: React.Dispatch<React.SetStateAction<Trainee[]>>;
  setSavedAnalyses: React.Dispatch<React.SetStateAction<SavedAnalysis[]>>;
  setSelectedTrainee: (traineeId: string | null) => void;
  setShowCoachDashboard: (show: boolean) => void;
  setShowComparison: (show: boolean) => void;
  setShowCoachGuide: (show: boolean) => void;
  getTraineeAnalysesCount: (traineeId: string) => number;
}

export const useCoach = (): UseCoachReturn => {
  const [coachMode, setCoachMode] = useState<'coach' | 'trainee' | null>(null);
  const [coachTrainingTrack, setCoachTrainingTrack] = useState<TrackId>('actors');
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'deep'>('standard');
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<string | null>(null);
  const [showCoachDashboard, setShowCoachDashboard] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showCoachGuide, setShowCoachGuide] = useState(false);

  const getTraineeAnalysesCount = useCallback((traineeId: string) => {
    return savedAnalyses.filter(a => a.traineeId === traineeId).length;
  }, [savedAnalyses]);

  return {
    coachMode,
    coachTrainingTrack,
    analysisDepth,
    trainees,
    savedAnalyses,
    selectedTrainee,
    showCoachDashboard,
    showComparison,
    showCoachGuide,
    setCoachMode,
    setCoachTrainingTrack,
    setAnalysisDepth,
    setTrainees,
    setSavedAnalyses,
    setSelectedTrainee,
    setShowCoachDashboard,
    setShowComparison,
    setShowCoachGuide,
    getTraineeAnalysesCount,
  };
};

