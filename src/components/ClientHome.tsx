"use client";

import { useEffect } from "react";
import { EditorInputs, EditorActions } from "@/components/EditorPanel";
import MainPreview from "@/components/MainPreview";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

export default function ClientHome() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-stone-100 flex items-start justify-center pt-14 md:pt-16">
      <div className="container mx-auto px-1.5 py-1.5 md:px-3 md:py-2">
        <div className="max-w-3xl mx-auto p-1 md:p-2 bg-white/90 backdrop-blur-xl rounded-lg md:rounded-xl border border-stone-200 shadow-2xl">

          <div className="grid grid-cols-12 gap-1.5 md:gap-2">
            <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5 md:gap-2 order-2 md:order-none">
              <EditorInputs />
              <EditorActions />
            </div>

            <div className="col-span-12 md:col-span-7 flex flex-col justify-between order-1 md:order-none">
              <MainPreview />
            </div>
          </div>

        </div>
      </div>
    </div>
    <Footer />
  </>
  );
}
