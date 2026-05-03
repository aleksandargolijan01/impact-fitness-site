import { Injectable, computed, inject, signal } from '@angular/core';
import { Trainer } from '../models/trainer.model';
import { FirestoreCollectionService } from './firestore-collection.service';

const defaultTrainers: Trainer[] = [
  {
    id: 'marko',
    name: 'Marko',
    specialty: 'Snaga i hipertrofija',
    description: 'Rad na tehnici, progresiji opterecenja i sigurnom jacanju.',
    imageUrl:
      'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=900&q=80',
    instagramUrl: '',
    instagram: '',
    yearsExperience: 6,
    experience: 6,
    alt: 'Trener za snagu u teretani',
  },
  {
    id: 'jovana',
    name: 'Jovana',
    specialty: 'Funkcionalni i grupni treninzi',
    description: 'Vodjeni treninzi za kondiciju, stabilnost i dobar ritam.',
    imageUrl:
      'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80',
    instagramUrl: '',
    instagram: '',
    yearsExperience: 5,
    experience: 5,
    alt: 'Trenerka vodi funkcionalni trening',
  },
  {
    id: 'nikola',
    name: 'Nikola',
    specialty: 'Kondicija i recomposition',
    description: 'Kombinuje snagu, kardio i navike za bolju telesnu kompoziciju.',
    imageUrl:
      'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=900&q=80',
    instagramUrl: '',
    instagram: '',
    yearsExperience: 7,
    experience: 7,
    alt: 'Trener demonstrira vezbu',
  },
];

@Injectable({
  providedIn: 'root',
})
export class TrainerService {
  private readonly collectionPath = 'trainers';
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly trainersState = signal<Trainer[]>(defaultTrainers);

  readonly trainers = computed(() => this.trainersState());

  constructor() {
    this.firestore.listen<Trainer>(this.collectionPath).subscribe({
      next: (trainers) => {
        this.trainersState.set(
          trainers.length ? trainers.map((trainer) => this.normalize(trainer)) : defaultTrainers,
        );
      },
      error: (error) => {
        console.error('Failed to load trainers from Firestore', error);
        this.trainersState.set(defaultTrainers);
      },
    });
  }

  async addTrainer(trainer: Omit<Trainer, 'id'>): Promise<void> {
    await this.firestore.set(
      this.collectionPath,
      this.normalize({ ...trainer, id: this.firestore.createId(this.collectionPath) }),
    );
  }

  async updateTrainer(trainer: Trainer): Promise<void> {
    await this.firestore.update(this.collectionPath, this.normalize(trainer));
  }

  async deleteTrainer(trainerId: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, trainerId);
  }

  private normalize(trainer: Trainer): Trainer {
    return {
      ...trainer,
      instagramUrl: trainer.instagramUrl ?? trainer.instagram ?? '',
      instagram: trainer.instagram ?? trainer.instagramUrl ?? '',
      yearsExperience: trainer.yearsExperience ?? trainer.experience ?? 0,
      experience: trainer.experience ?? trainer.yearsExperience ?? 0,
      alt: trainer.alt ?? trainer.name,
    };
  }
}
