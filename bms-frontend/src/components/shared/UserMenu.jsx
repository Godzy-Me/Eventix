import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/** "Sign in" button for visitors, avatar + dropdown (Profile / Your Orders / Logout) when signed in. */
const UserMenu = () => {
  const { auth, user, toggleModal, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!auth) {
    return (
      <button
        onClick={toggleModal}
        className="bg-[#f84464] cursor-pointer text-white px-4 py-1.5 text-sm rounded"
      >
        Sign in
      </button>
    );
  }

  const label = user?.activateUser ? user?.name : user?.email;
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 cursor-pointer text-sm font-medium"
      >
        <span className="w-8 h-8 rounded-full bg-[#f84464] text-white flex items-center justify-center font-semibold">
          {initial}
        </span>
        <span className="hidden md:inline max-w-[140px] truncate">Hi, {label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 text-sm overflow-hidden">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            My Profile
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/profile", { state: { tab: "Your Orders" } });
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
          >
            Your Orders
          </button>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate("/");
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-[#f84464] cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
