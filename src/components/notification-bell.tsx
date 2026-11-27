"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const loadNotifications = async (id: string) => {
      const { data, error: loadError } = await supabase
        .from("notifications")
        .select("id, type, title, message, action_url, is_read, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        return;
      }

      setNotifications((data as UserNotification[]) || []);
      setError(null);
    };

    const initialize = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (authError || !user) {
        setError(authError?.message || "Sign in to view notifications.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      await loadNotifications(user.id);
      if (!active) return;

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadNotifications(user.id);
          }
        )
        .subscribe((status) => {
          if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT")) {
            setError("Live notification updates are temporarily unavailable.");
          }
        });

      setLoading(false);
    };

    void initialize();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const markAllRead = async () => {
    if (!userId || busy) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    }

    setBusy(false);
  };

  const markRead = async (notificationId: string) => {
    if (!userId) return;
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-subtle bg-card text-ink-secondary transition hover:border-emerald-brand hover:text-emerald-brand"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-extrabold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-subtle bg-card shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
            <h2 className="text-sm font-extrabold text-ink">Notifications</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy || unreadCount === 0}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-brand hover:underline disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Mark all read
            </button>
          </div>

          {error && (
            <p role="alert" className="px-4 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-xs text-ink-secondary">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-ink-secondary">
                You&apos;re all caught up.
              </p>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.action_url || "/"}
                  onClick={(event) => {
                    event.preventDefault();
                    setIsOpen(false);
                    void (async () => {
                      if (!item.is_read) await markRead(item.id);
                      router.push(item.action_url || "/");
                    })();
                  }}
                  className={`block border-b border-subtle px-4 py-3 transition hover:bg-muted-surface ${
                    item.is_read ? "" : "bg-emerald-brand/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-brand" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-secondary">
                        {item.message}
                      </p>
                      <time
                        dateTime={item.created_at}
                        className="mt-1 block text-[10px] text-ink-muted"
                      >
                        {new Date(item.created_at).toLocaleString("en-KE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
