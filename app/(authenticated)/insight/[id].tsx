import { View, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ChevronLeft, Share2, Bookmark } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { H1, H2, H3, P, Muted } from "~/components/ui/typography";
import { INSIGHTS } from "~/lib/insights-data";
import { cn } from "~/lib/utils";

// Simple Markdown Renderer
function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <View className="gap-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (!trimmed) return <View key={i} className="h-2" />;

        // H1
        if (line.startsWith("# ")) {
          return (
            <H1 key={i} className="text-3xl font-black mt-4 mb-2">
              {line.substring(2)}
            </H1>
          );
        }

        // H2
        if (line.startsWith("## ")) {
          return (
            <H2 key={i} className="text-xl font-bold mt-4 mb-2 text-primary">
              {line.substring(3)}
            </H2>
          );
        }

        // H3
        if (line.startsWith("### ")) {
          return (
            <H3 key={i} className="text-lg font-bold mt-2 mb-1">
              {line.substring(4)}
            </H3>
          );
        }

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <View key={i} className="flex-row gap-2 pl-2">
              <Text className="text-foreground text-lg">•</Text>
              <P className="text-lg leading-7 flex-1">{trimmed.substring(2)}</P>
            </View>
          );
        }

        // Ordered list (approximate)
        if (/^\d+\./.test(trimmed)) {
          return (
            <View key={i} className="flex-row gap-2 pl-2">
              <P className="text-lg font-bold">{trimmed.split(".")[0]}.</P>
              <P className="text-lg leading-7 flex-1">
                {trimmed.substring(trimmed.indexOf(".") + 1).trim()}
              </P>
            </View>
          );
        }

        // Bold text handling (very simple, just replaces ** with nothing but applies bold to whole line - robust parsing would need more work but this is specific to our data)
        // For better results without a library, we'll just render as Paragraph.
        // If we really want inline bold, we'd need to parse the string into segments.
        // Let's do a simple bold parser for the whole line if it's wrapped in **

        return (
          <P key={i} className="text-lg leading-8 text-foreground/90">
            {/* Simple bold text parser for **text** */}
            {line.split(/(\*\*.*?\*\*)/).map((part, index) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <Text key={index} className="font-bold">
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </P>
        );
      })}
    </View>
  );
}

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insight = INSIGHTS.find((i) => i.id === id);

  if (!insight) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <P>Insight not found.</P>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <P className="text-primary font-bold">Go Back</P>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-2 flex-row items-center justify-between border-b border-border/40 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted items-center justify-center"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>

        <View className="flex-row gap-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted/50 items-center justify-center">
            <Bookmark size={20} className="text-foreground" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-muted/50 items-center justify-center">
            <Share2 size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Meta Info */}
        <View className="flex-row items-center gap-2 mb-4">
          <View
            className={cn(
              "px-3 py-1 rounded-full bg-primary/10",
              insight.color && `bg-[${insight.color}]/10`,
            )}
          >
            <Text
              className={cn(
                "font-bold text-xs uppercase text-primary",
                insight.color && `text-[${insight.color}]`,
              )}
              style={{ color: insight.color }}
            >
              {insight.category}
            </Text>
          </View>
          <Muted className="text-xs font-bold uppercase tracking-widest">
            {insight.readTime}
          </Muted>
        </View>

        {/* Content */}
        <Markdown content={insight.content} />

        {/* Footer Area */}
        <View className="mt-12 pt-8 border-t border-border">
          <P className="text-center italic text-muted-foreground">
            Read, understood, and applied.
          </P>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
