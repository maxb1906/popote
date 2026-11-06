import { type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { create } from 'zustand';
import { space, useTheme } from '../theme';
import { startOfWeek, today } from '../lib/dates';

export const MAX_WIDTH = 960;

/** Scrollable page with the app background, side gutters and a max width on tablets / web. */
export function Page({
  children,
  contentStyle,
  scroll = true,
  ...rest
}: ScrollViewProps & { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; scroll?: boolean }) {
  const { c } = useTheme();
  const inner = <View style={[{ width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', padding: space[4], gap: space[5] }, contentStyle]}>{children}</View>;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: c.bg }}>{inner}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: space[8] * 2 }}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {inner}
    </ScrollView>
  );
}

/** UI state shared by the Week and Shopping tabs (not persisted). */
interface UiState {
  weekStart: string;
  setWeekStart: (d: string) => void;
}
export const useUi = create<UiState>((set) => ({
  weekStart: startOfWeek(today()),
  setWeekStart: (weekStart) => set({ weekStart }),
}));
