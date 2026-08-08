"use client";

import { Calendar, Bell, Landmark, CalendarCheck, Globe, Store } from "lucide-react";

interface BusinessHoliday {
  icon: string;
  title: string;
  description: string;
  date: string;
  type: string;
  typeClass: string;
  comingSoon: boolean;
}

const BUSINESS_HOLIDAYS: BusinessHoliday[] = [
  {
    icon: "account_balance",
    title: "Banking Holiday",
    description: "Limited wire transfers and physical branch closures.",
    date: "MAR 03",
    type: "Public Holiday",
    typeClass: "bg-purple-200 text-purple-800",
    comingSoon: true,
  },
  {
    icon: "event_available",
    title: "Optional Float Days",
    description: "Flexible time off policies suggested for teams.",
    date: "MAR 10",
    type: "Restricted",
    typeClass: "bg-yellow-200 text-yellow-800",
    comingSoon: true,
  },
  {
    icon: "public",
    title: "Nowruz Regional",
    description: "Significant logistics delays expected in MENA regions.",
    date: "MAR 21",
    type: "High Impact",
    typeClass: "bg-red-200 text-red-800",
    comingSoon: true,
  },
  {
    icon: "storefront",
    title: "State Closures",
    description: "Maharashtra regional offices and local markets closed.",
    date: "MAR 30",
    type: "Observance",
    typeClass: "bg-stone-200 text-stone-800",
    comingSoon: true,
  },
];

export default function BusinessHolidaySection() {
  return (
    <section className="px-4 md:px-8 lg:px-20 py-12 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-20">
          <div className="w-full md:w-1/3">
            <h2 className="text-xl md:text-4xl font-headline font-bold text-stone-800 leading-tight mb-4 md:mb-6">
              Business Holidays & Impact
            </h2>
            <p className="text-stone-600 mb-4 md:mb-8 leading-relaxed font-body text-sm md:text-base">
              Stay ahead of regional holidays and plan your business operations accordingly. 
              Our compliance alerts help you avoid disruptions.
            </p>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm uppercase tracking-widest text-orange-700">
                <Calendar size={14} />
                Export as iCal/Google Calendar
              </div>
              <div className="flex items-center gap-2 md:gap-3 font-bold text-xs md:text-sm uppercase tracking-widest text-orange-700">
                <Bell size={14} />
                Regional Compliance Alerts
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {BUSINESS_HOLIDAYS.map((holiday, index) => (
                <div
                  key={index}
                  className="group relative bg-stone-100 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-stone-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`${holiday.typeClass} px-3 py-1 rounded text-xs font-bold uppercase`}>
                        {holiday.type}
                      </span>
                      <span className="text-stone-500 text-xs font-bold">
                        {holiday.date}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      {holiday.icon === "account_balance" && <Landmark className="text-orange-600" size={24} />}
                      {holiday.icon === "event_available" && <CalendarCheck className="text-orange-600" size={24} />}
                      {holiday.icon === "public" && <Globe className="text-orange-600" size={24} />}
                      {holiday.icon === "storefront" && <Store className="text-orange-600" size={24} />}
                      <div>
                        <h3 className="font-bold text-lg text-stone-800">
                          {holiday.title}
                        </h3>
                        <p className="text-sm text-stone-600 mt-1 font-body">
                          {holiday.description}
                        </p>
                      </div>
                    </div>

                    {holiday.comingSoon && (
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform -translate-y-2 group-hover:translate-y-0 mt-4">
                        <span className="bg-orange-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
