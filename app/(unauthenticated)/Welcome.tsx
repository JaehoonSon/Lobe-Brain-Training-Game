import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import {
  BrainCircuit,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { H1, H2, P, Muted } from "~/components/ui/typography";

const WelcomeScreen = () => {
  const { t } = useTranslation();
  const handleGetStarted = () => {
    router.push("/(unauthenticated)");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 py-6">
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center mb-8"
          >
            <View className="bg-primary/10 p-6 rounded-full mb-6 border-2 border-primary/20">
              <BrainCircuit
                size={64}
                className="text-primary"
                strokeWidth={3}
              />
            </View>
            <H1 className="text-4xl font-black text-center mb-3">
              {t("unauth.welcome.title")}
            </H1>
            <Muted className="text-lg font-bold text-center">
              {t("unauth.welcome.motto")}
            </Muted>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="gap-4 mb-8"
          >
            <Card className="bg-card border-border p-0">
              <CardContent>
                <View className="flex-row items-center gap-4 p-2">
                  <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                    <Zap size={28} className="text-primary" strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <H2 className="text-lg font-black text-foreground mb-1">
                      {t("unauth.welcome.think_faster")}
                    </H2>
                    <Muted className="text-sm font-bold">
                      {t("unauth.welcome.think_faster_desc")}
                    </Muted>
                  </View>
                  <ArrowRight size={20} className="text-muted-foreground" />
                </View>
              </CardContent>
            </Card>

            <Card className="bg-card border-border p-0">
              <CardContent>
                <View className="flex-row items-center gap-4 p-2">
                  <View className="w-14 h-14 rounded-xl bg-secondary/10 items-center justify-center">
                    <Target
                      size={28}
                      className="text-secondary"
                      strokeWidth={2.5}
                    />
                  </View>
                  <View className="flex-1">
                    <H2 className="text-lg font-black text-foreground mb-1">
                      {t("unauth.welcome.sharpen_focus")}
                    </H2>
                    <Muted className="text-sm font-bold">
                      {t("unauth.welcome.sharpen_focus_desc")}
                    </Muted>
                  </View>
                  <ArrowRight size={20} className="text-muted-foreground" />
                </View>
              </CardContent>
            </Card>

            <Card className="bg-card border-border p-0">
              <CardContent>
                <View className="flex-row items-center gap-4 p-2">
                  <View className="w-14 h-14 rounded-xl bg-accent/10 items-center justify-center">
                    <Sparkles
                      size={28}
                      className="text-accent"
                      strokeWidth={2.5}
                    />
                  </View>
                  <View className="flex-1">
                    <H2 className="text-lg font-black text-foreground mb-1">
                      {t("unauth.welcome.enhance_memory")}
                    </H2>
                    <Muted className="text-sm font-bold">
                      {t("unauth.welcome.enhance_memory_desc")}
                    </Muted>
                  </View>
                  <ArrowRight size={20} className="text-muted-foreground" />
                </View>
              </CardContent>
            </Card>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="items-center mb-8"
          >
            <Muted className="text-center text-sm font-bold">
              {t("unauth.welcome.legal_intro")}
              <TouchableOpacity onPress={() => {}}>
                <Muted className="text-primary font-black underline">
                  {t("unauth.welcome.terms")}
                </Muted>
              </TouchableOpacity>{" "}
              {t("unauth.welcome.legal_and")}
              <TouchableOpacity onPress={() => {}}>
                <Muted className="text-primary font-black underline">
                  {t("unauth.welcome.privacy")}
                </Muted>
              </TouchableOpacity>
            </Muted>
          </Animated.View>

          <Animated.View
            entering={ZoomIn.delay(600).duration(500).springify()}
            className="w-full"
          >
            <Button
              className="w-full h-12 native:h-16 px-10 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1"
              onPress={handleGetStarted}
            >
              <P className="text-white font-black text-xl tracking-wide uppercase">
                {t("unauth.welcome.get_started")}
              </P>
            </Button>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
