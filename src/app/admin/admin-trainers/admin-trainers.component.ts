import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Trainer } from '../../models/trainer.model';
import { TrainerService } from '../../services/trainer.service';

@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Treneri</p>
        <h1>Upravljanje trenerima</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>Ime i prezime <input formControlName="name" /></label>
        <label>Specijalnost <input formControlName="specialty" /></label>
        <label>Slika URL <input formControlName="imageUrl" /></label>
        <label>Instagram link <input formControlName="instagramUrl" /></label>
        <label
          >Godine iskustva <input type="number" min="0" formControlName="yearsExperience"
        /></label>
        <label class="full"
          >Opis <textarea rows="4" formControlName="description"></textarea>
        </label>
        <label class="full">Alt tekst <input formControlName="alt" /></label>
        <div class="form-actions full">
          <button class="btn btn--primary" type="submit" [disabled]="isSaving()">
            {{ isSaving() ? 'Cuvanje...' : editingId() ? 'Sacuvaj izmene' : 'Dodaj trenera' }}
          </button>
          @if (editingId()) {
            <button class="btn btn--ghost" type="button" (click)="cancel()">Odustani</button>
          }
        </div>
      </form>

      <div class="card-list">
        @for (trainer of trainerService.trainers(); track trainer.id) {
          <article class="card data-card">
            <img [src]="trainer.imageUrl" [alt]="trainer.alt" />
            <div>
              <h2>{{ trainer.name }}</h2>
              <p>{{ trainer.specialty }} / {{ trainer.yearsExperience }} god. iskustva</p>
              <p>{{ trainer.description }}</p>
              <div class="row-actions">
                <button class="btn btn--ghost" type="button" (click)="edit(trainer)">Izmeni</button>
                <button class="btn btn--ghost" type="button" (click)="delete(trainer.id)">
                  Obrisi
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTrainersComponent {
  readonly trainerService = inject(TrainerService);
  private readonly fb = inject(FormBuilder);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    specialty: ['', Validators.required],
    description: ['', Validators.required],
    imageUrl: ['', Validators.required],
    instagramUrl: [''],
    yearsExperience: [0, [Validators.required, Validators.min(0)]],
    alt: ['Trener Impact Fitness tima', Validators.required],
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
        await this.trainerService.updateTrainer({ ...payload, id: this.editingId()! });
      } else {
        await this.trainerService.addTrainer(payload);
      }

      this.cancel();
      this.successMessage.set('Trener je sacuvan.');
    } catch (error) {
      console.error('Saving trainer failed', error);
      this.errorMessage.set(
        'Trener trenutno nije sacuvan. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  edit(trainer: Trainer): void {
    this.editingId.set(trainer.id);
    this.form.setValue({
      name: trainer.name,
      specialty: trainer.specialty,
      description: trainer.description,
      imageUrl: trainer.imageUrl,
      instagramUrl: trainer.instagramUrl,
      yearsExperience: trainer.yearsExperience,
      alt: trainer.alt,
    });
  }

  async delete(trainerId: string): Promise<void> {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.trainerService.deleteTrainer(trainerId);
      this.successMessage.set('Trener je obrisan.');
    } catch (error) {
      console.error('Deleting trainer failed', error);
      this.errorMessage.set(
        'Trener trenutno nije obrisan. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      specialty: '',
      description: '',
      imageUrl: '',
      instagramUrl: '',
      yearsExperience: 0,
      alt: 'Trener Impact Fitness tima',
    });
  }
}
