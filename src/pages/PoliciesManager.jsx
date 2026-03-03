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

export default function PoliciesManager() {

    const [policies, setPolicies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);

    const emptyForm = {
        type: "privacy",
        title: "",
        content: "",
        isActive: true,
    };

    const [formData, setFormData] = useState(emptyForm);

    /* ---------------- FETCH POLICIES ---------------- */

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "policies"),
            (snapshot) => {
                setPolicies(
                    snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                );
            }
        );

        return () => unsubscribe();
    }, []);

    /* ---------------- SUBMIT ---------------- */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            return Swal.fire("Error", "All fields required", "error");
        }

        try {

            if (editingPolicy) {

                await updateDoc(
                    doc(db, "policies", editingPolicy.id),
                    {
                        ...formData,
                        updatedAt: serverTimestamp(),
                    }
                );

                // ✅ LOG UPDATE

                await logActivity({
                    actionType: formData.isActive
                        ? "ACTIVATE_POLICY"
                        : "DEACTIVATE_POLICY",
                    description: `Changed status of ${formData.type.toUpperCase()} policy: ${formData.title}`,
                    entityId: editingPolicy.id,
                    entityType: "policy",
                });

                Swal.fire("Success", "Policy updated", "success");

            } else {

                const ref = await addDoc(collection(db, "policies"), {
                    ...formData,
                    createdAt: serverTimestamp(),
                });

                // ✅ LOG CREATE
                await logActivity({
                    actionType: "CREATE_POLICY",
                    description: `Created ${formData.type.toUpperCase()} policy: ${formData.title}`,
                    entityId: ref.id,
                    entityType: "policy",
                });

                Swal.fire("Success", "Policy added", "success");
            }

            setShowModal(false);
            setEditingPolicy(null);
            setFormData(emptyForm);

        } catch (err) {
            Swal.fire("Error", err.message, "error");
        }
    };

    /* ---------------- EDIT ---------------- */

    const handleEdit = (policy) => {
        setEditingPolicy(policy);
        setFormData({
            type: policy.type,
            title: policy.title,
            content: policy.content,
            isActive: policy.isActive,
        });
        setShowModal(true);
    };

    /* ---------------- DELETE ---------------- */

    const handleDelete = async (id) => {

        const confirm = await Swal.fire({
            title: "Delete Policy?",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        const policy = policies.find(p => p.id === id);

        await deleteDoc(doc(db, "policies", id));

        // ✅ LOG DELETE
        await logActivity({
            actionType: "DELETE_POLICY",
            description: `Deleted ${policy?.type?.toUpperCase()} policy: ${policy?.title}`,
            entityId: id,
            entityType: "policy",
        });

        Swal.fire("Deleted", "Policy removed", "success");
    };

    return (
        <div className="p-10 bg-slate-100 min-h-screen">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Privacy & Policy Management
                </h2>

                <button
                    onClick={() => {
                        setEditingPolicy(null);
                        setFormData(emptyForm);
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Add Policy
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl shadow overflow-x-auto">

                <table className="w-full text-left">
                    <thead className="bg-slate-200">
                        <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">Title</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {policies.map((policy) => (
                            <tr key={policy.id} className="border-t">
                                <td className="p-3 capitalize">
                                    {policy.type}
                                </td>

                                <td className="p-3">
                                    {policy.title}
                                </td>

                                <td className="p-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm ${policy.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {policy.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>

                                <td className="p-3 space-x-3">
                                    <button
                                        onClick={() => handleEdit(policy)}
                                        className="text-indigo-600"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDelete(policy.id)}
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

                        <h3 className="text-xl font-bold mb-4">
                            {editingPolicy ? "Edit Policy" : "Add Policy"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* TYPE */}
                            <div>
                                <label className="block font-medium mb-2">
                                    Policy Type
                                </label>

                                <select
                                    className="border p-2 rounded w-full"
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target.value,
                                        })
                                    }
                                >
                                    <option value="privacy">Privacy Policy</option>
                                    <option value="terms">Terms & Conditions</option>
                                </select>
                            </div>

                            {/* TITLE */}
                            <div>
                                <label className="block font-medium mb-2">
                                    Title
                                </label>

                                <input
                                    className="border p-2 rounded w-full"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            title: e.target.value
                                        }))
                                    }
                                />
                            </div>

                            {/* CONTENT */}
                            <div>
                                <label className="block font-medium mb-2">
                                    Content
                                </label>

                                <QuillEditor
                                    value={formData.content}
                                    onChange={(value) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            content: value
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
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                />
                                <label>Set as Active</label>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3 pt-4">
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