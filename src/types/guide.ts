export interface GuideStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  screenshot?: {
    src: string;
    alt: string;
    responsive?: {
      mobile?: string;
      tablet?: string;
      desktop?: string;
    };
  };
  actionRequired?: boolean;
  waitForElement?: string;
  offset?: {
    x: number;
    y: number;
  };
}

export interface GuideFlow {
  id: string;
  name: string;
  condition: 'authenticated' | 'unauthenticated';
  steps: GuideStep[];
}

export interface GuideState {
  isActive: boolean;
  currentFlow: GuideFlow | null;
  currentStepIndex: number;
  isCompleted: boolean;
  isPaused: boolean;
}

export interface GuideContextType {
  state: GuideState;
  startGuide: (flowId?: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  closeGuide: () => void;
  pauseGuide: () => void;
  resumeGuide: () => void;
  resetGuide: () => void;
}

export interface GuideTooltipPosition {
  top: number;
  left: number;
  transform: string;
  arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  arrowOffset: number;
}

export interface SpotlightCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface GuideProgress {
  completedFlows: string[];
  currentFlow?: string;
  currentStep?: number;
  lastActiveDate?: string;
}