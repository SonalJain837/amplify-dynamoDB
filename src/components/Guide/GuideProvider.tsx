import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { GuideContextType, GuideState, GuideFlow, GuideProgress } from '../../types/guide';
import { guideFlows, getGuideFlowById, getGuideFlowByCondition } from '../../config/guideFlows';
import { useAuth } from '../../hooks/useAuth';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Guide action types
type GuideAction =
  | { type: 'START_GUIDE'; flow: GuideFlow }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SKIP_STEP' }
  | { type: 'CLOSE_GUIDE' }
  | { type: 'PAUSE_GUIDE' }
  | { type: 'RESUME_GUIDE' }
  | { type: 'RESET_GUIDE' }
  | { type: 'COMPLETE_GUIDE' };

// Initial guide state
const initialGuideState: GuideState = {
  isActive: false,
  currentFlow: null,
  currentStepIndex: 0,
  isCompleted: false,
  isPaused: false
};

// Guide reducer
const guideReducer = (state: GuideState, action: GuideAction): GuideState => {
  switch (action.type) {
    case 'START_GUIDE':
      return {
        ...state,
        isActive: true,
        currentFlow: action.flow,
        currentStepIndex: 0,
        isCompleted: false,
        isPaused: false
      };
    
    case 'NEXT_STEP':
      if (!state.currentFlow) return state;
      
      const nextIndex = state.currentStepIndex + 1;
      if (nextIndex >= state.currentFlow.steps.length) {
        return {
          ...state,
          isActive: false,
          isCompleted: true,
          currentStepIndex: 0
        };
      }
      
      return {
        ...state,
        currentStepIndex: nextIndex
      };
    
    case 'PREVIOUS_STEP':
      if (state.currentStepIndex > 0) {
        return {
          ...state,
          currentStepIndex: state.currentStepIndex - 1
        };
      }
      return state;
    
    case 'SKIP_STEP':
      return guideReducer(state, { type: 'NEXT_STEP' });
    
    case 'CLOSE_GUIDE':
      return {
        ...initialGuideState,
        isCompleted: state.isCompleted
      };
    
    case 'PAUSE_GUIDE':
      return {
        ...state,
        isPaused: true
      };
    
    case 'RESUME_GUIDE':
      return {
        ...state,
        isPaused: false
      };
    
    case 'RESET_GUIDE':
      return initialGuideState;
    
    case 'COMPLETE_GUIDE':
      return {
        ...state,
        isActive: false,
        isCompleted: true
      };
    
    default:
      return state;
  }
};

// Create context
export const GuideContext = createContext<GuideContextType | null>(null);

interface GuideProviderProps {
  children: React.ReactNode;
}

export const GuideProvider: React.FC<GuideProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(guideReducer, initialGuideState);
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useLocalStorage<GuideProgress>('guideProgress', {
    completedFlows: [],
    lastActiveDate: new Date().toISOString()
  });

  // Start guide based on authentication state or specific flow ID
  const startGuide = useCallback((flowId?: string) => {
    let targetFlow: GuideFlow | undefined;
    
    if (flowId) {
      targetFlow = getGuideFlowById(flowId);
    } else {
      // Auto-select flow based on auth state
      const condition = isAuthenticated ? 'authenticated' : 'unauthenticated';
      targetFlow = getGuideFlowByCondition(condition);
    }
    
    if (targetFlow) {
      // Check if this flow was already completed
      const wasCompleted = progress.completedFlows.includes(targetFlow.id);
      
      if (!wasCompleted) {
        dispatch({ type: 'START_GUIDE', flow: targetFlow });
        
        // Update progress
        setProgress(prev => ({
          ...prev,
          currentFlow: targetFlow!.id,
          currentStep: 0,
          lastActiveDate: new Date().toISOString()
        }));
      }
    }
  }, [isAuthenticated, progress.completedFlows, setProgress]);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
    
    // Update progress
    if (state.currentFlow) {
      setProgress(prev => ({
        ...prev,
        currentStep: Math.min(state.currentStepIndex + 1, state.currentFlow!.steps.length - 1),
        lastActiveDate: new Date().toISOString()
      }));
    }
  }, [state.currentFlow, state.currentStepIndex, setProgress]);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
    
    // Update progress
    if (state.currentFlow) {
      setProgress(prev => ({
        ...prev,
        currentStep: Math.max(state.currentStepIndex - 1, 0),
        lastActiveDate: new Date().toISOString()
      }));
    }
  }, [state.currentStepIndex, setProgress]);

  const skipStep = useCallback(() => {
    dispatch({ type: 'SKIP_STEP' });
  }, []);

  const closeGuide = useCallback(() => {
    dispatch({ type: 'CLOSE_GUIDE' });
    
    // Mark flow as completed if we reached the end
    if (state.currentFlow && state.isCompleted) {
      setProgress(prev => ({
        ...prev,
        completedFlows: [...prev.completedFlows, state.currentFlow!.id],
        currentFlow: undefined,
        currentStep: undefined,
        lastActiveDate: new Date().toISOString()
      }));
    }
  }, [state.currentFlow, state.isCompleted, setProgress]);

  const pauseGuide = useCallback(() => {
    dispatch({ type: 'PAUSE_GUIDE' });
  }, []);

  const resumeGuide = useCallback(() => {
    dispatch({ type: 'RESUME_GUIDE' });
  }, []);

  const resetGuide = useCallback(() => {
    dispatch({ type: 'RESET_GUIDE' });
    setProgress({
      completedFlows: [],
      lastActiveDate: new Date().toISOString()
    });
  }, [setProgress]);

  // Handle guide completion
  useEffect(() => {
    if (state.isCompleted && state.currentFlow) {
      setProgress(prev => ({
        ...prev,
        completedFlows: [...new Set([...prev.completedFlows, state.currentFlow!.id])],
        currentFlow: undefined,
        currentStep: undefined,
        lastActiveDate: new Date().toISOString()
      }));
    }
  }, [state.isCompleted, state.currentFlow, setProgress]);

  // Keyboard navigation support
  useEffect(() => {
    if (!state.isActive || state.isPaused) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          closeGuide();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          previousStep();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isActive, state.isPaused, nextStep, previousStep, closeGuide]);

  const contextValue: GuideContextType = {
    state,
    startGuide,
    nextStep,
    previousStep,
    skipStep,
    closeGuide,
    pauseGuide,
    resumeGuide,
    resetGuide
  };

  return (
    <GuideContext.Provider value={contextValue}>
      {children}
    </GuideContext.Provider>
  );
};