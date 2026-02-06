import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { CustomerInfo } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import Tenjin from "react-native-tenjin";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";

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
  const { currentOffering } = useRevenueCat();

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onPurchaseCompleted={({ customerInfo, storeTransaction }) => {
          console.log("Purchase completed:", customerInfo);

          if (storeTransaction) {
            const product = currentOffering?.availablePackages.find(
              (p) =>
                p.product.identifier === storeTransaction.productIdentifier,
            )?.product;

            if (product) {
              if (
                Platform.OS === "ios" &&
                storeTransaction.transactionIdentifier &&
                "appStoreReceipt" in storeTransaction
              ) {
                // @ts-ignore
                const receipt = storeTransaction.appStoreReceipt as string;
                Tenjin.transactionWithReceipt(
                  product.identifier,
                  product.currencyCode,
                  1,
                  product.price,
                  storeTransaction.transactionIdentifier,
                  receipt,
                );
              } else {
                Tenjin.transaction(
                  product.identifier,
                  product.currencyCode,
                  1,
                  product.price,
                );
              }
            }
          }

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
        options={{
          displayCloseButton: true,
          ...options,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
