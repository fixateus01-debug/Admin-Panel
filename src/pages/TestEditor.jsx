import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import Swal from "sweetalert2";
import SectionsManager from "../components/SectionsManager";
import QuestionsManager from "../components/QuestionsManager";
import PyqsManager from "../components/PyqsManager";
import { logActivity } from "../utils/logActivity";

export default function TestEditor() {
  const { examId, testId } = useParams();
  const navigate = useNavigate();
  const isNew = testId === "new";

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [sections, setSections] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    type: "full",
    status: "draft",
    isDemo: false,
    visibilityStart: "",
    visibilityEnd: "",

    totalQuestions: 0,
    totalMarks: 0,
    marksPerQuestion: 1,
    negativeMarkingEnabled: false,
    negativeMarks: 0,

    attemptLimit: 1,
    randomizeQuestions: false,
    randomizeOptions: false,

    timing: {
      totalDurationMinutes: 120,
      serverEnforced: true,
    },

    securityConfig: {
      allowedAppSwitch: 3,
      screenshotDetection: true,
      screenRecordingDetection: true,
      blockRootedDevice: true,
      autoSubmitOnViolation: false,
    },

    resultSettings: {
      visibility: "immediate",
      leaderboardSize: 100,
      rankingBasis: "testScore",
      firstAttemptOnlyRanking: true,
    },
  });

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    if (isNew) return;

    const fetchTest = async () => {
      const snap = await getDoc(
        doc(db, "exams", examId, "tests", testId)
      );

      if (snap.exists()) {
        const data = snap.data();

        setFormData({
          ...data,
          visibilityStart: data.visibilityStart
            ? data.visibilityStart.toDate().toISOString().slice(0, 16)
            : "",
          visibilityEnd: data.visibilityEnd
            ? data.visibilityEnd.toDate().toISOString().slice(0, 16)
            : "",
        });
      }
    };

    fetchTest();
  }, [examId, testId]);

  useEffect(() => {
    if (isNew) return;

    const unsubscribe = onSnapshot(
      collection(db, "exams", examId, "tests", testId, "sections"),
      (snapshot) => {
        setSections(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }
    );

    return () => unsubscribe();
  }, [examId, testId, isNew]);

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    try {
      setLoading(true);

      const refDoc = isNew
        ? doc(collection(db, "exams", examId, "tests"))
        : doc(db, "exams", examId, "tests", testId);

      const payload = {
        ...formData,
        visibilityStart: formData.visibilityStart
          ? new Date(formData.visibilityStart)
          : null,
        visibilityEnd: formData.visibilityEnd
          ? new Date(formData.visibilityEnd)
          : null,
        createdBy: auth.currentUser?.uid || "admin",
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        await setDoc(refDoc, {
          ...payload,
          createdAt: serverTimestamp(),
        });

        // ✅ LOG CREATE
        await logActivity({
          actionType: "CREATE_TEST",
          description: `Created test: ${formData.name}`,
          entityId: refDoc.id,
          entityType: "test",
        });

      } else {
        await updateDoc(refDoc, payload);

        // ✅ LOG UPDATE
        await logActivity({
          actionType: "UPDATE_TEST",
          description: `Updated test: ${formData.name}`,
          entityId: testId,
          entityType: "test",
        });
      }

      Swal.fire("Success", "Test saved successfully", "success");
      navigate("/admin/tests");

    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-8 bg-slate-100 min-h-screen">

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin/tests")}>←</button>
        <h2 className="text-2xl font-bold">
          {isNew ? "Create Test" : "Edit Test"}
        </h2>
      </div>

      {!isNew && (
        <div className="flex gap-6 mb-6 border-b">
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-1 font-medium transition-colors ${activeTab === "settings"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Test Settings
          </button>
          <button
            onClick={() => setActiveTab("sections")}
            className={`pb-3 px-1 font-medium transition-colors ${activeTab === "sections"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Sections
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`pb-3 px-1 font-medium transition-colors ${activeTab === "questions"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab("pyqs")}
            className={`pb-3 px-1 font-medium transition-colors ${activeTab === "pyqs"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            PYQs
          </button>
        </div>
      )}

      {(isNew || activeTab === "settings") && (
        <div className="bg-white p-6 rounded-xl shadow space-y-8">

          {/* BASIC INFO */}
          <div>
            <h3 className="font-bold mb-4">Basic Information</h3>

            <label className="block text-sm mb-1">Test Name</label>
            <input
              className="w-full border p-3 rounded mb-4"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Test Type</label>
                <select
                  className="border p-2 rounded w-full"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="full">Full</option>
                  <option value="sectional">Sectional</option>
                  <option value="demo">Demo</option>
                </select>
              </div>

              <div>
                <label>Status</label>
                <select
                  className="border p-2 rounded w-full"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label>Visibility Start</label>
                <input
                  type="datetime-local"
                  className="border p-2 rounded w-full"
                  value={formData.visibilityStart}
                  onChange={(e) =>
                    setFormData({ ...formData, visibilityStart: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Visibility End</label>
                <input
                  type="datetime-local"
                  className="border p-2 rounded w-full"
                  value={formData.visibilityEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, visibilityEnd: e.target.value })
                  }
                />
              </div>
            </div>

            <label className="flex gap-2 mt-3">
              <input
                type="checkbox"
                checked={formData.isDemo}
                onChange={(e) =>
                  setFormData({ ...formData, isDemo: e.target.checked })
                }
              />
              Demo Test
            </label>
          </div>

          {/* MARKS */}
          <div>
            <h3 className="font-bold mb-4">Marks & Structure</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label>Total Questions</label>
                <input type="number" className="border p-2 rounded w-full"
                  value={formData.totalQuestions}
                  onChange={(e) =>
                    setFormData({ ...formData, totalQuestions: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label>Total Marks</label>
                <input type="number" className="border p-2 rounded w-full"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label>Marks Per Question</label>
                <input type="number" className="border p-2 rounded w-full"
                  value={formData.marksPerQuestion}
                  onChange={(e) =>
                    setFormData({ ...formData, marksPerQuestion: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label>Negative Marks</label>
                <input type="number" className="border p-2 rounded w-full"
                  value={formData.negativeMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, negativeMarks: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <label className="flex gap-2 mt-3">
              <input
                type="checkbox"
                checked={formData.negativeMarkingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, negativeMarkingEnabled: e.target.checked })
                }
              />
              Enable Negative Marking
            </label>
          </div>

          {/* ATTEMPTS & RANDOMIZATION */}
          <div>
            <h3 className="font-bold mb-4">Attempts & Randomization</h3>

            <label>Attempt Limit</label>
            <input
              type="number"
              className="border p-2 rounded w-full mb-3"
              value={formData.attemptLimit}
              onChange={(e) =>
                setFormData({ ...formData, attemptLimit: Number(e.target.value) })
              }
            />

            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) =>
                  setFormData({ ...formData, randomizeQuestions: e.target.checked })
                }
              />
              Randomize Questions
            </label>

            <label className="flex gap-2 mt-2">
              <input
                type="checkbox"
                checked={formData.randomizeOptions}
                onChange={(e) =>
                  setFormData({ ...formData, randomizeOptions: e.target.checked })
                }
              />
              Randomize Options
            </label>
          </div>

          {/* RESULT SETTINGS */}
          <div>
            <h3 className="font-bold mb-4">Result Settings</h3>

            <label>Ranking Basis</label>
            <select
              className="border p-2 rounded w-full mb-3"
              value={formData.resultSettings.rankingBasis}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resultSettings: {
                    ...formData.resultSettings,
                    rankingBasis: e.target.value,
                  },
                })
              }
            >
              <option value="testScore">Test Score</option>
              <option value="averageScore">Average Score</option>
            </select>

            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={formData.resultSettings.firstAttemptOnlyRanking}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    resultSettings: {
                      ...formData.resultSettings,
                      firstAttemptOnlyRanking: e.target.checked,
                    },
                  })
                }
              />
              First Attempt Only Ranking
            </label>
          </div>

          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded"
          >
            Save Test
          </button>

        </div>
      )}

      {activeTab === "sections" && !isNew && (
        <SectionsManager examId={examId} testId={testId} />
      )}

      {activeTab === "questions" && !isNew && (
        <QuestionsManager
          examId={examId}
          testId={testId}
          sections={sections}
        />
      )}

      {activeTab === "pyqs" && !isNew && (
        <PyqsManager examId={examId} />
      )}
    </div>
  );
}
