
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { UserReportData } from "@/types"; 
import { ClipboardCopy, Printer, Mail } from "lucide-react";
import { format } from 'date-fns';

interface ReportDisplayProps {
  report: UserReportData; 
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (report?.recommendations) {
      navigator.clipboard.writeText(report.recommendations)
        .then(() => {
          toast({ title: "Copied to clipboard!", description: "Report content copied." });
        })
        .catch(err => {
          toast({ title: "Copy failed", description: "Could not copy report to clipboard.", variant: "destructive" });
        });
    } else {
      toast({ title: "Nothing to copy", description: "Report content is empty.", variant: "destructive" });
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const { questionnaireData, recipientEmail, generatedAtClient } = report;

  let displayDate = "Not specified";
  if (generatedAtClient) {
    try {
      // Ensure generatedAtClient is a valid date string or number before parsing
      const dateValue = new Date(generatedAtClient);
      if (!isNaN(dateValue.getTime())) {
        displayDate = format(dateValue, "MMMM d, yyyy 'at' h:mm a");
      } else {
        displayDate = "Invalid date provided";
        console.warn("Could not format generatedAtClient date (invalid):", generatedAtClient);
      }
    } catch (e) {
      console.warn("Could not format generatedAtClient date (error):", generatedAtClient, e);
      displayDate = "Date format error";
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Your Personalized Style Report</CardTitle>
        <CardDescription>
          {recipientEmail && <p className="text-sm mb-1">For: {recipientEmail}</p>}
          Generated on: {displayDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-secondary-foreground">Your Inputs Summary</h3>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <h4 className="font-medium text-md">Line Analysis:</h4>
              {questionnaireData?.lineAnswers.map((item, index) => (
                <p key={index} className="text-sm ml-4">
                  <strong>{item.bodyPart}:</strong> {item.answer} (<em>{item.classification}</em>)
                </p>
              ))}
            </div>
            <div>
              <h4 className="font-medium text-md">Scale Assessment:</h4>
              {questionnaireData?.scaleAnswers.map((item, index) => (
                <p key={index} className="text-sm ml-4">
                  <strong>{item.category}:</strong> {item.answer}
                </p>
              ))}
            </div>
            <p className="text-sm"><strong>Body Shape:</strong> {questionnaireData?.bodyShape}</p>
          </div>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-2 text-secondary-foreground">Styling Recommendations</h3>
          <h2 className="text-xl font-semibold mb-2 text-secondary-foreground">Please use the scroll bar within the report box to view your full report.</h2>
          <ScrollArea className="h-96 p-4 border rounded-lg bg-background">
            <div 
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: report.recommendations ? report.recommendations.replace(/\n/g, '<br />') : "" }} 
            />
          </ScrollArea>
          <p className="text-xs text-muted-foreground text-center mt-2">Scroll down to read the full report.</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
        <Button onClick={handleCopyToClipboard} variant="outline">
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Report Text
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print Report
        </Button>
        {recipientEmail && (
          <Button variant="outline" asChild>
            <a href={`mailto:${recipientEmail}?subject=Your Perfectly Styled Report&body=Here is your personalized style report!`} target="_blank" rel="noopener noreferrer">
              <Mail className="mr-2 h-4 w-4" /> Email Again (Draft)
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
