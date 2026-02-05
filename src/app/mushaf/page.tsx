import Header from "@/components/layout/Header";
import MushafViewer from "@/components/mushaf/MushafViewer";

export const metadata = {
  title: "المصحف التفاعلي | Interactive Mushaf",
};

export default function MushafPage() {
  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen">
        <MushafViewer />
      </main>
    </>
  );
}
