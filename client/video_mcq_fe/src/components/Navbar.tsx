import { Link } from "react-router-dom";
import { FileVideo, Home, Upload } from "lucide-react";
import { Button } from "./ui/button";

const Navbar = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <FileVideo className="h-6 w-6" />
          <span className="font-bold text-xl">Video MCQ Generator</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Videos
            </Button>
          </Link>
          <Link to="/upload">
            <Button variant="default" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
