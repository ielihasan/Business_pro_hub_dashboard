"use client";

import { supabase } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

export default function ChatList({ onSelect }) {
  const [conversations, setConversations] = useState([]);

  async function loadChats() {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    setConversations(data || []);
  }

  useEffect(() => {
    loadChats();

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        loadChats
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="w-1/3 border-r p-3 overflow-y-auto">
      <h2 className="font-bold mb-2">Students</h2>

      {conversations.map((c) => (
        <button
          key={c.id}
          className="w-full p-3 text-left hover:bg-gray-100 rounded-lg"
          onClick={() => onSelect(c.id)}
        >
          <p className="font-semibold">{c.student_id}</p>
          <p className="text-sm text-gray-500">{c.last_message}</p>
        </button>
      ))}
    </div>
  );
}
