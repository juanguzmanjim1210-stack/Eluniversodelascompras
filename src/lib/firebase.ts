import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _firestore: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_PROJECT_ID !== "demo-project"
  );
}

export function getFirestoreDb(): Firestore {
  if (_firestore) return _firestore;

  if (getApps().length > 0) {
    _firestore = getFirestore(getApps()[0]);
    return _firestore;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
  });
  _firestore = getFirestore(app);
  return _firestore;
}
