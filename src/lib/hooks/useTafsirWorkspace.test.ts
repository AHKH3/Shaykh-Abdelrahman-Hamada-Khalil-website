import { describe, expect, it } from "vitest";
import {
  createInitialTafsirWorkspaceState,
  resolveActiveAyahVerseKey,
  tafsirWorkspaceReducer,
} from "./useTafsirWorkspace";

describe("useTafsirWorkspace reducer", () => {
  it("opens for ayah and locks to selected verse", () => {
    const initial = createInitialTafsirWorkspaceState();
    const state = tafsirWorkspaceReducer(initial, {
      type: "open_for_ayah",
      verseKey: "2:255",
      lockToVerse: true,
    });

    expect(state.isOpen).toBe(true);
    expect(state.scopeMode).toBe("ayah");
    expect(state.followMode).toBe("locked");
    expect(state.lockedVerseKey).toBe("2:255");
    expect(state.manualVerseKey).toBe("2:255");
  });

  it("toggles follow mode and keeps lock target", () => {
    const locked = tafsirWorkspaceReducer(createInitialTafsirWorkspaceState(), {
      type: "set_follow_mode",
      followMode: "locked",
      lockedVerseKey: "1:1",
    });

    expect(locked.followMode).toBe("locked");
    expect(locked.lockedVerseKey).toBe("1:1");

    const follow = tafsirWorkspaceReducer(locked, {
      type: "toggle_follow_mode",
      lockedVerseKey: "2:1",
    });

    expect(follow.followMode).toBe("follow");
    expect(follow.lockedVerseKey).toBeNull();

    const backToLocked = tafsirWorkspaceReducer(follow, {
      type: "toggle_follow_mode",
      lockedVerseKey: "2:1",
    });

    expect(backToLocked.followMode).toBe("locked");
    expect(backToLocked.lockedVerseKey).toBe("2:1");
  });

  it("updates scope mode and open/close transitions", () => {
    const opened = tafsirWorkspaceReducer(createInitialTafsirWorkspaceState(), { type: "open" });
    expect(opened.isOpen).toBe(true);

    const pageScope = tafsirWorkspaceReducer(opened, {
      type: "set_scope_mode",
      scopeMode: "page",
    });
    expect(pageScope.scopeMode).toBe("page");

    const closed = tafsirWorkspaceReducer(pageScope, { type: "close" });
    expect(closed.isOpen).toBe(false);
  });
});

describe("resolveActiveAyahVerseKey", () => {
  it("prioritizes audio then highlighted then selected in follow mode", () => {
    const state = createInitialTafsirWorkspaceState();

    expect(
      resolveActiveAyahVerseKey(state, {
        currentAudioVerse: "3:7",
        highlightedVerse: "2:1",
        selectedVerse: "1:1",
      })
    ).toBe("3:7");

    expect(
      resolveActiveAyahVerseKey(state, {
        currentAudioVerse: null,
        highlightedVerse: "2:1",
        selectedVerse: "1:1",
      })
    ).toBe("2:1");

    expect(
      resolveActiveAyahVerseKey(state, {
        currentAudioVerse: null,
        highlightedVerse: null,
        selectedVerse: "1:1",
      })
    ).toBe("1:1");
  });

  it("stays on locked verse in locked mode", () => {
    const state = {
      ...createInitialTafsirWorkspaceState(),
      followMode: "locked" as const,
      lockedVerseKey: "5:3",
      manualVerseKey: "4:1",
    };

    expect(
      resolveActiveAyahVerseKey(state, {
        currentAudioVerse: "3:7",
        highlightedVerse: "2:1",
        selectedVerse: "1:1",
      })
    ).toBe("5:3");
  });
});
