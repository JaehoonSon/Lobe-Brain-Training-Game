import React, { useState } from "react";
import { View } from "react-native";
import {
  ChevronRight,
  ArrowLeft,
  Zap,
  Hand,
  PartyPopper,
} from "lucide-react-native";
import { Text } from "~/components/ui/text";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { WizardLayout } from "~/components/WizardLayout";
import {
  SelectionStep,
  SelectionStepConfig,
  AffirmationStep,
  AffirmationStepConfig,
  GameStep,
  GameStepProps,
} from "./templates";
import BirthdaySelectionScreen from "./birthday";
import WelcomeScreen from "./welcome";
import ThankYouScreen from "./steps/thankyou";
import InterventionStep, {
  InterventionStepProps,
} from "./steps/InterventionStep";
import PlanCreationStep from "./steps/PlanCreationStep";
import PlanRevealStep from "./steps/PlanRevealStep";
import PaywallScreen from "../paywall";
import DailyStreakStep from "./steps/DailyStreakStep";
import PremiumFeaturesStep from "./steps/PremiumFeaturesStep";

// --- Step Configuration ---
// Each step is just data. Templates render them.

// Define the props that custom steps will receive
export interface CustomStepProps {
  onNext: () => void;
  onBack: () => void;
}

type CustomStepConfig = {
  type: "custom";
  component: React.ComponentType<CustomStepProps>;
  fullscreen?: boolean; // If true, renders without WizardLayout; otherwise renders inside it
};

type InterventionStepConfig = {
  type: "intervention";
  title: string;
  description: string;
  buttonText?: string;
  variant?: InterventionStepProps["variant"];
  component: React.ComponentType<InterventionStepProps>;
};

type GameStepConfig = {
  type: "game";
  component: React.ComponentType<GameStepProps>;
  fullscreen?: boolean; // If true, renders without WizardLayout; otherwise renders inside it
  gameConfig: GameStepProps["gameConfig"];
};

type StepConfig =
  | { title: string; description: string; step: SelectionStepConfig }
  | { title: string; description: string; step: AffirmationStepConfig }
  | { title: string; description: string; step: CustomStepConfig }
  | { title: string; description: string; step: GameStepConfig }
  | { title: string; description: string; step: InterventionStepConfig };

export const STEPS: StepConfig[] = [
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: WelcomeScreen,
      fullscreen: true,
    },
  },
  {
    title: "When is your birthday?",
    description: "We use this to personalize your experience.",
    step: {
      type: "custom",
      component: BirthdaySelectionScreen,
      fullscreen: true,
    },
  },
  // Step 1: Interests
  {
    title: "Let's start with your interests",
    description: "Select up to 3",
    step: {
      type: "selection",
      dataKey: "interests",
      maxSelections: 3,
      options: [
        "I want to keep my mind active and challenged",
        "I like pushing myself to improve",
        "I want to train my memory and attention",
        "I'm curious about how my brain works",
        "I'd like to manage stress and build better habits",
      ],
    },
  },
  // Step 2: Affirmation
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/brain_lifting_cute.png"), // Using the new CUTE brain
      headline: "The brain is like a muscle.",
      subtext:
        "Train it daily. Just a few minutes each day can build a lifelong habit.",
    },
  },
  // Step 3: Memory
  {
    title: "Memory",
    description: "What aspects of your memory would you like to train?",
    step: {
      type: "selection",
      dataKey: "memory_goals",
      options: [
        {
          label: "Working Memory",
          description: "Hold and manipulate information",
        },
        {
          label: "Face-name Recall",
          description: "Recall and match people's names",
        },
        {
          label: "Spatial Memory",
          description: "Store and recall locations and positions",
        },
        {
          label: "Long-term Memory",
          description: "Retain information for future recall",
        },
      ],
    },
  },
  // Step 4: Community Affirmation
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/community_avatars.png"),
      headline: "You're in Good Company",
      subtext:
        "Over 100 million people have trained their memory on Brain App — many do it daily!",
    },
  },
  // Step 5: Focus Goal
  {
    title: "Attention",
    description: "What aspects of your attention would you like to improve?",
    step: {
      type: "selection",
      dataKey: "focus_goals",
      options: [
        { label: "Productivity", description: "Stay focused on tasks longer" },
        {
          label: "Multitasking",
          description: "Switch between tasks efficiently",
        },
        { label: "Concentration", description: "Avoid distractions" },
        {
          label: "Dividing Attention",
          description: "Focus on multiple sources at once",
        },
      ],
    },
  },
  // Step 6: Focus Affirmation
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/brain_focus_archery.png"),
      headline: "Laser Focus Loaded.",
      subtext:
        "Training your attention can help you stay in the zone when it matters most.",
    },
  },
  // Step 7: Problem Solving Goal
  {
    title: "Problem Solving",
    description: "What skills do you want to sharpen?",
    step: {
      type: "selection",
      dataKey: "problem_solving_goals",
      options: [
        {
          label: "Logical Reasoning",
          description: "Analyze arguments and connect ideas",
        },
        {
          label: "Math Skills",
          description: "Calculate faster and more accurately",
        },
        { label: "Planning", description: "Think ahead and strategize" },
        {
          label: "Spatial Orientation",
          description: "Visualize and manipulate objects",
        },
      ],
    },
  },
  // Step 8: Problem Solving Affirmation
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/brain_solving_puzzle.png"),
      headline: "Solved!",
      subtext:
        "Challenge your logic daily to keep your mind sharp and flexible.",
    },
  },
  // Step 9: Goals Transition
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/yellow_character_cute.png"),
      headline: "That was about your goals",
      subtext:
        "Now, let’s get to know you so we can tailor your training and feedback.",
    },
  },
  // Step 11: Gender
  {
    title: "First, what’s your gender?",
    description:
      "This helps us show you how you compare to similar members in our community.",
    step: {
      type: "selection",
      dataKey: "gender",
      maxSelections: 1,
      options: ["Male", "Female", "Non-binary"],
    },
  },
  // Step 11: Education
  {
    title: "What's the highest level of education you've completed?",
    description: "",
    step: {
      type: "selection",
      dataKey: "education",
      maxSelections: 1,
      options: [
        "Some high school",
        "High school",
        "Some college",
        "Associate degree",
        "College degree (BA/BS)",
        "Master's degree",
        "Professional degree",
        "PhD",
      ],
    },
  },
  // Step 12: Referral Source
  {
    title: "How did you hear about Brain App?",
    description: "",
    step: {
      type: "selection",
      dataKey: "referral_source",
      maxSelections: 1,
      options: [
        "Doctor or Healthcare Provider",
        "Friend or family",
        "App Store",
        "Play Store",
        "Social media (e.g. Facebook)",
        "Search (e.g. Google)",
        "Other",
      ],
    },
  },
  // Step 13: Calibration Transition
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/yellow_character_cute.png"),
      headline: "Great to meet you!",
      subtext:
        "Next, we'll calibrate your training program to your current level.",
    },
  },
  // --- Game 1: Mental Arithmetic ---
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Mental Math",
      description: "We'll test your numerical processing speed and accuracy.",
      buttonText: "Start",
      variant: "intro",
    },
  },
  {
    title: "Game Steps",
    description: "",
    step: {
      type: "game",
      component: GameStep,
      fullscreen: true,
      gameConfig: {
        type: "mental_arithmetic",
      },
    },
  },
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Great job!",
      description: "That measured your quantitative reasoning skills.",
      buttonText: "Next Challenge",
      variant: "outro",
    },
  },

  // --- Game 2: Language ---
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Verbal Fluency",
      description: "Now let's test your language processing and vocabulary.",
      buttonText: "Start",
      variant: "intro",
    },
  },
  {
    title: "Language Game",
    description: "",
    step: {
      type: "game",
      component: GameStep,
      fullscreen: true,
      gameConfig: {
        type: "mental_language_discrimination",
      },
    },
  },
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Excellent!",
      description: "That measured your verbal discrimination skills.",
      buttonText: "Next Challenge",
      variant: "outro",
    },
  },
  // --- Game 3: Memory Matrix ---
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Memory Matrix",
      description: "Let's test your spatial memory and recall.",
      buttonText: "Start",
      variant: "intro",
    },
  },
  {
    title: "Memory Matrix",
    description: "",
    step: {
      type: "game",
      component: GameStep,
      fullscreen: true,
      gameConfig: {
        type: "memory_matrix",
      },
    },
  },
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "Great work!",
      description: "That measured your spatial memory.",
      buttonText: "See Results",
      variant: "outro",
    },
  },
  // Step: Thank You & Skill Calibration
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: ThankYouScreen,
      fullscreen: true,
    },
  },
  // Step: Daily Streak
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: DailyStreakStep,
      fullscreen: true,
    },
  },
  // Step: Program Design Affirmation
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/brain_program_design.png"),
      headline: "Now that we have your baseline scores",
      subtext: "Let's design a program just for you.",
    },
  },
  // Step: Difficulty
  {
    title: "What difficulty level would you like?",
    description: "",
    step: {
      type: "selection",
      dataKey: "difficulty",
      maxSelections: 1,
      options: [
        {
          label: "Standard (recommended)",
          description: "I like to balance fun with difficulty.",
          icon: <Zap size={24} color="#F59E0B" fill="#F59E0B" />, // Amber Zap
        },
        {
          label: "Advanced",
          description: "I'm here to work hard.",
          icon: (
            <View className="flex-row">
              <Zap size={24} color="#EF4444" fill="#EF4444" />
              <Zap
                size={24}
                color="#EF4444"
                fill="#EF4444"
                style={{ marginLeft: -8 }}
              />
            </View>
          ), // Double Red Zap
        },
      ],
    },
  },
  // Step: Encouragement
  {
    title: "What kind of encouragement helps you stay motivated?",
    description: "",
    step: {
      type: "selection",
      dataKey: "encouragement",
      maxSelections: 1,
      options: [
        {
          label: "High fives",
          description: "Celebrate all my successes.",
          icon: <Hand size={24} color="#EF4444" fill="#EF4444" />, // Red Hand
        },
        {
          label: "Tough love",
          description: "Push me to stay on track.",
          icon: <PartyPopper size={24} color="#10B981" />, // Greenish PartyPopper matching the cone shape/vibe
        },
      ],
    },
  },
  // Step: Exercise Frequency
  {
    title: "How often do you exercise?",
    description: "",
    step: {
      type: "selection",
      dataKey: "exercise_frequency",
      maxSelections: 1,
      options: [
        "Daily or almost daily",
        "A few times per week",
        "Once a week or less",
        "Rarely or never",
      ],
    },
  },
  // Step: Sleep Duration
  {
    title: "How much sleep do you usually get each night?",
    description: "",
    step: {
      type: "selection",
      dataKey: "sleep_duration",
      maxSelections: 1,
      options: ["4 hours or less", "5-6 hours", "7-8 hours", "9 hours or more"],
    },
  },
  // Step: Training Frequency
  {
    title: "How many days a week can you train?",
    description: "People who do 5 days see the most gains in performance.",
    step: {
      type: "selection",
      dataKey: "training_frequency",
      maxSelections: 1,
      options: [
        "3 days a week",
        "4 days a week",
        "5 days a week",
        "6 days a week",
        "7 days a week",
      ],
    },
  },
  // Step: Plan Creation Loading
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: PlanCreationStep,
      fullscreen: true,
    },
  },
  // Step: Plan Reveal
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: PlanRevealStep,
      fullscreen: true,
    },
  },
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: PremiumFeaturesStep,
      fullscreen: true,
    },
  },
  {
    title: "",
    description: "",
    step: {
      type: "custom",
      component: PaywallScreen,
      fullscreen: true,
    },
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
      case "selection":
        return (
          <SelectionStep
            key={currentStep}
            config={stepConfig.step}
            onNextDisabled={setIsNextDisabled}
          />
        );
      case "affirmation":
        return (
          <AffirmationStep
            key={currentStep}
            config={stepConfig.step}
            onNextDisabled={setIsNextDisabled}
          />
        );
      case "custom": {
        const Component = stepConfig.step.component;
        return (
          <Component
            key={currentStep}
            onNext={handleNext}
            onBack={handlePrev}
          />
        );
      }
      case "game": {
        const Component = stepConfig.step.component;
        return (
          <Component
            key={currentStep}
            onNext={handleNext}
            onBack={handlePrev}
            gameConfig={stepConfig.step.gameConfig}
          />
        );
      }
      case "intervention": {
        const Component = stepConfig.step.component;
        return (
          <Component
            key={currentStep}
            onNext={handleNext}
            onBack={handlePrev}
            title={stepConfig.step.title}
            description={stepConfig.step.description}
            buttonText={stepConfig.step.buttonText}
            variant={stepConfig.step.variant}
          />
        );
      }
      default:
        return <Text className="text-destructive">Unknown step type</Text>;
    }
  };

  // Render directly without WizardLayout (safe access)
  if ("fullscreen" in stepConfig.step && stepConfig.step.fullscreen) {
    return renderStep();
  }

  // Intervention steps are also full screen usually, or at least custom layout
  if (stepConfig.step.type === "intervention") {
    return renderStep();
  }

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
