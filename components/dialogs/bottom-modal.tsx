import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT_IOS = 0;
const TAB_BAR_HEIGHT_ANDROID = 0;

const BottomModal = ({
  visible = true,
  onClose,
  colors,
  children,
  tabBarVisible = true,
  collapsed = false,
}: {
  visible?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  colors: any;
  tabBarVisible?: boolean;
  /**
   * Set to true while something else (e.g. the map) is being interacted with.
   * The sheet drops to its lowest snap point, then pops back up when this
   * goes back to false, but only if it was open before it was lowered.
   */
  collapsed?: boolean;
}) => {
  const sheetRef = useRef<BottomSheet>(null);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Tracks where the *user* left the sheet, so auto-collapse never overrides
  // a sheet they lowered themselves.
  const indexRef = useRef(visible ? 1 : -1);
  const autoCollapsedRef = useRef(false);
  const restoreRef = useRef(false);

  const isTablet = screenWidth >= 768;

  const tabBarHeight = tabBarVisible
    ? Platform.OS === "ios"
      ? TAB_BAR_HEIGHT_IOS
      : TAB_BAR_HEIGHT_ANDROID
    : 0;

  const bottomInset = tabBarHeight + (tabBarVisible ? 0 : insets.bottom);

  const snapPoints = useMemo(() => {
    if (isTablet) {
      return [72 + bottomInset, screenHeight * 0.92];
    }
    return [
      50 + bottomInset, // screenHeight * 0.85
    ];
  }, [isTablet, screenHeight, bottomInset]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(1);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  // Lower while `collapsed`, restore afterwards
  useEffect(() => {
    if (!visible) return;

    if (collapsed) {
      if (!autoCollapsedRef.current) {
        restoreRef.current = indexRef.current >= 1;
        autoCollapsedRef.current = true;
        sheetRef.current?.snapToIndex(0);
      }
    } else if (autoCollapsedRef.current) {
      autoCollapsedRef.current = false;
      if (restoreRef.current) sheetRef.current?.snapToIndex(1);
    }
  }, [collapsed, visible]);

  const handleChange = useCallback((index: number) => {
    // Ignore index changes we caused ourselves while auto-collapsed
    if (!autoCollapsedRef.current) indexRef.current = index;
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 1 : -1}
      snapPoints={snapPoints}
      enableDynamicSizing={true}
      enablePanDownToClose={false}
      onChange={handleChange}
      onClose={handleClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      bottomInset={bottomInset}
      style={isTablet ? styles.tabletSheet : undefined}
      containerStyle={
        isTablet
          ? { alignSelf: "center", width: Math.min(560, screenWidth * 0.9) }
          : undefined
      }
      handleIndicatorStyle={{
        backgroundColor: colors.placeholder || "#A1A1AA",
        width: 40,
        height: 4,
      }}
      handleStyle={styles.handle}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderRadius: 24,
      }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bounces={false}
        overScrollMode="never"
        // contentContainerStyle={[
        //   styles.scrollContent,
        //   { paddingBottom: Math.max(insets.bottom, 16) },
        // ]}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handle: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  tabletSheet: {
    marginHorizontal: 0,
  },
});

export default BottomModal;
