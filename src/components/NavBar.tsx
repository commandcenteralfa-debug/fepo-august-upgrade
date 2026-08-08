"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Gift, Briefcase, Heart, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import festivalDates from "../../festival-dates.json";
import type { Festival } from "@/types/festival";

const FESTIVAL_SLUGS: Record<string, string> = {
  diwali: "diwali", deepavali: "diwali", "naraka chaturdashi": "diwali", holi: "holi", dussehra: "dussehra", vijayadashami: "dussehra", navratri: "navratri",
  "ganesh chaturthi": "ganeshchaturthi", "ganesh chaturth": "ganeshchaturthi", "raksha bandhan": "rakshabandhan", janmashtami: "janmashtami",
  "durga puja": "durgapuja", "maha navami": "mahanavami", "maha saptami": "mahasaptami", "durga puja ashtami": "durgapujaashtami",
  chhath: "chhathpuja", dhanteras: "dhanteras", "bhakti divas": "diwali", "mahashivratri": "mahashivratri", "shivaratri": "mahashivratri",
  "rama navami": "rama_navami", ramnavami: "rama_navami", eid: "eid", "eid al-fitr": "eidalfitr", "eid al-adha": "idulzuha", "bakrid": "idulzuha",
  christmas: "christmas", "christmas eve": "christmaseve", "christmas day": "christmas", "new year": "diwali",
  vishu: "vishu", onam: "onam", pongal: "pongal", lohri: "chetichand", "makar sankranti": "tamilnewyear",
  baisakhi: "baisakhi", vaisakhi: "vaisakhi", easter: "eastersunday", "good friday": "goodfriday",
  "karwa chauth": "karwachauth", teesi: "chetichand", mahalaya: "mahalayaamavasya",
  guru: "gurupurnima", "guru nanak": "gurunanakjayanti", jagannath: "jagannathrathyatra", jain: "mahavirjayanti", mahavir: "mahavirjayanti",
  buddha: "buddapurnima", "buddha purnima": "buddapurnima", parsi: "parsinewyear", "parsi new year": "parsinewyear",
  "ganga dussehra": "gangadussehra", hanuman: "hanumanjayanti", nag: "nagpanchami", hariyali: "hariyaliteej", chakra: "anantchaturdashi",
  anant: "anantchaturdashi", bohg: "bohagbihu", bengali: "bengalinewyear", cheti: "chetichand", ugadi: "ugadi",
  "papmochani ekadashi": "papmochaniekadashi", "gudi padwa": "gudipadwa", "cheti chand": "chetichand", "jhulelal jayanti": "jhulelaljayanti",
  "mahavir jayanti": "mahavirjayanti", "hanuman jayanti": "hanumanjayanti", "eid al-fitr (tentative)": "eidalfitr", "id-ul-zuha (bakrid) (tentative)": "idulzuha",
  "guru purnima": "gurupurnima", "hariyali teej / independence day": "independenceday", "mahatma gandhi jayanti": "mahatmagandhijayanti",
  "mahalaya amavasya": "mahalayaamavasya", "sharad navratri begins": "sharadnavratri", "maharishi valmiki jayanti": "maharishivalmikijayanti",
  "govardhan puja": "govardhanpuja", "bhai dooj": "bhaidooj", "guru nanak jayanti / kartik purnima": "gurunanakjayanti",
  "geeta jayanti": "geetajayanti", "hazarat ali's birthday": "hazrat ali", "akshaya tritiya": "akshayatritiya",
  "vishwakarma puja": "vishwakarmapuja", "anant chaturdashi": "anantchaturdashi", "id-e-milad (tentative)": "idemilad",
  "muharram (tentative)": "muharram", "tamil new year": "tamilnewyear", "bengali new year / bohag bihu": "bengalinewyear",
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

export default function NavBar() {
  const router = useRouter();
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setShowSearchDropdown] = useState(false);

  const festivals: Festival[] = festivalDates as Festival[];

  const filteredFestivals = searchQuery.trim()
    ? festivals.filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleCreateDesignClick = () => {
    setShowCreatePopup(!showCreatePopup);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 glass">
        <div className="container mx-auto px-2 py-2 md:px-3 md:py-2.5 flex items-center justify-between gap-1.5 md:gap-4">
          <div
            className="cursor-pointer whitespace-nowrap font-headline order-1"
            onClick={() => router.push("/")}
          >
            <span className="text-sm md:text-lg lg:text-xl font-bold text-800 font-sans">FEPO</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2 order-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                className="w-20 sm:w-32 md:w-48 lg:w-64 bg-stone-100 border border-stone-200 rounded-full py-1 md:py-2 pl-2.5 md:pl-4 pr-7 md:pr-10 text-[10px] md:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
              />
              <Search size={12} className="absolute right-1.5 md:right-3 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>


          </div>

          <div className="flex items-center gap-2 order-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateDesignClick}
              className="bg-primary hover:bg-primary-dim text-white px-2 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-xs font-bold whitespace-nowrap transition-colors"
            >
              Create Design
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Search Dropdown */}
      {searchQuery.trim() && (
        <div className="fixed top-16 left-0 right-0 z-[90] flex justify-center px-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 w-full max-w-3xl shadow-xl max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase mb-2">Festivals</h4>
                {filteredFestivals.slice(0, 5).map((f, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const slug = getFestivalSlug(f.title);
                      if (slug) {
                        router.push(`/templates/${slug}`);
                      }
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    {f.title}
                  </button>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-secondary uppercase mb-2">Categories</h4>
                {["Finance", "Marketing", "IT & Tech", "Sales", "Healthcare"].filter(c =>
                  c.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      router.push(`/templates/diwali`);
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-tertiary uppercase mb-2">Recent</h4>
                {["Diwali 1", "Holi Template", "Business Card", "Logo Design"].filter(r =>
                  r.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      router.push(`/templates/diwali`);
                      setSearchQuery("");
                      setShowSearchDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Design Popup */}
      <AnimatePresence>
        {showCreatePopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/30"
              onClick={() => setShowCreatePopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 right-4 z-[90] bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 w-80 max-w-[calc(100vw-2rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-stone-800">Choose Your Option</h3>
                <button
                  onClick={() => setShowCreatePopup(false)}
                  className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { router.push('/templates/diwali'); setShowCreatePopup(false); }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-400 transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center">
                    <Gift className="w-6 h-6 text-white mb-1" />
                    <span className="text-white font-bold text-sm drop-shadow-lg">Festival</span>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/'); setShowCreatePopup(false); }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-400 transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white mb-1" />
                    <span className="text-white font-bold text-sm drop-shadow-lg">Business Card</span>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/'); setShowCreatePopup(false); }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-red-400 transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center">
                    <Heart className="w-6 h-6 text-white mb-1" />
                    <span className="text-white font-bold text-sm drop-shadow-lg">Wishing Card</span>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/'); setShowCreatePopup(false); }}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-400 transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex flex-col items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white mb-1" />
                    <span className="text-white font-bold text-sm drop-shadow-lg">Digital Card</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
