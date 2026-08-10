"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import HeroBannerCarousel from "@/components/HeroBannerCarousel";
import HorizontalScrollSection from "@/components/HorizontalScrollSection";
import Footer from "@/components/Footer";
import FestiveCalendar from "@/components/FestiveCalendar";
import BusinessHolidaySection from "@/components/BusinessHolidaySection";
import { ASSET_URLS, festivalLogoUrl, wishingCardIconUrl, businessCardIconUrl } from "@/lib/assets";

const festivalItems = [
  {
    id: "jagannathrathyatra",
    title: "Rath Yatra",
    subtitle: "Sacred chariot festival",
    gradient: "from-amber-600 via-orange-500 to-yellow-500",
    image: ASSET_URLS.rathYatraBackground,
  },
  {
    id: "nagpanchami",
    title: "Nag Panchami",
    subtitle: "Serpent worship",
    gradient: "from-green-700 via-emerald-600 to-teal-500",
    image: festivalLogoUrl("nag-punchmi-logo.png"),
  },
  {
    id: "rakshabandhan",
    title: "Raksha Bandhan",
    subtitle: "Brother-sister bond",
    gradient: "from-pink-500 via-rose-500 to-red-400",
    image: festivalLogoUrl("raksha-bandhan-logo.png"),
  },
  {
    id: "independenceday",
    title: "Independence Day",
    subtitle: "Tiranga pride theme",
    gradient: "from-orange-500 via-white to-green-500",
    image: festivalLogoUrl("independence-logo.png"),
  },
  {
    id: "janmashtami",
    title: "Janmashtami",
    subtitle: "Lord Krishna birthday",
    gradient: "from-blue-700 via-indigo-500 to-purple-400",
    image: festivalLogoUrl("janmashtami-logo.png"),
  },
  {
    id: "ganeshchaturthi",
    title: "Ganesh Chaturthi",
    subtitle: "Lord Ganesha celebration",
    gradient: "from-orange-600 via-amber-500 to-yellow-500",
    image: festivalLogoUrl("ganesh-chaturthi-logo.png"),
  },
  {
    id: "anantchaturdashi",
    title: "Anant Chaturdashi",
    subtitle: "Divine celebration",
    gradient: "from-purple-600 via-violet-500 to-fuchsia-400",
    image: festivalLogoUrl("anant-chaturdashi-logo.png"),
  },
  {
    id: "vishwakarmapuja",
    title: "Vishwakarma Puja",
    subtitle: "Worker & engineer tribute",
    gradient: "from-slate-600 via-gray-500 to-zinc-400",
    image: festivalLogoUrl("vishwakarma-puja-logo.png"),
  },
  {
    id: "navratri",
    title: "Sharad Navratri",
    subtitle: "Nine nights of devotion",
    gradient: "from-purple-500 via-pink-500 to-red-500",
    image: festivalLogoUrl("sharad-navratri-logo.png"),
  },
  {
    id: "mahasaptami",
    title: "Maha Saptami",
    subtitle: "Navratri seventh day",
    gradient: "from-indigo-600 via-blue-500 to-cyan-400",
    image: festivalLogoUrl("maha-saptami-logo.png"),
  },
  {
    id: "durgapujaashtami",
    title: "Durga Puja Ashtami",
    subtitle: "Red & gold divine theme",
    gradient: "from-red-700 via-red-500 to-orange-500",
    image: festivalLogoUrl("durga-puja-ashtami-logo.png"),
  },
  {
    id: "mahanavami",
    title: "Maha Navami",
    subtitle: "Navratri ninth day",
    gradient: "from-purple-700 via-violet-600 to-fuchsia-500",
    image: festivalLogoUrl("maha-navami-logo.png"),
  },
  {
    id: "dussehra",
    title: "Dussehra",
    subtitle: "Victory of good over evil",
    gradient: "from-red-700 via-red-600 to-orange-700",
    image: festivalLogoUrl("dussehra-logo.png"),
  },
  {
    id: "gandhijayanti",
    title: "Gandhi Jayanti",
    subtitle: "Father of the nation",
    gradient: "from-green-600 via-emerald-500 to-teal-400",
    image: festivalLogoUrl("gandhi-logo.png"),
  },
  {
    id: "maharishivalmiki",
    title: "Maharishi Valmiki",
    subtitle: "Poet saint tribute",
    gradient: "from-indigo-600 via-purple-500 to-violet-400",
    image: festivalLogoUrl("maharishi-valmiki-logo.png"),
  },
  {
    id: "karwachauth",
    title: "Karwa Chauth",
    subtitle: "Fasting for spouse",
    gradient: "from-red-500 via-pink-500 to-rose-400",
    image: festivalLogoUrl("karwa-chauth-logo.png"),
  },
  {
    id: "dhanteras",
    title: "Dhanteras",
    subtitle: "Wealth & prosperity",
    gradient: "from-yellow-600 via-amber-500 to-gold-400",
    image: festivalLogoUrl("dhanteras-logo.png"),
  },
  {
    id: "diwali",
    title: "Diwali",
    subtitle: "Festival of lights",
    gradient: "from-amber-500 via-orange-500 to-yellow-400",
    image: festivalLogoUrl("diwali-logo.png"),
  },
  {
    id: "govardhanpuja",
    title: "Govardhan Puja",
    subtitle: "Lord Krishna tribute",
    gradient: "from-blue-600 via-cyan-500 to-sky-400",
    image: festivalLogoUrl("govardhan-puja-logo.png"),
  },
  {
    id: "baidooj",
    title: "Bhai Dooj",
    subtitle: "Sibling bond festival",
    gradient: "from-pink-500 via-rose-500 to-red-400",
    image: festivalLogoUrl("bhai-dooj-logo.png"),
  },
  {
    id: "chhattpuja",
    title: "Chhath Puja",
    subtitle: "Sun god worship",
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    image: festivalLogoUrl("chhath-puja-logo.png"),
  },
  {
    id: "gurunanak",
    title: "Guru Nanak Jayanti",
    subtitle: "Sikh guru birthday",
    gradient: "from-amber-600 via-orange-500 to-red-500",
    image: festivalLogoUrl("guru-nanak-logo.png"),
  },
  {
    id: "hazaratali",
    title: "Hazarat Ali",
    subtitle: "Islamic holy day",
    gradient: "from-emerald-600 via-green-500 to-teal-400",
    image: festivalLogoUrl("hazarat-ali-logo.png"),
  },
  {
    id: "geetajayanti",
    title: "Geeta Jayanti",
    subtitle: "Divine wisdom celebration",
    gradient: "from-yellow-600 via-amber-500 to-orange-400",
    image: festivalLogoUrl("geeta-logo.png"),
  },
];

const categoryItems = [
  {
    id: "dj",
    title: "DJ",
    subtitle: "Music & nightlife",
    gradient: "from-purple-600 via-fuchsia-500 to-pink-500",
    image: businessCardIconUrl("business-card-05.png"),
  },
  {
    id: "real-estate",
    title: "Real Estate",
    subtitle: "Property & homes",
    gradient: "from-amber-600 via-orange-500 to-yellow-400",
    image: businessCardIconUrl("business-card-08.png"),
  },
  {
    id: "fashion",
    title: "Fashion",
    subtitle: "Style & retail",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    image: businessCardIconUrl("business-card-09.png"),
  },
];

const digitalCardItems = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  title: `Business Card ${i + 1}`,
  subtitle: `Business card design ${i + 1}`,
  gradient: "from-slate-700 via-slate-600 to-slate-400",
  image: businessCardIconUrl(`business-card-${String(i + 1).padStart(2, "0")}.png`),
}));

const wishingCardItems = Array.from({ length: 11 }, (_, i) => ({
  id: `w${i + 1}`,
  title: `Wishing Card ${i + 1}`,
  subtitle: `Wishing card design ${i + 1}`,
  gradient: "from-pink-500 via-rose-500 to-red-400",
  image: wishingCardIconUrl(`wishing-card-${String(i + 1).padStart(2, "0")}.png`),
}));

interface HomeLogo {
  slug: string;
  src: string;
}

function normalizeLogoSlug(name: string): string {
  return name.toLowerCase().replace(/-logo$/, "").replace(/[-\s]/g, "");
}

export default function HomePage() {
  const router = useRouter();
  const [resolvedItems, setResolvedItems] = useState(festivalItems);

  useEffect(() => {
    fetch("/api/festival-logos/home")
      .then((res) => res.json())
      .then((data: HomeLogo[]) => {
        const map: Record<string, string> = {};
        data.forEach((logo) => {
          map[normalizeLogoSlug(logo.slug)] = logo.src;
        });
        setResolvedItems(
          festivalItems.map((item) => {
            const matchedSrc = map[normalizeLogoSlug(item.id)];
            return matchedSrc ? { ...item, image: matchedSrc } : item;
          })
        );
      })
      .catch(() => {});
  }, []);

  const handleFestivalClick = (id: string) => {
    router.push(`/templates/${id}`);
  };

  return (
    <div className="min-h-screen text-on-surface" style={{ backgroundColor: "#ffffff" }}>
      <NavBar />
      
      <HeroBannerCarousel />

      <FestiveCalendar />

      <HorizontalScrollSection 
        title="Festival Templates" 
        items={resolvedItems} 
        onItemClick={handleFestivalClick}
      />

      <HorizontalScrollSection 
        title="Wishing Cards" 
        items={wishingCardItems} 
        onItemClick={handleFestivalClick}
        itemAspect="aspect-[4/5]"
        imageStyle="full"
      />

      <HorizontalScrollSection 
        title="Digital Business Cards" 
        items={digitalCardItems} 
        onItemClick={handleFestivalClick}
        itemAspect="aspect-[7/4]"
        imageStyle="full"
      />

      <HorizontalScrollSection 
        title="Business Categories" 
        items={categoryItems} 
        onItemClick={handleFestivalClick}
        imageStyle="full"
      />

      <BusinessHolidaySection />

      <Footer />
    </div>
  );
}
