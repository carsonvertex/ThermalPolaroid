import { useAuthStore } from "@/lib/stores/auth-store";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  TouchableOpacity,
  View,
} from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import UploadOrderDev from "./upload-order-dev";

const BUTTON_SIZE = 60;
const TOP_NAV_HEIGHT = 60; // Approximate height of top navigation
const BOTTOM_TAB_HEIGHT = 60; // Approximate height of bottom tabs

export default function FloatingDevButton() {
  const { user } = useAuthStore();
  const theme = useTheme();
  const [showModal, setShowModal] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  console.log("🔧 FloatingDevButton render - user role:", user?.role, "showModal:", showModal);

  // Calculate boundaries
  const minY = TOP_NAV_HEIGHT;
  const maxY = screenHeight - BOTTOM_TAB_HEIGHT - BUTTON_SIZE;
  const minX = 0;
  const maxX = screenWidth - BUTTON_SIZE;

  // Position state for draggable button (start in bottom right)
  const pan = useRef(new Animated.ValueXY({ 
    x: maxX - 20, 
    y: maxY - 100 
  })).current;
  
  const isDragging = useRef(false);

  // Pan responder for dragging with boundaries
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only become responder if moved more than 5 pixels
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        
        // Get current position
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        // Constrain to boundaries
        const boundedX = Math.max(minX, Math.min(maxX, currentX));
        const boundedY = Math.max(minY, Math.min(maxY, currentY));
        
        // Animate to bounded position if out of bounds
        if (currentX !== boundedX || currentY !== boundedY) {
          Animated.spring(pan, {
            toValue: { x: boundedX, y: boundedY },
            useNativeDriver: false,
            friction: 7,
          }).start();
        }
        
        // Reset dragging flag after a short delay
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;
  
  const handleButtonPress = () => {
    console.log("🔧 Dev button pressed, isDragging:", isDragging.current);
    // Only open modal if not dragging
    if (!isDragging.current) {
      console.log("🔧 Opening dev tools modal");
      setShowModal(true);
    } else {
      console.log("🔧 Ignoring press - was dragging");
    }
  };

  // Only show for admin users
  if (user?.role !== "developer") {
    return null;
  }

  return (
    <>
          <Animated.View
            style={{
              position: "absolute",
              transform: [{ translateX: pan.x }, { translateY: pan.y }],
              zIndex: 9999,
            }}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              onPress={handleButtonPress}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.colors.errorContainer,
                borderRadius: 30,
                width: 60,
                height: 60,
                justifyContent: "center",
                alignItems: "center",
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <IconButton
                icon="tools"
                size={28}
                iconColor={theme.colors.error}
                style={{ margin: 0 }}
              />
            </TouchableOpacity>
          </Animated.View>

          <Modal
            visible={showModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              console.log("🔧 Modal closing via back button");
              setShowModal(false);
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => setShowModal(false)}
                activeOpacity={1}
              />
              <View
                style={{
                  backgroundColor: theme.colors.background,
                  borderRadius: 12,
                  padding: 20,
                  maxHeight: "80%",
                  width: "100%",
                  maxWidth: 500,
                }}
              >
                <UploadOrderDev onClose={() => setShowModal(false)} />
              </View>
            </View>
          </Modal>
    </>
  );
}
