// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "../firebase";
// import { useEffect, useState } from "react";
// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       setLoading(false);
//     });
//   }, []);

//   if (loading) return <div>Loading...</div>;

//   return user ? children : <Navigate to="/" />;
// }





import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      if (!user) {
        setAuthorized(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));

        if (adminDoc.exists()) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }

      } catch (err) {
        console.error(err);
        setAuthorized(false);
      }

    });

    return () => unsubscribe();

  }, []);

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking authorization...
      </div>
    );
  }

  return authorized ? children : <Navigate to="/" />;
}