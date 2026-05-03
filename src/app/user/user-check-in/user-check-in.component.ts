import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsQR from 'jsqr';
import { AuthService } from '../../services/auth.service';
import { CheckInService, VALID_CHECK_IN_QR_CODE } from '../../services/check-in.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-check-in',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-heading">
        <p class="section-kicker">Cekiranje</p>
        <h1>Cekiraj se</h1>
      </div>

      @if (successMessage()) {
        <div class="success" role="status">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error" role="alert">{{ errorMessage() }}</div>
      }

      @if (checkInSuccess()) {
        <section class="card panel-card check-in-card">
          <div>
            <h2>Uspesno cekiranje!</h2>
            <p>{{ authService.currentUser()?.fullName }}</p>
            <p>Bravo! Ovo je tvoj {{ successMonthlyCount() }}. dolazak ovog meseca.</p>
            <p>Ukupno dolazaka: {{ successTotalCount() }}</p>
          </div>
          <a class="btn btn--primary" routerLink="/user/dashboard">Vrati se na profil</a>
        </section>
      } @else {
        <section class="card panel-card check-in-card">
          <div>
            <h2>QR kod na pultu</h2>
            <p>
              Skeniraj QR kod koji se nalazi na pultu teretane. Kamera se koristi samo tokom
              cekiranja.
            </p>
          </div>

          <div class="scanner-frame" [class.is-active]="isScanning()">
            @if (isScanning()) {
              <video #scannerVideo muted playsinline></video>
              <span class="scanner-frame__line"></span>
            } @else {
              <div class="scanner-placeholder">
                <span>IF</span>
                <p>Kamera nije pokrenuta.</p>
              </div>
            }
          </div>

          <div class="form-actions full">
            @if (isScanning()) {
              <button class="btn btn--ghost" type="button" (click)="stopScanner()">
                Zaustavi kameru
              </button>
            } @else {
              <button class="btn btn--primary" type="button" (click)="startScanner()">
                Otvori kameru
              </button>
            }
          </div>

          <label>
            Test unos QR koda
            <input
              [(ngModel)]="manualQrCode"
              name="manualQrCode"
              placeholder="IMPACT_GYM_CHECKIN"
            />
          </label>
          <button class="btn btn--ghost" type="button" (click)="submitManualQrCode()">
            Testiraj QR kod
          </button>
        </section>
      }

      <section class="card panel-card">
        <h2>Moja istorija dolazaka</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Datum</th>
                <th>Vreme</th>
              </tr>
            </thead>
            <tbody>
              @if (checkInService.isLoading()) {
                <tr>
                  <td colspan="3"><span class="skeleton-line"></span></td>
                </tr>
              } @else {
                @for (checkIn of myCheckIns(); track checkIn.id; let index = $index) {
                  <tr>
                    <td data-label="#">#{{ myCheckIns().length - index }}</td>
                    <td data-label="Datum">{{ formatDate(checkIn.date) }}</td>
                    <td data-label="Vreme">{{ checkIn.time }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3">Jos uvek nema evidentiranih dolazaka.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCheckInComponent implements OnDestroy {
  @ViewChild('scannerVideo') private scannerVideo?: ElementRef<HTMLVideoElement>;

  readonly authService = inject(AuthService);
  readonly checkInService = inject(CheckInService);
  private readonly platformId = inject(PLATFORM_ID);
  private mediaStream?: MediaStream;
  private animationFrameId?: number;
  private isSavingScan = false;

  readonly isScanning = signal(false);
  readonly checkInSuccess = signal(false);
  readonly successMonthlyCount = signal(0);
  readonly successTotalCount = signal(0);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  manualQrCode = '';

  readonly myCheckIns = computed(() => {
    const userId = this.authService.currentUser()?.id;

    return userId ? this.checkInService.getCheckInsByUserId(userId) : [];
  });

  async startScanner(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.checkInSuccess.set(false);

    const user = this.authService.currentUser();

    if (!user) {
      this.errorMessage.set('Morate biti ulogovani za cekiranje.');
      return;
    }

    if (!isPlatformBrowser(this.platformId) || !navigator.mediaDevices?.getUserMedia) {
      this.errorMessage.set('Kamera nije dostupna. Proverite dozvole browsera.');
      return;
    }

    this.isScanning.set(true);
    await new Promise((resolve) => setTimeout(resolve));

    const video = this.scannerVideo?.nativeElement;

    if (!video) {
      this.isScanning.set(false);
      this.errorMessage.set('Kamera nije dostupna. Proverite dozvole browsera.');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      });
      video.srcObject = this.mediaStream;
      await video.play();
      this.scanFrame(video);
    } catch (error) {
      console.error('Starting QR scanner failed', error);
      this.stopScanner();
      this.errorMessage.set('Kamera nije dostupna. Proverite dozvole browsera.');
    }
  }

  stopScanner(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = undefined;

    const video = this.scannerVideo?.nativeElement;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.isScanning.set(false);
    this.isSavingScan = false;
  }

  formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return day && month && year ? `${day}.${month}.${year}.` : value;
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  private async handleScan(value: string): Promise<void> {
    const user = this.authService.currentUser();
    const scannedValue = value.trim();

    console.log('QR value:', scannedValue);

    if (!user) {
      this.stopScanner();
      this.errorMessage.set('Morate biti ulogovani za cekiranje.');
      return;
    }

    if (scannedValue !== VALID_CHECK_IN_QR_CODE) {
      this.stopScanner();
      this.errorMessage.set('QR kod nije validan za Impact Fitness.');
      return;
    }

    this.isSavingScan = true;

    try {
      console.log('Creating check-in for user:', user.id);
      await this.checkInService.createCheckIn({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        qrCodeValue: scannedValue,
      });

      this.successMonthlyCount.set(this.checkInService.getMonthlyCheckInsByUserId(user.id).length);
      this.successTotalCount.set(this.checkInService.getCheckInsByUserId(user.id).length);
      this.checkInSuccess.set(true);
      this.successMessage.set('Cekiranje je uspesno evidentirano.');
      this.stopScanner();
    } catch (error) {
      console.error('Creating check-in failed', error);
      this.stopScanner();
      this.errorMessage.set(
        error instanceof Error && error.message === 'CHECK_IN_TOO_SOON'
          ? 'Vec ste se cekirali. Sledece cekiranje je moguce kasnije.'
          : 'Cekiranje trenutno nije sacuvano. Proverite vezu i pokusajte ponovo.',
      );
    }
  }

  async submitManualQrCode(): Promise<void> {
    await this.handleScan(this.manualQrCode);
  }

  private scanFrame(video: HTMLVideoElement): void {
    if (!this.isScanning() || this.isSavingScan) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (qrCode) {
          void this.handleScan(qrCode.data);
          return;
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.scanFrame(video));
  }
}
