export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};
  
  // Check env vars (sin revelar valores completos)
  result.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ? `set (${process.env.FIREBASE_PROJECT_ID.length} chars)` : "NOT SET";
  result.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ? `set (${process.env.FIREBASE_CLIENT_EMAIL.length} chars)` : "NOT SET";
  result.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ? `set (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : "NOT SET";
  
  try {
    const { isFirebaseConfigured } = await import("@/lib/firebase");
    result.isFirebaseConfigured = isFirebaseConfigured();
  } catch (e) {
    result.firebaseConfigError = String(e);
  }

  // Try to connect
  try {
    const { isFirebaseConfigured, getFirestoreDb } = await import("@/lib/firebase");
    if (isFirebaseConfigured()) {
      const fs = getFirestoreDb();
      const snap = await fs.collection("settings").doc("store").get();
      result.firestoreConnected = true;
      result.storeSettingsExists = snap.exists;
      if (snap.exists) {
        const data = snap.data();
        result.storeName = data?.storeName;
      }
      
      // Check products
      const prodSnap = await fs.collection("products").get();
      result.productCount = prodSnap.size;
    } else {
      result.firestoreConnected = false;
      result.reason = "Firebase not configured - env vars missing";
    }
  } catch (e) {
    result.firestoreError = String(e);
  }

  return Response.json(result);
}
