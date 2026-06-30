import React from 'react';
import { CREATOR_TYPE_OPTIONS } from '../constants';
import {
  FieldLabel,
  ToggleRow,
  TypeChip,
  TypeChipGrid,
} from '../styles/viralShareStyles';
import { getCreatorTypeLabel, getShareStrings } from '../i18n';
import type { CreatorTypeKey } from '../types';

interface CreatorTypePickerProps {
  value: CreatorTypeKey;
  onChange: (value: CreatorTypeKey) => void;
  disabled?: boolean;
}

export const CreatorTypePicker: React.FC<CreatorTypePickerProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const s = getShareStrings();

  if (disabled) return null;

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
  creatorType: CreatorTypeKey;
  onCreatorTypeChange: (v: CreatorTypeKey) => void;
}

export const CreatorIdentitySection: React.FC<CreatorIdentitySectionProps> = ({
  includeName,
  onIncludeNameChange,
  creatorType,
  onCreatorTypeChange,
}) => {
  const s = getShareStrings();

  return (
    <>
      <ToggleRow>
        <span>{s.includeCreatorName}</span>
        <input
          type="checkbox"
          checked={includeName}
          onChange={(e) => onIncludeNameChange(e.target.checked)}
        />
      </ToggleRow>
      <CreatorTypePicker
        value={creatorType}
        onChange={onCreatorTypeChange}
        disabled={!includeName}
      />
    </>
  );
};
