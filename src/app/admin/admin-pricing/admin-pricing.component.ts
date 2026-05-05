import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PricingPlan } from '../../models/pricing-plan.model';
import { PricingService } from '../../services/pricing.service';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Cenovnik</p>
        <h1>Upravljanje paketima</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>Naziv paketa <input formControlName="name" /></label>
        <label>Cena <input formControlName="price" /></label>
        <label>Trajanje <input formControlName="period" /></label>
        <label class="full"
          >Opis <textarea formControlName="description" rows="3"></textarea>
        </label>
        <label class="full">
          Lista benefita, jedan po redu
          <textarea formControlName="benefitsText" rows="5"></textarea>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" formControlName="popular" />
          <span>Popularan paket</span>
        </label>
        <div class="form-actions full">
          <button class="btn btn--primary" type="submit" [disabled]="isSaving()">
            {{ isSaving() ? 'Cuvanje...' : editingId() ? 'Sacuvaj izmene' : 'Dodaj paket' }}
          </button>
          @if (editingId()) {
            <button class="btn btn--ghost" type="button" (click)="cancel()">Odustani</button>
          }
        </div>
      </form>

      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Paket</th>
              <th>Cena</th>
              <th>Trajanje</th>
              <th>Popularan</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (plan of pricingService.plans(); track plan.id) {
              <tr>
                <td data-label="Paket">{{ plan.name }}</td>
                <td data-label="Cena">{{ plan.price }}</td>
                <td data-label="Trajanje">{{ plan.period }}</td>
                <td data-label="Popularan">{{ plan.popular ? 'Da' : 'Ne' }}</td>
                <td class="row-actions" data-label="Akcije">
                  <button class="btn btn--ghost" type="button" (click)="edit(plan)">Izmeni</button>
                  <button class="btn btn--ghost" type="button" (click)="delete(plan.id)">
                    Obrisi
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPricingComponent {
  readonly pricingService = inject(PricingService);
  private readonly fb = inject(FormBuilder);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: ['', Validators.required],
    period: ['', Validators.required],
    description: ['', Validators.required],
    benefitsText: ['', Validators.required],
    popular: [false],
  });

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      price: raw.price.trim(),
      period: raw.period.trim(),
      description: raw.description.trim(),
      benefits: this.toLines(raw.benefitsText),
      popular: raw.popular,
    };

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      if (this.editingId()) {
        await this.pricingService.updatePlan({ ...payload, id: this.editingId()! });
      } else {
        await this.pricingService.addPlan(payload);
      }

      this.cancel();
      this.successMessage.set('Cenovnik je sacuvan.');
    } catch (error) {
      console.error('Saving pricing plan failed', error);
      this.errorMessage.set(
        'Cenovnik trenutno nije sacuvan. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  edit(plan: PricingPlan): void {
    this.editingId.set(plan.id);
    this.form.setValue({
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      benefitsText: plan.benefits.join('\n'),
      popular: plan.popular,
    });
  }

  async delete(planId: string): Promise<void> {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.pricingService.deletePlan(planId);
      this.successMessage.set('Paket je obrisan.');
    } catch (error) {
      console.error('Deleting pricing plan failed', error);
      this.errorMessage.set(
        'Paket trenutno nije obrisan. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      price: '',
      period: '',
      description: '',
      benefitsText: '',
      popular: false,
    });
  }

  private toLines(value: string): string[] {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
}
