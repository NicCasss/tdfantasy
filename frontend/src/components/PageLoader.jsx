import React from "react";
import AppLayout from "./AppLayout";

function PageLoader({ text = "Caricamento..." }) {
  return (
    <AppLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-solid border-[#F26A00] border-r-transparent" />

          <p className="text-sm font-semibold text-[#6A5B52]">
            {text}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

export default PageLoader;