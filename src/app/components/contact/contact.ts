import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';
import { ScrollService } from '../../services/scroll.service';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  readonly contentService = inject(ContentService);
  readonly scrollService = inject(ScrollService);
}
