"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Annotation } from "@/lib/supabase/types";

export function useStudentAnnotations(studentId: string | undefined, currentPage: number) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const loadAnnotations = useCallback(async () => {
    if (!studentId) return;
    const supabase = createClient();
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

  const addAnnotation = useCallback(
    async (annotation: {
      verseKey: string;
      text: string;
      startOffset: number;
      endOffset: number;
      comment: string;
      isTemporary: boolean;
    }) => {
      if (!studentId) return false;
      const supabase = createClient();
      const { error } = await supabase.from("annotations").insert({
        student_id: studentId,
        page_number: currentPage,
        verse_key: annotation.verseKey,
        start_offset: annotation.startOffset,
        end_offset: annotation.endOffset,
        comment: annotation.comment.trim() || null,
        color: annotation.isTemporary ? "#eab308" : "#ef4444",
        is_temporary: annotation.isTemporary,
      });
      if (!error) await loadAnnotations();
      return !error;
    },
    [studentId, currentPage, loadAnnotations]
  );

  const deleteAnnotation = useCallback(
    async (id: string) => {
      if (!studentId) return;
      const supabase = createClient();
      await supabase.from("annotations").delete().eq("id", id);
      await loadAnnotations();
    },
    [studentId, loadAnnotations]
  );

  const clearTemporaryAnnotations = useCallback(async () => {
    if (!studentId) return;
    const supabase = createClient();
    await supabase
      .from("annotations")
      .delete()
      .eq("student_id", studentId)
      .eq("page_number", currentPage)
      .eq("is_temporary", true);
    await loadAnnotations();
  }, [studentId, currentPage, loadAnnotations]);

  return {
    annotations,
    loadAnnotations,
    addAnnotation,
    deleteAnnotation,
    clearTemporaryAnnotations,
  };
}
