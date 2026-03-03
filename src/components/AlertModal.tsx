import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fadeIn } from '../styles/globalStyles';
import { showAlert, dismissAlert, subscribe, getAlert } from '../lib/alertStore';

const Overlay = styled.div<{ $show: boolean }>`
  display: ${(p) => (p.$show ? 'flex' : 'none')};
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  align-items: center;
  justify-content: center;
  z-index: 100000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

const Box = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 2px solid #D4A043;
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  text-align: center;
`;

const Message = styled.p`
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
  white-space: pre-wrap;
`;

const OkBtn = styled.button`
  padding: 12px 32px;
  background: linear-gradient(135deg, #D4A043 0%, #F5C842 100%);
  border: none;
  border-radius: 10px;
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    opacity: 0.95;
  }
`;

export const AlertModal: React.FC = () => {
  const [msg, setMsg] = useState<string | null>(getAlert());

  useEffect(() => {
    return subscribe(setMsg);
  }, []);

  const handleDismiss = () => {
    dismissAlert();
    setMsg(null);
  };

  return (
    <Overlay $show={!!msg} onClick={handleDismiss}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Message>{msg}</Message>
        <OkBtn type="button" onClick={handleDismiss}>
          OK
        </OkBtn>
      </Box>
    </Overlay>
  );
};
