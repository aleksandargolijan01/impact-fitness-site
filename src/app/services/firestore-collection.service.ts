import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  query,
  QueryConstraint,
  setDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreCollectionService {
  private readonly firestore = inject(Firestore);
  private readonly platformId = inject(PLATFORM_ID);

  listen<T extends { id: string }>(path: string): Observable<T[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    return collectionData(collection(this.firestore, path), { idField: 'id' }) as Observable<T[]>;
  }

  listenWhere<T extends { id: string }>(
    path: string,
    ...constraints: QueryConstraint[]
  ): Observable<T[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    const queryRef = query(collection(this.firestore, path), ...constraints);

    return collectionData(queryRef, { idField: 'id' }) as Observable<T[]>;
  }

  listenDocument<T>(path: string, id: string): Observable<T | undefined> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(undefined);
    }

    return docData(doc(this.firestore, path, id)) as Observable<T | undefined>;
  }

  createId(path: string): string {
    return doc(collection(this.firestore, path)).id;
  }

  set<T extends { id: string }>(path: string, item: T): Promise<void> {
    return this.runWrite(`set ${path}/${item.id}`, () =>
      setDoc(doc(this.firestore, path, item.id), item),
    );
  }

  update<T extends { id: string }>(path: string, item: T): Promise<void> {
    const { id, ...data } = item;

    return this.runWrite(`update ${path}/${id}`, () =>
      setDoc(doc(this.firestore, path, id), data, { merge: true }),
    );
  }

  delete(path: string, id: string): Promise<void> {
    return this.runWrite(`delete ${path}/${id}`, () => deleteDoc(doc(this.firestore, path, id)));
  }

  setDocument<T extends object>(path: string, id: string, data: T): Promise<void> {
    return this.runWrite(`set ${path}/${id}`, () => setDoc(doc(this.firestore, path, id), data));
  }

  private async runWrite(action: string, write: () => Promise<void>): Promise<void> {
    try {
      await write();
    } catch (error) {
      console.error(`Firestore ${action} failed`, error);
      throw error;
    }
  }
}
