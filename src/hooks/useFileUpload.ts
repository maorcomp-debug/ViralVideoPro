import { useState, useRef, useCallback } from 'react';
import type { TrackId, UserSubscription } from '../types';
import { getMaxFileBytes, getMaxVideoSeconds, getUploadLimitText } from '../constants';

interface UseFileUploadReturn {
  file: File | null;
  pdfFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pdfInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  setFile: (file: File | null) => void;
  setPdfFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (e: React.MouseEvent) => void;
  handlePdfSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePdf: (e: React.MouseEvent) => void;
  handleReset: () => void;
}

export const useFileUpload = (
  activeTrack: TrackId,
  subscription: UserSubscription | null,
  isImprovementMode: boolean,
  setResult: (result: any) => void
): UseFileUploadReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxFileBytes = getMaxFileBytes(activeTrack, subscription || undefined);
    const maxVideoSeconds = getMaxVideoSeconds(activeTrack, subscription || undefined);
    const limitText = getUploadLimitText(activeTrack, subscription || undefined);

    if (selectedFile.size > maxFileBytes) {
      const actualMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
      alert(`הקובץ גדול מדי (${actualMb}MB). מגבלה: ${limitText}.`);
      resetInput();
      return;
    }
      
    const objectUrl = URL.createObjectURL(selectedFile);
      
    const finalizeSelection = () => {
      setFile(selectedFile);
      setPreviewUrl(objectUrl);
      if (!isImprovementMode) {
        setResult(null);
      }
    };

    if (selectedFile.type.startsWith('video')) {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.src = objectUrl;

      videoEl.onloadedmetadata = () => {
        if (videoEl.duration > maxVideoSeconds) {
          const durationSeconds = Math.round(videoEl.duration);
          alert(`אורך הסרטון (${durationSeconds} שניות) חורג מהמגבלה: ${limitText}.`);
          URL.revokeObjectURL(objectUrl);
          resetInput();
          return;
        }
        finalizeSelection();
      };

      videoEl.onerror = () => {
        alert("לא ניתן לקרוא את המטא-דאטה של הווידאו. נסה קובץ אחר.");
        URL.revokeObjectURL(objectUrl);
        resetInput();
      };
    } else {
      finalizeSelection();
    }
  }, [activeTrack, subscription, isImprovementMode, setResult]);

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handlePdfSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setPdfFile(selectedFile);
    } else if (selectedFile) {
      alert('נא לבחור קובץ PDF בלבד');
    }
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  }, []);

  const handleRemovePdf = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPdfFile(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  }, []);

  const handleReset = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPdfFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  }, [previewUrl, setResult]);

  return {
    file,
    pdfFile,
    previewUrl,
    fileInputRef,
    pdfInputRef,
    videoRef,
    setFile,
    setPdfFile,
    setPreviewUrl,
    handleFileSelect,
    handleRemoveFile,
    handlePdfSelect,
    handleRemovePdf,
    handleReset,
  };
};

