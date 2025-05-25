import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "./components/Navbar";
import VideoUpload from "./pages/VideoUpload";
import VideoDetails from "./pages/VideoDetails";
import VideoList from "./pages/VideoList";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <ThemeProvider defaultTheme="light" storageKey="video-mcq-theme"> */}
      <Router>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto py-6 px-4">
            <Routes>
              <Route path="/" element={<VideoList />} />
              <Route path="/upload" element={<VideoUpload />} />
              <Route path="/video/:id" element={<VideoDetails />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  );
}

export default App;
