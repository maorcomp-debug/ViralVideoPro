import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface ContactFormProps {
  onClose: () => void;
  sourceUrl?: string;
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  honeypot: string; // Hidden field for spam protection
}

interface FormErrors {
  fullName?: string;
  email?: string;
  message?: string;
  subject?: string;
  general?: string;
}

const FormContainer = styled.div`
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  color: #D4A043;
  font-size: 0.9rem;
  text-align: right;
  font-weight: 500;
`;

const Required = styled.span`
  color: #ff6b6b;
  margin-right: 3px;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
  direction: rtl;
  text-align: right;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(212, 160, 67, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 1rem;
  direction: rtl;
  text-align: right;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.3s;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #D4A043;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const HoneypotField = styled.input`
  position: absolute;
  left: -9999px;
  opacity: 0;
  pointer-events: none;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.85rem;
  margin-top: 5px;
  text-align: right;
`;

const SuccessMessage = styled.div`
  color: #51cf66;
  font-size: 0.9rem;
  padding: 15px;
  background: rgba(81, 207, 102, 0.1);
  border: 1px solid rgba(81, 207, 102, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button<{ $primary?: boolean; $isFree?: boolean }>`
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Frank Ruhl Libre', serif;

  ${props => props.$primary ? `
    background: linear-gradient(135deg, #D4A043 0%, #B88A2E 100%);
    color: #0a0a0a;
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #E4B053 0%, #C89A3E 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 160, 67, 0.4);
    }
  ` : `
    background: ${props.$isFree ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props.$isFree ? '#999' : '#fff'};
    border: 1px solid ${props.$isFree ? '#333' : 'rgba(212, 160, 67, 0.3)'};
    
    &:hover:not(:disabled) {
      background: ${props.$isFree ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'};
      border-color: ${props.$isFree ? '#444' : '#D4A043'};
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const CharacterCount = styled.div<{ $warning?: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.$warning ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)'};
  text-align: right;
  margin-top: 5px;
`;

export const ContactForm: React.FC<ContactFormProps> = ({ onClose, sourceUrl }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('contact.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('contact.emailInvalid');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.subjectRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contact.messageRequired');
    } else if (formData.message.trim().length < 20) {
      newErrors.message = t('contact.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          honeypot: formData.honeypot,
          sourceUrl: sourceUrl || window.location.href,
          lang: (i18n.language || i18n.resolvedLanguage || 'he').split('-')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || t('contact.sendError'));
      }

      setIsSuccess(true);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        honeypot: '',
      });

      // Close form after 3 seconds
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 3000);

    } catch (error: any) {
      setErrors({
        general: error.message || t('contact.sendError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = formData.message.trim().length;
  const minMessageLength = 20;

  if (isSuccess) {
    return (
      <FormContainer>
        <SuccessMessage>
          ✓ {t('contact.successMessage')}
        </SuccessMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <ErrorMessage style={{ marginBottom: '15px', textAlign: 'center' }}>
            {errors.general}
          </ErrorMessage>
        )}

        <FormField>
          <Label>
            <Required>*</Required>{t('contact.fullName')}
          </Label>
          <Input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder={t('contact.placeholderFullName')}
            disabled={isSubmitting}
            required
          />
          {errors.fullName && <ErrorMessage>{errors.fullName}</ErrorMessage>}
        </FormField>

        <FormField>
          <Label>
            <Required>*</Required>{t('contact.email')}
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            disabled={isSubmitting}
            required
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </FormField>

        <FormField>
          <Label>{t('contact.phoneOptional')}</Label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="05X-XXXXXXX"
            disabled={isSubmitting}
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
        </FormField>

        <FormField>
          <Label>
            <Required>*</Required>{t('contact.subject')}
          </Label>
          <Input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder={t('contact.placeholderSubject')}
            disabled={isSubmitting}
            required
          />
          {errors.subject && <ErrorMessage>{errors.subject}</ErrorMessage>}
        </FormField>

        <FormField>
          <Label>
            <Required>*</Required>{t('contact.message')}
          </Label>
          <TextArea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t('contact.placeholderMessage')}
            disabled={isSubmitting}
            required
            rows={5}
          />
          <CharacterCount $warning={messageLength > 0 && messageLength < minMessageLength}>
            {t('contact.charCount', { count: messageLength, min: minMessageLength })}
          </CharacterCount>
          {errors.message && <ErrorMessage>{errors.message}</ErrorMessage>}
        </FormField>

        {/* Honeypot field - hidden from users */}
        <HoneypotField
          type="text"
          name="website"
          value={formData.honeypot}
          onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />

        <ButtonContainer>
          <Button
            type="submit"
            $primary
            disabled={isSubmitting}
          >
            {isSubmitting ? t('subscription.sending') : t('subscription.sendMessage')}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            $isFree={true}
            disabled={isSubmitting}
          >
            {t('subscription.cancel')}
          </Button>
        </ButtonContainer>
      </form>
    </FormContainer>
  );
};

