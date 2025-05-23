
"use client";

import Link from "next/link";
import { Shirt, DraftingCompass } from "lucide-react";
// Removed useAuth, Button, useRouter, useToast, Skeleton, and other auth-related imports
// import { useAuth } from "@/hooks/useAuth";
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";
// import { useToast } from "@/hooks/use-toast";
// import { Skeleton } from "@/components/ui/skeleton";

const Header = () => {
  // Removed all auth-related state and logic

  return (
    <header className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Shirt className="h-8 w-8" />
          <span>Perfectly Styled</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {/* Simplified navigation, as there's no user login state */}
          <Link href="/questionnaire" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <DraftingCompass className="mr-2 h-4 w-4" /> Questionnaire
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
