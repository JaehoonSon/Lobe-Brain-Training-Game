import React from "react";
import { StyleSheet, View } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { CustomerInfo } from "react-native-purchases";

type PaywallProps = {
  onPurchaseCompleted: (customerInfo: CustomerInfo) => void;
  onRestoreCompleted: (customerInfo: CustomerInfo) => void;
  onDismiss: () => void;
  options?: any; // Allow passing through other RevenueCat options if needed
};

export default function Paywall({
  onPurchaseCompleted,
  onRestoreCompleted,
  onDismiss,
  options,
}: PaywallProps) {
  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={({ customerInfo }) => {
          console.log("Purchase completed:", customerInfo);
          onPurchaseCompleted(customerInfo);
        }}
        onRestoreCompleted={({ customerInfo }) => {
          console.log("Restore completed:", customerInfo);
          onRestoreCompleted(customerInfo);
        }}
        onDismiss={() => {
          console.log("Paywall dismissed");
          onDismiss();
        }}
        {...options}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
