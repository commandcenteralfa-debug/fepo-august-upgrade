import { FestivalType } from "@/types/design";
import ClientHomeWrapper from "@/components/ClientHomeWrapper";

const ALL_FESTIVALS: string[] = [
  "diwali", "holi", "dussehra", "navratri", "rama_navami", "finance", "it-tech", "marketing", "sales",
  "christmas", "christmaseve", "eid", "eidalfitr", "idulzuha", "durgapuja", "durgapujaashtami", "ganeshchaturthi",
  "janmashtami", "rakshabandhan", "mahashivratri", "onam", "pongal", "chetichand", "baisakhi",
  "vaisakhi", "eastersunday", "goodfriday", "ugadi", "gurupurnima", "buddapurnima", "gurunanakjayanti", "mahavirjayanti",
  "hanumanjayanti", "chhathpuja", "dhanteras", "karwachauth", "maharishivalmikijayanti", "govardhanpuja", "bhaidooj",
  "geetajayanti", "hazrat ali", "papmochaniekadashi", "gudipadwa", "jhulelaljayanti", "akshayatritiya", "gangadussehra",
  "muharram", "jagannathrathyatra", "independenceday", "parsinewyear", "nagpanchami", "idemilad", "vishwakarmapuja",
  "anantchaturdashi", "mahatmagandhijayanti", "mahalayaamavasya", "sharadnavratri", "mahasaptami", "mahanavami",
  "tamilnewyear", "bengalinewyear", "bohagbihu", "vishu"
];

interface FestivalPageProps {
  params: Promise<{ festivalName: string }>;
  searchParams: Promise<{ template?: string }>;
}

export default async function FestivalPage({ params, searchParams }: FestivalPageProps) {
  const { festivalName } = await params;
  const { template } = await searchParams;
  const normalizedFestival = festivalName.toLowerCase();

  const validFestival = (ALL_FESTIVALS.includes(normalizedFestival) 
    ? normalizedFestival 
    : "diwali") as FestivalType;

  const templateIndex = template ? Math.max(0, parseInt(template, 10) - 1) : 0;

  return <ClientHomeWrapper initialFestival={validFestival} initialTemplateIndex={templateIndex} />;
}