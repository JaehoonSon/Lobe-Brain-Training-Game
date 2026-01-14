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

const ONBOARDING_STORAGE_KEY = "onboarding_progress";
const TOTAL_STEPS = STEPS.length;

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastStep = currentStep === TOTAL_STEPS;

  useEffect(() => {
    console.log("Onboarding data updated", data);
  }, [data]);

  // Load progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Load step progress from local storage (for resuming mid-onboarding)
        const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentStep(parsed.currentStep || 1);
          setData(parsed.data || {});
        }

        // Always check DB for completion status (single source of truth)
        if (user) {
          console.log("Checking onboarding status from DB for user:", user.id);
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("onboarding_completed_at")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Failed to check onboarding status:", error);
            // On error, default to not complete (show onboarding)
            setIsComplete(false);
          } else if (profile?.onboarding_completed_at) {
            console.log(
              "Onboarding already completed at:",
              profile.onboarding_completed_at
            );
            setIsComplete(true);
          } else {
            console.log("Onboarding not completed yet");
            setIsComplete(false);
          }
        } else {
          // No user logged in - can't determine completion status
          setIsComplete(false);
        }
      } catch (e) {
        console.error("Failed to load onboarding progress", e);
        setIsComplete(false);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, [user]);

  // Save progress on change
  useEffect(() => {
    const saveProgress = async () => {
      try {
        await AsyncStorage.setItem(
          ONBOARDING_STORAGE_KEY,
          JSON.stringify({ currentStep, data, isComplete })
        );
      } catch (e) {
        console.error("Failed to save onboarding progress", e);
      }
    };
    saveProgress();
  }, [currentStep, data, isComplete]);

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

    // Save onboarding data to supabase profiles table
    if (user) {
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
        } else {
          console.log("Onboarding data saved successfully");
        }
      } catch (e) {
        console.error("Failed to save onboarding data", e);
      }
    }

    setIsComplete(true);
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
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
