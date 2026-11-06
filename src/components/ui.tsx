import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Minus, Plus } from 'lucide-react-native';
import { radius, space, textStyle, useTheme, type Colors } from '../theme';

type TextVariant = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'display' | 'cook';
type Tone = 'text' | 'muted' | 'accent' | 'danger' | 'success' | 'warning' | 'onAccent';

const toneColor = (c: Colors, tone: Tone) =>
  ({
    text: c.text,
    muted: c['text-muted'],
    accent: c['accent-text'],
    danger: c.danger,
    success: c.success,
    warning: c.warning,
    onAccent: c['on-accent'],
  })[tone];

export function Text({
  variant = 'base',
  tone = 'text',
  serif,
  bold,
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: Tone; serif?: boolean; bold?: boolean }) {
  const { c } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        textStyle(variant),
        { color: toneColor(c, tone) },
        serif && { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }) },
        bold && { fontWeight: '700' },
        style,
      ]}
    />
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  const h = { sm: 36, md: 44, lg: 52 }[size];
  const bg = { primary: c.accent, secondary: c['surface-2'], ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: c['on-accent'], secondary: c.text, ghost: c['accent-text'], danger: c.danger }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: h,
          backgroundColor: bg,
          paddingHorizontal: size === 'sm' ? space[3] : space[4],
          borderColor: variant === 'danger' ? c.danger : 'transparent',
          borderWidth: variant === 'danger' ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : Icon ? <Icon color={fg} size={size === 'sm' ? 16 : 20} /> : null}
      <RNText style={[textStyle(size === 'sm' ? 'sm' : 'base'), { color: fg, fontWeight: '600' }]} numberOfLines={1}>
        {label}
      </RNText>
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  tone = 'ghost',
  size = 44,
  color,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  tone?: 'ghost' | 'surface' | 'accent';
  size?: number;
  color?: string;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const bg = { ghost: 'transparent', surface: c['surface-2'], accent: c.accent }[tone];
  const fg = color ?? (tone === 'accent' ? c['on-accent'] : c.text);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Icon color={fg} size={Math.round(size * 0.48)} />
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon: Icon,
  onRemove,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  onRemove?: () => void;
}) {
  const { c } = useTheme();
  const fg = selected ? c['on-accent'] : c.text;
  return (
    <Pressable
      onPress={onPress ?? onRemove}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={onRemove && !onPress ? `${label}, ×` : label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? c.accent : c['surface-2'], opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {Icon ? <Icon size={15} color={fg} /> : null}
      <RNText style={[textStyle('sm'), { color: fg, fontWeight: selected ? '600' : '500' }]}>{label}</RNText>
      {onRemove ? <RNText style={[textStyle('sm'), { color: fg, marginLeft: 2 }]}>×</RNText> : null}
    </Pressable>
  );
}

export function Field({ label, error, hint, style, multiline, ...rest }: TextInputProps & { label?: string; error?: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space[1] }}>
      {label ? (
        <Text variant="sm" bold>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={c['text-muted']}
        multiline={multiline}
        accessibilityLabel={label ?? rest.placeholder}
        {...rest}
        style={[
          textStyle('base'),
          {
            color: c.text,
            backgroundColor: c.surface,
            borderColor: error ? c.danger : c['border-input'],
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: space[3],
            paddingVertical: multiline ? space[3] : space[2],
            minHeight: multiline ? 110 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
          },
          style,
        ]}
      />
      {error ? (
        <Text variant="sm" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="xs" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label,
  format,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  format?: (n: number) => string;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.stepper, { backgroundColor: c['surface-2'] }]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format ? format(value) : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - 1));
      }}
    >
      <IconButton icon={Minus} label={`${label} −`} size={36} onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} />
      <Text variant="base" bold style={{ minWidth: 70, textAlign: 'center' }}>
        {format ? format(value) : value}
      </Text>
      <IconButton icon={Plus} label={`${label} +`} size={36} onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />
    </View>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c['accent-soft'] }]}>
        <Icon size={32} color={c['accent-text']} />
      </View>
      <Text variant="lg" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={{ textAlign: 'center', maxWidth: 340 }}>
          {body}
        </Text>
      ) : null}
      {children ? <View style={{ gap: space[2], marginTop: space[2], alignSelf: 'stretch', alignItems: 'center' }}>{children}</View> : null}
    </View>
  );
}

export function Banner({ tone = 'info', children, icon: Icon }: { tone?: 'info' | 'warning' | 'error'; children: ReactNode; icon?: LucideIcon }) {
  const { c } = useTheme();
  const bg = { info: c['accent-soft'], warning: c['warning-soft'], error: c.surface }[tone];
  const fg = { info: c['accent-text'], warning: c.warning, error: c.danger }[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.banner, { backgroundColor: bg, borderColor: tone === 'error' ? c.danger : 'transparent' }]}
    >
      {Icon ? <Icon size={18} color={fg} style={{ marginTop: 2 }} /> : null}
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text variant="sm">{children}</Text> : children}</View>
    </View>
  );
}

export function Card({ children, style, ...rest }: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  const Comp = rest.onPress ? Pressable : View;
  return (
    <Comp
      {...(rest as object)}
      style={({ pressed }: { pressed?: boolean }) => [
        { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      {children}
    </Comp>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: space[3] }}>
      <View style={styles.sectionHead}>
        <Text variant="lg" accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Row({ children, gap = space[2], style, wrap }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle>; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

export function ListRow({
  title,
  subtitle,
  icon: Icon,
  onPress,
  right,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      {Icon ? <Icon size={20} color={danger ? c.danger : c['accent-text']} /> : null}
      <View style={{ flex: 1 }}>
        <Text tone={danger ? 'danger' : 'text'} style={{ fontWeight: '500' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="sm" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[2], borderRadius: radius.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 14, minHeight: 36 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingHorizontal: 4, alignSelf: 'flex-start' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[3], flex: 1 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: space[2] },
  banner: { flexDirection: 'row', gap: space[2], padding: space[3], borderRadius: radius.md, borderWidth: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3], minHeight: 52 },
});
