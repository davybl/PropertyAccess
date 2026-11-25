"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSessionToken, getSessionToken } from "@/lib/device";

export function DeviceSessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const verifySession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      const localToken = getSessionToken();
      if (!localToken) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_session_token")
        .eq("id", user.id)
        .single();

      if (
        isMounted &&
        profile?.active_session_token &&
        profile.active_session_token !== localToken
      ) {
        clearSessionToken();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  return null;
}
