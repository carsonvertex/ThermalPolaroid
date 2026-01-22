import {
  InputFocusProvider,
  useInputFocusGroup,
} from "@/hooks/use-input-focus-group";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { Portal, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";

// Component for iOS drawer content with conditional padding
function DrawerContentIOS({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isNumberInputFocused = useInputFocusGroup();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        className="p-5 pt-3 mb-24"
        style={{ backgroundColor: theme.colors.surface }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: isNumberInputFocused ? 64 : 20,
        }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Component for Android drawer content with conditional padding
function DrawerContentAndroid({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isNumberInputFocused = useInputFocusGroup();

  return (
    <ScrollView
      className="p-5 pt-3 mb-12"
      style={{ backgroundColor: theme.colors.surface }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: isNumberInputFocused ? 128 : 20 }}
    >
      {children}
    </ScrollView>
  );
}

export default function DraggableBottomDrawer({
  showDrawer,
  setShowDrawer,
  children,
  title,
}: {
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  children: React.ReactNode;
  title: string;
}) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  // Handle opening/closing animation
  useEffect(() => {
    if (showDrawer) {
      setIsRendered(true);
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isRendered) {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
        translateY.setValue(500);
        backdropOpacity.setValue(0);
      });
    }
  }, [showDrawer]);

  const handleGestureEvent = (event: any) => {
    const { translationY: newY } = event.nativeEvent;
    // Only allow dragging down (positive values)
    if (newY >= 0) {
      translateY.setValue(newY);
    }
  };

  const handleGestureEnd = (event: any) => {
    const { translationY: finalY, velocityY } = event.nativeEvent;

    // Close if dragged down more than 100px or with high velocity
    if (finalY > 100 || velocityY > 500) {
      Animated.timing(translateY, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowDrawer(false);
      });
    } else {
      // Snap back to original position
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }
  };

  return (
    <Portal>
      {isRendered && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Backdrop */}
          <Pressable
            onPress={() => setShowDrawer(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#000",
                opacity: backdropOpacity,
              }}
            />
          </Pressable>

          {/* Drawer */}
          <Animated.View
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
              minHeight: "50%",
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderColor: theme.colors.outline,
              borderWidth: 1,
              zIndex: 1000,
              elevation: 8,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              backgroundColor: theme.colors.surface,
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, 500],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            {/* Drawer Header - Draggable */}
            <PanGestureHandler
              onGestureEvent={handleGestureEvent}
              onHandlerStateChange={(event: any) => {
                if (event.nativeEvent.state === 5) {
                  // State.END
                  handleGestureEnd(event);
                }
              }}
            >
              <View>
                <View className="items-center py-3">
                  <View
                    className="w-10 h-1 rounded-sm opacity-30"
                    style={{ backgroundColor: theme.colors.outline }}
                  />
                </View>
                <View
                  className="px-5 flex-row justify-between items-center pb-2.5 border-b"
                  style={{ borderBottomColor: theme.colors.outline }}
                >
                  <ThemedText className="text-xl font-bold">{title}</ThemedText>
                </View>
              </View>
            </PanGestureHandler>

            {/* Drawer Content */}
            <InputFocusProvider>
              {Platform.OS === "ios" ? (
                <DrawerContentIOS>{children}</DrawerContentIOS>
              ) : (
                <DrawerContentAndroid>{children}</DrawerContentAndroid>
              )}
            </InputFocusProvider>
          </Animated.View>
        </GestureHandlerRootView>
      )}
    </Portal>
  );
}
