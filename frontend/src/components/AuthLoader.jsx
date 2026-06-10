import React from "react";
import AuthLayout from "./AuthLayout";

function AuthLoader({ text = "Caricamento..." }) {
  return (
    <AuthLayout compact>
      <div className="text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-solid border-[#F26A00] border-r-transparent" />

        <h2 className="text-2xl font-black tracking-tight text-[#2B211B]">
          Attendi un momento
        </h2>

        <p className="mt-2 text-sm font-semibold text-[#5E5148]">
          {text}
        </p>
      </div>
    </AuthLayout>
  );
}

export default AuthLoader;