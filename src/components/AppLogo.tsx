import React from 'react';
import { LogoContainer, StyledLogoImg } from '../styles/indexStyles';

export const AppLogo = () => {
  return (
    <LogoContainer>
      <StyledLogoImg 
        src="/Logo.png" 
        alt="Logo" 
      />
    </LogoContainer>
  );
};

