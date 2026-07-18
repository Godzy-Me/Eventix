import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(true);

  const toggleModal = () => {
    console.log("Auth modal");
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        toggleModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);