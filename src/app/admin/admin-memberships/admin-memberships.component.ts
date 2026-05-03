import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembershipApplicationStatus } from '../../models/membership-application.model';
import { MembershipApplicationService } from '../../services/membership-application.service';

@Component({
  selector: 'app-admin-memberships',
  standalone: true,
  imports: [FormsModule, DatePipe],
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
            <option value="novo">Novo</option>
            <option value="kontaktirano">Kontaktirano</option>
            <option value="potvrdjeno">Potvrdjeno</option>
            <option value="aktivirano">Aktivirano</option>
            <option value="odbijeno">Odbijeno</option>
          </select>
        </label>
      </div>

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
                    <select
                      [ngModel]="application.status"
                      (ngModelChange)="updateStatus(application.id, $event)"
                    >
                      <option value="novo">Novo</option>
                      <option value="kontaktirano">Kontaktirano</option>
                      <option value="potvrdjeno">Potvrdjeno</option>
                      <option value="aktivirano">Aktivirano</option>
                      <option value="odbijeno">Odbijeno</option>
                    </select>
                  </td>
                  <td data-label="Akcije">
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
  readonly statusFilter = signal<MembershipApplicationStatus | 'sve'>('sve');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly filteredApplications = computed(() => {
    const status = this.statusFilter();
    const applications = this.membershipService.getAllApplications();

    return status === 'sve'
      ? applications
      : applications.filter((application) => application.status === status);
  });

  async updateStatus(id: string, status: MembershipApplicationStatus): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.membershipService.updateApplicationStatus(id, status);
      this.successMessage.set('Status prijave je sacuvan.');
    } catch (error) {
      console.error('Updating membership application status failed', error);
      this.errorMessage.set('Status trenutno nije sacuvan. Proveri Firebase rules.');
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
}
