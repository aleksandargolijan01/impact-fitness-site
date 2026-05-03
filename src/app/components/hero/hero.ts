import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {
  readonly contentService = inject(ContentService);
  readonly scrollService = inject(ScrollService);
}
