import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function useIsAdmin() {
  const session = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.rpc("current_user_is_admin").then(({ data }) => setIsAdmin(data === true));
  }, [session?.user.id]);
  return isAdmin;
}
