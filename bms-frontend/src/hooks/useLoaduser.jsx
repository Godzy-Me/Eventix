import { useEffect, useState } from "react";
import { getUser } from "../apis";
import { hasSessionFlag, setSessionFlag } from "../apis/axiosWrapper";
import { useAuth } from "../context/AuthContext";

/** On first load, restore the session from the httpOnly cookies (refreshing the access token if needed). */
export const useLoadUser = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { loginSuccess } = useAuth();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // never signed in on this browser -> nothing to restore, skip the request
      if (!hasSessionFlag()) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await getUser();
        if (!cancelled) loginSuccess(data);
      } catch {
        setSessionFlag(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoading };
};
