import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GymService } from '../../services/gym.service';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-services',
  imports: [],
  templateUrl: './services.html',
  styleUrl: './services.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Services {
  readonly gymService = inject(GymService);
  readonly scrollService = inject(ScrollService);
}
