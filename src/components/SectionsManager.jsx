import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import Swal from "sweetalert2";

export default function SectionsManager({ examId, testId }) {
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const emptySection = {
    name: "",
    order: 1,
    totalQuestions: 0,
    totalMarks: 0,
    sectionDurationMinutes: 0,
    navigationRule: "free",
    switchingAllowed: true,
    negativeMarksOverride: 0,
  };

  const [formData, setFormData] = useState(emptySection);

  /* ---------------- FETCH SECTIONS ---------------- */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "exams", examId, "tests", testId, "sections"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a, b) => a.order - b.order);
        setSections(data);
      }
    );

    return () => unsubscribe();
  }, [examId, testId]);

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    try {
      if (!formData.name)
        return Swal.fire("Error", "Section name required", "error");

      if (editingSection) {
        await updateDoc(
          doc(
            db,
            "exams",
            examId,
            "tests",
            testId,
            "sections",
            editingSection.id
          ),
          formData
        );
      } else {
        await addDoc(
          collection(
            db,
            "exams",
            examId,
            "tests",
            testId,
            "sections"
          ),
          {
            ...formData,
            createdAt: serverTimestamp(),
          }
        );
      }

      setShowModal(false);
      setEditingSection(null);
      setFormData(emptySection);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Section?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    await deleteDoc(
      doc(db, "exams", examId, "tests", testId, "sections", id)
    );
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="mt-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Sections</h3>

        <button
          onClick={() => {
            setEditingSection(null);
            setFormData({
              ...emptySection,
              order: sections.length + 1,
            });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Add Section
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Section Name</th>
              <th className="p-3">Questions</th>
              <th className="p-3">Marks</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Navigation</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.id} className="border-t">
                <td className="p-3">{section.order}</td>
                <td className="p-3">{section.name}</td>
                <td className="p-3">{section.totalQuestions}</td>
                <td className="p-3">{section.totalMarks}</td>
                <td className="p-3">
                  {section.sectionDurationMinutes || "—"}
                </td>
                <td className="p-3">{section.navigationRule}</td>
                <td className="p-3 space-x-3">
                  <button
                    onClick={() => {
                      setEditingSection(section);
                      setFormData(section);
                      setShowModal(true);
                    }}
                    className="text-indigo-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(section.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow max-h-[80vh] overflow-y-auto space-y-6">

            <h4 className="text-xl font-bold">
              {editingSection ? "Edit Section" : "Add Section"}
            </h4>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="text-sm">Section Name</label>
                <input
                  className="border p-2 rounded w-full"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Order</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Total Questions</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.totalQuestions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalQuestions: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">Total Marks</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalMarks: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">
                  Section Duration (Minutes)
                </label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.sectionDurationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sectionDurationMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm">
                  Navigation Rule
                </label>
                <select
                  className="border p-2 rounded w-full"
                  value={formData.navigationRule}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      navigationRule: e.target.value,
                    })
                  }
                >
                  <option value="free">Free Navigation</option>
                  <option value="locked">Locked Section-wise</option>
                </select>
              </div>

              <div>
                <label className="text-sm">
                  Negative Marks Override
                </label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.negativeMarksOverride}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      negativeMarksOverride: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={formData.switchingAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      switchingAllowed: e.target.checked,
                    })
                  }
                />
                <label>Allow Section Switching</label>
              </div>

            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-2 rounded"
              >
                Save Section
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
