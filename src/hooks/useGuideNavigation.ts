import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGuide } from './useGuide';
import { useAuth } from './useAuth';

interface GuideNavigationState {
  targetPage: string;
  stepId: string;
  flowId: string;
}

export const useGuideNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: guideState, startGuide, nextStep } = useGuide();
  const { isAuthenticated } = useAuth();

  // Save guide state to sessionStorage for cross-page persistence
  const saveGuideNavigationState = useCallback((navigationState: GuideNavigationState) => {
    sessionStorage.setItem('guideNavigation', JSON.stringify(navigationState));
  }, []);

  // Get guide state from sessionStorage
  const getGuideNavigationState = useCallback((): GuideNavigationState | null => {
    const stored = sessionStorage.getItem('guideNavigation');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn('Failed to parse guide navigation state:', error);
        sessionStorage.removeItem('guideNavigation');
      }
    }
    return null;
  }, []);

  // Clear guide navigation state
  const clearGuideNavigationState = useCallback(() => {
    sessionStorage.removeItem('guideNavigation');
  }, []);

  // Navigate to a specific page during guide flow
  const navigateWithGuide = useCallback((targetPath: string, stepId?: string) => {
    if (guideState.isActive && guideState.currentFlow) {
      const navigationState: GuideNavigationState = {
        targetPage: targetPath,
        stepId: stepId || guideState.currentFlow.steps[guideState.currentStepIndex]?.id || '',
        flowId: guideState.currentFlow.id
      };
      
      saveGuideNavigationState(navigationState);
      navigate(targetPath);
    } else {
      navigate(targetPath);
    }
  }, [navigate, guideState, saveGuideNavigationState]);

  // Check if guide should resume on current page
  const checkGuideResumption = useCallback(() => {
    const navigationState = getGuideNavigationState();
    
    if (navigationState && !guideState.isActive) {
      const { targetPage, stepId, flowId } = navigationState;
      
      // Check if we're on the expected page
      if (location.pathname === targetPage) {
        // Resume guide with the appropriate flow
        setTimeout(() => {
          startGuide(flowId);
          
          // Find the step index for the target step
          if (guideState.currentFlow) {
            const stepIndex = guideState.currentFlow.steps.findIndex(step => step.id === stepId);
            if (stepIndex > -1 && stepIndex < guideState.currentStepIndex) {
              // If we've progressed past this step, move to next
              nextStep();
            }
          }
        }, 500); // Small delay to ensure page is fully loaded
        
        clearGuideNavigationState();
      }
    }
  }, [location.pathname, guideState, getGuideNavigationState, clearGuideNavigationState, startGuide, nextStep]);

  // Handle specific guide flow navigation sequences
  const handleRegistrationFlow = useCallback(() => {
    if (!isAuthenticated && guideState.isActive) {
      const currentStep = guideState.currentFlow?.steps[guideState.currentStepIndex];
      
      if (currentStep?.id === 'registration-introduction' && location.pathname !== '/register') {
        navigateWithGuide('/register', 'registration-form-fields');
      } else if (currentStep?.id === 'registration-complete' && location.pathname !== '/login') {
        navigateWithGuide('/login', 'login-form-guidance');
      }
    }
  }, [isAuthenticated, guideState, location.pathname, navigateWithGuide]);

  // Handle authentication status changes during guide
  const handleAuthChange = useCallback(() => {
    if (guideState.isActive && guideState.currentFlow) {
      const wasUnauthenticated = guideState.currentFlow.condition === 'unauthenticated';
      
      if (isAuthenticated && wasUnauthenticated) {
        // User just authenticated, transition to authenticated flow
        setTimeout(() => {
          startGuide('authenticated-onboarding');
        }, 1000); // Give time for UI to update
      }
    }
  }, [isAuthenticated, guideState, startGuide]);

  // Listen for page changes and guide state changes
  useEffect(() => {
    checkGuideResumption();
  }, [location.pathname, checkGuideResumption]);

  useEffect(() => {
    handleRegistrationFlow();
  }, [handleRegistrationFlow]);

  useEffect(() => {
    handleAuthChange();
  }, [isAuthenticated, handleAuthChange]);

  // Cleanup when guide is closed
  useEffect(() => {
    if (!guideState.isActive) {
      clearGuideNavigationState();
    }
  }, [guideState.isActive, clearGuideNavigationState]);

  return {
    navigateWithGuide,
    checkGuideResumption,
    clearGuideNavigationState,
    isNavigatingWithGuide: !!getGuideNavigationState()
  };
};