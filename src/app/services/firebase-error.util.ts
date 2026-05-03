export function toUserFriendlyFirebaseError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Korisnik sa ovim emailom vec postoji.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Pogresan email ili password.';
    case 'auth/invalid-email':
      return 'Email adresa nije ispravna.';
    case 'auth/weak-password':
      return 'Password mora imati najmanje 6 karaktera.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Veza sa serverom trenutno nije dostupna. Pokusaj ponovo.';
    case 'permission-denied':
      return 'Nemas dozvolu za ovu akciju.';
    default:
      return 'Doslo je do greske. Pokusaj ponovo za nekoliko trenutaka.';
  }
}
