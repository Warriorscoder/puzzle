"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OnboardingPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);

    if (selected.length > 6) {
      setError("You can upload a maximum of 6 images.");
      return;
    }

    setFiles(selected);
    setError("");
  }

  async function handleSubmit() {
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least 1 image.");
      return;
    }

    if (files.length === 1) {
      setError("Please upload at least 1 more image.");
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append("username", username);
    files.forEach((file) => form.append("files[]", file));

    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (data.error) {
      setError(data.error);
      return;
    }

    localStorage.setItem("userId", data.userId);
    router.push("/game");
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="/img/bg.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay for soft gradient */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* Right-Side Glass Form */}

      <div className="absolute right-[8%] top-0 h-full flex items-center p-10">
        <div
          className="
      bg-white/20 backdrop-blur-xl shadow-2xl border border-white/10
      rounded-2xl p-10 w-[420px]
      flex flex-col gap-6
    "
        >
          <h1 className="text-3xl font-bold text-black text-center drop-shadow-lg">
            Create Your Profile
          </h1>

          {error && (
            <p className="text-red-300 text-center mb-2 font-medium">{error}</p>
          )}

          {/* Floating Label Input */}
          <div className="relative w-full">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="
          w-full border-b border-white/50 bg-transparent py-3 text-white
          focus:outline-none focus:border-blue-300 peer transition
        "
              placeholder=" "
            />
            <label
              htmlFor="username"
              className={`
          absolute left-0 pointer-events-none transition-all duration-200
          ${
            username
              ? "-top-2 text-sm text-blue-200"
              : "top-3 text-base text-white/80"
          }
        `}
            >
              Choose a Username
            </label>
          </div>

          {/* Upload Hint */}
          <p className="text-sm text-white/70 -mt-3">Upload 2 to 6 images.</p>

          {/* BUTTON ROW */}
          <div className="flex gap-4 mt-2">
            {/* Select Images Button */}
            <label
              htmlFor="fileInput"
              className="
          flex-1 text-center py-3 rounded-lg cursor-pointer
          bg-white/20 border border-white/15 text-white shadow-lg
          backdrop-blur-md transition hover:bg-white/30
        "
            >
              Select Images
            </label>

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Continue Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="
          flex-1 py-3 rounded-lg bg-white/15 border border-white/30 text-white
          shadow-lg backdrop-blur-md transition hover:bg-white/30
          disabled:opacity-40
        "
            >
              {loading ? "..." : "Continue"}
            </button>
          </div>

          {/* File Count */}
          {files.length > 0 && (
            <p className="text-sm text-green-300 text-center">
              {files.length} image(s) selected
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
