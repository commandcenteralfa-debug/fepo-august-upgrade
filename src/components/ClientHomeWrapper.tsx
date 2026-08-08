"use client";

import { FestivalType } from "@/types/design";
import { DesignProvider } from "@/context/DesignContext";
import ClientHome from "@/components/ClientHome";

interface ClientHomeWrapperProps {
  initialFestival: FestivalType;
  initialTemplateIndex?: number;
}

export default function ClientHomeWrapper({ initialFestival, initialTemplateIndex }: ClientHomeWrapperProps) {
  return (
    <DesignProvider initialFestival={initialFestival} initialTemplateIndex={initialTemplateIndex}>
      <ClientHome />
    </DesignProvider>
  );
}
