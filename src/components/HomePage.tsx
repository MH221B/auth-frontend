import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <Link to="/" className="text-xl font-semibold">Auth</Link>
          <div className="ml-auto">
            <Button asChild variant="outline">
              <Link to="/login" className="text-primary">Login</Link>
            </Button>
          </div>
        </div>
      </nav>
      <main className="flex-1" />
    </div>
  );
};

export default HomePage;
