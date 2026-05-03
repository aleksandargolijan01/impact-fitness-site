import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'app-trainers',
  imports: [],
  templateUrl: './trainers.html',
  styleUrl: './trainers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Trainers {
  readonly contentService = inject(ContentService);
}
