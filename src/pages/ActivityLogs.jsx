import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot
} from "firebase/firestore";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [filterAdmin, setFilterAdmin] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    return onSnapshot(collection(db, "systemLogs"), snap =>
      setLogs(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )
    );
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {

      const logDate = log.createdAt?.toDate();

      const matchAdmin =
        !filterAdmin || log.adminName === filterAdmin;

      const matchAction =
        !filterAction || log.actionType === filterAction;

      const matchStart =
        !startDate || logDate >= new Date(startDate);

      const matchEnd =
        !endDate || logDate <= new Date(endDate);

      return matchAdmin && matchAction && matchStart && matchEnd;
    });
  }, [logs, filterAdmin, filterAction, startDate, endDate]);

  const uniqueAdmins = [...new Set(logs.map(l => l.adminName))];
  const uniqueActions = [...new Set(logs.map(l => l.actionType))];

  return (
    <div className="p-10 bg-slate-100 min-h-screen">

      <h2 className="text-3xl font-bold mb-8">
        📜 Admin Activity Logs
      </h2>

      {/* FILTER SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <select
          className="border p-2 rounded"
          onChange={e => setFilterAdmin(e.target.value)}
        >
          <option value="">All Admins</option>
          {uniqueAdmins.map((a, i) => (
            <option key={i}>{a}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          {uniqueActions.map((a, i) => (
            <option key={i}>{a}</option>
          ))}
        </select>

        <input
          type="date"
          className="border p-2 rounded"
          onChange={e => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          onChange={e => setEndDate(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-200">
            <tr>
              <th className="p-4">Admin</th>
              <th className="p-4">Action</th>
              <th className="p-4">Description</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id} className="border-t">
                <td className="p-4 font-semibold">
                  {log.adminName}
                </td>
                <td className="p-4">
                  {log.actionType}
                </td>
                <td className="p-4">
                  {log.description}
                </td>
                <td className="p-4">
                  {log.entityType}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {log.createdAt?.toDate().toLocaleString()}
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
