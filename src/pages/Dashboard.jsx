import { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  collectionGroup,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";
import { RotateCcw } from "lucide-react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function Dashboard() {
  const [adminName, setAdminName] = useState("");

  const [exams, setExams] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  /* ---------------- ADMIN NAME ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const snap = await getDoc(doc(db, "admins", user.uid));
      if (snap.exists()) setAdminName(snap.data().name);
    });
    return () => unsub();
  }, []);

  /* ---------------- FIRESTORE ---------------- */
  useEffect(() => {
    return onSnapshot(collection(db, "exams"), snap =>
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collectionGroup(db, "tests"), snap =>
      setTests(snap.docs.map(d => ({
        id: d.id,
        examId: d.ref.parent.parent.id,
        ...d.data()
      })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collectionGroup(db, "questions"), snap =>
      setQuestions(snap.docs.map(d => ({
        id: d.id,
        testId: d.ref.parent.parent.id,
        examId: d.ref.parent.parent.parent.parent.id,
        ...d.data()
      })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "users"), snap =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "results"), snap =>
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "testAttempts"), snap =>
      setAttempts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "subscriptions"), snap =>
      setSubscriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  /* ---------------- FILTER LOGIC ---------------- */

  const filteredTests = useMemo(() => {
    return tests.filter(t =>
      !selectedExam || t.examId === selectedExam
    );
  }, [tests, selectedExam]);

  const subjects = useMemo(() => {
    return [...new Set(
      questions
        .filter(q => !selectedTest || q.testId === selectedTest)
        .map(q => q.subject)
        .filter(Boolean)
    )];
  }, [questions, selectedTest]);

  const chapters = useMemo(() => {
    return [...new Set(
      questions
        .filter(q =>
          (!selectedTest || q.testId === selectedTest) &&
          (!selectedSubject || q.subject === selectedSubject)
        )
        .map(q => q.chapter)
        .filter(Boolean)
    )];
  }, [questions, selectedTest, selectedSubject]);

  const filteredResults = useMemo(() => {
    return results.filter(r =>
      (!selectedExam || r.examId === selectedExam) &&
      (!selectedTest || r.testId === selectedTest) &&
      (!selectedUser || r.userId === selectedUser)
    );
  }, [results, selectedExam, selectedTest, selectedUser]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter(a =>
      (!selectedExam || a.examId === selectedExam) &&
      (!selectedTest || a.testId === selectedTest) &&
      (!selectedUser || a.userId === selectedUser)
    );
  }, [attempts, selectedExam, selectedTest, selectedUser]);

    /* ---------------- CHAPTER QUESTION COUNT DATA ---------------- */
  const chapterQuestionData = useMemo(() => {
    const map = {};
    questions
      .filter(q =>
        (!selectedExam || q.examId === selectedExam) &&
        (!selectedTest || q.testId === selectedTest) &&
        (!selectedSubject || q.subject === selectedSubject) &&
        (!selectedChapter || q.chapter === selectedChapter)
      )
      .forEach(q => {
        if (q.chapter) {
          map[q.chapter] = (map[q.chapter] || 0) + 1;
        }
      });

    return Object.entries(map)
      .map(([chapter, count]) => ({
        chapter,
        questions: count
      }))
      .sort((a, b) => b.questions - a.questions);
  }, [questions, selectedExam, selectedTest, selectedSubject, selectedChapter]);

  /* ---------------- RESET FILTERS FUNCTION ---------------- */
  const resetFilters = () => {
    setSelectedExam("");
    setSelectedTest("");
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedUser("");
  };

  /* ---------------- KPI ---------------- */

  const totalRevenue = subscriptions.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );

  const activeUsers = users.filter(
    u => u.subscriptionStatus === "active"
  ).length;

  const avgScore =
    filteredResults.length
      ? (filteredResults.reduce((s, r) => s + r.score, 0) / filteredResults.length).toFixed(2)
      : 0;

  const avgRank =
    filteredResults.length
      ? (filteredResults.reduce((s, r) => s + r.rank, 0) / filteredResults.length).toFixed(2)
      : 0;

  const completionRate =
    attempts.length
      ? ((attempts.filter(a => a.status === "completed").length / attempts.length) * 100).toFixed(1)
      : 0;

  /* ---------------- CHART DATA ---------------- */

  const scoreDistribution = [
    {
      name: "Low (<40)",
      value: filteredResults.filter(r => r.score < 40).length
    },
    {
      name: "Medium (40-70)",
      value: filteredResults.filter(r => r.score >= 40 && r.score < 70).length
    },
    {
      name: "High (>70)",
      value: filteredResults.filter(r => r.score >= 70).length
    }
  ];

  const leaderboard = useMemo(() => {
    const map = {};
    filteredResults.forEach(r => {
      map[r.userId] = (map[r.userId] || 0) + r.score;
    });

    return Object.entries(map)
      .map(([uid, score]) => ({
        user: users.find(u => u.id === uid)?.phone || uid,
        score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [filteredResults, users]);

  const testPopularity = useMemo(() => {
    const map = {};
    filteredAttempts.forEach(a => {
      map[a.testId] = (map[a.testId] || 0) + 1;
    });

    return Object.entries(map).map(([testId, count]) => ({
      test: tests.find(t => t.id === testId)?.name || testId,
      attempts: count
    }));
  }, [filteredAttempts, tests]);

  return (
    <div className="p-10 bg-slate-100 min-h-screen space-y-10">

      <h2 className="text-3xl font-bold">
        Welcome {adminName} 👋
      </h2>

      {/* ---------------- FILTER SECTION WITH RESET BUTTON ---------------- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <RotateCcw size={18} />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          <select
            className="border p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={selectedExam}
            onChange={e => {
              setSelectedExam(e.target.value);
              setSelectedTest("");
              setSelectedSubject("");
              setSelectedChapter("");
            }}
          >
            <option value="">All Exams</option>
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={selectedTest}
            onChange={e => {
              setSelectedTest(e.target.value);
              setSelectedSubject("");
              setSelectedChapter("");
            }}
          >
            <option value="">All Tests</option>
            {filteredTests.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={selectedSubject}
            onChange={e => {
              setSelectedSubject(e.target.value);
              setSelectedChapter("");
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={selectedChapter}
            onChange={e => setSelectedChapter(e.target.value)}
          >
            <option value="">All Chapters</option>
            {chapters.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
          >
            <option value="">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.phone || u.id}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* ---------------- KPI CARDS ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card title="Total Users" value={users.length} />
        <Card title="Active Users" value={activeUsers} />
        <Card title="Revenue" value={`₹ ${totalRevenue}`} />
        <Card title="Avg Score" value={avgScore} />
        <Card title="Avg Rank" value={avgRank} />
        <Card title="Completion Rate %" value={completionRate} />
      </div>

      {/* ---------------- CHAPTER QUESTIONS DISTRIBUTION ---------------- */}
      <ChartBox title="Questions by Chapter">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chapterQuestionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="chapter" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="questions" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* ---------------- LEADERBOARD ---------------- */}
      <ChartBox title="Top 10 Leaderboard">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leaderboard}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="user" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* ---------------- TEST POPULARITY ---------------- */}
      <ChartBox title="Test Popularity">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={testPopularity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attempts" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>

      {/* ---------------- SCORE DISTRIBUTION ---------------- */}
      <ChartBox title="Score Distribution">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={scoreDistribution}
              dataKey="value"
              outerRadius={100}
              label
            >
              {scoreDistribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartBox>

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
      <h3 className="text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-indigo-600 mt-3">{value}</p>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}
