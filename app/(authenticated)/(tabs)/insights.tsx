import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H4, P, Muted } from "~/components/ui/typography";
import { Card, CardContent } from "~/components/ui/card";
import { Lightbulb, ChevronRight } from "lucide-react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { INSIGHTS } from "~/lib/insights-data";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { useTranslation } from "react-i18next";

export default function InsightsScreen() {
  const { t } = useTranslation();
  const dailyInsight = INSIGHTS[0];
  const otherInsights = INSIGHTS.slice(1);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar */}
      <View className="px-6 pt-2 pb-2 bg-background z-10">
        <AuthenticatedHeader />
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pb-6 pt-4">
          {/* Page Title */}
          <H1 className="mb-6 text-3xl font-black">{t('insights.title')}</H1>

          {/* Daily Read Section */}
          <View className="mb-8">
            <P className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
              {t('insights.daily_read.title')}
            </P>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/insight/${dailyInsight.id}`)}
            >
              <Card className="bg-primary border-primary border-b-[8px] border-black/20">
                <CardContent className="p-6">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold uppercase">
                        {t(`common.categories.${dailyInsight.category.toLowerCase()}`, { defaultValue: dailyInsight.category })}
                      </Text>
                    </View>
                    <Lightbulb size={24} className="text-white" />
                  </View>
                  <H4 className="text-2xl font-black text-white mb-2">
                    {dailyInsight.title}
                  </H4>
                  <P className="text-white/80 leading-6 mb-4">
                    {dailyInsight.summary}
                  </P>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-bold">
                      {dailyInsight.readTime}
                    </Text>
                    <ChevronRight size={16} className="text-white/60" />
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Explore Section */}
          <P className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
            {t('insights.explore.title')}
          </P>

          <View className="gap-4">
            {otherInsights.map((insight) => (
              <TouchableOpacity
                key={insight.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/insight/${insight.id}`)}
              >
                <Card className="border-b-[4px] border-muted">
                  <CardContent className="p-4 flex-row gap-4 items-center">
                    {/* Color Indicator */}
                    <View
                      className="w-2 h-16 rounded-full"
                      style={{ backgroundColor: insight.color || "#e4e4e7" }}
                    />

                    <View className="flex-1">
                      <View className="flex-row justify-between mb-1">
                        <Text
                          className="text-[10px] font-black uppercase tracking-wide"
                          style={{ color: insight.color || "#71717a" }}
                        >
                          {t(`common.categories.${insight.category.toLowerCase()}`, { defaultValue: insight.category })}
                        </Text>
                        <Text className="text-[10px] font-bold text-muted-foreground">
                          {insight.readTime}
                        </Text>
                      </View>
                      <H4 className="text-lg font-black text-foreground mb-1">
                        {insight.title}
                      </H4>
                      <P
                        className="text-sm text-muted-foreground line-clamp-2"
                        numberOfLines={2}
                      >
                        {insight.summary}
                      </P>
                    </View>

                    <ChevronRight
                      size={20}
                      className="text-muted-foreground/50"
                    />
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
