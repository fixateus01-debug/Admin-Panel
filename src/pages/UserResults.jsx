import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

export default function UserResults() {

  const [results, setResults] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [examsMap, setExamsMap] = useState({});
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  /* ---------------- FETCH RESULTS ---------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "results"),
      (snapshot) => {
        setResults(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );
    return () => unsub();
  }, []);

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach(doc => {
          map[doc.id] = doc.data();
        });
        setUsersMap(map);
      }
    );
    return () => unsub();
  }, []);

  /* ---------------- FETCH EXAMS ---------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "exams"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach(doc => {
          map[doc.id] = doc.data().name;
        });
        setExamsMap(map);
      }
    );
    return () => unsub();
  }, []);

  /* ---------------- SEARCH ---------------- */
  const filtered = useMemo(() => {
    return results.filter(r => {
      const user = usersMap[r.userId];
      const name = user?.name?.toLowerCase() || "";
      const email = user?.email?.toLowerCase() || "";

      return (
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase())
      );
    });
  }, [results, search, usersMap]);

  return (
    <div className="p-10 bg-slate-100 min-h-screen">

      <h2 className="text-3xl font-bold mb-6">
        User Results
      </h2>

      <input
        type="text"
        placeholder="Search user..."
        className="border p-3 rounded-lg mb-6 w-72"
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-4">
        {filtered.map(result => {
          const user = usersMap[result.userId];

          return (
            <div
              key={result.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition"
            >

              {/* MAIN SUMMARY */}
              <div
                onClick={() =>
                  setExpandedId(
                    expandedId === result.id ? null : result.id
                  )
                }
                className="p-6 cursor-pointer flex justify-between items-center"
              >

                <div>
                  <p className="font-bold text-lg">
                    {user?.name || "Unknown User"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {user?.email}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {examsMap[result.examId] || result.examId}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {result.score}
                  </p>
                  <p className="text-xs text-slate-500">
                    Score
                  </p>
                </div>

              </div>

              {/* EXPANDED DETAILS */}
              {expandedId === result.id && (
                <div className="border-t p-6 bg-slate-50">

                  {/* TOP STATS */}
                  <div className="grid grid-cols-4 gap-6 mb-6">

                    <StatCard
                      label="Correct"
                      value={result.correct}
                      color="green"
                    />

                    <StatCard
                      label="Incorrect"
                      value={result.incorrect}
                      color="red"
                    />

                    <StatCard
                      label="Unanswered"
                      value={result.unanswered}
                      color="yellow"
                    />

                    <StatCard
                      label="Percentile"
                      value={`${result.percentile}%`}
                      color="blue"
                    />

                  </div>

                  {/* RANK */}
                  <div className="mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                      <span className="text-slate-600 font-medium">
                        Rank
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        #{result.rank}
                      </span>
                    </div>
                  </div>

                  {/* SECTION WISE */}
                  {result.sectionWise && result.sectionWise.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">
                        Section Wise Performance
                      </h4>

                      <div className="space-y-3">
                        {result.sectionWise.map((sec, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 rounded-lg border"
                          >
                            <p className="font-medium">
                              {sec.sectionName}
                            </p>

                            <div className="flex gap-6 text-sm mt-2 text-slate-600">
                              <span>Score: {sec.score}</span>
                              <span>Correct: {sec.correct}</span>
                              <span>Incorrect: {sec.incorrect}</span>
                              <span>Unanswered: {sec.unanswered}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-slate-500">
                    Created At:{" "}
                    {result.createdAt
                      ? new Date(
                          result.createdAt.toDate()
                        ).toLocaleString()
                      : "-"}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function StatCard({ label, value, color }) {

  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
      <p className="text-xs text-slate-500 uppercase mb-1">
        {label}
      </p>
      <p className={`text-xl font-bold px-3 py-1 rounded-full inline-block ${colors[color]}`}>
        {value}
      </p>
    </div>
  );
}