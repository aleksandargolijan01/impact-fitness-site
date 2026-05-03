import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembershipApplicationStatus } from '../../models/membership-application.model';
import { CurrentUser } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { CheckInService } from '../../services/check-in.service';
import { MembershipApplicationService } from '../../services/membership-application.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Korisnici</p>
        <h1>Pregled korisnika</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      <div class="panel-toolbar">
        <label>
          Pretraga
          <input
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Ime ili email"
          />
        </label>
      </div>

      <div class="card-list">
        @for (user of filteredUsers(); track user.id) {
          <article class="card panel-card">
            <h2>{{ user.fullName || user.email }}</h2>
            <p><strong>Email:</strong> {{ user.email }}</p>
            <p>
              <strong>Status naloga:</strong> {{ user.active === false ? 'Neaktivan' : 'Aktivan' }}
            </p>
            <p><strong>Ukupno dolazaka:</strong> {{ checkInsFor(user).length }}</p>
            <p>
              <strong>Poslednji dolazak:</strong>
              {{ checkInService.formatCheckIn(checkInsFor(user)[0]) }}
            </p>

            @if (latestMembership(user); as membership) {
              <p>
                <strong>Clanarina:</strong> {{ membership.packageName }} / {{ membership.status }}
              </p>
              <p><strong>Pocetak:</strong> {{ membership.startDate || '-' }}</p>
              <label>
                Status clanarine
                <select
                  [ngModel]="membership.status"
                  (ngModelChange)="updateMembershipStatus(membership.id, $event)"
                >
                  <option value="novo">Novo</option>
                  <option value="kontaktirano">Kontaktirano</option>
                  <option value="potvrdjeno">Potvrdjeno</option>
                  <option value="aktivirano">Aktivirano</option>
                  <option value="odbijeno">Odbijeno</option>
                </select>
              </label>
            } @else {
              <p><strong>Clanarina:</strong> Nema prijave.</p>
            }

            <div class="form-actions full">
              <button class="btn btn--ghost" type="button" (click)="manualCheckIn(user)">
                Dodaj check-in
              </button>
              <button class="btn btn--primary" type="button" (click)="toggleUser(user)">
                {{ user.active === false ? 'Aktiviraj korisnika' : 'Deaktiviraj korisnika' }}
              </button>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Vreme</th>
                  </tr>
                </thead>
                <tbody>
                  @for (checkIn of checkInsFor(user).slice(0, 5); track checkIn.id) {
                    <tr>
                      <td data-label="Datum">{{ checkIn.date }}</td>
                      <td data-label="Vreme">{{ checkIn.time }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2">Nema evidentiranih dolazaka.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </article>
        } @empty {
          <section class="card panel-card">
            <p>Nema korisnika za izabranu pretragu.</p>
          </section>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent {
  readonly authService = inject(AuthService);
  readonly checkInService = inject(CheckInService);
  private readonly membershipService = inject(MembershipApplicationService);

  readonly searchTerm = signal('');
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    return this.authService
      .users()
      .filter((user) => user.role === 'user')
      .filter(
        (user) =>
          !term ||
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term),
      );
  });

  checkInsFor(user: CurrentUser) {
    return this.checkInService.getCheckInsByUserId(user.id);
  }

  latestMembership(user: CurrentUser) {
    return this.membershipService.getApplicationsByUserId(user.id, user.email)[0];
  }

  async manualCheckIn(user: CurrentUser): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.checkInService.createManualCheckIn(user);
      this.successMessage.set('Rucni check-in je sacuvan.');
    } catch (error) {
      console.error('Creating manual check-in failed', error);
      this.errorMessage.set('Rucni check-in trenutno nije sacuvan.');
    }
  }

  async toggleUser(user: CurrentUser): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.authService.updateUserActive(user.id, user.active === false);
      this.successMessage.set('Status korisnika je sacuvan.');
    } catch (error) {
      console.error('Updating user active status failed', error);
      this.errorMessage.set('Status korisnika trenutno nije sacuvan.');
    }
  }

  async updateMembershipStatus(id: string, status: MembershipApplicationStatus): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.membershipService.updateApplicationStatus(id, status);
      this.successMessage.set('Status clanarine je sacuvan.');
    } catch (error) {
      console.error('Updating membership status failed', error);
      this.errorMessage.set('Status clanarine trenutno nije sacuvan.');
    }
  }
}
