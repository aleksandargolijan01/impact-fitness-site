import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { About } from '../../components/about/about';
import { BookingFormComponent } from '../../components/booking-form/booking-form';
import { Contact } from '../../components/contact/contact';
import { Footer } from '../../components/footer/footer';
import { Gallery } from '../../components/gallery/gallery';
import { Header } from '../../components/header/header';
import { Hero } from '../../components/hero/hero';
import { Pricing } from '../../components/pricing/pricing';
import { Services } from '../../components/services/services';
import { Trainers } from '../../components/trainers/trainers';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    Header,
    Hero,
    About,
    Services,
    Pricing,
    Trainers,
    Gallery,
    BookingFormComponent,
    Contact,
    Footer,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly openFaqIndex = signal<number | null>(null);

  toggleFaq(index: number): void {
    this.openFaqIndex.update((current) => (current === index ? null : index));
  }
}
