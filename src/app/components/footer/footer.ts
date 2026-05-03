import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly pwaInstall = inject(PwaInstallService);
  readonly installMessage = signal('');

  async installApp(): Promise<void> {
    this.installMessage.set('');

    if (this.pwaInstall.isInstalled()) {
      this.installMessage.set('Aplikacija je vec instalirana.');
      return;
    }

    if (!this.pwaInstall.canInstall()) {
      this.installMessage.set('Instalacija trenutno nije dostupna na ovom uredjaju/browseru.');
      return;
    }

    const installed = await this.pwaInstall.promptInstall();

    this.installMessage.set(
      installed ? 'Aplikacija je instalirana.' : 'Instalacija nije zavrsena.',
    );
  }
}
