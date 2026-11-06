import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uid } from '../lib/text';
import type { Meal, Notebook, PantryItem, PlanEntry, Recipe, RecipeDraft, Settings, ShoppingItem } from '../lib/types';
import { defaultLanguage } from '../lib/locale';
import { appStorage, requestPersistentStorage } from '../lib/storage';

export interface ShoppingState {
  /** ticked keys of generated + manual items */
  checked: Record<string, boolean>;
  /** generated items the user removed for this list */
  removed: Record<string, boolean>;
  manual: ShoppingItem[];
}

export interface State {
  recipes: Record<string, Recipe>;
  notebooks: Notebook[];
  plan: PlanEntry[];
  pantry: PantryItem[];
  shopping: ShoppingState;
  settings: Settings;
  hydrated: boolean;

  addRecipe: (draft: RecipeDraft) => Recipe;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavourite: (id: string) => void;
  markCooked: (id: string) => void;

  addNotebook: (name: string) => Notebook;
  renameNotebook: (id: string, name: string) => void;
  deleteNotebook: (id: string) => void;
  toggleInNotebook: (notebookId: string, recipeId: string) => void;

  addPlan: (date: string, meal: Meal, recipeId: string, servings: number) => void;
  updatePlan: (id: string, patch: Partial<PlanEntry>) => void;
  removePlan: (id: string) => void;

  toggleChecked: (key: string) => void;
  removeShoppingKey: (key: string) => void;
  addManualItem: (item: ShoppingItem) => void;
  clearChecked: (keys: string[]) => void;
  resetShopping: () => void;

  addPantry: (name: string) => void;
  removePantry: (id: string) => void;

  setSettings: (patch: Partial<Settings>) => void;
  replaceAll: (data: Partial<Pick<State, 'recipes' | 'notebooks' | 'plan' | 'pantry' | 'shopping'>>) => void;
}

const now = () => new Date().toISOString();

const emptyShopping: ShoppingState = { checked: {}, removed: {}, manual: [] };

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      recipes: {},
      notebooks: [],
      plan: [],
      pantry: [],
      shopping: emptyShopping,
      settings: { language: defaultLanguage(), theme: 'system', grams: false },
      hydrated: false,

      addRecipe: (draft) => {
        const t = now();
        const recipe: Recipe = {
          favourite: false,
          cookedCount: 0,
          ...draft,
          title: draft.title.trim() || '—',
          servings: Math.max(1, Math.round(draft.servings || 1)),
          id: uid(),
          createdAt: t,
          updatedAt: t,
        };
        set((s) => ({ recipes: { ...s.recipes, [recipe.id]: recipe } }));
        return recipe;
      },
      updateRecipe: (id, patch) =>
        set((s) => {
          const r = s.recipes[id];
          if (!r) return s;
          return { recipes: { ...s.recipes, [id]: { ...r, ...patch, id, updatedAt: now() } } };
        }),
      deleteRecipe: (id) =>
        set((s) => {
          const { [id]: _gone, ...recipes } = s.recipes;
          return {
            recipes,
            notebooks: s.notebooks.map((n) => ({ ...n, recipeIds: n.recipeIds.filter((r) => r !== id) })),
            plan: s.plan.filter((p) => p.recipeId !== id),
          };
        }),
      toggleFavourite: (id) => {
        const r = get().recipes[id];
        if (r) get().updateRecipe(id, { favourite: !r.favourite });
      },
      markCooked: (id) => {
        const r = get().recipes[id];
        if (r) get().updateRecipe(id, { cookedCount: r.cookedCount + 1, lastCookedAt: now() });
      },

      addNotebook: (name) => {
        const nb: Notebook = { id: uid(), name: name.trim(), recipeIds: [], createdAt: now() };
        set((s) => ({ notebooks: [...s.notebooks, nb] }));
        return nb;
      },
      renameNotebook: (id, name) => set((s) => ({ notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, name: name.trim() } : n)) })),
      deleteNotebook: (id) => set((s) => ({ notebooks: s.notebooks.filter((n) => n.id !== id) })),
      toggleInNotebook: (notebookId, recipeId) =>
        set((s) => ({
          notebooks: s.notebooks.map((n) =>
            n.id !== notebookId
              ? n
              : { ...n, recipeIds: n.recipeIds.includes(recipeId) ? n.recipeIds.filter((r) => r !== recipeId) : [...n.recipeIds, recipeId] },
          ),
        })),

      addPlan: (date, meal, recipeId, servings) =>
        set((s) => ({ plan: [...s.plan, { id: uid(), date, meal, recipeId, servings: Math.max(1, servings) }] })),
      updatePlan: (id, patch) => set((s) => ({ plan: s.plan.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removePlan: (id) => set((s) => ({ plan: s.plan.filter((p) => p.id !== id) })),

      toggleChecked: (key) =>
        set((s) => ({ shopping: { ...s.shopping, checked: { ...s.shopping.checked, [key]: !s.shopping.checked[key] } } })),
      removeShoppingKey: (key) =>
        set((s) => ({
          shopping: {
            ...s.shopping,
            manual: s.shopping.manual.filter((m) => m.key !== key),
            removed: { ...s.shopping.removed, [key]: true },
          },
        })),
      addManualItem: (item) =>
        set((s) => {
          const { [item.key]: _r, ...removed } = s.shopping.removed;
          return { shopping: { ...s.shopping, removed, manual: [...s.shopping.manual.filter((m) => m.key !== item.key), item] } };
        }),
      clearChecked: (keys) =>
        set((s) => {
          const removed = { ...s.shopping.removed };
          const checked = { ...s.shopping.checked };
          for (const k of keys) {
            removed[k] = true;
            delete checked[k];
          }
          return { shopping: { checked, removed, manual: s.shopping.manual.filter((m) => !keys.includes(m.key)) } };
        }),
      resetShopping: () => set({ shopping: emptyShopping }),

      addPantry: (name) => {
        const n = name.trim();
        if (!n || get().pantry.some((p) => p.name.toLowerCase() === n.toLowerCase())) return;
        set((s) => ({ pantry: [...s.pantry, { id: uid(), name: n }] }));
      },
      removePantry: (id) => set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      replaceAll: (data) => set((s) => ({ ...s, ...data })),
    }),
    {
      name: 'popote-v1',
      version: 1,
      storage: createJSONStorage(() => appStorage),
      partialize: ({ recipes, notebooks, plan, pantry, shopping, settings }) => ({ recipes, notebooks, plan, pantry, shopping, settings }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
        requestPersistentStorage();
      },
    },
  ),
);

export const recipeList = (s: State) => s.recipes;
