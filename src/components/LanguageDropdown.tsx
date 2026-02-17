import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { setLanguage } from '../i18n/setLanguage';
import { supabase } from '../lib/supabase';
import { updateCurrentUserProfile } from '../lib/supabase-helpers';

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(212, 160, 67, 0.95);
  background: transparent;
  border: 1px solid rgba(212, 160, 67, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #D4A043;
    background: rgba(212, 160, 67, 0.08);
  }
`;

const Chevron = styled.span<{ $open?: boolean }>`
  font-size: 10px;
  opacity: 0.8;
  transform: ${(p) => (p.$open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.2s;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 120px;
  background: #1a1a1a;
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
`;

const Option = styled.button`
  display: block;
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(212, 160, 67, 0.12);
    color: #D4A043;
  }
`;

const LABELS: Record<string, string> = {
  en: 'English',
  he: 'עברית',
};

const TRIGGER_LABELS: Record<string, string> = {
  en: 'EN',
  he: 'עברית',
};

export function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLng = (i18n.language || i18n.resolvedLanguage || 'en').split('-')[0] as 'en' | 'he';
  const displayLng = currentLng === 'he' ? 'he' : 'en';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (lng: 'en' | 'he') => {
    setLanguage(lng);
    setOpen(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateCurrentUserProfile({ preferred_language: lng });
      }
    } catch (e) {
      console.warn('Could not save preferred_language to profile:', e);
    }
  };

  return (
    <Wrapper ref={ref} dir="ltr">
      <Trigger type="button" onClick={() => setOpen(!open)}>
        {TRIGGER_LABELS[displayLng]} <Chevron $open={open}>▼</Chevron>
      </Trigger>
      {open && (
        <Dropdown>
          <Option type="button" onClick={() => handleSelect('en')}>
            {LABELS.en}
          </Option>
          <Option type="button" onClick={() => handleSelect('he')}>
            {LABELS.he}
          </Option>
        </Dropdown>
      )}
    </Wrapper>
  );
}
