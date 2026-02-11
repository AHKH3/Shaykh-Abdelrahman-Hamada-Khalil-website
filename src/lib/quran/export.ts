import type { Verse } from "./api";

export function exportVersesAsText(verses: Verse[]): void {
    const text = verses
        .map((verse) => {
            const [chapter, verseNum] = verse.verse_key.split(":");
            return `[${chapter}:${verseNum}] ${verse.text_uthmani}`;
        })
        .join("\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quran_verses_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function copyVersesToClipboard(verses: Verse[]): Promise<boolean> {
    try {
        const text = verses
            .map((verse) => {
                const [chapter, verseNum] = verse.verse_key.split(":");
                return `[${chapter}:${verseNum}] ${verse.text_uthmani}`;
            })
            .join("\n\n");

        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return false;
    }
}

export async function shareVerses(verses: Verse[]): Promise<boolean> {
    if (!navigator.share) {
        console.warn("Web Share API not supported");
        return false;
    }

    try {
        const text = verses
            .map((verse) => {
                const [chapter, verseNum] = verse.verse_key.split(":");
                return `[${chapter}:${verseNum}] ${verse.text_uthmani}`;
            })
            .join("\n\n");

        await navigator.share({
            title: "Quran Verses",
            text: text,
        });
        return true;
    } catch (error) {
        console.error("Failed to share:", error);
        return false;
    }
}

export function copyVerseToClipboard(verseKey: string, verseText: string): Promise<boolean> {
    try {
        const text = `[${verseKey}] ${verseText}`;
        navigator.clipboard.writeText(text);
        return Promise.resolve(true);
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return Promise.resolve(false);
    }
}

export async function shareVerse(verseKey: string, verseText: string): Promise<boolean> {
    if (!navigator.share) {
        console.warn("Web Share API not supported");
        return false;
    }

    try {
        const text = `[${verseKey}] ${verseText}`;
        await navigator.share({
            title: `Quran ${verseKey}`,
            text: text,
        });
        return true;
    } catch (error) {
        console.error("Failed to share:", error);
        return false;
    }
}
