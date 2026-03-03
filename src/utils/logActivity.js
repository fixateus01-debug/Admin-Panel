import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";

export const logActivity = async ({
  actionType,
  description,
  entityId = "",
  entityType = ""
}) => {
  const user = auth.currentUser;
  if (!user) return;

  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) return;

  const adminData = adminSnap.data();

  await addDoc(collection(db, "systemLogs"), {
    adminId: user.uid,
    adminName: adminData.name,
    actionType,
    description,
    entityId,
    entityType,
    createdAt: serverTimestamp()
  });
};
