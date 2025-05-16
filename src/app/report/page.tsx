"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReportDisplay from "@/components/ReportDisplay";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/config/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import type { UserReport, UserMeta } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const reportCheck = (meta: UserMeta | null) => {
  return !!meta && meta.hasPaid && meta.hasGeneratedReport;
};

export default function ReportPage() {
  const { currentUser, userMeta, loading: authLoading } = useAuth();
  const [report, setReport] = useState<UserReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!currentUser || !userMeta) {
        setIsLoadingReport(false);
        return;
      }

      if (!userMeta.hasGeneratedReport) {
         setError("Report not generated yet.");
         setIsLoadingReport(false);
         return;
      }
      
      try {
        let reportDocRef;
        if (userMeta.activeReportId) { // Assuming activeReportId is stored in UserMeta
            reportDocRef = doc(db, "users", currentUser.uid, "reports", userMeta.activeReportId);
        } else {
            // Fallback: get the latest report if activeReportId is not set
            const reportsQuery = query(
                collection(db, "users", currentUser.uid, "reports"),
                orderBy("generatedAt", "desc"),
                limit(1)
            );
            const querySnapshot = await getDocs(reportsQuery);
            if (!querySnapshot.empty) {
                reportDocRef = querySnapshot.docs[0].ref;
            } else {
                setError("No report found.");
                setIsLoadingReport(false);
                return;
            }
        }

        const reportSnap = await getDoc(reportDocRef);
        if (reportSnap.exists()) {
          setReport(reportSnap.data() as UserReport);
        } else {
          setError("Report data not found.");
        }
      } catch (e) {
        console.error("Error fetching report:", e);
        setError("Failed to load your report.");
      } finally {
        setIsLoadingReport(false);
      }
    };

    if (!authLoading && currentUser) {
      fetchReport();
    } else if (!authLoading && !currentUser) {
      // Handled by ProtectedRoute, but good to stop loading here too
      setIsLoadingReport(false);
    }
  }, [currentUser, userMeta, authLoading]);

  if (authLoading || isLoadingReport) {
    return <LoadingSpinner fullPage />;
  }
  
  if (!userMeta?.hasGeneratedReport && !error) {
     return (
        <ProtectedRoute checkMeta={reportCheck} redirectPath="/questionnaire">
            <div className="flex items-center justify-center py-12">
                <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Almost There!</CardTitle>
                    <CardDescription>Your report is not ready yet. Please complete the questionnaire and payment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                     {!userMeta?.questionnaireComplete && (
                        <Button asChild size="lg" className="w-full">
                            <Link href="/questionnaire">Complete Questionnaire</Link>
                        </Button>
                     )}
                    {userMeta?.questionnaireComplete && !userMeta?.hasPaid && (
                         <Button asChild size="lg" className="w-full">
                            <Link href="/payment">Proceed to Payment</Link>
                        </Button>
                    )}
                </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
     );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Error Loading Report</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <ProtectedRoute checkMeta={reportCheck} redirectPath="/questionnaire">
      <div className="max-w-4xl mx-auto py-8">
        {report ? (
          <ReportDisplay report={report} />
        ) : (
          // This case should ideally be covered by error or loading states
          <p>No report available.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
