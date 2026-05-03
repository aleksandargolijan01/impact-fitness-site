import { Injectable, computed, inject, signal } from '@angular/core';
import { ServiceItem } from '../models/service-item.model';
import { FirestoreCollectionService } from './firestore-collection.service';

export interface GymSchedule {
  weekdayHours: string;
  weekdayLabel: string;
  weekendHours: string;
  weekendLabel: string;
}

const defaultSchedule: GymSchedule = {
  weekdayHours: '07-22',
  weekdayLabel: 'Pon-pet',
  weekendHours: '09-21',
  weekendLabel: 'Subota i nedelja',
};

const defaultServices: ServiceItem[] = [
  {
    id: 'circuit',
    title: 'Kruzni trening',
    name: 'Kruzni trening',
    description: 'Dinamican rad po stanicama za snagu, kondiciju i bolju izdrzljivost.',
    iconUrl: '',
    image: '',
    duration: '45 min',
    level: 'srednji',
  },
  {
    id: 'functional',
    title: 'Funkcionalni trening',
    name: 'Funkcionalni trening',
    description: 'Snaga, mobilnost i kondicija kroz pokrete koji imaju direktan efekat.',
    iconUrl: '',
    image: '',
    duration: '50 min',
    level: 'pocetnik',
  },
  {
    id: 'hard-body',
    title: 'Hard body',
    name: 'Hard body',
    description: 'Intenzivan grupni trening za zatezanje, snagu i veci kalorijski utrosak.',
    iconUrl: '',
    image: '',
    duration: '45 min',
    level: 'napredni',
  },
  {
    id: 'glute',
    title: 'Glute building',
    name: 'Glute building',
    description: 'Fokusiran program za jacanje gluteusa, stabilnost kukova i oblikovanje nogu.',
    iconUrl: '',
    image: '',
    duration: '50 min',
    level: 'srednji',
  },
  {
    id: 'kids-sport',
    title: 'Skolica sporta',
    name: 'Skolica sporta',
    description: 'Razvoj koordinacije, motorike i zdravih sportskih navika kod dece.',
    iconUrl: '',
    image: '',
    duration: '45 min',
    level: 'pocetnik',
  },
  {
    id: 'kids-boxing',
    title: 'Skolica boksa',
    name: 'Skolica boksa',
    description: 'Osnove boksa, rad nogu, fokus i disciplina kroz bezbedan trening.',
    iconUrl: '',
    image: '',
    duration: '45 min',
    level: 'pocetnik',
  },
  {
    id: 'rhythmic',
    title: 'Ritmicka gimnastika',
    name: 'Ritmicka gimnastika',
    description: 'Pokretljivost, ritam i koordinacija kroz elegantan i kontrolisan rad.',
    iconUrl: '',
    image: '',
    duration: '45 min',
    level: 'pocetnik',
  },
];

@Injectable({
  providedIn: 'root',
})
export class GymService {
  private readonly collectionPath = 'services';
  private readonly settingsCollectionPath = 'settings';
  private readonly scheduleDocumentId = 'schedule';
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly servicesState = signal<ServiceItem[]>(defaultServices);
  private readonly scheduleState = signal<GymSchedule>(defaultSchedule);

  readonly services = computed(() => this.servicesState());
  readonly schedule = computed(() => this.scheduleState());

  constructor() {
    this.firestore.listen<ServiceItem>(this.collectionPath).subscribe({
      next: (services) => {
        this.servicesState.set(
          services.length ? services.map((service) => this.normalize(service)) : defaultServices,
        );
      },
      error: (error) => {
        console.error('Failed to load services from Firestore', error);
        this.servicesState.set(defaultServices);
      },
    });

    this.firestore
      .listenDocument<GymSchedule>(this.settingsCollectionPath, this.scheduleDocumentId)
      .subscribe({
        next: (schedule) => {
          this.scheduleState.set(schedule ?? defaultSchedule);
        },
        error: (error) => {
          console.error('Failed to load schedule from Firestore', error);
          this.scheduleState.set(defaultSchedule);
        },
      });
  }

  async addService(service: Omit<ServiceItem, 'id'>): Promise<void> {
    await this.firestore.set(
      this.collectionPath,
      this.normalize({ ...service, id: this.firestore.createId(this.collectionPath) }),
    );
  }

  async updateService(service: ServiceItem): Promise<void> {
    await this.firestore.update(this.collectionPath, this.normalize(service));
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, serviceId);
  }

  async updateSchedule(schedule: GymSchedule): Promise<void> {
    await this.firestore.setDocument(
      this.settingsCollectionPath,
      this.scheduleDocumentId,
      schedule,
    );
    this.scheduleState.set(schedule);
  }

  private normalize(service: ServiceItem): ServiceItem {
    return {
      ...service,
      title: service.title ?? service.name ?? '',
      name: service.name ?? service.title ?? '',
      iconUrl: service.iconUrl ?? service.image ?? '',
      image: service.image ?? service.iconUrl ?? '',
    };
  }
}
