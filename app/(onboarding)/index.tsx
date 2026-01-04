import React from "react";
import { View, Text } from "react-native";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { WizardLayout } from "~/components/WizardLayout";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { H1 } from "~/components/ui/typography";
import { InterestsStep } from "~/components/onboarding/steps/InterestsStep";
import { AffirmationStep } from "~/components/onboarding/steps/AffirmationStep";
import { AssessmentStep } from "~/components/onboarding/steps/AssessmentStep";
import { InterstitialStep } from "~/components/onboarding/steps/InterstitialStep";

// --- Step Components (Ideally these go in separate files) ---

const Step1_Welcome = () => (
  <View>
    <Text className="text-foreground">
      Welcome! Let's set up your profile. This will only take a moment.
    </Text>
  </View>
);

const Step2_Name = () => {
  const { data, updateData } = useOnboarding();
  return (
    <View className="gap-4">
      <View>
        <Label nativeID="first-name">First Name</Label>
        <Input
          placeholder="Jane"
          value={data.firstName}
          onChangeText={(t) => updateData("firstName", t)}
        />
      </View>
      <View>
        <Label nativeID="last-name">Last Name</Label>
        <Input
          placeholder="Doe"
          value={data.lastName}
          onChangeText={(t) => updateData("lastName", t)}
        />
      </View>
    </View>
  );
};

const Step3_Interests = () => <InterestsStep />;

// --- Assessment Steps ---

const Step5_Focus = () => (
  <AssessmentStep
    title="Focus"
    subtitle="What requires your focus the most?"
    dataKey="focusGoals"
    options={[
      {
        id: "attention_span",
        label: "Improve Attention Span",
        description: "Stay focused on tasks for longer periods",
      },
      {
        id: "reduce_distractions",
        label: "Reduce Distractions",
        description: "Ignore background noise and interruptions",
      },
      {
        id: "task_switching",
        label: "Task Switching",
        description: "Switch between activities efficiently",
      },
      {
        id: "deep_work",
        label: "Deep Work",
        description: "Enter a state of flow more easily",
      },
    ]}
  />
);

const Step6_FocusFact = () => (
  <InterstitialStep
    imageSource={require("~/assets/images/brain_focus.png")}
    title="Did you know?"
    description="The average attention span has dropped significantly in the digital age. But with training, you can reclaim your focus."
  />
);

const Step7_Memory = () => (
  <AssessmentStep
    title="Memory"
    subtitle="What aspects of your memory would you like to train?"
    dataKey="memoryGoals"
    options={[
      {
        id: "working_memory",
        label: "Working Memory",
        description: "Hold and manipulate information",
      },
      {
        id: "face_name",
        label: "Face-name Recall",
        description: "Recall and match people's names",
      },
      {
        id: "spatial_memory",
        label: "Spatial Memory",
        description: "Store and recall locations and positions",
      },
      {
        id: "long_term",
        label: "Long-term Memory",
        description: "Retain information for future recall",
      },
    ]}
  />
);

const Step8_MemoryFact = () => (
  <InterstitialStep
    imageSource={require("~/assets/images/brain_memory.png")}
    title="Neuroplasticity is real."
    description="Your brain can physically change and grow new connections at any age. It's never too late to improve your memory."
  />
);

const Step9_Speed = () => (
  <AssessmentStep
    title="Thinking Faster"
    subtitle="In which areas do you want to improve speed?"
    dataKey="speedGoals"
    options={[
      {
        id: "reaction_speed",
        label: "Reaction Speed",
        description: "React quickly to new information",
      },
      {
        id: "processing_speed",
        label: "Processing Speed",
        description: "Analyze and process data faster",
      },
      {
        id: "verbal_fluency",
        label: "Verbal Fluency",
        description: "Find the right words in conversations",
      },
      {
        id: "decision_making",
        label: "Decision Making",
        description: "Make better decisions under pressure",
      },
    ]}
  />
);

const Step10_SpeedFact = () => (
  <InterstitialStep
    imageSource={require("~/assets/images/brain_speed.png")}
    title="Speed is a skill."
    description="Faster information processing leads to more confident decisions and sharper reactions in daily life."
  />
);

// --- Component Map ---

const STEP_COMPONENTS: Record<
  number,
  { component: React.FC; title?: string; description?: string }
> = {
  1: {
    component: Step1_Welcome,
    title: "Welcome",
    description: "Let's get started.",
  },
  2: {
    component: Step2_Name,
    title: "Your Profile",
    description: "Tell us about yourself.",
  },
  3: {
    component: Step3_Interests,
    // title: "Interests",
    // description: "What do you like?",
  },
  4: {
    component: AffirmationStep,
  },
  5: { component: Step5_Focus },
  6: { component: Step6_FocusFact },
  7: { component: Step7_Memory },
  8: { component: Step8_MemoryFact },
  9: { component: Step9_Speed },
  10: { component: Step10_SpeedFact },
  // ... maps up to 32
};

export default function OnboardingOrchestrator() {
  const { currentStep } = useOnboarding();

  const stepConfig = STEP_COMPONENTS[currentStep];

  if (!stepConfig) {
    return (
      <WizardLayout title="Error">
        <Text className="text-destructive">Step {currentStep} not found.</Text>
      </WizardLayout>
    );
  }

  const ActiveComponent = stepConfig.component;

  return (
    <WizardLayout title={stepConfig.title} description={stepConfig.description}>
      <ActiveComponent />
    </WizardLayout>
  );
}
