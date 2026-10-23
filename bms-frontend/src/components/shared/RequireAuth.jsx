import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

/** Wraps pages that need a signed-in user. Visitors are sent home and the sign-in modal opens. */
const RequireAuth = ({ children }) => {
  const { auth, toggleModal } = useAuth();

  useEffect(() => {
    if (!auth) {
      toast("Please sign in to continue");
      toggleModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  if (!auth) return <Navigate to="/" replace />;
  return children;
};

export default RequireAuth;
