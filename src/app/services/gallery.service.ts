import { Injectable, computed, inject, signal } from '@angular/core';
import { GalleryItem } from '../models/gallery-item.model';
import { FirestoreCollectionService } from './firestore-collection.service';

const defaultGallery: GalleryItem[] = [
  {
    id: 'gym-wide',
    imageUrl:
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80',
    altText: 'Opremljena moderna teretana',
    category: 'prostor',
    wide: true,
  },
  {
    id: 'weights',
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    altText: 'Trening sa tegovima',
    category: 'trening',
    wide: false,
  },
  {
    id: 'machines',
    imageUrl:
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80',
    altText: 'Zona sa spravama',
    category: 'oprema',
    wide: false,
  },
  {
    id: 'cardio',
    imageUrl:
      'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=900&q=80',
    altText: 'Kardio trening',
    category: 'trening',
    wide: false,
  },
  {
    id: 'functional-wide',
    imageUrl:
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=80',
    altText: 'Funkcionalni trening prostor',
    category: 'prostor',
    wide: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private readonly collectionPath = 'gallery';
  private readonly firestore = inject(FirestoreCollectionService);
  private readonly itemsState = signal<GalleryItem[]>(defaultGallery);

  readonly items = computed(() => this.itemsState());

  constructor() {
    this.firestore.listen<GalleryItem>(this.collectionPath).subscribe({
      next: (items) => {
        this.itemsState.set(
          items.length ? items.map((item) => this.normalize(item)) : defaultGallery,
        );
      },
      error: (error) => {
        console.error('Failed to load gallery from Firestore', error);
        this.itemsState.set(defaultGallery);
      },
    });
  }

  async addItem(item: Omit<GalleryItem, 'id'>): Promise<void> {
    await this.firestore.set(
      this.collectionPath,
      this.normalize({ ...item, id: this.firestore.createId(this.collectionPath) }),
    );
  }

  async updateItem(item: GalleryItem): Promise<void> {
    await this.firestore.update(this.collectionPath, this.normalize(item));
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.firestore.delete(this.collectionPath, itemId);
  }

  private normalize(item: GalleryItem): GalleryItem {
    return {
      ...item,
      wide: item.wide ?? false,
    };
  }
}
