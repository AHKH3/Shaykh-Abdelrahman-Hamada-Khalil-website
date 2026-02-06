"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  SkipBack,
  SkipForward,
  Image as ImageIcon,
  FileText,
  Trash2,
  ArrowRight,
  MessageSquare,
  Eraser,
  Highlighter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { getVersesByPage, getChapters, TOTAL_PAGES, type Verse, type Chapter } from "@/lib/quran/api";
import type { Student, Annotation } from "@/lib/supabase/types";
import Header from "@/components/layout/Header";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

type AnnotationMode = "permanent" | "temporary";

export default function StudentMushafPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const mushafRef = useRef<HTMLDivElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>("permanent");
  const [showAnnotationPopup, setShowAnnotationPopup] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{
    verseKey: string;
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [exporting, setExporting] = useState(false);

  const supabase = createClient();

  // Load student info
  useEffect(() => {
    const loadStudent = async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      if (data) setStudent(data);
      else router.push("/mushaf/students");
    };
    loadStudent();
  }, [studentId]);

  // Load chapters
  useEffect(() => {
    getChapters(locale === "ar" ? "ar" : "en").then(setChapters).catch(console.error);
  }, [locale]);

  // Load verses
  useEffect(() => {
    setLoading(true);
    getVersesByPage(currentPage)
      .then((data) => setVerses(data.verses))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPage]);

  // Load annotations for current page
  const loadAnnotations = useCallback(async () => {
    const { data } = await supabase
      .from("annotations")
      .select("*")
      .eq("student_id", studentId)
      .eq("page_number", currentPage);
    setAnnotations(data || []);
  }, [studentId, currentPage]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      setCurrentPage(page);
    }
  };

  // Handle text selection for annotation
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Find the verse element
    let verseElement = container.parentElement;
    while (verseElement && !verseElement.dataset.verseKey) {
      verseElement = verseElement.parentElement;
    }
    if (!verseElement) return;

    const verseKey = verseElement.dataset.verseKey!;
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    setPendingAnnotation({
      verseKey,
      text: selectedText,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
    setShowAnnotationPopup(true);
  };

  const saveAnnotation = async () => {
    if (!pendingAnnotation) return;

    await supabase.from("annotations").insert({
      student_id: studentId,
      page_number: currentPage,
      verse_key: pendingAnnotation.verseKey,
      start_offset: pendingAnnotation.startOffset,
      end_offset: pendingAnnotation.endOffset,
      comment: commentText.trim() || null,
      color: annotationMode === "permanent" ? "#ef4444" : "#eab308",
      is_temporary: annotationMode === "temporary",
    });

    setShowAnnotationPopup(false);
    setPendingAnnotation(null);
    setCommentText("");
    window.getSelection()?.removeAllRanges();
    loadAnnotations();
  };

  const deleteAnnotation = async (id: string) => {
    await supabase.from("annotations").delete().eq("id", id);
    loadAnnotations();
  };

  const clearTemporaryAnnotations = async () => {
    await supabase
      .from("annotations")
      .delete()
      .eq("student_id", studentId)
      .eq("page_number", currentPage)
      .eq("is_temporary", true);
    loadAnnotations();
  };

  // Export as image
  const exportAsImage = async () => {
    if (!mushafRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(mushafRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `${student?.name || "mushaf"}-page-${currentPage}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // Export as PDF
  const exportAsPdf = async () => {
    if (!mushafRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(mushafRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${student?.name || "mushaf"}-page-${currentPage}.pdf`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  // Build annotated text
  const getAnnotatedText = (verse: Verse) => {
    const verseAnnotations = annotations.filter(
      (a) => a.verse_key === verse.verse_key
    );
    if (verseAnnotations.length === 0) return verse.text_uthmani;

    // Simple approach: wrap entire verse if annotated
    const hasAnnotation = verseAnnotations.length > 0;
    if (hasAnnotation) {
      const annotation = verseAnnotations[0];
      return `<span class="${
        annotation.is_temporary ? "annotation-temporary" : "annotation-permanent"
      }" title="${annotation.comment || ""}">${verse.text_uthmani}</span>`;
    }
    return verse.text_uthmani;
  };

  // Group verses by surah
  const groupedVerses: Array<{ chapterId: number; chapterName: string; verses: Verse[] }> = [];
  verses.forEach((verse) => {
    const last = groupedVerses[groupedVerses.length - 1];
    if (last && last.chapterId === verse.chapter_id) {
      last.verses.push(verse);
    } else {
      const chapter = chapters.find((c) => c.id === verse.chapter_id);
      groupedVerses.push({
        chapterId: verse.chapter_id,
        chapterName: chapter?.name_arabic || `سورة ${verse.chapter_id}`,
        verses: [verse],
      });
    }
  });

  const pageAnnotations = annotations.filter((a) => a.page_number === currentPage);

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/mushaf/students")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowRight size={16} />
            </button>
            <span className="text-sm font-medium">
              {student?.name || "..."} — {t.mushaf.page} {currentPage}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {/* Annotation Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 me-2">
              <button
                onClick={() => setAnnotationMode("permanent")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  annotationMode === "permanent"
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Highlighter size={12} />
                {t.mushaf.permanent}
              </button>
              <button
                onClick={() => setAnnotationMode("temporary")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  annotationMode === "temporary"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Highlighter size={12} />
                {t.mushaf.temporary}
              </button>
            </div>

            <button
              onClick={clearTemporaryAnnotations}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t.mushaf.clearTemporary}
            >
              <Eraser size={16} />
            </button>
            <button
              onClick={exportAsImage}
              disabled={exporting}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t.mushaf.exportImage}
            >
              <ImageIcon size={16} />
            </button>
            <button
              onClick={exportAsPdf}
              disabled={exporting}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={t.mushaf.exportPdf}
            >
              <FileText size={16} />
            </button>
          </div>
        </div>

        {/* Mushaf Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
              </div>
            ) : (
              <div
                ref={mushafRef}
                className="bg-white dark:bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm"
                onMouseUp={handleTextSelection}
              >
                {/* Student Name Header */}
                <div className="text-center mb-4 pb-3 border-b border-border/50">
                  <p className="text-sm text-muted-foreground">
                    {student?.name} — {t.mushaf.page} {currentPage}
                  </p>
                </div>

                {/* Verses */}
                <div className="quran-text text-center leading-[2.5]" dir="rtl">
                  {groupedVerses.map((group, gi) => (
                    <div key={gi}>
                      {group.verses[0].verse_number === 1 && (
                        <div className="my-8 text-center">
                          <div className="inline-block px-12 py-3 bg-muted/50 rounded-2xl border border-border/50">
                            <h3 className="text-xl font-bold font-['Amiri',serif] text-foreground">
                              {group.chapterName}
                            </h3>
                          </div>
                          {group.chapterId !== 9 && group.chapterId !== 1 && (
                            <p className="mt-4 text-lg font-['Amiri',serif] text-muted-foreground">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                          )}
                        </div>
                      )}

                      {group.verses.map((verse) => (
                        <span
                          key={verse.verse_key}
                          data-verse-key={verse.verse_key}
                          className="cursor-text inline"
                          dangerouslySetInnerHTML={{
                            __html: `${getAnnotatedText(verse)} <span class="inline-flex items-center justify-center text-xs text-muted-foreground font-sans mx-1 min-w-[1.5rem]">﴿${verse.verse_number.toLocaleString("ar-EG")}﴾</span> `,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Annotations List */}
                {pageAnnotations.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <MessageSquare size={12} />
                      {t.mushaf.annotations} ({pageAnnotations.length})
                    </h4>
                    <div className="space-y-2">
                      {pageAnnotations.map((ann) => (
                        <div
                          key={ann.id}
                          className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                            ann.is_temporary ? "bg-yellow-50 dark:bg-yellow-950/20" : "bg-red-50 dark:bg-red-950/20"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                              ann.is_temporary ? "bg-yellow-500" : "bg-red-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-muted-foreground">{ann.verse_key}</p>
                            {ann.comment && (
                              <p className="text-foreground mt-0.5">{ann.comment}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteAnnotation(ann.id)}
                            className="p-1 rounded hover:bg-black/10 shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
          >
            <SkipBack size={14} />
            {t.mushaf.prevPage}
          </button>
          <span className="text-sm">{currentPage} / {TOTAL_PAGES}</span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= TOTAL_PAGES}
            className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
          >
            {t.mushaf.nextPage}
            <SkipForward size={14} />
          </button>
        </div>

        {/* Annotation Comment Popup */}
        <AnimatePresence>
          {showAnnotationPopup && pendingAnnotation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
              onClick={() => {
                setShowAnnotationPopup(false);
                setPendingAnnotation(null);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold font-['Amiri',serif] mb-2">
                  {t.mushaf.addAnnotation}
                </h3>
                <p className="text-xs text-muted-foreground mb-1">
                  {pendingAnnotation.verseKey}
                </p>
                <p className="text-sm font-['Amiri',serif] mb-4 p-2 bg-muted rounded-lg" dir="rtl">
                  &ldquo;{pendingAnnotation.text}&rdquo;
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-muted-foreground">{locale === "ar" ? "النوع:" : "Type:"}</span>
                  <button
                    onClick={() => setAnnotationMode("permanent")}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      annotationMode === "permanent"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.mushaf.permanent}
                  </button>
                  <button
                    onClick={() => setAnnotationMode("temporary")}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      annotationMode === "temporary"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.mushaf.temporary}
                  </button>
                </div>

                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`${t.mushaf.comment} (${locale === "ar" ? "اختياري" : "optional"})`}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none h-20 mb-4"
                  dir="rtl"
                />

                <div className="flex gap-2">
                  <button
                    onClick={saveAnnotation}
                    className="flex-1 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {t.mushaf.saveComment}
                  </button>
                  <button
                    onClick={() => {
                      setShowAnnotationPopup(false);
                      setPendingAnnotation(null);
                    }}
                    className="px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    {t.common.close}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
