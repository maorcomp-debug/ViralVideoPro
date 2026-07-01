import React, { useEffect } from 'react';
import { CREATOR_TYPE_OPTIONS } from '../constants';
import {
  FieldLabel,
  ShareNameInput,
  ToggleRow,
  TypeChip,
  TypeChipGrid,
} from '../styles/viralShareStyles';
import { getCreatorTypeLabel, getShareStrings } from '../i18n';
import type { CreatorTypeKey } from '../types';

interface CreatorTypePickerProps {
  value: CreatorTypeKey;
  onChange: (value: CreatorTypeKey) => void;
}

export const CreatorTypePicker: React.FC<CreatorTypePickerProps> = ({
  value,
  onChange,
}) => {
  const s = getShareStrings();

  return (
    <>
      <FieldLabel>{s.creatorTypeLabel}</FieldLabel>
      <TypeChipGrid>
        {CREATOR_TYPE_OPTIONS.map((key) => (
          <TypeChip
            key={key}
            type="button"
            $active={value === key}
            onClick={() => onChange(key)}
          >
            {getCreatorTypeLabel(key)}
          </TypeChip>
        ))}
      </TypeChipGrid>
    </>
  );
};

interface CreatorIdentitySectionProps {
  includeName: boolean;
  onIncludeNameChange: (v: boolean) => void;
  creatorDisplayName: string;
  onCreatorDisplayNameChange: (v: string) => void;
  suggestedCreatorName?: string;
  creatorType: CreatorTypeKey;
  onCreatorTypeChange: (v: CreatorTypeKey) => void;
}

export const CreatorIdentitySection: React.FC<CreatorIdentitySectionProps> = ({
  includeName,
  onIncludeNameChange,
  creatorDisplayName,
  onCreatorDisplayNameChange,
  suggestedCreatorName,
  creatorType,
  onCreatorTypeChange,
}) => {
  const s = getShareStrings();
  const profileName = suggestedCreatorName?.trim() || '';
  const filledFromProfile = !!profileName && creatorDisplayName.trim() === profileName;

  useEffect(() => {
    if (!includeName || !profileName) return;
    if (!creatorDisplayName.trim()) {
      onCreatorDisplayNameChange(profileName);
    }
  }, [includeName, profileName, creatorDisplayName, onCreatorDisplayNameChange]);

  const handleIncludeChange = (checked: boolean) => {
    onIncludeNameChange(checked);
    if (checked && profileName && !creatorDisplayName.trim()) {
      onCreatorDisplayNameChange(profileName);
    }
  };

  return (
    <>
      <ToggleRow>
        <span>{s.includeCreatorName}</span>
        <input
          type="checkbox"
          checked={includeName}
          onChange={(e) => handleIncludeChange(e.target.checked)}
        />
      </ToggleRow>
      {includeName && (
        <>
          <FieldLabel>{s.creatorNameLabel}</FieldLabel>
          <ShareNameInput
            type="text"
            value={creatorDisplayName}
            onChange={(e) => onCreatorDisplayNameChange(e.target.value)}
            placeholder={profileName ? profileName : s.creatorNamePlaceholder}
            maxLength={60}
            autoComplete="name"
          />
          {filledFromProfile && (
            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'rgba(212,160,67,0.85)' }}>
              {s.creatorNameFromProfile}
            </p>
          )}
        </>
      )}
      <CreatorTypePicker
        value={creatorType}
        onChange={onCreatorTypeChange}
      />
    </>
  );
};
