import React from 'react';
// GUIDE FUNCTIONALITY HIDDEN - IMPORTS COMMENTED OUT
// import { useGuide } from '../../hooks/useGuide';
// import { GuideOverlay } from './GuideOverlay';
// import { GuideTooltip } from './GuideTooltip';
// import SimpleInteractiveGuide from './SimpleInteractiveGuide';

export const GuideController: React.FC = () => {
  // GUIDE FUNCTIONALITY HIDDEN - HOOK USAGE COMMENTED OUT
  /* const {
    state,
    nextStep,
    previousStep,
    skipStep,
    closeGuide,
    pauseGuide,
    resumeGuide
  } = useGuide();

  const { isActive, currentFlow, currentStepIndex, isPaused } = state;

  // Don't render anything if guide is not active
  if (!isActive || !currentFlow || isPaused) {
    return null;
  }

  const currentStep = currentFlow.steps[currentStepIndex];
  
  if (!currentStep) {
    return null;
  }

  const handleOverlayClick = () => {
    // Pause guide instead of closing when clicking overlay
    pauseGuide();
  };

  const handleTooltipClose = () => {
    closeGuide();
  }; */

  return (
    <>
      {/* GUIDE FUNCTIONALITY HIDDEN - COMMENTED OUT */}
      {/* Traditional guided tour components */}
      {/* {isActive && currentStep && !isPaused && (
        <>
          <GuideOverlay
            isVisible={true}
            targetSelector={currentStep.targetSelector}
            onOverlayClick={handleOverlayClick}
            spotlightPadding={8}
          />
          
          <GuideTooltip
            step={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={currentFlow.steps.length}
            isVisible={true}
            onNext={nextStep}
            onPrevious={previousStep}
            onSkip={skipStep}
            onClose={handleTooltipClose}
          />
        </>
      )} */}

      {/* Simple Interactive Guide - always available */}
      {/* {(!isActive || isPaused) && <SimpleInteractiveGuide />} */}
    </>
  );
};