export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  duration?: string;
  description: string;
  benefits: string[];
  popular: boolean;
}
