import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const STORAGE_KEY = 'app_language';

const SwitcherWrapper = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const LangButton = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid ${(p) => (p.$active ? '#D4A043' : '#444')};
  border-radius: 6px;
  background: ${(p) => (p.$active ? 'rgba(212, 160, 67, 0.15)' : 'transparent')};
  color: ${(p) => (p.$active ? '#D4A043' : '#aaa')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #D4A043;
    color: #D4A043;
    background: rgba(212, 160, 67, 0.1);
  }
`;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (lng: 'en' | 'he') => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lng);
    }
  };

  return (
    <SwitcherWrapper>
      <LangButton
        type="button"
        $active={i18n.language === 'en'}
        onClick={() => handleChange('en')}
      >
        EN
      </LangButton>
      <LangButton
        type="button"
        $active={i18n.language === 'he'}
        onClick={() => handleChange('he')}
      >
        עברית
      </LangButton>
    </SwitcherWrapper>
  );
}
