import { Injectable, computed, inject, signal } from '@angular/core';
import { PricingPlan } from '../models/pricing-plan.model';
import { FirestoreCollectionService } from './firestore-collection.service';

const defaultPricing: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '4.500 RSD',
    period: 'mesecno',
    duration: 'mesecno',
    description: 'Samostalan trening uz osnovne smernice tima.',
    benefits: ['Neogranicen ulazak', 'Koriscenje teretane', 'Osnovne smernice trenera'],
    popular: false,
  },
  {
    id: 'impact',
    name: 'Impact',
    price: '7.500 RSD',
    period: 'mesecno',
    duration: 'mesecno',
    description: 'Najbolji balans teretane, grupnih treninga i pracenja napretka.',
    benefits: ['Teretana + grupni treninzi', 'Merenje napretka', 'Plan treninga za pocetak'],
    popular: true,
  },
  {
    id: 'personal',
    name: 'Personal',
    price: '18.000 RSD',
    period: '8 treninga',
    duration: '8 treninga',
    description: 'Rad 1 na 1 za jasan cilj, tehniku i kontinuitet.',
    benefits: ['Rad 1 na 1 sa trenerom', 'Plan prilagodjen cilju', 'Pracenje tehnike i oporavka'],
    popular: false,
  },
];

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  private readonly collectionPath = 'pricing';
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly plansState = signal<PricingPlan[]>(defaultPricing);

  readonly plans = computed(() => this.plansState());

  constructor() {
    this.firestore.listen<PricingPlan>(this.collectionPath).subscribe({
      next: (plans) => {
        this.plansState.set(
          plans.length ? plans.map((plan) => this.normalize(plan)) : defaultPricing,
        );
      },
      error: (error) => {
        console.error('Failed to load pricing plans from Firestore', error);
        this.plansState.set(defaultPricing);
      },
    });
  }

  async addPlan(plan: Omit<PricingPlan, 'id'>): Promise<void> {
    const item = this.normalize({
      ...plan,
      id: this.firestore.createId(this.collectionPath),
    });

    await this.firestore.set(this.collectionPath, item);
  }

  async updatePlan(plan: PricingPlan): Promise<void> {
    await this.firestore.update(this.collectionPath, this.normalize(plan));
  }

  async deletePlan(planId: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, planId);
  }

  private normalize(plan: PricingPlan): PricingPlan {
    return {
      ...plan,
      period: plan.period ?? plan.duration ?? '',
      duration: plan.duration ?? plan.period ?? '',
    };
  }
}
