"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import MushafViewer from "@/components/mushaf/MushafViewer";
import { createClient } from "@/lib/supabase/client";

export default function SharedMushafPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [isValidStudent, setIsValidStudent] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStudent = async () => {
      // In sharing mode, we might just use anon API key for read-only access
      const supabase = createClient();
      const { count } = await supabase
        .from("students")
        .select("*", { count: 'exact', head: true })
        .eq("id", studentId);
      
      setIsValidStudent(count === 1);
      
      if (count === 0) {
        router.push("/mushaf");
      }
    };
    checkStudent();
  }, [studentId, router]);

  if (isValidStudent === null) {
    return (
      <>
        <Header />
        <main className="pt-[var(--header-height)] min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-[var(--header-height)] min-h-screen flex flex-col">
        {/* Pass studentId and readOnly=true so guests can see annotations but not edit */}
        <MushafViewer studentId={studentId} readOnly={true} />
      </main>
    </>
  );
}
