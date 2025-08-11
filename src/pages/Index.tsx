import Navbar from "@/components/Navbar";
import NotebookSidebar from "@/components/NotebookSidebar";
import FileEditor from "@/components/FileEditor";
import AIChatSidebar from "@/components/AIChatSidebar";
import { FileProvider } from "@/contexts/FileContext";

const Index = () => {
  return (
    <FileProvider>
      <div className="h-screen flex flex-col bg-background">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content Area - 20-50-30 Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Notebook Navigator (20%) */}
          <div className="w-1/5 min-w-[280px] max-w-[400px]">
            <NotebookSidebar />
          </div>

          {/* Middle Content - File Editor (50%) */}
          <div className="flex-1 min-w-0">
            <FileEditor />
          </div>

          {/* Right Sidebar - AI Chat (30%) */}
          <div className="w-[30%] min-w-[320px] max-w-[500px]">
            <AIChatSidebar />
          </div>
        </div>
      </div>
    </FileProvider>
  );
};

export default Index;