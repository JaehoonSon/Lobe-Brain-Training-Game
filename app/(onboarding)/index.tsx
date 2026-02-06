import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import PaywallScreen from "../paywall";
import BirthdaySelectionScreen from "./birthday";
import DailyStreakStep from "./steps/DailyStreakStep";
import InterventionStep, {
  InterventionStepProps,
} from "./steps/InterventionStep";
import NotificationPermissionStep from "./steps/NotificationPermissionStep";
import PlanCreationStep from "./steps/PlanCreationStep";
import PlanRevealStep from "./steps/PlanRevealStep";
import PremiumFeaturesStep from "./steps/PremiumFeaturesStep";
import ThankYouScreen from "./steps/thankyou";
import {
  AffirmationStep,
  AffirmationStepConfig,
  GameStep,
  GameStepProps,
  SelectionStep,
  SelectionStepConfig,
} from "./templates";
import WelcomeScreen from "./welcome";
import { Hand, PartyPopper, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { WizardLayout } from "~/components/WizardLayout";
import { Text } from "~/components/ui/text";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { useAnalytics } from "~/contexts/PostHogProvider";

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
    title: "onboarding.steps.birthday.title",
    description: "onboarding.steps.birthday.description",
    step: {
      type: "custom",
      component: BirthdaySelectionScreen,
      fullscreen: true,
    },
  },
  // Step 1: Interests
  {
    title: "onboarding.steps.interests.title",
    description: "onboarding.steps.interests.subtitle",
    step: {
      type: "selection",
      dataKey: "interests",
      maxSelections: 3,
      options: [
        "onboarding.steps.interests.options.0",
        "onboarding.steps.interests.options.1",
        "onboarding.steps.interests.options.2",
        "onboarding.steps.interests.options.3",
        "onboarding.steps.interests.options.4",
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
      headline: "onboarding.steps.affirmations.muscle.headline",
      subtext: "onboarding.steps.affirmations.muscle.subtext",
    },
  },
  // Step 3: Memory
  {
    title: "onboarding.steps.goals.memory.title",
    description: "onboarding.steps.goals.memory.description",
    step: {
      type: "selection",
      dataKey: "memory_goals",
      options: [
        {
          label: "onboarding.steps.goals.memory.options.working",
          description: "onboarding.steps.goals.memory.options.working_desc",
        },
        {
          label: "onboarding.steps.goals.memory.options.face",
          description: "onboarding.steps.goals.memory.options.face_desc",
        },
        {
          label: "onboarding.steps.goals.memory.options.spatial",
          description: "onboarding.steps.goals.memory.options.spatial_desc",
        },
        {
          label: "onboarding.steps.goals.memory.options.long_term",
          description: "onboarding.steps.goals.memory.options.long_term_desc",
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
      headline: "onboarding.steps.affirmations.community.headline",
      subtext: "onboarding.steps.affirmations.community.subtext",
    },
  },
  // Step 5: Focus Goal
  {
    title: "onboarding.steps.goals.attention.title",
    description: "onboarding.steps.goals.attention.description",
    step: {
      type: "selection",
      dataKey: "focus_goals",
      options: [
        {
          label: "onboarding.steps.goals.attention.options.productivity",
          description:
            "onboarding.steps.goals.attention.options.productivity_desc",
        },
        {
          label: "onboarding.steps.goals.attention.options.multitasking",
          description:
            "onboarding.steps.goals.attention.options.multitasking_desc",
        },
        {
          label: "onboarding.steps.goals.attention.options.concentration",
          description:
            "onboarding.steps.goals.attention.options.concentration_desc",
        },
        {
          label: "onboarding.steps.goals.attention.options.dividing",
          description: "onboarding.steps.goals.attention.options.dividing_desc",
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
      headline: "onboarding.steps.affirmations.focus.headline",
      subtext: "onboarding.steps.affirmations.focus.subtext",
    },
  },
  // Step 7: Problem Solving Goal
  {
    title: "onboarding.steps.goals.problem_solving.title",
    description: "onboarding.steps.goals.problem_solving.description",
    step: {
      type: "selection",
      dataKey: "problem_solving_goals",
      options: [
        {
          label: "onboarding.steps.goals.problem_solving.options.logic",
          description:
            "onboarding.steps.goals.problem_solving.options.logic_desc",
        },
        {
          label: "onboarding.steps.goals.problem_solving.options.math",
          description:
            "onboarding.steps.goals.problem_solving.options.math_desc",
        },
        {
          label: "onboarding.steps.goals.problem_solving.options.planning",
          description:
            "onboarding.steps.goals.problem_solving.options.planning_desc",
        },
        {
          label: "onboarding.steps.goals.problem_solving.options.spatial",
          description:
            "onboarding.steps.goals.problem_solving.options.spatial_desc",
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
      headline: "onboarding.steps.affirmations.solved.headline",
      subtext: "onboarding.steps.affirmations.solved.subtext",
    },
  },
  // Step 9: Goals Transition
  {
    title: "",
    description: "",
    step: {
      type: "affirmation",
      image: require("~/assets/yellow_character_cute.png"),
      headline: "onboarding.steps.affirmations.transition.headline",
      subtext: "onboarding.steps.affirmations.transition.subtext",
    },
  },
  // Step 11: Gender (optional)
  {
    title: "onboarding.steps.profile.gender.title",
    description: "onboarding.steps.profile.gender.description",
    step: {
      type: "selection",
      dataKey: "gender",
      maxSelections: 1,
      optional: true,
      options: [
        "onboarding.steps.profile.gender.options.0",
        "onboarding.steps.profile.gender.options.1",
        "onboarding.steps.profile.gender.options.2",
        "onboarding.steps.profile.gender.options.3",
      ],
    },
  },
  // Step 12: Education (optional)
  {
    title: "onboarding.steps.profile.education.title",
    description: "common.optional",
    step: {
      type: "selection",
      dataKey: "education",
      maxSelections: 1,
      optional: true,
      options: [
        "onboarding.steps.profile.education.options.0",
        "onboarding.steps.profile.education.options.1",
        "onboarding.steps.profile.education.options.2",
        "onboarding.steps.profile.education.options.3",
        "onboarding.steps.profile.education.options.4",
        "onboarding.steps.profile.education.options.5",
        "onboarding.steps.profile.education.options.6",
        "onboarding.steps.profile.education.options.7",
        "onboarding.steps.profile.education.options.8",
      ],
    },
  },
  // Step 12: Referral Source
  {
    title: "onboarding.steps.profile.referral.title",
    description: "",
    step: {
      type: "selection",
      dataKey: "referral_source",
      maxSelections: 1,
      options: [
        "onboarding.steps.profile.referral.options.0",
        "onboarding.steps.profile.referral.options.1",
        "onboarding.steps.profile.referral.options.2",
        "onboarding.steps.profile.referral.options.3",
        "onboarding.steps.profile.referral.options.4",
        "onboarding.steps.profile.referral.options.5",
        "onboarding.steps.profile.referral.options.6",
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
      headline: "onboarding.steps.affirmations.meet_you.headline",
      subtext: "onboarding.steps.affirmations.meet_you.subtext",
    },
  },
  // --- Game 1: Mental Arithmetic ---
  {
    title: "",
    description: "",
    step: {
      type: "intervention",
      component: InterventionStep,
      title: "onboarding.games.arithmetic.title",
      description: "onboarding.games.arithmetic.description",
      buttonText: "common.start",
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
      title: "onboarding.games.arithmetic.outro_title",
      description: "onboarding.games.arithmetic.outro_description",
      buttonText: "onboarding.games.next_challenge",
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
      title: "onboarding.games.language.title",
      description: "onboarding.games.language.description",
      buttonText: "common.start",
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
      title: "onboarding.games.language.outro_title",
      description: "onboarding.games.language.outro_description",
      buttonText: "onboarding.games.next_challenge",
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
      title: "onboarding.games.matrix.title",
      description: "onboarding.games.matrix.description",
      buttonText: "common.start",
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
      title: "onboarding.games.matrix.outro_title",
      description: "onboarding.games.matrix.outro_description",
      buttonText: "onboarding.games.see_results",
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
      headline: "onboarding.steps.affirmations.baseline.headline",
      subtext: "onboarding.steps.affirmations.baseline.subtext",
    },
  },
  // Step: Difficulty
  {
    title: "onboarding.steps.difficulty.title",
    description: "",
    step: {
      type: "selection",
      dataKey: "difficulty",
      maxSelections: 1,
      options: [
        {
          label: "onboarding.steps.difficulty.options.standard",
          description: "onboarding.steps.difficulty.options.standard_desc",
          icon: <Zap size={24} color="#F59E0B" fill="#F59E0B" />, // Amber Zap
        },
        {
          label: "onboarding.steps.difficulty.options.advanced",
          description: "onboarding.steps.difficulty.options.advanced_desc",
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
    title: "onboarding.steps.encouragement.title",
    description: "",
    step: {
      type: "selection",
      dataKey: "encouragement",
      maxSelections: 1,
      options: [
        {
          label: "onboarding.steps.encouragement.options.high_fives",
          description: "onboarding.steps.encouragement.options.high_fives_desc",
          icon: <Hand size={24} color="#EF4444" fill="#EF4444" />, // Red Hand
        },
        {
          label: "onboarding.steps.encouragement.options.tough_love",
          description: "onboarding.steps.encouragement.options.tough_love_desc",
          icon: <PartyPopper size={24} color="#10B981" />, // Greenish PartyPopper matching the cone shape/vibe
        },
      ],
    },
  },
  // Step: Exercise Frequency
  {
    title: "onboarding.steps.frequency.exercise_title",
    description: "",
    step: {
      type: "selection",
      dataKey: "exercise_frequency",
      maxSelections: 1,
      options: [
        "onboarding.steps.frequency.options.daily",
        "onboarding.steps.frequency.options.few_times",
        "onboarding.steps.frequency.options.once_less",
        "onboarding.steps.frequency.options.rarely",
      ],
    },
  },
  // // Step: Sleep Duration
  {
    title: "onboarding.steps.sleep.title",
    description: "",
    step: {
      type: "selection",
      dataKey: "sleep_duration",
      maxSelections: 1,
      options: [
        "onboarding.steps.sleep.options.4_less",
        "onboarding.steps.sleep.options.5_6",
        "onboarding.steps.sleep.options.7_8",
        "onboarding.steps.sleep.options.9_more",
      ],
    },
  },
  // // Step: Training Frequency
  {
    title: "onboarding.steps.frequency.training_title",
    description: "onboarding.steps.frequency.training_subtitle",
    step: {
      type: "selection",
      dataKey: "training_frequency",
      maxSelections: 1,
      options: [
        "onboarding.steps.frequency.options.3_days",
        "onboarding.steps.frequency.options.4_days",
        "onboarding.steps.frequency.options.5_days",
        "onboarding.steps.frequency.options.6_days",
        "onboarding.steps.frequency.options.7_days",
      ],
    },
  },
  // Step: Notification Permission
  {
    title: "Notification Permission",
    description: "",
    step: {
      type: "custom",
      component: NotificationPermissionStep,
      fullscreen: true,
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
  const { t } = useTranslation();
  const { currentStep, nextStep, prevStep, totalSteps } = useOnboarding();
  const { track } = useAnalytics();
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const hasStartedRef = useRef(false);

  const stepIndex = currentStep - 1; // Steps are 1-indexed
  const stepConfig = STEPS[stepIndex];

  if (!stepConfig) {
    return (
      <WizardLayout title={t("common.error")} nextDisabled>
        <Text className="text-destructive text-center text-xl">
          {t("onboarding.error_step", { step: currentStep })}
        </Text>
      </WizardLayout>
    );
  }

  const handleNext = () => {
    if (stepConfig) {
      track("onboarding_step_complete", {
        step_index: currentStep,
        total_steps: totalSteps,
        step_type: stepConfig.step.type,
        step_title_key: stepConfig.title || undefined,
        step_description_key: stepConfig.description || undefined,
      });
    }
    nextStep();
    setIsNextDisabled(true);
  };

  const handlePrev = () => {
    prevStep();
  };

  useEffect(() => {
    if (!stepConfig) return;

    if (!hasStartedRef.current && currentStep === 1) {
      hasStartedRef.current = true;
      track("onboarding_started", {
        total_steps: totalSteps,
      });
    }

    track("onboarding_step_view", {
      step_index: currentStep,
      total_steps: totalSteps,
      step_type: stepConfig.step.type,
      step_title_key: stepConfig.title || undefined,
      step_description_key: stepConfig.description || undefined,
    });
  }, [currentStep, stepConfig, totalSteps, track]);

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
            title={t(stepConfig.step.title)}
            description={t(stepConfig.step.description)}
            buttonText={
              stepConfig.step.buttonText
                ? t(stepConfig.step.buttonText)
                : undefined
            }
            variant={stepConfig.step.variant}
          />
        );
      }
      default:
        return (
          <Text className="text-destructive">{t("common.error_generic")}</Text>
        );
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
      title={stepConfig.title ? t(stepConfig.title) : ""}
      description={stepConfig.description ? t(stepConfig.description) : ""}
      onNext={handleNext}
      onPrev={handlePrev}
      nextDisabled={isNextDisabled}
    >
      {renderStep()}
    </WizardLayout>
  );
}
