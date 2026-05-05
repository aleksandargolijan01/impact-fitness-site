import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GalleryItem } from '../../models/gallery-item.model';
import { GalleryService } from '../../services/gallery.service';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Galerija</p>
        <h1>Upravljanje slikama</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <form class="card panel-form" [formGroup]="form" (ngSubmit)="save()">
        <label>Image URL <input formControlName="imageUrl" /></label>
        <label>Alt tekst <input formControlName="altText" /></label>
        <label>Kategorija <input formControlName="category" /></label>
        <label class="checkbox-row">
          <input type="checkbox" formControlName="wide" />
          <span>Sirina 2 kolone na javnoj galeriji</span>
        </label>
        <div class="form-actions full">
          <button class="btn btn--primary" type="submit" [disabled]="isSaving()">
            {{ isSaving() ? 'Cuvanje...' : editingId() ? 'Sacuvaj izmene' : 'Dodaj sliku' }}
          </button>
          @if (editingId()) {
            <button class="btn btn--ghost" type="button" (click)="cancel()">Odustani</button>
          }
        </div>
      </form>

      <div class="gallery-admin-grid">
        @for (item of galleryService.items(); track item.id) {
          <article class="card data-card">
            <img [src]="item.imageUrl" [alt]="item.altText" />
            <div>
              <h2>{{ item.category }}</h2>
              <p>{{ item.altText }}</p>
              <div class="row-actions">
                <button class="btn btn--ghost" type="button" (click)="edit(item)">Izmeni</button>
                <button class="btn btn--ghost" type="button" (click)="delete(item.id)">
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
export class AdminGalleryComponent {
  readonly galleryService = inject(GalleryService);
  private readonly fb = inject(FormBuilder);
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    imageUrl: ['', Validators.required],
    altText: ['', Validators.required],
    category: ['', Validators.required],
    wide: [false],
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
        await this.galleryService.updateItem({ ...payload, id: this.editingId()! });
      } else {
        await this.galleryService.addItem({
          imageUrl: payload.imageUrl,
          altText: payload.altText,
          category: payload.category,
          wide: payload.wide,
        });
      }

      this.cancel();
      this.successMessage.set('Slika je sacuvana.');
    } catch (error) {
      console.error('Saving gallery item failed', error);
      this.errorMessage.set(
        'Slika trenutno nije sacuvana. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  edit(item: GalleryItem): void {
    this.editingId.set(item.id);
    this.form.setValue({
      imageUrl: item.imageUrl,
      altText: item.altText,
      category: item.category,
      wide: item.wide ?? false,
    });
  }

  async delete(itemId: string): Promise<void> {
    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.galleryService.deleteItem(itemId);
      this.successMessage.set('Slika je obrisana.');
    } catch (error) {
      console.error('Deleting gallery item failed', error);
      this.errorMessage.set(
        'Slika trenutno nije obrisana. Proveri Firebase rules i pokusaj ponovo.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({
      imageUrl: '',
      altText: '',
      category: '',
      wide: false,
    });
  }
}
