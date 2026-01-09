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
        // 1. Check local storage first for immediate feedback
        const saved = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        let localIsComplete = false;
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentStep(parsed.currentStep || 1);
          setData(parsed.data || {});
          if (parsed.isComplete) {
            localIsComplete = true;
            setIsComplete(true);
          }
        }

        // 2. If not complete locally, check DB (if user is logged in)
        if (!localIsComplete && user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed_at")
            .eq("id", user.id)
            .single();

          if (profile?.onboarding_completed_at) {
            setIsComplete(true);
            // Sync back to local storage so next time it's faster
            await AsyncStorage.setItem(
              ONBOARDING_STORAGE_KEY,
              JSON.stringify({
                currentStep: TOTAL_STEPS,
                data: saved ? JSON.parse(saved).data : {},
                isComplete: true,
              })
            );
          }
        }
      } catch (e) {
        console.error("Failed to load onboarding progress", e);
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
      setIsComplete(true);
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
  useEffect(() => {
    (async () => {
      if (lastStep && data) {
        await completeOnboarding();
      }
    })();
  }, [lastStep]);

  const completeOnboarding = async () => {
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
      setIsComplete(false);
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
