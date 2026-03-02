import React from "react";
import { CgSpinner } from "react-icons/cg";

const FullLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/10 dark:bg-black/50">
      <CgSpinner className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
};

export default FullLoader;