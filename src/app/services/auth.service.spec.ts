import { toUserFriendlyFirebaseError } from './firebase-error.util';

describe('Firebase auth error mapping', () => {
  it('maps duplicate emails to a friendly message', () => {
    expect(toUserFriendlyFirebaseError({ code: 'auth/email-already-in-use' })).toBe(
      'Korisnik sa ovim emailom vec postoji.',
    );
  });

  it('maps invalid credentials to a friendly message', () => {
    expect(toUserFriendlyFirebaseError({ code: 'auth/invalid-credential' })).toBe(
      'Pogresan email ili password.',
    );
  });
});
