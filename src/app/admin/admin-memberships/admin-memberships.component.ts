import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import {
  MembershipApplication,
  MembershipApplicationStatus,
  getMembershipStatusClass,
  getMembershipStatusLabel,
  normalizeMembershipStatus,
} from '../../models/membership-application.model';
import { MembershipApplicationService } from '../../services/membership-application.service';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Clanarine</p>
        <h1>Prijave za clanarine</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <div class="panel-toolbar">
        <label>
          Filter po statusu
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
            <option value="sve">Sve</option>
            <option value="aktivirano">Aktivirano</option>
            <option value="na_cekanju">Na čekanju</option>
            <option value="blokirano">Blokirano</option>
          </select>
        </label>
      </div>

      @if (editingApplication(); as application) {
        <form class="card panel-form membership-edit-form" [formGroup]="form" (ngSubmit)="save()">
          <div class="full edit-form-heading">
            <h2>Izmena clanarine</h2>
            <p>{{ application.packageName }} / {{ application.fullName }}</p>
          </div>

          <label>Ime i prezime <input formControlName="fullName" /></label>
          <label>Email <input type="email" formControlName="email" /></label>
          <label>Telefon <input formControlName="phone" /></label>
          <label>Paket <input formControlName="packageName" /></label>
          <label>Cena paketa <input formControlName="packagePrice" /></label>
          <label>Datum pocetka <input type="date" formControlName="startDate" /></label>
          <label>Broj licnog dokumenta <input formControlName="documentNumber" /></label>
          <label>
            Status
            <select formControlName="status">
              <option value="aktivirano">Aktivirano</option>
              <option value="na_cekanju">Na čekanju</option>
              <option value="blokirano">Blokirano</option>
            </select>
          </label>
          <label class="full">Napomena <textarea rows="4" formControlName="note"></textarea></label>

          <div class="form-actions full">
            <button class="btn btn--primary" type="submit" [disabled]="isSaving()">
              {{ isSaving() ? 'Cuvanje...' : 'Sacuvaj izmene' }}
            </button>
            <button class="btn btn--ghost" type="button" (click)="cancelEdit()">Odustani</button>
          </div>
        </form>
      }

      <div class="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Korisnik</th>
              <th>Paket</th>
              <th>Pocetak</th>
              <th>Dokument</th>
              <th>Napomena</th>
              <th>Prijava</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            @if (membershipService.isLoading()) {
              <tr>
                <td colspan="8"><span class="skeleton-line"></span></td>
              </tr>
            } @else {
              @for (application of filteredApplications(); track application.id) {
                <tr>
                  <td data-label="Korisnik">
                    {{ application.fullName }}<br />{{ application.email }}<br />{{
                      application.phone
                    }}
                  </td>
                  <td data-label="Paket">
                    {{ application.packageName }}<br />{{ application.packagePrice }}
                  </td>
                  <td data-label="Pocetak">{{ application.startDate }}</td>
                  <td data-label="Dokument">{{ application.documentNumber || '-' }}</td>
                  <td data-label="Napomena">{{ application.note || '-' }}</td>
                  <td data-label="Prijava">{{ application.createdAt | date: 'short' }}</td>
                  <td data-label="Status">
                    <span class="status-badge {{ statusClass(application.status) }}">
                      {{ statusLabel(application.status) }}
                    </span>
                  </td>
                  <td class="row-actions" data-label="Akcije">
                    <button class="btn btn--ghost" type="button" (click)="edit(application)">
                      Izmeni
                    </button>
                    <button class="btn btn--ghost" type="button" (click)="delete(application.id)">
                      Obrisi
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8">Nema prijava za izabrani status.</td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMembershipsComponent {
  readonly membershipService = inject(MembershipApplicationService);
  private readonly fb = inject(FormBuilder);
  readonly statusFilter = signal<MembershipApplicationStatus | 'sve'>('sve');
  readonly editingId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    packageName: ['', Validators.required],
    packagePrice: [''],
    startDate: ['', Validators.required],
    documentNumber: [''],
    note: [''],
    status: ['na_cekanju' as MembershipApplicationStatus, Validators.required],
  });

  readonly filteredApplications = computed(() => {
    const status = this.statusFilter();
    const applications = this.membershipService.getAllApplications();

    return status === 'sve'
      ? applications
      : applications.filter((application) => normalizeMembershipStatus(application.status) === status);
  });

  readonly editingApplication = computed(() => {
    const editingId = this.editingId();

    return editingId
      ? this.membershipService.getAllApplications().find((application) => application.id === editingId)
      : undefined;
  });

  edit(application: MembershipApplication): void {
    this.editingId.set(application.id);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.form.reset({
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      packageName: application.packageName,
      packagePrice: application.packagePrice,
      startDate: application.startDate,
      documentNumber: application.documentNumber || '',
      note: application.note || '',
      status: normalizeMembershipStatus(application.status),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({
      fullName: '',
      email: '',
      phone: '',
      packageName: '',
      packagePrice: '',
      startDate: '',
      documentNumber: '',
      note: '',
      status: 'na_cekanju',
    });
  }

  async save(): Promise<void> {
    const editingId = this.editingId();

    if (!editingId) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Popunite obavezna polja pre cuvanja.');
      return;
    }

    this.isSaving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.membershipService.updateApplication({
        id: editingId,
        ...this.form.getRawValue(),
      });
      this.cancelEdit();
      this.successMessage.set('Clanarina je izmenjena.');
    } catch (error) {
      console.error('Updating membership application failed', error);
      this.errorMessage.set('Clanarina trenutno nije sacuvana. Proveri Firebase rules.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async delete(id: string): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.membershipService.deleteApplication(id);
      this.successMessage.set('Prijava je obrisana.');
    } catch (error) {
      console.error('Deleting membership application failed', error);
      this.errorMessage.set('Prijava trenutno nije obrisana. Proveri Firebase rules.');
    }
  }

  statusLabel(status: string): string {
    return getMembershipStatusLabel(status);
  }

  statusClass(status: string): string {
    return getMembershipStatusClass(status);
  }
}
