import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReadingMode, User } from "@/types";

/* ══════════════════════════════════════
   名前変換ストア
   作品ごとのキャラ名マッピングをlocalStorageに保存
══════════════════════════════════════ */
interface NameMap { [charId: string]: string; }

interface NameStore {
  // key: workId, value: { charId -> userInputName }
  nameMaps: { [workId: string]: NameMap };
  setName: (workId: string, charId: string, name: string) => void;
  resetNames: (workId: string) => void;
  getNameMap: (workId: string) => NameMap;
}

export const useNameStore = create<NameStore>()(
  persist(
    (set, get) => ({
      nameMaps: {},
      setName: (workId, charId, name) =>
        set(state => ({
          nameMaps: {
            ...state.nameMaps,
            [workId]: { ...state.nameMaps[workId], [charId]: name },
          },
        })),
      resetNames: workId =>
        set(state => ({
          nameMaps: { ...state.nameMaps, [workId]: {} },
        })),
      getNameMap: workId => get().nameMaps[workId] ?? {},
    }),
    { name: "nf-names" }
  )
);

/* ══════════════════════════════════════
   読書設定ストア
   フォント・背景・行間などをlocalStorageに保存
══════════════════════════════════════ */
export type ReaderFont = "mincho" | "gothic" | "mono";
export type ReaderTheme = "dark" | "sepia" | "navy" | "warm" | "cream" | "white";

interface ReaderSettings {
  fontSize: number;       // 12~24
  lineHeight: number;     // 1.5~2.5
  font: ReaderFont;
  theme: ReaderTheme;
  // テーマ別の背景色とテキスト色
  themeBg:  string;
  themeTxt: string;
  // 最後に使ったモード (per work)
  lastModes: { [workId: string]: ReadingMode };
}
interface ReaderSettingsStore extends ReaderSettings {
  setFontSize:   (v: number) => void;
  setLineHeight: (v: number) => void;
  setFont:       (v: ReaderFont) => void;
  setTheme:      (v: ReaderTheme) => void;
  setLastMode:   (workId: string, mode: ReadingMode) => void;
  getLastMode:   (workId: string) => ReadingMode;
}

const THEME_MAP: Record<ReaderTheme, { bg: string; txt: string }> = {
  dark:  { bg: "#0f0e14", txt: "rgba(255,255,255,0.82)" },
  sepia: { bg: "#1e1812", txt: "rgba(240,220,180,0.88)" },
  navy:  { bg: "#0e1422", txt: "rgba(180,210,255,0.88)" },
  warm:  { bg: "#1e1414", txt: "rgba(255,230,210,0.88)" },
  cream: { bg: "#f5f0e8", txt: "rgba(50,40,30,0.88)"   },
  white: { bg: "#ffffff", txt: "rgba(30,30,30,0.88)"   },
};

export const useReaderSettings = create<ReaderSettingsStore>()(
  persist(
    (set, get) => ({
      fontSize:   17,
      lineHeight: 1.9,
      font:       "mincho",
      theme:      "dark",
      themeBg:    THEME_MAP.dark.bg,
      themeTxt:   THEME_MAP.dark.txt,
      lastModes:  {},

      setFontSize:   v  => set({ fontSize: v }),
      setLineHeight: v  => set({ lineHeight: v }),
      setFont:       v  => set({ font: v }),
      setTheme: v => set({
        theme: v,
        themeBg: THEME_MAP[v].bg,
        themeTxt: THEME_MAP[v].txt,
      }),
      setLastMode: (workId, mode) =>
        set(state => ({ lastModes: { ...state.lastModes, [workId]: mode } })),
      getLastMode: workId =>
        get().lastModes[workId] ?? "both",
    }),
    { name: "nf-reader-settings" }
  )
);

/* ══════════════════════════════════════
   認証ストア（モック）
   実際はNextAuth/Supabase Authに置き換え
══════════════════════════════════════ */
interface AuthStore {
  user:    User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  logout:  () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      user: null,
      isLoading: false,
      isLoggedIn: false,
      setUser: user => set({ user, isLoggedIn: !!user }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    { name: "nf-auth" }
  )
);

/* ══════════════════════════════════════
   読書進捗ストア（ローカルキャッシュ）
══════════════════════════════════════ */
interface ProgressMap {
  [workId: string]: {
    lastEpisodeId: string | null;
    lastScrollPct: number;
    lastFlipPage: number;
    updatedAt: string;
  };
}
interface ProgressStore {
  progresses: ProgressMap;
  saveProgress: (
    workId: string,
    ep: { lastEpisodeId?: string; lastScrollPct?: number; lastFlipPage?: number }
  ) => void;
  getProgress: (workId: string) => ProgressMap[string] | null;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progresses: {},
      saveProgress: (workId, ep) =>
        set(state => ({
          progresses: {
            ...state.progresses,
            [workId]: {
              lastEpisodeId: ep.lastEpisodeId ?? state.progresses[workId]?.lastEpisodeId ?? null,
              lastScrollPct: ep.lastScrollPct ?? state.progresses[workId]?.lastScrollPct ?? 0,
              lastFlipPage:  ep.lastFlipPage  ?? state.progresses[workId]?.lastFlipPage  ?? 0,
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      getProgress: workId => get().progresses[workId] ?? null,
    }),
    { name: "nf-progress" }
  )
);

/* ══════════════════════════════════════
   パックストア
   インポート済みパックをlocalStorageに保存
══════════════════════════════════════ */
interface PackImport {
  packId: string;
  packName: string;
  workId: string;
  isActive: boolean;
  importedAt: string;
}
interface PackStore {
  imports: { [workId: string]: PackImport[] };
  importPack: (pack: PackImport) => void;
  activatePack: (workId: string, packId: string) => void;
  removePack: (workId: string, packId: string) => void;
  getActivePack: (workId: string) => PackImport | null;
  getImports: (workId: string) => PackImport[];
}

export const usePackStore = create<PackStore>()(
  persist(
    (set, get) => ({
      imports: {},
      importPack: pack =>
        set(state => ({
          imports: {
            ...state.imports,
            [pack.workId]: [
              ...(state.imports[pack.workId] ?? []).filter(p => p.packId !== pack.packId),
              pack,
            ],
          },
        })),
      activatePack: (workId, packId) =>
        set(state => ({
          imports: {
            ...state.imports,
            [workId]: (state.imports[workId] ?? []).map(p =>
              ({ ...p, isActive: p.packId === packId })
            ),
          },
        })),
      removePack: (workId, packId) =>
        set(state => ({
          imports: {
            ...state.imports,
            [workId]: (state.imports[workId] ?? []).filter(p => p.packId !== packId),
          },
        })),
      getActivePack: workId =>
        (get().imports[workId] ?? []).find(p => p.isActive) ?? null,
      getImports: workId => get().imports[workId] ?? [],
    }),
    { name: "nf-packs" }
  )
);
