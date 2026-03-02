"use client";

import { useCallback, useMemo, useReducer } from "react";

export type TafsirScopeMode = "ayah" | "range" | "page";
export type TafsirFollowMode = "follow" | "locked";

export type TafsirScope =
  | { mode: "ayah"; verseKey: string | null }
  | {
      mode: "range";
      chapterId: number;
      fromVerse: number;
      toVerse: number;
      verseKeys: string[];
    }
  | {
      mode: "page";
      pageNumber: number;
      verseKeys: string[];
    };

export interface TafsirWorkspaceSources {
  currentAudioVerse: string | null;
  highlightedVerse: string | null;
  selectedVerse: string | null;
}

export interface TafsirWorkspaceState {
  isOpen: boolean;
  scopeMode: TafsirScopeMode;
  followMode: TafsirFollowMode;
  lockedVerseKey: string | null;
  manualVerseKey: string | null;
}

type TafsirWorkspaceAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "toggle_open" }
  | { type: "set_scope_mode"; scopeMode: TafsirScopeMode }
  | { type: "set_follow_mode"; followMode: TafsirFollowMode; lockedVerseKey?: string | null }
  | { type: "toggle_follow_mode"; lockedVerseKey?: string | null }
  | { type: "set_manual_verse"; verseKey: string | null }
  | { type: "open_for_ayah"; verseKey: string; lockToVerse: boolean };

export function createInitialTafsirWorkspaceState(): TafsirWorkspaceState {
  return {
    isOpen: false,
    scopeMode: "ayah",
    followMode: "follow",
    lockedVerseKey: null,
    manualVerseKey: null,
  };
}

export function resolveFollowCandidate(sources: TafsirWorkspaceSources): string | null {
  return sources.currentAudioVerse ?? sources.highlightedVerse ?? sources.selectedVerse ?? null;
}

export function resolveActiveAyahVerseKey(
  state: TafsirWorkspaceState,
  sources: TafsirWorkspaceSources
): string | null {
  const followCandidate = resolveFollowCandidate(sources);
  if (state.followMode === "locked") {
    return state.lockedVerseKey ?? state.manualVerseKey ?? followCandidate;
  }
  return followCandidate;
}

export function tafsirWorkspaceReducer(
  state: TafsirWorkspaceState,
  action: TafsirWorkspaceAction
): TafsirWorkspaceState {
  switch (action.type) {
    case "open":
      return { ...state, isOpen: true };
    case "close":
      return { ...state, isOpen: false };
    case "toggle_open":
      return { ...state, isOpen: !state.isOpen };
    case "set_scope_mode":
      return { ...state, scopeMode: action.scopeMode };
    case "set_follow_mode":
      return {
        ...state,
        followMode: action.followMode,
        lockedVerseKey:
          action.followMode === "locked"
            ? action.lockedVerseKey ?? state.lockedVerseKey ?? state.manualVerseKey
            : null,
      };
    case "toggle_follow_mode":
      if (state.followMode === "follow") {
        return {
          ...state,
          followMode: "locked",
          lockedVerseKey: action.lockedVerseKey ?? state.lockedVerseKey ?? state.manualVerseKey,
        };
      }
      return {
        ...state,
        followMode: "follow",
        lockedVerseKey: null,
      };
    case "set_manual_verse":
      return {
        ...state,
        manualVerseKey: action.verseKey,
        lockedVerseKey:
          state.followMode === "locked" ? action.verseKey ?? state.lockedVerseKey : state.lockedVerseKey,
      };
    case "open_for_ayah":
      return {
        ...state,
        isOpen: true,
        scopeMode: "ayah",
        manualVerseKey: action.verseKey,
        followMode: action.lockToVerse ? "locked" : state.followMode,
        lockedVerseKey: action.lockToVerse ? action.verseKey : state.lockedVerseKey,
      };
    default:
      return state;
  }
}

interface OpenForAyahOptions {
  lockToVerse?: boolean;
}

export function useTafsirWorkspace(sources: TafsirWorkspaceSources) {
  const [state, dispatch] = useReducer(
    tafsirWorkspaceReducer,
    undefined,
    createInitialTafsirWorkspaceState
  );

  const activeAyahVerseKey = useMemo(
    () => resolveActiveAyahVerseKey(state, sources),
    [sources, state]
  );

  const open = useCallback(() => dispatch({ type: "open" }), []);
  const close = useCallback(() => dispatch({ type: "close" }), []);
  const toggleOpen = useCallback(() => dispatch({ type: "toggle_open" }), []);

  const setScopeMode = useCallback((scopeMode: TafsirScopeMode) => {
    dispatch({ type: "set_scope_mode", scopeMode });
  }, []);

  const setFollowMode = useCallback(
    (followMode: TafsirFollowMode) => {
      dispatch({
        type: "set_follow_mode",
        followMode,
        lockedVerseKey: followMode === "locked" ? activeAyahVerseKey : null,
      });
    },
    [activeAyahVerseKey]
  );

  const toggleFollowMode = useCallback(() => {
    dispatch({ type: "toggle_follow_mode", lockedVerseKey: activeAyahVerseKey });
  }, [activeAyahVerseKey]);

  const setManualVerse = useCallback((verseKey: string | null) => {
    dispatch({ type: "set_manual_verse", verseKey });
  }, []);

  const openForAyah = useCallback((verseKey: string, options?: OpenForAyahOptions) => {
    dispatch({
      type: "open_for_ayah",
      verseKey,
      lockToVerse: options?.lockToVerse ?? true,
    });
  }, []);

  return {
    ...state,
    activeAyahVerseKey,
    open,
    close,
    toggleOpen,
    setScopeMode,
    setFollowMode,
    toggleFollowMode,
    setManualVerse,
    openForAyah,
  };
}
