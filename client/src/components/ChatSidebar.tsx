import { Button } from "@/components/ui/button";
import { Plus, Menu, X } from "lucide-react";
import { Chat } from "@shared/types";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  currentChatId: number | null;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({
  isOpen,
  onToggle,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 transition-transform duration-300 z-40 w-64 h-screen bg-card border-r border-border flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-border">
          <Button
            onClick={onNewChat}
            className="w-full gap-2"
            variant="default"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                onSelectChat(chat.id);
                // Close sidebar on mobile after selection
                if (window.innerWidth < 768) {
                  onToggle();
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentChatId === chat.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <p className="truncate text-sm font-medium">
                {chat.title || "Untitled Chat"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
