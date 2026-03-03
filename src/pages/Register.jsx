import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    await createUserWithEmailAndPassword(auth, email, password);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="bg-white p-8 rounded-xl shadow-xl w-96">
        {/* <h2 className="text-2xl font-bold mb-4 text-center">
          Create Admin Account
        </h2> */}

        <h2 className="text-4xl font-bold text-indigo-600">
            Create Admin Account
        </h2>


        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
