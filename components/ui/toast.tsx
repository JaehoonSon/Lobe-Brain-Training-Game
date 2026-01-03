import React from "react";
import { View, Text } from "react-native";
import Toast, {
  ToastConfig,
  ToastConfigParams,
} from "react-native-toast-message";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react-native";

// Type definitions
export type ToastType = "success" | "error" | "info" | "warning";

export interface CustomToastProps {
  text1?: string;
  text2?: string;
}

export interface ToastOptions {
  title: string;
  message?: string;
  visibilityTime?: number;
  autoHide?: boolean;
  topOffset?: number;
}

// Custom Toast Components
const CustomSuccessToast: React.FC<CustomToastProps> = ({ text1, text2 }) => (
  <View className="bg-card border border-border rounded-lg mx-4 p-4 flex-row items-center shadow-lg">
    <View className="bg-green-100 p-2 rounded-full mr-3">
      <CheckCircle size={20} color="#16a34a" />
    </View>
    <View className="flex-1">
      <Text className="text-card-foreground font-semibold text-base">
        {text1}
      </Text>
      {text2 && (
        <Text className="text-muted-foreground text-sm mt-1">{text2}</Text>
      )}
    </View>
  </View>
);

const CustomErrorToast: React.FC<CustomToastProps> = ({ text1, text2 }) => (
  <View className="bg-card border border-border rounded-lg mx-4 p-4 flex-row items-center shadow-lg">
    <View className="bg-destructive/10 p-2 rounded-full mr-3">
      <XCircle size={20} color="hsl(0, 84.2%, 60.2%)" />
    </View>
    <View className="flex-1">
      <Text className="text-card-foreground font-semibold text-base">
        {text1}
      </Text>
      {text2 && (
        <Text className="text-muted-foreground text-sm mt-1">{text2}</Text>
      )}
    </View>
  </View>
);

const CustomInfoToast: React.FC<CustomToastProps> = ({ text1, text2 }) => (
  <View className="bg-card border border-border rounded-lg mx-4 p-4 flex-row items-center shadow-lg">
    <View className="bg-blue-100 p-2 rounded-full mr-3">
      <Info size={20} color="#3b82f6" />
    </View>
    <View className="flex-1">
      <Text className="text-card-foreground font-semibold text-base">
        {text1}
      </Text>
      {text2 && (
        <Text className="text-muted-foreground text-sm mt-1">{text2}</Text>
      )}
    </View>
  </View>
);

const CustomWarningToast: React.FC<CustomToastProps> = ({ text1, text2 }) => (
  <View className="bg-card border border-border rounded-lg mx-4 p-4 flex-row items-center shadow-lg">
    <View className="bg-yellow-100 p-2 rounded-full mr-3">
      <AlertTriangle size={20} color="#f59e0b" />
    </View>
    <View className="flex-1">
      <Text className="text-card-foreground font-semibold text-base">
        {text1}
      </Text>
      {text2 && (
        <Text className="text-muted-foreground text-sm mt-1">{text2}</Text>
      )}
    </View>
  </View>
);

// Type-safe Toast Configuration
export const toastConfig: ToastConfig = {
  success: (props: ToastConfigParams<CustomToastProps>) => (
    <CustomSuccessToast {...props} />
  ),
  error: (props: ToastConfigParams<CustomToastProps>) => (
    <CustomErrorToast {...props} />
  ),
  info: (props: ToastConfigParams<CustomToastProps>) => (
    <CustomInfoToast {...props} />
  ),
  warning: (props: ToastConfigParams<CustomToastProps>) => (
    <CustomWarningToast {...props} />
  ),
};

// Default toast options
const defaultToastOptions: Partial<ToastOptions> = {
  visibilityTime: 4000,
  autoHide: true,
  topOffset: 60,
};

// Type-safe helper functions
export const showSuccessToast = (
  title: string,
  message?: string,
  options?: Partial<ToastOptions>
): void => {
  const config = { ...defaultToastOptions, ...options };

  Toast.show({
    type: "success" as const,
    text1: title,
    text2: message,
    visibilityTime: config.visibilityTime,
    autoHide: config.autoHide,
    topOffset: config.topOffset,
  });
};

export const showErrorToast = (
  title: string,
  message?: string,
  options?: Partial<ToastOptions>
): void => {
  const config = { ...defaultToastOptions, ...options, visibilityTime: 5000 };

  Toast.show({
    type: "error" as const,
    text1: title,
    text2: message,
    visibilityTime: config.visibilityTime,
    autoHide: config.autoHide,
    topOffset: config.topOffset,
  });
};

export const showInfoToast = (
  title: string,
  message?: string,
  options?: Partial<ToastOptions>
): void => {
  const config = { ...defaultToastOptions, ...options, visibilityTime: 3000 };

  Toast.show({
    type: "info" as const,
    text1: title,
    text2: message,
    visibilityTime: config.visibilityTime,
    autoHide: config.autoHide,
    topOffset: config.topOffset,
  });
};

export const showWarningToast = (
  title: string,
  message?: string,
  options?: Partial<ToastOptions>
): void => {
  const config = { ...defaultToastOptions, ...options };

  Toast.show({
    type: "warning" as const,
    text1: title,
    text2: message,
    visibilityTime: config.visibilityTime,
    autoHide: config.autoHide,
    topOffset: config.topOffset,
  });
};

// Generic toast function with type safety
export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  options?: Partial<ToastOptions>
): void => {
  const toastFunctions = {
    success: showSuccessToast,
    error: showErrorToast,
    info: showInfoToast,
    warning: showWarningToast,
  } as const;

  toastFunctions[type](title, message, options);
};

// Type guard for toast types
export const isValidToastType = (type: string): type is ToastType => {
  return ["success", "error", "info", "warning"].includes(type);
};
