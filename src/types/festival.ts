export interface Festival {
  id: number;
  title: string;
  date: string;
  year: number;
  categories: string[];
  country: string;
  states: string[];
  sameDayEvents: string[];
  businessCategories: string[];
  templatePriority: number;
  hashtags: string[];
  isPublicHoliday: boolean;
}
