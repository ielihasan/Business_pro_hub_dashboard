"use client";

import { supabase } from "@/lib/supabase-client";
import { useEffect, useState } from "react";
import MessageInput from "./MessageInput";

export default function ChatWindow({ chatId }) {
  const [messages, setMessages] = useState([]);

  async function loadMessages() {
    if (!chatId) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", chatId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  useEffect(() => {
    loadMessages();

    if (!chatId) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${chatId}`,
        },
        loadMessages
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId]);

  if (!chatId)
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat
      </div>
    );

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-xl max-w-[60%] ${
              m.sender_id === "admin"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <MessageInput chatId={chatId} />
    </div>
  );
}
