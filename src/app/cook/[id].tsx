import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, ListChecks, PartyPopper, Pause, Play, RotateCcw, Timer, X } from 'lucide-react-native';
import { RecipeRow } from '../../components/RecipeCard';
import { Button, EmptyState, IconButton, Row, Text } from '../../components/ui';
import { useT } from '../../i18n';
import { leftoverSuggestions } from '../../lib/match';
import { cancelTimer, scheduleTimer } from '../../lib/notify';
import { primeAudio, ring } from '../../lib/beep';
import { formatClock } from '../../lib/parse/duration';
import { displayIngredient, scaleIngredient } from '../../lib/scale';
import { useStore } from '../../store';
import { radius, space, useTheme } from '../../theme';

interface RunningTimer {
  step: number;
  total: number;
  endsAt?: number; // running
  left?: number; // paused
  notificationId?: string;
  done?: boolean;
}

export default function CookMode() {
  useKeepAwake();
  const { id, servings: servingsParam } = useLocalSearchParams<{ id: string; servings?: string }>();
  const { c } = useTheme();
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const recipe = useStore((s) => s.recipes[id]);
  const recipes = useStore((s) => s.recipes);
  const markCooked = useStore((s) => s.markCooked);
  const [step, setStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timers, setTimers] = useState<Record<number, RunningTimer>>({});
  const [, tick] = useState(0);
  const timersRef = useRef(timers);
  timersRef.current = timers;

  // one clock for every timer
  useEffect(() => {
    const h = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const next = { ...timersRef.current };
      for (const k of Object.keys(next)) {
        const tm = next[+k];
        if (tm.endsAt && !tm.done && tm.endsAt <= now) {
          next[+k] = { ...tm, done: true, endsAt: undefined, left: 0 };
          changed = true;
          Vibration.vibrate([0, 500, 250, 500]);
          ring();
        }
      }
      if (changed) setTimers(next);
      tick((n) => n + 1);
    }, 500);
    return () => clearInterval(h);
  }, []);

  // cancel pending notifications when leaving cook mode
  useEffect(() => () => Object.values(timersRef.current).forEach((tm) => cancelTimer(tm.notificationId)), []);

  if (!recipe) {
    return <EmptyState icon={X} title={t('recipe.notFound')} />;
  }

  const servings = Math.max(1, parseInt(servingsParam ?? '', 10) || recipe.servings);
  const factor = servings / (recipe.servings || 1);
  const steps = recipe.steps.length ? recipe.steps : [{ id: 'none', text: t('recipe.noSteps') }];
  const current = steps[step];
  const last = step === steps.length - 1;

  const startTimer = async (i: number, seconds: number) => {
    primeAudio();
    const existing = timers[i];
    const left = existing?.left && !existing.done ? existing.left : seconds;
    const notificationId = await scheduleTimer(left, t('cook.timerDone'), t('cook.timerDoneBody', { title: recipe.title, i: i + 1 }));
    setTimers((all) => ({ ...all, [i]: { step: i, total: seconds, endsAt: Date.now() + left * 1000, notificationId } }));
  };
  const pauseTimer = (i: number) => {
    const tm = timers[i];
    if (!tm?.endsAt) return;
    cancelTimer(tm.notificationId);
    setTimers((all) => ({ ...all, [i]: { ...tm, endsAt: undefined, left: Math.max(0, (tm.endsAt! - Date.now()) / 1000), notificationId: undefined } }));
  };
  const resetTimer = (i: number) => {
    cancelTimer(timers[i]?.notificationId);
    setTimers(({ [i]: _gone, ...rest }) => rest);
  };
  const secondsLeft = (tm: RunningTimer) => (tm.endsAt ? (tm.endsAt - Date.now()) / 1000 : (tm.left ?? tm.total));

  const finish = () => {
    markCooked(recipe.id);
    setFinished(true);
  };

  if (finished) {
    const suggestions = leftoverSuggestions(recipe, Object.values(recipes));
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingBottom: insets.bottom }}>
        <Stack.Screen options={{ title: '', headerLeft: () => <IconButton icon={X} label={t('common.close')} onPress={() => router.back()} /> }} />
        <ScrollView contentContainerStyle={{ padding: space[5], gap: space[5], maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <View style={{ alignItems: 'center', gap: space[3], marginTop: space[6] }}>
            <View style={[styles.badge, { backgroundColor: c['accent-soft'] }]}>
              <PartyPopper size={36} color={c['accent-text']} />
            </View>
            <Text variant="xl" serif style={{ textAlign: 'center' }}>
              {t('cook.bravo')}
            </Text>
            <Text tone="muted" style={{ textAlign: 'center' }}>
              {t('cook.bravoBody', { n: (recipe.cookedCount ?? 0) })}
            </Text>
          </View>
          {suggestions.length ? (
            <View style={{ gap: space[2] }}>
              <Text variant="lg">{t('cook.leftovers')}</Text>
              <Text variant="sm" tone="muted">
                {t('cook.leftoversBody')}
              </Text>
              {suggestions.map((m) => (
                <RecipeRow key={m.recipe.id} recipe={m.recipe} onPress={() => router.replace(`/recipe/${m.recipe.id}`)} />
              ))}
            </View>
          ) : null}
          <Button label={t('cook.backToRecipe')} variant="secondary" onPress={() => router.back()} />
        </ScrollView>
      </View>
    );
  }

  const tm = current && 'timerSeconds' in current && current.timerSeconds ? timers[step] : undefined;
  const stepTimer = current && 'timerSeconds' in current ? current.timerSeconds : undefined;
  const otherTimers = Object.values(timers).filter((x) => x.step !== step && (x.endsAt || x.done));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingBottom: insets.bottom }}>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerLeft: () => <IconButton icon={X} label={t('common.close')} onPress={() => router.back()} />,
          headerRight: () => (
            <IconButton icon={ListChecks} label={t('cook.ingredients')} color={showIngredients ? c.accent : c.text} onPress={() => setShowIngredients((v) => !v)} />
          ),
        }}
      />
      {/* progress */}
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: space[4], paddingTop: space[2] }} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: steps.length, now: step + 1 }}>
        {steps.map((s, i) => (
          <View key={s.id} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.accent : c.border }} />
        ))}
      </View>

      {showIngredients ? (
        <ScrollView style={{ maxHeight: 260, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border }} contentContainerStyle={{ padding: space[4], gap: space[1] }}>
          <Text variant="sm" tone="muted">
            {t('common.servingsLong', { n: servings })}
          </Text>
          {recipe.ingredients.map((ing) => {
            const d = displayIngredient(scaleIngredient(ing, factor), lang);
            return (
              <Text key={ing.id}>
                <Text bold>{[d.qtyText, d.unitText].filter(Boolean).join(' ')}</Text> {d.name}
              </Text>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space[5], justifyContent: 'center', gap: space[5], maxWidth: 720, width: '100%', alignSelf: 'center' }}>
        <Text variant="sm" tone="accent" bold style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {t('cook.step', { i: step + 1, n: steps.length })}
        </Text>
        <Text variant="cook" accessibilityLiveRegion="polite">
          {current.text}
        </Text>

        {stepTimer ? (
          <View style={[styles.timer, { backgroundColor: tm?.done ? c['accent-soft'] : c.surface, borderColor: tm?.endsAt ? c.accent : c.border }]}>
            <Timer size={24} color={tm?.done ? c.success : c['accent-text']} />
            <Text variant="xl" style={{ flex: 1, fontVariant: ['tabular-nums'] }} accessibilityLabel={t('recipe.timer', { t: formatClock(tm ? secondsLeft(tm) : stepTimer) })}>
              {tm?.done ? '0:00' : formatClock(tm ? secondsLeft(tm) : stepTimer)}
            </Text>
            {tm?.endsAt ? (
              <IconButton icon={Pause} label={t('cook.pause')} tone="surface" onPress={() => pauseTimer(step)} />
            ) : !tm?.done ? (
              <IconButton icon={Play} label={t('cook.startTimer', { t: formatClock(stepTimer) })} tone="accent" onPress={() => startTimer(step, stepTimer)} />
            ) : null}
            {tm ? <IconButton icon={RotateCcw} label={t('cook.reset')} onPress={() => resetTimer(step)} /> : null}
          </View>
        ) : null}

        {otherTimers.length ? (
          <Row wrap gap={space[2]}>
            {otherTimers.map((x) => (
              <Pressable
                key={x.step}
                onPress={() => setStep(x.step)}
                accessibilityRole="button"
                style={[styles.mini, { backgroundColor: x.done ? c['accent-soft'] : c['surface-2'] }]}
              >
                <Timer size={14} color={x.done ? c.success : c['accent-text']} />
                <Text variant="sm" bold>
                  {`${step < x.step ? '→' : '←'} ${x.step + 1} · ${x.done ? '0:00' : formatClock(secondsLeft(x))}`}
                </Text>
              </Pressable>
            ))}
          </Row>
        ) : null}
      </ScrollView>

      <View style={[styles.nav, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Button label={t('common.previous')} icon={ChevronLeft} variant="secondary" size="lg" disabled={step === 0} onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
        {last ? (
          <Button label={t('cook.finish')} icon={Check} size="lg" onPress={finish} style={{ flex: 1.4 }} />
        ) : (
          <Button label={t('common.next')} icon={ChevronRight} size="lg" onPress={() => setStep((s) => s + 1)} style={{ flex: 1.4 }} />
        )}
      </View>
      <Text variant="xs" tone="muted" style={{ textAlign: 'center', paddingVertical: space[1] }}>
        {t('cook.awake')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timer: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], borderRadius: radius.lg, borderWidth: 2 },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space[3], paddingVertical: space[2], borderRadius: radius.pill },
  nav: { flexDirection: 'row', gap: space[3], padding: space[4], borderTopWidth: StyleSheet.hairlineWidth },
  badge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
});
