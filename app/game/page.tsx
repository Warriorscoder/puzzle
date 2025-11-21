"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Tile = {
  id: number;
  src: string;
  flipped: boolean;
  matched: boolean;
};

export default function GamePage() {
  const router = useRouter();

  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [first, setFirst] = useState<Tile | null>(null);
  const [second, setSecond] = useState<Tile | null>(null);
  const [lock, setLock] = useState(false);

const fetchImages = useCallback(async (userId: string) => {
  try {
    const res = await fetch(`/api/images?userId=${userId}`);

    if (!res.ok) {
      console.error("API Error:", res.status);
      return [];
    }

    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      console.error("JSON parse failed", e);
      return [];
    }

    if (!data || !data.images || data.images.length === 0) {
      return [];
    }

    return data.images;
  } catch (err) {
    console.error("Failed to fetch:", err);
    return [];
  }
}, []);


  const shuffle = <T,>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5);

  const initGame = (imgs: string[]) => {
    const duplicated = shuffle(
      [...imgs, ...imgs].map((src, index) => ({
        id: index,
        src,
        flipped: false,
        matched: false,
      }))
    );
    setTiles(duplicated);
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.replace("/");
      return;
    }

    (async () => {
      const imgs = await fetchImages(userId);
      if (imgs.length === 0) return;

      setOriginalImages(imgs);
      initGame(imgs);
      setLoading(false);
    })();
  }, [fetchImages, router]);

  const handleFlip = (tile: Tile) => {
    if (lock || tile.flipped || tile.matched) return;

    const updated = tiles.map((t) =>
      t.id === tile.id ? { ...t, flipped: true } : t
    );
    setTiles(updated);

    if (!first) return setFirst(tile);

    if (!second) {
      setSecond(tile);
      setLock(true);

      setTimeout(() => checkMatch(first, tile), 700);
    }
  };

  const checkMatch = (a: Tile, b: Tile) => {
    if (a.src === b.src) {
      setTiles((prev) =>
        prev.map((t) =>
          t.src === a.src ? { ...t, matched: true } : t
        )
      );
    } else {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === a.id || t.id === b.id ? { ...t, flipped: false } : t
        )
      );
    }

    setFirst(null);
    setSecond(null);
    setLock(false);
  };

  const restartGame = () => {
    setFirst(null);
    setSecond(null);
    setLock(false);
    initGame(originalImages);
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-700">Loading your game…</p>
      </main>
    );
  }

  return (
    <main className="p-6 flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800 drop-shadow">
        Memory Game
      </h1>

      {/* Restart Button */}
      <button
        onClick={restartGame}
        className="mb-6 px-5 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition"
      >
        Restart Game
      </button>

      {/* Card Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            onClick={() => handleFlip(tile)}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl cursor-pointer select-none transform transition hover:scale-105"
          >
            {/* Card Container */}
            <div
              className={`relative w-full h-full transition-transform duration-300 ${
                tile.flipped || tile.matched ? "rotate-y-180" : ""
              }`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Back of Card */}
              <div className="absolute inset-0 bg-gray-800 rounded-xl shadow-xl backface-hidden"></div>

              {/* Front (Image) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={tile.src}
                  alt="Tile"
                  width={120}
                  height={120}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
