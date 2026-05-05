import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  PLATFORM_ID,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { FirebaseApp, provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore((injector) => {
      const firebaseApp = injector.get(FirebaseApp);

      if (!isPlatformBrowser(injector.get(PLATFORM_ID))) {
        return getFirestore(firebaseApp);
      }

      try {
        return initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        return getFirestore(firebaseApp);
      }
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production && !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
