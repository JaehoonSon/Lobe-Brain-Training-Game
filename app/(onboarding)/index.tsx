import React, { useState } from 'react';
import { Text } from '~/components/ui/text';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { WizardLayout } from '~/components/WizardLayout';
import {
  SelectionStep, SelectionStepConfig,
  AffirmationStep, AffirmationStepConfig
} from './templates';

// --- Step Configuration ---
// Each step is just data. Templates render them.

type StepConfig =
  | { title: string; description: string; step: SelectionStepConfig }
  | { title: string; description: string; step: AffirmationStepConfig };

const STEPS: StepConfig[] = [
  // Step 1: Interests
  {
    title: "Let's start with your interests",
    description: "Select up to 3",
    step: {
      type: 'selection',
      dataKey: 'interests',
      maxSelections: 3,
      options: [
        "I want to keep my mind active and challenged",
        "I like pushing myself to improve",
        "I want to train my memory and attention",
        "I'm curious about how my brain works",
        "I'd like to manage stress and build better habits"
      ]
    }
  },
  // Step 2: Affirmation
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/brain_lifting_cute.png'), // Using the new CUTE brain
      headline: "The brain is like a muscle.",
      subtext: "Train it daily. Just a few minutes each day can build a lifelong habit."
    }
  },
  // Step 3: Memory
  {
    title: "Memory",
    description: "What aspects of your memory would you like to train?",
    step: {
      type: 'selection',
      dataKey: 'memory_goals',
      options: [
        { label: "Working Memory", description: "Hold and manipulate information" },
        { label: "Face-name Recall", description: "Recall and match people's names" },
        { label: "Spatial Memory", description: "Store and recall locations and positions" },
        { label: "Long-term Memory", description: "Retain information for future recall" },
      ]
    }
  },
  // Step 4: Community Affirmation
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/community_avatars.png'),
      headline: "You're in Good Company",
      subtext: "Over 100 million people have trained their memory on Brain App — many do it daily!"
    }
  },
  // Step 5: Focus Goal
  {
    title: "Attention",
    description: "What aspects of your attention would you like to improve?",
    step: {
      type: 'selection',
      dataKey: 'focus_goals',
      options: [
        { label: "Productivity", description: "Stay focused on tasks longer" },
        { label: "Multitasking", description: "Switch between tasks efficiently" },
        { label: "Concentration", description: "Avoid distractions" },
        { label: "Dividing Attention", description: "Focus on multiple sources at once" },
      ]
    }
  },
  // Step 6: Focus Affirmation
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/brain_focus_archery.png'),
      headline: "Laser Focus Loaded.",
      subtext: "Training your attention can help you stay in the zone when it matters most."
    }
  },
  // Step 7: Problem Solving Goal
  {
    title: "Problem Solving",
    description: "What skills do you want to sharpen?",
    step: {
      type: 'selection',
      dataKey: 'problem_solving_goals',
      options: [
        { label: "Logical Reasoning", description: "Analyze arguments and connect ideas" },
        { label: "Math Skills", description: "Calculate faster and more accurately" },
        { label: "Planning", description: "Think ahead and strategize" },
        { label: "Spatial Orientation", description: "Visualize and manipulate objects" },
      ]
    }
  },
  // Step 8: Problem Solving Affirmation
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/brain_solving_puzzle.png'),
      headline: "Solved!",
      subtext: "Challenge your logic daily to keep your mind sharp and flexible."
    }
  },
  // Step 9: Goals Transition
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/yellow_character_cute.png'),
      headline: "That was about your goals",
      subtext: "Now, let’s get to know you so we can tailor your training and feedback."
    }
  },
  // Step 10: Gender
  {
    title: "First, what’s your gender?",
    description: "This helps us show you how you compare to similar members in our community.",
    step: {
      type: 'selection',
      dataKey: 'gender',
      maxSelections: 1,
      options: ["Male", "Female", "Non-binary"]
    }
  },
  // Step 11: Education
  {
    title: "What's the highest level of education you've completed?",
    description: "",
    step: {
      type: 'selection',
      dataKey: 'education',
      maxSelections: 1,
      options: [
        "Some high school",
        "High school",
        "Some college",
        "Associate degree",
        "College degree (BA/BS)",
        "Master's degree",
        "Professional degree",
        "PhD"
      ]
    }
  },
  // Step 12: Referral Source
  {
    title: "How did you hear about Brain App?",
    description: "",
    step: {
      type: 'selection',
      dataKey: 'referral_source',
      maxSelections: 1,
      options: [
        "Doctor or Healthcare Provider",
        "Friend or family",
        "App Store",
        "Play Store",
        "Social media (e.g. Facebook)",
        "Search (e.g. Google)",
        "Other"
      ]
    }
  },
  // Step 13: Calibration Transition
  {
    title: "",
    description: "",
    step: {
      type: 'affirmation',
      image: require('~/assets/yellow_character_cute.png'),
      headline: "Great to meet you!",
      subtext: "Next, we'll calibrate your training program to your current level."
    }
  },
];

// --- Orchestrator ---

export default function OnboardingOrchestrator() {
  const { currentStep, nextStep, prevStep } = useOnboarding();
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  const stepIndex = currentStep - 1; // Steps are 1-indexed
  const stepConfig = STEPS[stepIndex];

  if (!stepConfig) {
    return (
      <WizardLayout title="Error" nextDisabled>
        <Text className="text-destructive text-center text-xl">
          Step {currentStep} not found.
        </Text>
      </WizardLayout>
    );
  }

  const handleNext = () => {
    nextStep();
    setIsNextDisabled(true);
  };

  const handlePrev = () => {
    prevStep();
  };

  // Render the appropriate template based on step type
  const renderStep = () => {
    switch (stepConfig.step.type) {
      case 'selection':
        return <SelectionStep key={currentStep} config={stepConfig.step} onNextDisabled={setIsNextDisabled} />;
      case 'affirmation':
        return <AffirmationStep key={currentStep} config={stepConfig.step} onNextDisabled={setIsNextDisabled} />;
      default:
        return <Text className="text-destructive">Unknown step type</Text>;
    }
  };

  return (
    <WizardLayout
      title={stepConfig.title}
      description={stepConfig.description}
      onNext={handleNext}
      onPrev={handlePrev}
      nextDisabled={isNextDisabled}
    >
      {renderStep()}
    </WizardLayout>
  );
}
