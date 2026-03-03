import { onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();

export const createAdminUser = onCall(async (request) => {

  const { name, email, password, role, permissions } = request.data;

  // 🔐 Only superadmin can create
  if (!request.auth) {
    throw new Error("Not authenticated");
  }

  const requesterDoc = await admin.firestore()
    .collection("admins")
    .doc(request.auth.uid)
    .get();

  if (!requesterDoc.exists || requesterDoc.data().role !== "superadmin") {
    throw new Error("Only superadmin can create admins");
  }

  try {
    // Create Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create Firestore admin doc
    await admin.firestore()
      .collection("admins")
      .doc(userRecord.uid)
      .set({
        name,
        email,
        role,
        permissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return { success: true };

  } catch (err) {
    console.error(err);
    throw new HttpsError(
      "invalid-argument",
      err.errorInfo?.message || "Invalid input"
    );
  }

});