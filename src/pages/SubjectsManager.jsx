import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { logActivity } from "../utils/logActivity";

const ITEMS_PER_PAGE = 20;

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [chapters, setChapters] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalSubjects = subjects.length;
  const totalChapters = subjects.reduce(
    (sum, sub) => sum + (sub.chapters?.length || 0),
    0
  );

  /* ---------------- FETCH SUBJECTS ---------------- */

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "subjects"), (snapshot) => {
      setSubjects(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- PAGINATION LOGIC ---------------- */

  const totalPages = Math.ceil(subjects.length / ITEMS_PER_PAGE);

  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return subjects.slice(start, end);
  }, [subjects, currentPage]);

  /* ---------------- ADD CHAPTER TEMP ---------------- */

  const addChapter = () => {
    if (!chapterInput) return;
    setChapters((prev) => [...prev, chapterInput]);
    setChapterInput("");
  };

  const removeChapter = (index) => {
    const updated = [...chapters];
    updated.splice(index, 1);
    setChapters(updated);
  };

  /* ---------------- EDIT SUBJECT ---------------- */

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setSubjectName(subject.name);
    setChapters(subject.chapters || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSubjectName("");
    setChapters([]);
  };

  /* ---------------- SAVE / UPDATE ---------------- */

  const handleSave = async () => {
    if (!subjectName)
      return Swal.fire("Error", "Subject name required", "error");

    if (editingId) {

      const oldSubject = subjects.find(s => s.id === editingId);

      await updateDoc(doc(db, "subjects", editingId), {
        name: subjectName,
        chapters,
        updatedAt: serverTimestamp(),
      });

      // 🔥 Detect chapter changes
      const oldChapters = oldSubject?.chapters || [];

      const addedChapters = chapters.filter(ch => !oldChapters.includes(ch));
      const removedChapters = oldChapters.filter(ch => !chapters.includes(ch));

      await logActivity({
        actionType: "UPDATE_SUBJECT",
        description: `Updated subject: ${subjectName}`,
        entityId: editingId,
        entityType: "subject",
      });

      if (addedChapters.length > 0) {
        await logActivity({
          actionType: "ADD_CHAPTER",
          description: `Added chapters to ${subjectName}: ${addedChapters.join(", ")}`,
          entityId: editingId,
          entityType: "subject",
        });
      }

      if (removedChapters.length > 0) {
        await logActivity({
          actionType: "REMOVE_CHAPTER",
          description: `Removed chapters from ${subjectName}: ${removedChapters.join(", ")}`,
          entityId: editingId,
          entityType: "subject",
        });
      }

      Swal.fire("Success", "Subject updated", "success");

    } else {

      const ref = await addDoc(collection(db, "subjects"), {
        name: subjectName,
        chapters,
        createdAt: serverTimestamp(),
      });

      await logActivity({
        actionType: "CREATE_SUBJECT",
        description: `Created subject: ${subjectName}`,
        entityId: ref.id,
        entityType: "subject",
      });

      Swal.fire("Success", "Subject added", "success");
    }

    setSubjectName("");
    setChapters([]);
    setEditingId(null);
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Subject?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    const subject = subjects.find(s => s.id === id);

    await deleteDoc(doc(db, "subjects", id));

    await logActivity({
      actionType: "DELETE_SUBJECT",
      description: `Deleted subject: ${subject?.name}`,
      entityId: id,
      entityType: "subject",
    });

    Swal.fire("Deleted", "Subject removed", "success");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-10 bg-slate-100 min-h-screen">

      <h2 className="text-2xl font-bold mb-6">Subjects & Chapters</h2>

      {/* ADD / EDIT CARD */}
      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-4">

        <div>
          <label className="block font-semibold mb-2">Subject Name</label>
          <input
            className="border p-3 rounded w-full"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                // Prevent empty subject
                if (!subjectName.trim()) return;

                // Prevent duplicate subject
                const exists = subjects.some(
                  (s) => s.name.toLowerCase() === subjectName.trim().toLowerCase()
                );
                if (exists) return Swal.fire("Error", "Subject already exists", "error");

                // Save subject
                const ref = await addDoc(collection(db, "subjects"), {
                  name: subjectName.trim(),
                  chapters: [],
                  createdAt: serverTimestamp(),
                });

                await logActivity({
                  actionType: "CREATE_SUBJECT",
                  description: `Created subject: ${subjectName}`,
                  entityId: ref.id,
                  entityType: "subject",
                });

                Swal.fire("Success", "Subject added", "success");
                setSubjectName("");
              }
            }}
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Add Chapter</label>
          <div className="flex gap-3">
            <input
              className="border p-3 rounded w-full"
              placeholder="Type chapter name and press Enter"
              value={chapterInput}
              onChange={(e) => setChapterInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = chapterInput.trim();
                  if (!trimmed) return;

                  // Prevent duplicate chapter
                  if (chapters.includes(trimmed)) {
                    return Swal.fire("Error", "Chapter already exists", "error");
                  }

                  setChapters((prev) => [...prev, trimmed]);
                  setChapterInput("");
                }
              }}
            />
          </div>
        </div>

        {chapters.length > 0 && (
          <div className="space-y-2">
            {chapters.map((ch, index) => (
              <div
                key={index}
                className="flex justify-between bg-slate-100 p-3 rounded"
              >
                {ch}
                <button
                  onClick={() => removeChapter(index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            {editingId ? "Update Subject" : "Save Subject"}
          </button>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SUBJECT COUNTS */}
      <div className="mb-4 flex gap-6">
        <div className="font-semibold">
          Total Subjects: <span className="text-indigo-600">{totalSubjects}</span>
        </div>
        <div className="font-semibold">
          Total Chapters: <span className="text-indigo-600">{totalChapters}</span>
        </div>
      </div>

      {/* SUBJECT TABLE */}
      <div className="bg-white rounded-xl shadow">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Chapters</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubjects.map((sub) => (
              <tr key={sub.id} className="border-t">
                <td className="p-3 font-semibold">{sub.name}</td>
                <td className="p-3">
                  {sub.chapters?.map((ch, i) => (
                    <span
                      key={i}
                      className="inline-block bg-slate-100 px-3 py-1 rounded mr-2 mb-1"
                    >
                      {ch}
                    </span>
                  ))}
                </td>
                <td className="p-3 space-x-4">
                  <button
                    onClick={() => handleEdit(sub)}
                    className="text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id)}
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

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded ${currentPage === i + 1
                ? "bg-indigo-600 text-white"
                : "border"
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}
