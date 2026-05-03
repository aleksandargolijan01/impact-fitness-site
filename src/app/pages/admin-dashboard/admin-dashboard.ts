import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  readonly contentService = inject(ContentService);
  private readonly fb = inject(FormBuilder);

  readonly scheduleForm = this.fb.nonNullable.group({
    weekdayHours: [this.contentService.schedule().weekdayHours, Validators.required],
    weekdayLabel: [this.contentService.schedule().weekdayLabel, Validators.required],
    weekendHours: [this.contentService.schedule().weekendHours, Validators.required],
    weekendLabel: [this.contentService.schedule().weekendLabel, Validators.required],
  });

  readonly trainerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    specialty: ['', Validators.required],
    imageUrl: ['', Validators.required],
    alt: ['Trener Impact Fitness tima', Validators.required],
  });

  savePricingPlan(
    planId: string,
    name: string,
    price: string,
    period: string,
    features: string,
  ): void {
    const currentPlan = this.contentService.pricing().find((plan) => plan.id === planId);

    if (!currentPlan) {
      return;
    }

    this.contentService.updatePricingPlan({
      ...currentPlan,
      name: name.trim(),
      price: price.trim(),
      period: period.trim(),
      description: currentPlan.description,
      popular: currentPlan.popular,
      benefits: features
        .split('\n')
        .map((feature) => feature.trim())
        .filter(Boolean),
    });
  }

  saveSchedule(): void {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    this.contentService.updateSchedule(this.scheduleForm.getRawValue());
  }

  addTrainer(): void {
    if (this.trainerForm.invalid) {
      this.trainerForm.markAllAsTouched();
      return;
    }

    this.contentService.addTrainer({
      ...this.trainerForm.getRawValue(),
      description: 'Trener Impact Fitness tima.',
      instagramUrl: '',
      yearsExperience: 0,
    });
    this.trainerForm.reset({
      name: '',
      specialty: '',
      imageUrl: '',
      alt: 'Trener Impact Fitness tima',
    });
  }

  resetContent(): void {
    this.contentService.resetContent();
    this.scheduleForm.setValue(this.contentService.schedule());
  }
}
