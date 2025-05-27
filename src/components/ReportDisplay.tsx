"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ScrollArea} from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { UserReportData } from "@/types";
import { Mail, Download } from "lucide-react";
import { format } from "date-fns";
import { marked } from "marked";
import html2pdf from "html2pdf.js";

interface ReportDisplayProps {
  report: UserReportData;
}

export default function ReportDisplay({ report }: ReportDisplayProps) {
  const { toast } = useToast();

  const [html2pdf, setHtml2pdf] = useState<any>(null); // State to hold dynamically imported html2pdf
  const [recommendationsHtml, setRecommendationsHtml] = useState("");
  const handleDownloadPdf = () => { // Check if html2pdf is loaded before using it
    const reportContentElement = document.getElementById("report-content-for-pdf");
    if (reportContentElement) {
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: "PerfectlyStyled_Report.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
      };
 if (html2pdf) {
 html2pdf()
 .from(reportContentElement)
 .set(opt)
 .save()
 .catch((err: any) => {
 console.error("PDF generation error:", err);
 toast({
 title: "PDF Download Failed",
 description: "Could not generate PDF. Please try again.",
 variant: "destructive"
 });
          });
    } else {
      toast({
        title: "Error",
        description: "Report content not found for PDF generation.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const processMarkdown = async () => {
      const html = await marked(report.recommendations || "");
      setRecommendationsHtml(html as string); // Cast to string as marked can return Promise<string> or string
    };
    if (report.recommendations) processMarkdown();

    // Dynamically import html2pdf.js
    import('html2pdf.js').then(module => {
 setHtml2pdf(() => module.default);
    });
  }, [report.recommendations]);

  const { questionnaireData, recipientEmail, generatedAtClient } = report;

  let displayDate = "Not specified";
  if (generatedAtClient) {
    try {
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
        <CardTitle className="text-3xl font-bold text-primary">Your Personalised Style Report</CardTitle>
        <CardDescription>
          {recipientEmail && <p className="text-sm mb-1">For: {recipientEmail}</p>}
          Generated on: {displayDate}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-secondary-foreground mb-4">Your Inputs Summary</h2>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">Line Analysis</h3>
              <ul className="list-disc pl-6">
                {questionnaireData?.lineAnswers.map((item, index) => (
                  <li key={index}>
                    <strong>{item.bodyPart}:</strong> {item.answer} (<em>{item.classification}</em>)
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary mb-2">Scale Assessment</h3>
              <ul className="list-disc pl-6">
                {questionnaireData?.scaleAnswers.map((item, index) => (
                  <li key={index}>
                    <strong>{item.category}:</strong> {item.answer}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-base">
              <strong>Body Shape:</strong> {questionnaireData?.bodyShape}
            </p>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-bold text-secondary-foreground mb-2">Styling Recommendations</h2>
          <ScrollArea className="h-96 p-4 border rounded-lg bg-white">
            <div
              id="report-content-for-pdf"
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: recommendationsHtml }}
            />
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Scroll down within the box above to read your full report.
          </p>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
        <Button onClick={handleDownloadPdf} variant="outline" disabled={!html2pdf}> {/* Disable button until html2pdf is loaded */}
          <Download className="mr-2 h-4 w-4" /> Download as PDF
        </Button>
        {recipientEmail && (
          <Button variant="outline" asChild>
            <a
              href={`mailto:${recipientEmail}?subject=Your%20Perfectly%20Styled%20Report&body=Here%20is%20your%20personalised%20style%20report!`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail className="mr-2 h-4 w-4" /> Email Again (Draft)
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

