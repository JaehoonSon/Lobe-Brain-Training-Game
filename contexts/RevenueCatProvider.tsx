import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

// Config
const API_KEY = __DEV__
  ? "test_gMisiyIRDnuQuxtHUtlkVMGzyvC" // Test key for dev mode
  : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
    (() => {
      throw new Error("EXPO_PUBLIC_REVENUECAT_API_KEY is not defined");
    })();
export const ENTITLEMENT_ID = "Brain App Pro"; // As defined in task

interface RevenueCatContextType {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<CustomerInfo | null>;
  presentPaywall: (offering?: PurchasesOffering) => Promise<boolean>;
  presentPaywallIfNeeded: (requiredEntitlement?: string) => Promise<boolean>;
  isLoading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(
  undefined,
);

import { useAuth } from "./AuthProvider";

export const RevenueCatProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

        if (Platform.OS === "android") {
          await Purchases.configure({ apiKey: API_KEY });
        } else {
          await Purchases.configure({ apiKey: API_KEY });
        }

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        checkEntitlement(info);

        await loadOfferings();
      } catch (e) {
        console.error("Error initializing RevenueCat:", e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Sync user identity
  useEffect(() => {
    // Wait for auth to finish loading before making decisions
    if (isAuthLoading) return;

    const identifyUser = async () => {
      // If the user is logged in, log them into RevenueCat
      if (user?.id) {
        try {
          const { customerInfo } = await Purchases.logIn(user.id);
          setCustomerInfo(customerInfo);
          checkEntitlement(customerInfo);
        } catch (e) {
          console.error("Error logging in to RevenueCat:", e);
        }
      } else {
        // If the user is logged out (and we aren't loading), ensure we logout of RevenueCat
        // This resets to an anonymous ID and prevents data leaks between users
        try {
          // Check if we are already anonymous to avoid unnecessary calls/ID resets?
          // For now, robust security prefers ensuring logout.
          const info = await Purchases.logOut();
          setCustomerInfo(info);
          checkEntitlement(info);
        } catch (e) {
          console.error("Error logging out of RevenueCat:", e);
        }
      }
    };

    // Only run this if we aren't loading auth state (to avoid premature logout on app start)
    // Note: RevenueCatProvider relies on AuthProvider's user state.
    identifyUser();
  }, [user?.id, isAuthLoading]);

  useEffect(() => {
    const customerInfoUpdated = async (info: CustomerInfo) => {
      setCustomerInfo(info);
      checkEntitlement(info);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);
  }, []);

  const checkEntitlement = (info: CustomerInfo) => {
    if (info.entitlements.active[ENTITLEMENT_ID]) {
      setIsPro(true);
    } else {
      setIsPro(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        setCurrentOffering(offerings.current);
      }
    } catch (e) {
      console.error("Error loading offerings:", e);
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      setCustomerInfo(customerInfo);
      checkEntitlement(customerInfo);
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
        throw e;
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      checkEntitlement(info);
      return info;
    } catch (e) {
      console.error("Restore purchases error:", e);
      return null;
    }
  };

  const presentPaywall = async (
    offering?: PurchasesOffering,
  ): Promise<boolean> => {
    try {
      const paywallResult = offering
        ? await RevenueCatUI.presentPaywall({ offering })
        : await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        default:
          return false;
      }
    } catch (e) {
      console.error("Error presenting paywall:", e);
      return false;
    }
  };

  const presentPaywallIfNeeded = async (
    requiredEntitlement: string = ENTITLEMENT_ID,
  ): Promise<boolean> => {
    try {
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: requiredEntitlement,
      });

      switch (paywallResult) {
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
          return false;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          return true;
        default:
          return false;
      }
    } catch (e) {
      console.error("Error presenting paywall if needed:", e);
      return false;
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{
        isPro,
        customerInfo,
        currentOffering,
        purchasePackage,
        restorePurchases,
        presentPaywall,
        presentPaywallIfNeeded,
        isLoading,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }
  return context;
};
