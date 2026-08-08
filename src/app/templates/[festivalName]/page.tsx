"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

interface FestivalTemplate {
  id: number;
  image: string;
  mapping: string;
  canvas_dim: { w: number; h: number };
}

interface FestivalData {
  label: string;
  templateCount: number;
  templates: FestivalTemplate[];
}

const FESTIVAL_INFO: Record<string, { label: string; bgClass: string; textClass: string; iconBg: string; accentColor: string }> = {
  anantchaturdashi: { label: "Anant Chaturdashi", bgClass: "bg-gradient-to-br from-purple-100 to-violet-100", textClass: "text-purple-800", iconBg: "bg-purple-200", accentColor: "purple" },
  baidooj: { label: "Bhai Dooj", bgClass: "bg-gradient-to-br from-pink-100 to-rose-100", textClass: "text-pink-800", iconBg: "bg-pink-200", accentColor: "pink" },
  chhattpuja: { label: "Chhath Puja", bgClass: "bg-gradient-to-br from-orange-100 to-amber-100", textClass: "text-orange-800", iconBg: "bg-orange-200", accentColor: "orange" },
  dhanteras: { label: "Dhanteras", bgClass: "bg-gradient-to-br from-yellow-100 to-amber-100", textClass: "text-yellow-800", iconBg: "bg-yellow-200", accentColor: "yellow" },
  diwali: { label: "Diwali", bgClass: "bg-gradient-to-br from-amber-100 to-orange-100", textClass: "text-amber-800", iconBg: "bg-amber-200", accentColor: "amber" },
  durgapujaashtami: { label: "Durga Puja Ashtami", bgClass: "bg-gradient-to-br from-red-100 to-orange-100", textClass: "text-red-800", iconBg: "bg-red-200", accentColor: "red" },
  dussehra: { label: "Dussehra", bgClass: "bg-gradient-to-br from-red-100 to-orange-100", textClass: "text-red-800", iconBg: "bg-red-200", accentColor: "red" },
  gandhijayanti: { label: "Gandhi Jayanti", bgClass: "bg-gradient-to-br from-green-100 to-emerald-100", textClass: "text-green-800", iconBg: "bg-green-200", accentColor: "green" },
  ganeshchaturthi: { label: "Ganesh Chaturthi", bgClass: "bg-gradient-to-br from-orange-100 to-yellow-100", textClass: "text-orange-800", iconBg: "bg-orange-200", accentColor: "orange" },
  geetajayanti: { label: "Geeta Jayanti", bgClass: "bg-gradient-to-br from-yellow-100 to-amber-100", textClass: "text-yellow-800", iconBg: "bg-yellow-200", accentColor: "yellow" },
  govardhanpuja: { label: "Govardhan Puja", bgClass: "bg-gradient-to-br from-blue-100 to-cyan-100", textClass: "text-blue-800", iconBg: "bg-blue-200", accentColor: "blue" },
  gurunanak: { label: "Guru Nanak Jayanti", bgClass: "bg-gradient-to-br from-amber-100 to-orange-100", textClass: "text-amber-800", iconBg: "bg-amber-200", accentColor: "amber" },
  hazaratali: { label: "Hazarat Ali", bgClass: "bg-gradient-to-br from-emerald-100 to-teal-100", textClass: "text-emerald-800", iconBg: "bg-emerald-200", accentColor: "emerald" },
  independenceday: { label: "Independence Day", bgClass: "bg-gradient-to-br from-orange-100 via-white to-green-100", textClass: "text-orange-800", iconBg: "bg-orange-200", accentColor: "orange" },
  jagannathrathyatra: { label: "Jagannath Rath Yatra", bgClass: "bg-gradient-to-br from-amber-100 to-orange-100", textClass: "text-amber-800", iconBg: "bg-amber-200", accentColor: "amber" },
  janmashtami: { label: "Janmashtami", bgClass: "bg-gradient-to-br from-blue-100 to-purple-100", textClass: "text-blue-800", iconBg: "bg-blue-200", accentColor: "blue" },
  karwachauth: { label: "Karwa Chauth", bgClass: "bg-gradient-to-br from-red-100 to-pink-100", textClass: "text-red-800", iconBg: "bg-red-200", accentColor: "red" },
  mahanavami: { label: "Maha Navami", bgClass: "bg-gradient-to-br from-purple-100 to-violet-100", textClass: "text-purple-800", iconBg: "bg-purple-200", accentColor: "purple" },
  mahasaptami: { label: "Maha Saptami", bgClass: "bg-gradient-to-br from-indigo-100 to-blue-100", textClass: "text-indigo-800", iconBg: "bg-indigo-200", accentColor: "indigo" },
  maharishivalmiki: { label: "Maharishi Valmiki", bgClass: "bg-gradient-to-br from-indigo-100 to-purple-100", textClass: "text-indigo-800", iconBg: "bg-indigo-200", accentColor: "indigo" },
  nagpanchami: { label: "Nag Panchami", bgClass: "bg-gradient-to-br from-green-100 to-emerald-100", textClass: "text-green-800", iconBg: "bg-green-200", accentColor: "green" },
  navratri: { label: "Sharad Navratri", bgClass: "bg-gradient-to-br from-purple-100 to-pink-100", textClass: "text-purple-800", iconBg: "bg-purple-200", accentColor: "purple" },
  rakshabandhan: { label: "Raksha Bandhan", bgClass: "bg-gradient-to-br from-pink-100 to-rose-100", textClass: "text-pink-800", iconBg: "bg-pink-200", accentColor: "pink" },
  vishwakarmapuja: { label: "Vishwakarma Puja", bgClass: "bg-gradient-to-br from-slate-100 to-gray-100", textClass: "text-slate-800", iconBg: "bg-slate-200", accentColor: "slate" },
  gurupurnima: { label: "Guru Purnima", bgClass: "bg-gradient-to-br from-amber-100 to-yellow-100", textClass: "text-amber-800", iconBg: "bg-amber-200", accentColor: "amber" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: i * 0.04, ease: "easeOut" as const },
  }),
};

interface TemplatesPageProps {
  params: Promise<{ festivalName: string }>;
}

export default function TemplatesPage({ params }: TemplatesPageProps) {
  const { festivalName: rawFestivalName } = use(params);
  const festivalName = rawFestivalName.toLowerCase();
  const router = useRouter();
  const [festivalsData, setFestivalsData] = useState<Record<string, FestivalData> | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((res) => res.json())
      .then((data: { festivals: Record<string, FestivalData> }) => setFestivalsData(data.festivals))
      .catch(() => setFestivalsData(null));
  }, []);

  const festivalInfo = FESTIVAL_INFO[festivalName] || {
    label: festivalName.charAt(0).toUpperCase() + festivalName.slice(1),
    bgClass: "bg-gradient-to-br from-stone-100 to-stone-200",
    textClass: "text-stone-800",
    iconBg: "bg-stone-200",
    accentColor: "stone"
  };

  const festivalData = festivalsData?.[festivalName];
  const templates = festivalData?.templates || [];
  const hasRealTemplates = templates.length > 0;

  const handleTemplateSelect = (templateId: number) => {
    router.push(`/festival/${festivalName}?template=${templateId}`);
  };

  if (festivalsData === null) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-6xl mx-auto px-4 py-8 pt-20 flex items-center justify-center">
          <div className="animate-pulse text-stone-400">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (hasRealTemplates) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background pb-24"
      >
        <NavBar />
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-6xl mx-auto px-4 py-8 pt-20"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {templates.map((t, i) => {
              const templateId = i + 1;
              return (
                <motion.button
                  key={t.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTemplateSelect(templateId)}
                  className="aspect-[3/4] rounded-2xl cursor-pointer border-2 border-stone-200 hover:border-stone-300 overflow-hidden shadow-sm hover:shadow-xl transition-shadow relative"
                >
                  <Image
                    src={t.image}
                    alt={`Template ${templateId}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    loading="lazy"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="text-sm font-medium text-white font-body">Post {templateId}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.main>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-24"
    >
      <NavBar />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-6xl mx-auto px-4 py-8 pt-20 flex flex-col items-center justify-center min-h-[60vh]"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`w-24 h-24 md:w-32 md:h-32 rounded-full ${festivalInfo.iconBg} flex items-center justify-center mb-6`}
        >
          <Clock className={`w-12 h-12 md:w-16 md:h-16 ${festivalInfo.textClass}`} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`text-2xl md:text-4xl font-bold ${festivalInfo.textClass} mb-3 text-center`}
        >
          {festivalInfo.label}
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex items-center gap-2 mb-4"
        >
          <Sparkles className={`w-5 h-5 ${festivalInfo.textClass}`} />
          <span className="text-lg md:text-xl font-semibold text-stone-600">Coming Soon</span>
          <Sparkles className={`w-5 h-5 ${festivalInfo.textClass}`} />
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-stone-500 text-center max-w-md text-sm md:text-base"
        >
          Beautiful templates for {festivalInfo.label} are being crafted. Check back soon!
        </motion.p>
      </motion.main>
      <Footer />
    </motion.div>
  );
}
