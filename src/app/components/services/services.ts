import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GymService } from '../../services/gym.service';

@Component({
  selector: 'app-services',
  imports: [],
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Services {
  readonly gymService = inject(GymService);
}
