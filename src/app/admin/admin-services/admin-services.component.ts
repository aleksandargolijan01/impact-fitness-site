import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServiceItem, ServiceLevel } from '../../models/service-item.model';
import { GymService } from '../../services/gym.service';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Usluge</p>
        <h1>Upravljanje treninzima</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>Naziv usluge <input formControlName="title" /></label>
        <label>Ikonica ili slika URL <input formControlName="iconUrl" /></label>
        <label>Trajanje <input formControlName="duration" /></label>
        <label>
          Nivo
          <select formControlName="level">
            <option value="pocetnik">Pocetnik</option>
            <option value="srednji">Srednji</option>
            <option value="napredni">Napredni</option>
          </select>
        </label>
        <label class="full"
          >Opis <textarea formControlName="description" rows="4"></textarea>
        </label>
        <div class="form-actions full">
          <button class="btn btn--primary" type="submit" [disabled]="isSaving()">
            {{ isSaving() ? 'Cuvanje...' : editingId() ? 'Sacuvaj izmene' : 'Dodaj uslugu' }}
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
              <th>Naziv</th>
              <th>Trajanje</th>
              <th>Nivo</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            @for (service of gymService.services(); track service.id) {
              <tr>
                <td data-label="Naziv">{{ service.title }}</td>
                <td data-label="Trajanje">{{ service.duration }}</td>
                <td data-label="Nivo">{{ service.level }}</td>
                <td class="row-actions" data-label="Akcije">
                  <button class="btn btn--ghost" type="button" (click)="edit(service)">
                    Izmeni
                  </button>
                  <button class="btn btn--ghost" type="button" (click)="delete(service.id)">
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
export class AdminServicesComponent {
  readonly gymService = inject(GymService);
  private readonly fb = inject(FormBuilder);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    iconUrl: [''],
    duration: ['', Validators.required],
    level: ['pocetnik' as ServiceLevel, Validators.required],
  });

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      if (this.editingId()) {
        await this.gymService.updateService({ ...payload, id: this.editingId()! });
      } else {
        await this.gymService.addService(payload);
      }

      this.cancel();
      this.successMessage.set('Usluga je sacuvana.');
    } catch (error) {
      console.error('Saving service failed', error);
      this.errorMessage.set(
        'Usluga trenutno nije sacuvana. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  edit(service: ServiceItem): void {
    this.editingId.set(service.id);
    this.form.setValue({
      title: service.title,
      description: service.description,
      iconUrl: service.iconUrl,
      duration: service.duration,
      level: service.level,
    });
  }

  async delete(serviceId: string): Promise<void> {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.gymService.deleteService(serviceId);
      this.successMessage.set('Usluga je obrisana.');
    } catch (error) {
      console.error('Deleting service failed', error);
      this.errorMessage.set(
        'Usluga trenutno nije obrisana. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      iconUrl: '',
      duration: '',
      level: 'pocetnik',
    });
  }
}
