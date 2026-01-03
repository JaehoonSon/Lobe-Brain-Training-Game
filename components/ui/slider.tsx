import React, { useRef } from "react";
import { View, FlatList, Image, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

interface SlideItem {
  id: string;
  image: any;
  [key: string]: any;
}

interface OnboardingSliderProps {
  data: SlideItem[];
  onIndexChange?: (index: number) => void;
}

const OnboardingSlider: React.FC<OnboardingSliderProps> = ({
  data,
  onIndexChange,
}) => {
  const flatListRef = useRef<FlatList>(null);

  const renderSlide = ({ item }: { item: SlideItem }) => (
    <View style={{ width, justifyContent: "center", alignItems: "center" }}>
      <Image
        source={item.image}
        style={{
          width: width * 0.8,
          height: width * 0.8,
          resizeMode: "contain",
        }}
      />
    </View>
  );

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);

    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  };

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderSlide}
      keyExtractor={(item) => item.id}
      horizontal
      bounces={false}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScroll}
    />
  );
};

export default OnboardingSlider;
