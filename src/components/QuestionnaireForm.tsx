"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { QuestionnaireData } from "@/types";
import LoadingSpinner from "./LoadingSpinner";

const stepSchemas = [
  z.object({ dominantLine: z.string().min(1, "Please select your dominant line.") }),
  z.object({ bodyShape: z.string().min(1, "Please select your body shape.") }),
  z.object({ scale: z.string().min(1, "Please select your scale.") }),
  z.object({ preferences: z.string().min(10, "Please describe your preferences (min 10 characters).").max(500, "Preferences cannot exceed 500 characters.") }),
];

const combinedSchema = z.object({
  dominantLine: z.string().min(1, "Please select your dominant line."),
  bodyShape: z.string().min(1, "Please select your body shape."),
  scale: z.string().min(1, "Please select your scale."),
  preferences: z.string().min(10, "Please describe your preferences (min 10 characters).").max(500, "Preferences cannot exceed 500 characters."),
});


type QuestionnaireFormValues = z.infer<typeof combinedSchema>;

interface QuestionnaireFormProps {
  onSubmit: (data: QuestionnaireData) => Promise<void>;
  initialData?: Partial<QuestionnaireData>;
}

const dominantLines = ["Straight", "Curved", "Balanced"];
const bodyShapes = ["Hourglass", "Pear", "Apple", "Rectangle", "Inverted Triangle"];
const scales = ["Small", "Medium", "Large"];

const stepTitles = [
  "Dominant Line",
  "Body Shape",
  "Scale",
  "Style Preferences"
];

const stepDescriptions = [
  "Understanding your dominant line (overall silhouette) helps in choosing clothes that echo your natural form.",
  "Your body shape guides choices for flattering cuts and proportions.",
  "Scale refers to your bone structure and overall frame, influencing print sizes and accessory choices.",
  "Tell us about your style goals, favorite pieces, or any specific advice you're seeking."
];

export default function QuestionnaireForm({ onSubmit, initialData }: QuestionnaireFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(stepSchemas[currentStep]), // Validate current step only
    defaultValues: {
      dominantLine: initialData?.dominantLine || "",
      bodyShape: initialData?.bodyShape || "",
      scale: initialData?.scale || "",
      preferences: initialData?.preferences || "",
    },
    mode: "onChange", // Re-validate on change for better UX
  });

  const handleNext = async () => {
    // Trigger validation for current step fields
    const fieldsToValidate: (keyof QuestionnaireFormValues)[] = Object.keys(stepSchemas[currentStep].shape) as (keyof QuestionnaireFormValues)[];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < stepSchemas.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // This is the final submit
        await form.handleSubmit(onFinalSubmit)();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  const onFinalSubmit = async (data: QuestionnaireFormValues) => {
    setIsLoading(true);
    // Ensure all data is passed to the onSubmit prop
    const fullData: QuestionnaireData = {
      dominantLine: data.dominantLine,
      bodyShape: data.bodyShape,
      scale: data.scale,
      preferences: data.preferences,
    };
    await onSubmit(fullData);
    setIsLoading(false);
  };

  const progressValue = ((currentStep + 1) / stepSchemas.length) * 100;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">{stepTitles[currentStep]}</CardTitle>
        <CardDescription>{stepDescriptions[currentStep]}</CardDescription>
        <Progress value={progressValue} className="mt-2" />
        <p className="text-sm text-muted-foreground mt-1 text-right">Step {currentStep + 1} of {stepSchemas.length}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-8">
            {currentStep === 0 && (
              <FormField
                control={form.control}
                name="dominantLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your dominant line?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your dominant line" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dominantLines.map((line) => (
                          <SelectItem key={line} value={line}>{line}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      E.g., Straight lines for angular features, Curved for softer features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {currentStep === 1 && (
              <FormField
                control={form.control}
                name="bodyShape"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your body shape?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your body shape" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bodyShapes.map((shape) => (
                          <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Common shapes include Hourglass, Pear, Apple, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {currentStep === 2 && (
              <FormField
                control={form.control}
                name="scale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What is your scale?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your scale" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scales.map((sc) => (
                          <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This refers to your bone structure (e.g., Small for delicate, Large for broader).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {currentStep === 3 && (
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style Preferences & Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your style goals, preferred colors, types of clothing you like or dislike, occasions you typically dress for, etc."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Help us understand what you're looking for. (Min 10, Max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             {/* Hidden submit button to allow form.handleSubmit to be called via Enter key if desired. */}
            {currentStep === stepSchemas.length -1 && <button type="submit" style={{display: "none"}} disabled={isLoading} />}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isLoading}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {currentStep < stepSchemas.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={isLoading}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} className="mr-2"/> : <Send className="mr-2 h-4 w-4" />}
            Submit for Analysis
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
