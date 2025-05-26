"use client";

import Link from "next/link";
<<<<<<< HEAD
import { Shirt, LogIn, LogOut, UserPlus, DraftingCompass, FileText, Diamond } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { currentUser, userMeta, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out successfully" });
      router.push("/");
    } catch (error) {
      toast({ title: "Logout failed", description: (error as Error).message, variant: "destructive" });
    }
  };
=======
import { Shirt, DraftingCompass } from "lucide-react";
// Removed useAuth, Button, useRouter, useToast, Skeleton, and other auth-related imports

const Header = () => {
  // Removed all auth-related state and logic
>>>>>>> master

  return (
    <header className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Shirt className="h-8 w-8" />
          <span>Perfectly Styled</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
<<<<<<< HEAD
          {currentUser ? (
            <>
              {userMeta?.questionnaireComplete && !userMeta?.hasGeneratedReport && (
                 <Button variant="ghost" asChild>
                    <Link href="/payment">
                      <Diamond className="mr-2 h-4 w-4" /> Pay & Get Report
                    </Link>
                  </Button>
              )}
              {userMeta?.hasGeneratedReport ? (
                <Button variant="ghost" asChild>
                  <Link href="/report">
                    <FileText className="mr-2 h-4 w-4" /> View Report
                  </Link>
                </Button>
              ) : (
                 <Button variant="ghost" asChild>
                    <Link href="/questionnaire">
                      <DraftingCompass className="mr-2 h-4 w-4" /> Questionnaire
                    </Link>
                  </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">
                  <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                </Link>
              </Button>
            </>
          )}
=======
          {/* Simplified navigation, as there's no user login state */}
          <Link href="/questionnaire" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
            <DraftingCompass className="mr-2 h-4 w-4" /> Questionnaire
          </Link>
>>>>>>> master
        </nav>
      </div>
    </header>
  );
};

export default Header;
