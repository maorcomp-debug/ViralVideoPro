import styled from 'styled-components';
import { fadeIn } from './globalStyles';

export const AppContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 600px) {
    padding: 20px 15px;
  }
`;

export const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeIn} 0.8s ease-out;
`;

