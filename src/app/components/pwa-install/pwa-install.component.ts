import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  template: `
    @if (pwaInstall.shouldShowPrompt()) {
      <aside class="install-prompt" aria-label="Instalacija aplikacije">
        <button
          class="install-prompt__close"
          type="button"
          aria-label="Zatvori poruku za instalaciju"
          (click)="dismiss()"
        >
          ×
        </button>
        <div>
          <strong>Impact Fitness</strong>
          <span>Brzi pristup kao mobilna aplikacija.</span>
        </div>
        <button class="btn btn--primary" type="button" (click)="install()">
          Instaliraj aplikaciju
        </button>
      </aside>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaInstallComponent {
  readonly pwaInstall = inject(PwaInstallService);

  install(): void {
    void this.pwaInstall.promptInstall();
  }

  dismiss(): void {
    this.pwaInstall.dismissPrompt();
  }
}
