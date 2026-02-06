import * as React from "react";
import { SafeAreaView, ScrollView, View, Text } from "react-native";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Switch } from "~/components/ui/switch";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  H1,
  H2,
  H3,
  H4,
  P,
  Large,
  Small,
  Muted,
  Code,
  Lead,
} from "~/components/ui/typography";
import { Info, Check, X } from "lucide-react-native";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useTranslation } from "react-i18next";

export default function ComponentShowcase() {
  const { t } = useTranslation();
  const [checked, setChecked] = React.useState(false);
  const [switchOn, setSwitchOn] = React.useState(false);
  const [tabValue, setTabValue] = React.useState("tab1");
  const [radioValue, setRadioValue] = React.useState("option1");

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pb-6 pt-4">
          <H1 className="text-3xl font-black mb-2">{t("showcase.title")}</H1>
          <P className="mb-6 text-muted-foreground">{t("showcase.subtitle")}</P>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <H2>Heading 2</H2>
              <H3>Heading 3</H3>
              <H4>Heading 4</H4>
              <P className="mb-2">
                This is a paragraph with semibold text for better readability.
              </P>
              <Large>Large text for emphasis</Large>
              <Small>Small text for secondary information</Small>
              <Muted>Muted text for subtle hints</Muted>
              <Code>This is inline code</Code>
              <Lead>Lead paragraph for introductions</Lead>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Card Variants</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <H4 className="mb-2">Default Card</H4>
              <Card className="mb-4">
                <CardContent className="py-4">
                  <P>A simple card with default styling.</P>
                </CardContent>
              </Card>

              <H4 className="mb-2">Primary Hero Card</H4>
              <Card className="mb-4 bg-primary p-4">
                <P className="text-primary-foreground font-bold">
                  Hero card with primary background.
                </P>
              </Card>

              <H4 className="mb-2">Secondary Hero Card</H4>
              <Card className="mb-4 bg-secondary p-4">
                <P className="text-secondary-foreground font-bold">
                  Hero card with secondary background.
                </P>
              </Card>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View className="flex flex-wrap gap-3">
                <Button>
                  <Text className="text-primary-foreground font-bold">
                    Default
                  </Text>
                </Button>
                <Button variant="secondary">
                  <Text className="text-secondary-foreground font-bold">
                    Secondary
                  </Text>
                </Button>
                <Button variant="destructive">
                  <Text className="text-destructive-foreground font-bold">
                    Destructive
                  </Text>
                </Button>
                <Button variant="outline">
                  <Text className="text-foreground font-bold">Outline</Text>
                </Button>
                <Button variant="ghost">
                  <Text className="text-foreground font-bold">Ghost</Text>
                </Button>
              </View>
              <View className="flex flex-wrap gap-3">
                <Button className="h-9 px-3">
                  <Text className="text-primary-foreground font-bold">
                    Small
                  </Text>
                </Button>
                <Button className="h-10 px-4 py-2 native:h-12 native:px-5 native:py-3">
                  <Text className="text-primary-foreground font-bold">
                    Default
                  </Text>
                </Button>
                <Button className="h-11 px-8 native:h-14">
                  <Text className="text-primary-foreground font-bold">
                    Large
                  </Text>
                </Button>
                <Button className="h-12 px-10 native:h-16">
                  <Text className="text-primary-foreground font-bold">
                    Extra Large
                  </Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex flex-wrap gap-3">
                <Badge>
                  <Text className="text-primary-foreground font-bold">
                    Default
                  </Text>
                </Badge>
                <Badge variant="secondary">
                  <Text className="text-secondary-foreground font-bold">
                    Secondary
                  </Text>
                </Badge>
                <Badge variant="destructive">
                  <Text className="text-destructive-foreground font-bold">
                    Destructive
                  </Text>
                </Badge>
                <Badge variant="outline">
                  <Text className="text-foreground font-bold">Outline</Text>
                </Badge>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View>
                <Label className="mb-2">Input Field</Label>
                <Input placeholder="Enter text here..." />
              </View>

              <View>
                <Label className="mb-2">Textarea</Label>
                <Textarea
                  placeholder="Enter longer text here..."
                  numberOfLines={4}
                />
              </View>

              <View className="flex items-center gap-4">
                <View className="flex-row items-center gap-2">
                  <Checkbox checked={checked} onCheckedChange={setChecked} />
                  <Text className="text-foreground font-semibold">
                    Checkbox
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
                  <Text className="text-foreground font-semibold">Switch</Text>
                </View>
              </View>

              <View>
                <Label className="mb-2">Radio Group</Label>
                <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <View className="flex flex-row items-center gap-4">
                    <View className="flex-row items-center gap-2">
                      <RadioGroupItem value="option1" />
                      <Text className="text-foreground font-semibold">
                        Option 1
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <RadioGroupItem value="option2" />
                      <Text className="text-foreground font-semibold">
                        Option 2
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <RadioGroupItem value="option3" />
                      <Text className="text-foreground font-semibold">
                        Option 3
                      </Text>
                    </View>
                  </View>
                </RadioGroup>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Progress Bars</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <View>
                <P className="mb-2">Progress: 45%</P>
                <Progress value={45} />
              </View>
              <View>
                <P className="mb-2">Progress: 75%</P>
                <Progress value={75} />
              </View>
              <View>
                <P className="mb-2">Progress: 100%</P>
                <Progress value={100} />
              </View>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tabValue} onValueChange={setTabValue}>
                <TabsList>
                  <TabsTrigger value="tab1">
                    <Text>Tab 1</Text>
                  </TabsTrigger>
                  <TabsTrigger value="tab2">
                    <Text>Tab 2</Text>
                  </TabsTrigger>
                  <TabsTrigger value="tab3">
                    <Text>Tab 3</Text>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <View className="py-4">
                    <P>Content for Tab 1</P>
                  </View>
                </TabsContent>
                <TabsContent value="tab2">
                  <View className="py-4">
                    <P>Content for Tab 2</P>
                  </View>
                </TabsContent>
                <TabsContent value="tab3">
                  <View className="py-4">
                    <P>Content for Tab 3</P>
                  </View>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <Alert icon={Info}>
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is an informational alert message.
                </AlertDescription>
              </Alert>
              <Alert icon={Check} variant="default">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Your changes have been saved successfully.
                </AlertDescription>
              </Alert>
              <Alert icon={X} variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <View className="mt-8 items-center">
            <Muted className="text-center">
              All components follow the "Juicy" design system guidelines
            </Muted>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
