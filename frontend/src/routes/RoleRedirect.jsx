import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLE = "admCorradoadm";

function RoleRedirect() {
  const { user, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F26A00] border-t-transparent mx-auto" />
          <p className="mt-3 font-bold text-[#2B211B]">
            Caricamento...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === ADMIN_ROLE) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default RoleRedirect;