"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import festivalDates from "../../festival-dates.json";
import type { Festival } from "@/types/festival";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MIN_YEAR = 2026;
const MAX_YEAR = 2099;
const PREVIEW_DAYS = 15;

interface CalendarLogo {
  date: string;
  src: string;
}

const FESTIVAL_SLUGS: Record<string, string> = {
  diwali: "diwali",
  deepavali: "diwali",
  "naraka chaturdashi": "diwali",
  holi: "holi",
  dussehra: "dussehra",
  vijayadashami: "dussehra",
  navratri: "navratri",
  "ganesh chaturthi": "ganeshchaturthi",
  "ganesh chaturth": "ganeshchaturthi",
  "raksha bandhan": "rakshabandhan",
  janmashtami: "janmashtami",
  "durga puja": "durgapuja",
  "maha navami": "mahanavami",
  "maha saptami": "mahasaptami",
  "durga puja ashtami": "durgapujaashtami",
  chhath: "chhathpuja",
  dhanteras: "dhanteras",
  "bhakti divas": "diwali",
  "mahashivratri": "mahashivratri",
  "shivaratri": "mahashivratri",
  "rama navami": "rama_navami",
  ramnavami: "rama_navami",
  eid: "eid",
  "eid al-fitr": "eidalfitr",
  "eid al-adha": "idulzuha",
  "bakrid": "idulzuha",
  christmas: "christmas",
  "christmas eve": "christmaseve",
  "christmas day": "christmas",
  "new year": "diwali",
  vishu: "vishu",
  onam: "onam",
  pongal: "pongal",
  lohri: "chetichand",
  "makar sankranti": "tamilnewyear",
  baisakhi: "baisakhi",
  vaisakhi: "vaisakhi",
  easter: "eastersunday",
  "good friday": "goodfriday",
  guru: "gurupurnima",
  "guru purnima": "gurupurnima",
  "guru nanak": "gurunanakjayanti",
  teesi: "chetichand",
  mahalaya: "mahalayaamavasya",
  jagannath: "jagannathrathyatra",
  jain: "mahavirjayanti",
  mahavir: "mahavirjayanti",
  buddha: "buddapurnima",
  "buddha purnima": "buddapurnima",
  parsi: "parsinewyear",
  "parsi new year": "parsinewyear",
  "ganga dussehra": "gangadussehra",
  hanuman: "hanumanjayanti",
  nag: "nagpanchami",
  hariyali: "hariyaliteej",
  chakra: "anantchaturdashi",
  anant: "anantchaturdashi",
  bohg: "bohagbihu",
  bengali: "bengalinewyear",
  cheti: "chetichand",
  ugadi: "ugadi",
  "papmochani ekadashi": "papmochaniekadashi",
  "gudi padwa": "gudipadwa",
  "cheti chand": "chetichand",
  "jhulelal jayanti": "jhulelaljayanti",
  "mahavir jayanti": "mahavirjayanti",
  "hanuman jayanti": "hanumanjayanti",
  "eid al-fitr (tentative)": "eidalfitr",
  "id-ul-zuha (bakrid) (tentative)": "idulzuha",
  "hariyali teej / independence day": "independenceday",
  "mahatma gandhi jayanti": "mahatmagandhijayanti",
  "mahalaya amavasya": "mahalayaamavasya",
  "sharad navratri begins": "sharadnavratri",
  "karwa chauth": "karwachauth",
  "maharishi valmiki jayanti": "maharishivalmikijayanti",
  "govardhan puja": "govardhanpuja",
  "bhai dooj": "bhaidooj",
  "guru nanak jayanti / kartik purnima": "gurunanakjayanti",
  "geeta jayanti": "geetajayanti",
  "hazarat ali's birthday": "hazrat ali",
  "akshaya tritiya": "akshayatritiya",
  "vishwakarma puja": "vishwakarmapuja",
  "anant chaturdashi": "anantchaturdashi",
  "id-e-milad (tentative)": "idemilad",
  "muharram (tentative)": "muharram",
  "tamil new year": "tamilnewyear",
};

const FESTIVAL_COLORS: Record<string, { bgClass: string; textClass: string; icon: string }> = {
  diwali: { bgClass: "bg-amber-200", textClass: "text-amber-800", icon: "lightbulb" },
  holi: { bgClass: "bg-pink-200", textClass: "text-pink-800", icon: "palette" },
  dussehra: { bgClass: "bg-red-200", textClass: "text-red-800", icon: "shield" },
  navratri: { bgClass: "bg-purple-200", textClass: "text-purple-800", icon: "celebration" },
  eid: { bgClass: "bg-emerald-200", textClass: "text-emerald-800", icon: "moon" },
  christmas: { bgClass: "bg-green-200", textClass: "text-green-800", icon: "forest" },
  ganeshchaturthi: { bgClass: "bg-teal-200", textClass: "text-teal-800", icon: "spa" },
  janmashtami: { bgClass: "bg-violet-200", textClass: "text-violet-800", icon: "baby_changing_station" },
  rakshabandhan: { bgClass: "bg-rose-200", textClass: "text-rose-800", icon: "celebration" },
  durgapuja: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "shield" },

  rama_navami: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "lightbulb" },
  onam: { bgClass: "bg-yellow-200", textClass: "text-yellow-800", icon: "local_florist" },
  sankranti: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "wb_sunny" },
  mahashivratri: { bgClass: "bg-slate-200", textClass: "text-slate-800", icon: "nightlight" },
  basant: { bgClass: "bg-yellow-200", textClass: "text-yellow-800", icon: "eco" },
  lohri: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "local_fire_department" },
  pongal: { bgClass: "bg-yellow-200", textClass: "text-yellow-800", icon: "rice_bowl" },
  bihu: { bgClass: "bg-green-200", textClass: "text-green-800", icon: "grass" },
  ugadi: { bgClass: "bg-teal-200", textClass: "text-teal-800", icon: "flag" },
  vizu: { bgClass: "bg-blue-200", textClass: "text-blue-800", icon: "water" },
  guru: { bgClass: "bg-cyan-200", textClass: "text-cyan-800", icon: "school" },
  jain: { bgClass: "bg-stone-200", textClass: "text-stone-800", icon: "self_improvement" },
  buddha: { bgClass: "bg-emerald-200", textClass: "text-emerald-800", icon: "peace" },
  parsii: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "fireplace" },
  pare: { bgClass: "bg-teal-200", textClass: "text-teal-800", icon: "water_drop" },
  karwa: { bgClass: "bg-pink-200", textClass: "text-pink-800", icon: "nightlife" },
  mahalaya: { bgClass: "bg-indigo-200", textClass: "text-indigo-800", icon: "dark_mode" },
  default: { bgClass: "bg-orange-200", textClass: "text-orange-800", icon: "stars" },
};

function getFestivalSlug(festivalName: string): string | null {
  const lower = festivalName.toLowerCase();
  for (const key of Object.keys(FESTIVAL_SLUGS)) {
    if (lower.includes(key)) {
      return FESTIVAL_SLUGS[key];
    }
  }
  return null;
}

function getFestivalColor(slug: string | null) {
  if (slug && FESTIVAL_COLORS[slug]) {
    return FESTIVAL_COLORS[slug];
  }
  return FESTIVAL_COLORS.default;
}

function parseDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getOccasions(title: string): string[] {
  return title.split("/").map((occasion) => occasion.trim()).filter(Boolean);
}

function getFestivalsForDate(festivals: Festival[], year: number, month: number, day: number): Festival[] {
  return festivals.filter(f => {
    const fd = parseDate(f.date);
    return fd.getDate() === day && fd.getMonth() === month && fd.getFullYear() === year;
  });
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date();
  return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
}



export default function FestiveCalendar() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [calendarLogos, setCalendarLogos] = useState<Record<string, string>>({});
  const beltRef = useRef<HTMLDivElement>(null);

  const festivals: Festival[] = festivalDates as Festival[];

  useEffect(() => {
    fetch("/api/festival-logos/calendar")
      .then((res) => res.json())
      .then((data: CalendarLogo[]) => {
        const map: Record<string, string> = {};
        data.forEach((logo) => {
          map[logo.date] = logo.src;
        });
        setCalendarLogos(map);
      })
      .catch(() => setCalendarLogos({}));
  }, []);

  const nextMonth = (selectedMonth + 1) % 12;
  const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;

  const beltDays = useMemo(() => {
    const daysInCurrentMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const extraDays = Math.min(PREVIEW_DAYS, daysInNextMonth);

    const days: { day: number; month: number; year: number; festivals: Festival[]; isToday: boolean }[] = [];

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: selectedMonth,
        year: selectedYear,
        festivals: getFestivalsForDate(festivals, selectedYear, selectedMonth, i),
        isToday: isToday(selectedYear, selectedMonth, i),
      });
    }

    for (let i = 1; i <= extraDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        festivals: getFestivalsForDate(festivals, nextYear, nextMonth, i),
        isToday: isToday(nextYear, nextMonth, i),
      });
    }

    return days;
  }, [selectedMonth, selectedYear, festivals, nextMonth, nextYear]);

  useEffect(() => {
    const today = new Date();
    if (selectedMonth === today.getMonth() && selectedYear === today.getFullYear()) {
      setSelectedDay(today.getDate());
    } else {
      setSelectedDay(beltDays.length > 0 ? 1 : null);
    }
  }, [selectedMonth, selectedYear, beltDays.length]);

  useEffect(() => {
    if (selectedDay && beltRef.current) {
      const child = beltRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDay]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      if (selectedYear > MIN_YEAR) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      }
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      if (selectedYear < MAX_YEAR) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      }
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    if (selectedYear > MIN_YEAR) {
      setSelectedYear(prev => prev - 1);
    }
  };

  const handleNextYear = () => {
    if (selectedYear < MAX_YEAR) {
      setSelectedYear(prev => prev + 1);
    }
  };

  const canGoPrev = selectedYear > MIN_YEAR || selectedMonth > 0;
  const canGoNext = selectedYear < MAX_YEAR || selectedMonth < 11;

  const handleDayClick = (day: number, month: number, year: number) => {
    setSelectedDay(day);
    if (month !== selectedMonth || year !== selectedYear) {
      setSelectedMonth(month);
      setSelectedYear(year);
    }
  };

  const handleFestivalClick = (occasion: string) => {
    const slug = getFestivalSlug(occasion);
    if (slug) {
      router.push(`/templates/${slug}`);
    } else {
      const fallbackSlug = occasion.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/ /g, "");
      router.push(`/templates/${fallbackSlug}`);
    }
  };

  const scrollBelt = (direction: "left" | "right") => {
    if (beltRef.current) {
      beltRef.current.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const selectedDayFestivals = selectedDay
    ? beltDays.find(d => d.day === selectedDay && d.month === selectedMonth && d.year === selectedYear)?.festivals || []
    : [];

  const getDayLogoSrc = (day: number, month: number, year: number): string | null => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarLogos[key] ?? null;
  };

  return (
    <section id="festival-calendar-section" className="px-4 md:px-8 lg:px-20 py-6 md:py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-3 md:gap-4 mb-8">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevYear}
              disabled={selectedYear <= MIN_YEAR}
              className="text-sm md:text-base font-bold text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              «
            </button>
            <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight text-stone-800 text-center min-w-[160px] md:min-w-[220px]">
              {MONTHS[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={handleNextYear}
              disabled={selectedYear >= MAX_YEAR}
              className="text-sm md:text-base font-bold text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-stone-300 bg-white hover:bg-stone-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-600" />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => scrollBelt("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent flex items-center justify-start"
          >
            <ChevronLeft className="w-5 h-5 text-stone-400" />
          </button>

          <div
            ref={beltRef}
            className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {beltDays.map(({ day, month, year, festivals: dayFests, isToday }) => {
              const logoSrc = getDayLogoSrc(day, month, year);
              const isSelected = selectedDay === day && selectedMonth === month && selectedYear === year;
              const isFromNextMonth = month !== selectedMonth || year !== selectedYear;

              return (
                <button
                  key={`${year}-${month}-${day}`}
                  data-day={day}
                  onClick={() => handleDayClick(day, month, year)}
                  className={`flex-shrink-0 w-20 h-24 md:w-24 md:h-28 rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : isToday
                        ? "border-primary/50 bg-white shadow-sm"
                        : isFromNextMonth
                          ? "border-stone-200/60 bg-white/70"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                  }`}
                >
                  {logoSrc && (
                    <Image
                      src={logoSrc}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 6rem, 5rem"
                      loading="lazy"
                      className="object-cover blur-[1px] opacity-40"
                    />
                  )}
                  <span
                    className={`relative z-10 font-bold text-xl md:text-2xl ${
                      isSelected ? "text-primary" : "text-stone-800"
                    }`}
                  >
                    {day}
                  </span>
                  {dayFests.length > 0 && (
                    <span className="relative z-10 mt-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollBelt("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent flex items-center justify-end"
          >
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {selectedDayFestivals.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {selectedDayFestivals.map((festival, index) =>
              getOccasions(festival.title).map((occasion, occasionIndex) => {
                const slug = getFestivalSlug(occasion);
                const colors = getFestivalColor(slug);
                return (
                  <button
                    key={`${index}-${occasionIndex}`}
                    onClick={() => handleFestivalClick(occasion)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${colors.bgClass} ${colors.textClass} hover:scale-105 transition-all`}
                  >
                    {occasion}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
