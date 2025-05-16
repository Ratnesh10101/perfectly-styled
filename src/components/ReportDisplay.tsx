"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { UserReport } from "@/types";
import { ClipboardCopy, Download, Printer } from "lucide-react";
import { format } from 'date-fns';

interface ReportDisplayProps {
  report: UserReport;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(report.recommendations)
      .then(() => {
        toast({ title: "Copied to clipboard!", description: "Report content copied." });
      })
      .catch(err => {
        toast({ title: "Copy failed", description: "Could not copy report to clipboard.", variant: "destructive" });
      });
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Your Personalized Style Report</CardTitle>
        {report.generatedAt && (
           <CardDescription>
            Generated on: {format(report.generatedAt.toDate(), "MMMM d, yyyy 'at' h:mm a")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-secondary-foreground">Your Inputs Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <p><strong>Dominant Line:</strong> {report.questionnaireData.dominantLine}</p>
            <p><strong>Body Shape:</strong> {report.questionnaireData.bodyShape}</p>
            <p><strong>Scale:</strong> {report.questionnaireData.scale}</p>
            <div className="md:col-span-2">
                <p><strong>Preferences:</strong></p>
                <ScrollArea className="h-20 mt-1">
                     <p className="text-sm whitespace-pre-wrap">{report.questionnaireData.preferences}</p>
                </ScrollArea>
            </div>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-2 text-secondary-foreground">Styling Recommendations</h3>
          <ScrollArea className="h-72 p-4 border rounded-lg bg-background">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {report.recommendations}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
        <Button onClick={handleCopyToClipboard} variant="outline">
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Report Text
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
        {/* Placeholder for download functionality if implemented */}
        {/* <Button variant="outline" disabled> 
          <Download className="mr-2 h-4 w-4" /> Download PDF (Coming Soon)
        </Button> */}
      </CardFooter>
    </Card>
  );
}
