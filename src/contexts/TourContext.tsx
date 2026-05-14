import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface TourStep {
  target: string; // data-tour attribute value, or '' for centered/no-target steps
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'navigation',
    title: 'Navigation',
    body: 'Jump between your dashboard, semesters, and the GPA simulator from here.',
  },
  {
    target: 'gpa-ring',
    title: 'Your GPA',
    body: 'This is your cumulative GPA. It updates in real time as you enter grades.',
  },
  {
    target: 'course-list',
    title: 'Your courses',
    body: "Your active semester's courses are listed here. Tap any course to open it.",
  },
  {
    target: 'add-course',
    title: 'Add a course',
    body: 'Use this to add a new course to your semester.',
  },
  {
    target: '',
    title: 'Evaluation criteria',
    body: 'Inside a course, you define how your grade is calculated. Add quizzes, assignments, exams, and their percentage weights.',
  },
  {
    target: '',
    title: 'Score entry',
    body: 'Tap Score on any criterion to enter your grades. Cumulus calculates your running average automatically.',
  },
  {
    target: '',
    title: 'What score do I need?',
    body: "Not sure what you need on your next exam? Cumulus tells you exactly what score to aim for.",
  },
  {
    target: 'simulator-link',
    title: 'GPA Simulator',
    body: 'Use the simulator to play out different grade scenarios before the semester ends.',
  },
  {
    target: '',
    title: 'Canvas sync',
    body: 'Connect your Canvas account in Settings to import everything automatically — no manual entry needed.',
  },
  {
    target: '',
    title: "You're all set!",
    body: "That's everything. Cumulus will keep your GPA up to date as you enter grades throughout the semester.",
  },
];

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepData: TourStep;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  isActive: false,
  currentStep: 0,
  totalSteps: TOUR_STEPS.length,
  currentStepData: TOUR_STEPS[0],
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  endTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const updateTour = useMutation(api.users.updateTour);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev >= TOUR_STEPS.length - 1) return prev;
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    updateTour({ tourCompleted: true, tourDismissed: true }).catch(() => {});
  }, [updateTour]);

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      totalSteps: TOUR_STEPS.length,
      currentStepData: TOUR_STEPS[currentStep],
      startTour,
      nextStep,
      prevStep,
      endTour,
    }}>
      {children}
    </TourContext.Provider>
  );
}
