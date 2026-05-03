export type ServiceLevel = 'pocetnik' | 'srednji' | 'napredni';

export interface ServiceItem {
  id: string;
  title: string;
  name?: string;
  description: string;
  iconUrl: string;
  image?: string;
  duration: string;
  level: ServiceLevel;
}
