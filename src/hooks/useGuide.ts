import { useContext } from 'react';
import { GuideContext } from '../components/Guide/GuideProvider';
import { GuideContextType } from '../types/guide';

export const useGuide = (): GuideContextType => {
  const context = useContext(GuideContext);
  
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  
  return context;
};