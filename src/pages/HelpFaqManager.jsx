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
import QuillEditor from "../components/QuillEditor";
import { logActivity } from "../utils/logActivity";

export default function HelpFaqManager() {

  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const emptyForm = {
    type: "faq",
    category: "",
    question: "",
    answer: "",
    tags: [],
    priority: 1,
    isActive: true,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");

  /* ---------------- FETCH ---------------- */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "helpFaqs"),
      (snapshot) => {
        setItems(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
    );
    return () => unsubscribe();
  }, []);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.question || !formData.answer) {
      return Swal.fire("Error", "Question & Answer required", "error");
    }

    try {

      if (editingItem) {
        await updateDoc(
          doc(db, "helpFaqs", editingItem.id),
          {
            ...formData,
            updatedAt: serverTimestamp(),
          }
        );

        // ✅ LOG UPDATE
        await logActivity({
          actionType: "UPDATE_FAQ",
          description: `Updated ${formData.type.toUpperCase()}: ${formData.question}`,
          entityId: editingItem.id,
          entityType: "helpFaq",
        });

        Swal.fire("Updated", "Entry updated", "success");

      } else {
        const ref = await addDoc(collection(db, "helpFaqs"), {
          ...formData,
          createdAt: serverTimestamp(),
        });

        // ✅ LOG CREATE
        await logActivity({
          actionType: "CREATE_FAQ",
          description: `Created ${formData.type.toUpperCase()}: ${formData.question}`,
          entityId: ref.id,
          entityType: "helpFaq",
        });

        Swal.fire("Created", "Entry added", "success");
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData(emptyForm);
      setTagInput("");

    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete entry?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    const item = items.find(i => i.id === id);

    await deleteDoc(doc(db, "helpFaqs", id));

    // ✅ LOG DELETE
    await logActivity({
      actionType: "DELETE_FAQ",
      description: `Deleted ${item?.type?.toUpperCase()}: ${item?.question}`,
      entityId: id,
      entityType: "helpFaq",
    });

    Swal.fire("Deleted", "Entry removed", "success");
  };

  /* ---------------- TAGS ---------------- */

  const addTag = () => {
    if (!tagInput.trim()) return;

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));

    setTagInput("");
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="p-10 bg-slate-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Help & FAQ Management
        </h2>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Add Entry
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Category</th>
              <th className="p-3">Question</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-3 capitalize">{item.type}</td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">{item.question}</td>
                <td className="p-3">{item.priority}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-sm ${item.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 space-x-3">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setShowModal(true);
                    }}
                    className="text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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
          <div className="bg-white w-full max-w-3xl p-6 rounded-xl shadow max-h-[90vh] overflow-y-auto">

            <h3 className="text-xl font-bold mb-6">
              {editingItem ? "Edit Help / FAQ Entry" : "Add Help / FAQ Entry"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ENTRY TYPE */}
              <div>
                <label className="block font-semibold mb-2">
                  Entry Type
                </label>
                <select
                  className="border p-2 rounded w-full"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      type: e.target.value
                    }))
                  }
                >
                  <option value="faq">FAQ</option>
                  <option value="help">Help Article</option>
                </select>
              </div>

              {/* CATEGORY */}
              <div>
                <label className="block font-semibold mb-2">
                  Category
                </label>
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Example: Billing, Account, Exams"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      category: e.target.value
                    }))
                  }
                />
              </div>

              {/* QUESTION */}
              <div>
                <label className="block font-semibold mb-2">
                  Question / Title
                </label>
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Example: How do I reset my password?"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      question: e.target.value
                    }))
                  }
                />
              </div>

              {/* ANSWER */}
              <div>
                <label className="block font-semibold mb-2">
                  Answer Content
                </label>
                <QuillEditor
                  value={formData.answer}
                  onChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      answer: value
                    }))
                  }
                />
              </div>

              {/* TAGS */}
              <div>
                <label className="block font-semibold mb-2">
                  Tags (Keywords)
                </label>

                <div className="flex gap-2">
                  <input
                    className="border p-2 rounded flex-1"
                    placeholder="Example: password, login, account"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-indigo-600 text-white px-4 rounded"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-slate-200 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* PRIORITY */}
              <div>
                <label className="block font-semibold mb-2">
                  Display Priority (Lower = Shows First)
                </label>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      priority: Number(e.target.value)
                    }))
                  }
                />
              </div>

              {/* ACTIVE */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      isActive: e.target.checked
                    }))
                  }
                />
                <label>Set as Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border px-4 py-2 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded"
                >
                  Save
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}