"use client";

import { supabase } from "@/lib/supabase-client";
import { useState } from "react";

export default function MessageInput({ chatId }) {
  const [text, setText] = useState("");

  const sendMessage = async () => {
    if (!text.trim()) return;

    const ADMIN_ID = "admin"; // replace with real admin uid later

    await supabase.from("messages").insert({
      conversation_id: chatId,
      sender_id: ADMIN_ID,
      text,
    });

    await supabase
      .from("conversations")
      .update({
        last_message: text,
        updated_at: new Date(),
      })
      .eq("id", chatId);

    setText("");
  };

  return (
    <div className="p-3 border-t flex gap-2">
      <input
        className="flex-1 border px-3 py-2 rounded-lg"
        placeholder="Type message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-4 rounded-lg"
      >
        Send
      </button>
    </div>
  );
}
