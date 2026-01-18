import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { STEPS } from "~/app/(onboarding)";
import { supabase } from "~/lib/supabase";
import { useAuth } from "./AuthProvider";


// Define the shape of the onboarding data
// We'll use a Record<string, any> for flexibility as we build out the 32 steps
export interface OnboardingData {
  [key: string]: any;
}

interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;
  updateData: (key: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  isComplete: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const ONBOARDING_STORAGE_PREFIX = "onboarding_progress";
const TOTAL_STEPS = STEPS.length;

const getOnboardingStorageKey = (userId?: string | null) =>
  `${ONBOARDING_STORAGE_PREFIX}:${userId ?? "anon"}`;

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, onboardingComplete, isProfileLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsComplete(false);
      return;
    }

    if (!isProfileLoading) {
      setIsComplete(onboardingComplete);
    }
  }, [user, onboardingComplete, isProfileLoading]);
  const lastStep = currentStep === TOTAL_STEPS;

  useEffect(() => {
    console.log("Onboarding data updated", data);
  }, [data]);

  // Load progress on mount
  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      try {
        const storageKey = getOnboardingStorageKey(user?.id);
        const saved = await AsyncStorage.getItem(storageKey);
        if (!isMounted) return;

        if (saved) {
          const parsed = JSON.parse(saved);
          const savedStep = parsed.currentStep || 1;
          const boundedStep = Math.min(Math.max(savedStep, 1), TOTAL_STEPS);
          setCurrentStep(boundedStep);
          setData(parsed.data || {});
        } else {
          setCurrentStep(1);
          setData({});
        }

        if (!user) {
          setIsComplete(false);
        }
      } catch (e) {
        console.error("Failed to load onboarding progress", e);
        setIsComplete(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [user, TOTAL_STEPS]);

  // Save progress on change
  useEffect(() => {
    let isMounted = true;

    const saveProgress = async () => {
      try {
        const storageKey = getOnboardingStorageKey(user?.id);
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify({ currentStep, data, isComplete })
        );
      } catch (e) {
        if (!isMounted) return;
        console.error("Failed to save onboarding progress", e);
      }
    };
    saveProgress();

    return () => {
      isMounted = false;
    };
  }, [currentStep, data, isComplete, user?.id]);

  const updateData = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // setIsComplete(true);
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const setStep = (step: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  };

  const completeOnboarding = async () => {
    console.log("Completing onboarding");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!user) {
      setIsComplete(true);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_data: data,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Failed to save onboarding data to database", error);
        return;
      }

      console.log("Onboarding data saved successfully");
      setIsComplete(true);
    } catch (e) {
      console.error("Failed to save onboarding data", e);
    }
  };

  const resetOnboarding = async () => {
    try {
      const storageKey = getOnboardingStorageKey(user?.id);
      await AsyncStorage.removeItem(storageKey);
      setCurrentStep(1);
      setData({});
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_data: {},
          onboarding_completed_at: null,
        })
        .eq("id", user?.id);
      if (error) {
        console.error("Failed to reset onboarding data", error);
      }
      setIsComplete(() => false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Failed to reset onboarding", e);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        totalSteps: TOTAL_STEPS,
        data,
        updateData,
        nextStep,
        prevStep,
        setStep,
        isComplete,
        completeOnboarding,
        resetOnboarding,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
