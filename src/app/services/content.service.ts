import { Injectable, computed, inject } from '@angular/core';
import { PricingService } from './pricing.service';
import { GymSchedule, GymService } from './gym.service';
import { TrainerService } from './trainer.service';
import { PricingPlan } from '../models/pricing-plan.model';
import { Trainer } from '../models/trainer.model';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly pricingService = inject(PricingService);
  private readonly trainerService = inject(TrainerService);
  private readonly gymService = inject(GymService);

  readonly pricing = computed(() => this.pricingService.plans());
  readonly trainers = computed(() => this.trainerService.trainers());
  readonly schedule = computed(() => this.gymService.schedule());

  updatePricingPlan(plan: PricingPlan): Promise<void> {
    return this.pricingService.updatePlan(plan);
  }

  addTrainer(trainer: Omit<Trainer, 'id'>): Promise<void> {
    return this.trainerService.addTrainer(trainer);
  }

  updateSchedule(schedule: GymSchedule): Promise<void> {
    return this.gymService.updateSchedule(schedule);
  }

  resetContent(): Promise<void> {
    return this.gymService.updateSchedule({
      weekdayHours: '07-22',
      weekdayLabel: 'Pon-pet',
      weekendHours: '09-21',
      weekendLabel: 'Subota i nedelja',
    });
  }
}
