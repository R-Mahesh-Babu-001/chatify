import { LoaderIcon } from "lucide-react";
function PageLoader() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <LoaderIcon className="size-10 animate-spin text-red-500" />
      <p className="text-sm text-[#aebac1]">Loading Chatify...</p>
    </div>
  );
}
export default PageLoader;
