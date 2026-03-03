import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

export default function TestAttempts() {

  const [attempts, setAttempts] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [examsMap, setExamsMap] = useState({});
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [examFilter, setExamFilter] = useState("");

  /* ---------------- FETCH ATTEMPTS ---------------- */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "testAttempts"),
      (snapshot) => {
        setAttempts(
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

  /* ---------------- SEARCH & FILTER ---------------- */
  const filtered = useMemo(() => {
    return attempts.filter(a => {
      const user = usersMap[a.userId];
      const name = user?.name?.toLowerCase() || "";
      const email = user?.email?.toLowerCase() || "";

      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase());

      const matchesExam = !examFilter || a.examId === examFilter;

      return matchesSearch && matchesExam;
    });
  }, [attempts, search, usersMap, examFilter]);

  return (
    <div className="p-10 bg-slate-100 min-h-screen">

      <h2 className="text-3xl font-bold mb-6">
        User Test Attempts
      </h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search user..."
          className="border p-3 rounded-lg w-72"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="border p-3 rounded-lg bg-white"
        >
          <option value="">All Exams</option>
          {Object.entries(examsMap).map(([examId, examName]) => (
            <option key={examId} value={examId}>
              {examName}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600 text-sm uppercase">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">User</th>
              <th className="p-4">Exam</th>
              <th className="p-4">Test</th>
              <th className="p-4">Attempt #</th>
              <th className="p-4">Status</th>
              <th className="p-4">Submitted</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(attempt => {
              const user = usersMap[attempt.userId];

              return (
                <>
                  {/* MAIN ROW */}
                  <tr key={attempt.id} className="border-t hover:bg-slate-50">
                    <td className="p-4 text-center">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === attempt.id ? null : attempt.id
                          )
                        }
                        className="text-indigo-600"
                      >
                        {expandedId === attempt.id ? "−" : "+"}
                      </button>
                    </td>

                    <td className="p-4">
                      <div>
                        <p className="font-semibold">
                          {user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user?.email}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      {examsMap[attempt.examId] || attempt.examId}
                    </td>

                    <td className="p-4">
                      {attempt.testId}
                    </td>

                    <td className="p-4">
                      {attempt.attemptNumber}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        attempt.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {attempt.status}
                      </span>
                    </td>

                    <td className="p-4 text-sm">
                      {attempt.submittedAt
                        ? new Date(
                            attempt.submittedAt.toDate()
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>

                  {/* EXPANDED SECTION */}
                  {expandedId === attempt.id && (
                    <tr>
                      <td colSpan="7" className="bg-slate-50 p-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm">

                          <h3 className="font-semibold mb-4">
                            Attempt Details
                          </h3>

                          <div className="grid grid-cols-3 gap-6 text-sm mb-6">
                            <Info label="Started At" value={
                              attempt.startedAt
                                ? new Date(attempt.startedAt.toDate()).toLocaleString()
                                : "-"
                            } />
                            <Info label="Submitted At" value={
                              attempt.submittedAt
                                ? new Date(attempt.submittedAt.toDate()).toLocaleString()
                                : "-"
                            } />
                            <Info label="Total Answers" value={
                              Object.keys(attempt.answers || {}).length
                            } />
                          </div>

                          {/* ANSWERS TABLE */}
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">
                              Answers
                            </h4>

                            <table className="w-full text-left text-sm border">
                              <thead className="bg-slate-100">
                                <tr>
                                  <th className="p-2 border">Question</th>
                                  <th className="p-2 border">Selected Option</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(attempt.answers || {}).map(
                                  ([question, answer]) => (
                                    <tr key={question}>
                                      <td className="p-2 border">
                                        {question}
                                      </td>
                                      <td className="p-2 border">
                                        {answer}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>

                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border">
      <p className="text-xs uppercase text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-medium">
        {value || "-"}
      </p>
    </div>
  );
}
