<<<<<<< HEAD
"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
=======

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
>>>>>>> master
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
<<<<<<< HEAD
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
=======
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import type { QuestionnaireData, LineAnswer, ScaleAnswer } from "@/types";
import LoadingSpinner from "./LoadingSpinner";
// useAuth removed
import Image from "next/image";

// Schemas for individual form fields
const lineAnswerSchema = z.string().min(1, "Please select an option.");
const scaleAnswerSchema = z.string().min(1, "Please select an option.");
const bodyShapeSchema = z.string().min(1, "Please select your body shape.");

const combinedSchema = z.object({
  shoulders_answer: lineAnswerSchema,
  waist_answer: lineAnswerSchema,
  hips_answer: lineAnswerSchema,
  face_answer: lineAnswerSchema,
  jawline_answer: lineAnswerSchema,
  wrist_answer: scaleAnswerSchema,
  height_answer: scaleAnswerSchema,
  shoeSize_answer: scaleAnswerSchema,
  bodyShape: bodyShapeSchema,
});

type QuestionnaireFormValues = z.infer<typeof combinedSchema>;

const stepSchemas: z.ZodObject<any, any, any, any, any>[] = [
  z.object({
    shoulders_answer: lineAnswerSchema,
    waist_answer: lineAnswerSchema,
    hips_answer: lineAnswerSchema,
  }),
  z.object({
    face_answer: lineAnswerSchema,
    jawline_answer: lineAnswerSchema,
  }),
  z.object({
    wrist_answer: scaleAnswerSchema,
    height_answer: scaleAnswerSchema,
    shoeSize_answer: scaleAnswerSchema,
  }),
  z.object({
    bodyShape: bodyShapeSchema,
  }),
];


interface QuestionnaireFormProps {
  onSubmit: (data: QuestionnaireData) => Promise<void>; // Preferences removed
  initialData?: Partial<QuestionnaireData>;
}

const lineOptions = {
  shoulders: [
    { value: "straight", label: "Straight", classification: "straight" },
    { value: "sloping", label: "Sloping", classification: "curved" },
  ],
  waist: [
    { value: "defined", label: "Defined", classification: "curved" },
    { value: "undefined", label: "Undefined", classification: "straight" },
  ],
  hips: [
    { value: "flared", label: "Flared", classification: "curved" },
    { value: "straight", label: "Straight", classification: "straight" },
  ],
  face: [
    { value: "straight/thin lips", label: "Straight/thin lips", classification: "straight" },
    { value: "curved/full lips", label: "Curved/full lips", classification: "curved" },
  ],
  jawline: [
    { value: "curved", label: "Curved", classification: "curved" },
    { value: "angular", label: "Angular", classification: "straight" },
  ],
};

const scaleOptions = {
  wrist: [
    { value: "Small - 5.5” (14cm) or less", label: "Small - 5.5” (14cm) or less" },
    { value: "Medium - 5.5 – 6.5” (14-16cm)", label: "Medium - 5.5 – 6.5” (14-16cm)" },
    { value: "Large 6.5 (16.5cm) or more", label: "Large 6.5 (16.5cm) or more" },
  ],
  height: [
    { value: "Small - Under 5’3” (1.6m)", label: "Small - Under 5’3” (1.6m)" },
    { value: "Medium - 5’3” – 5’8” (1.6-1.72m)", label: "Medium - 5’3” – 5’8” (1.6-1.72m)" },
    { value: "Large – 5’8” (1.72m) and over", label: "Large – 5’8” (1.72m) and over" },
  ],
  shoeSize: [
    { value: "Small – 35 – 37", label: "Small – 35 – 37" },
    { value: "Medium – 38 - 39", label: "Medium – 38 - 39" },
    { value: "Large – 40+", label: "Large – 40+" },
  ],
};

const bodyShapeOptions = [
  { name: "Pear Shape", description: "Smaller upper body, often with narrow shoulders and/or a petite bust. The waist is defined, leading to broader hips. This shape often includes full thighs and a more prominent lower body.", dataAiHint: "fashion illustration" },
  { name: "Inverted Triangle", description: "Shoulders are wider than the hips, often accompanied by a fuller bust. Typically, this shape also features a shorter waist.", dataAiHint: "fashion sketch" },
  { name: "Straight", description: "Hips and shoulders are aligned with little to no waist definition, creating an overall straight silhouette. Often gives a boxy or column-like appearance.", dataAiHint: "mannequin outline" },
  { name: "Round/Apple", description: "A rounded figure with fullness throughout. The waist is less defined, creating a naturally curvy outline.", dataAiHint: "body shape" },
  { name: "Hourglass", description: "Balanced proportions between shoulders and hips, with a well-defined waist that is typically 8-10 inches smaller than the hips. Curves are evenly distributed, with straight shoulders and a rounded lower body.", dataAiHint: "classic silhouette" },
];


const stepTitles = [
  "Line Analysis (Part 1)",
  "Line Analysis (Part 2)",
  "Scale Assessment",
  "Horizontal Proportion (Body Shape)",
];

const stepDescriptions = [
  "Let's analyze the lines of your body structure (Shoulders, Waist, Hips).",
  "Continuing our line analysis (Face, Jawline).",
  "Let's determine your scale based on measurements.",
  "Try holding a meter stick against your shoulders (or ask a friend to help) and let it hang straight down. Observe where it aligns with your hips to get a better idea of your body shape.",
];

const PENDING_QUESTIONNAIRE_KEY = "pendingQuestionnaireData_v2";

export default function QuestionnaireForm({ onSubmit, initialData }: QuestionnaireFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // authLoading removed

  const transformInitialDataToFormValues = (data?: Partial<QuestionnaireData>): Partial<QuestionnaireFormValues> => {
    if (!data) return {};
    const formValues: Partial<QuestionnaireFormValues> = { bodyShape: data.bodyShape as QuestionnaireFormValues['bodyShape'] };
    data.lineAnswers?.forEach(la => {
      if (la.bodyPart === 'Shoulders') formValues.shoulders_answer = la.answer;
      if (la.bodyPart === 'Waist') formValues.waist_answer = la.answer;
      if (la.bodyPart === 'Hips') formValues.hips_answer = la.answer;
      if (la.bodyPart === 'Face') formValues.face_answer = la.answer;
      if (la.bodyPart === 'Jawline') formValues.jawline_answer = la.answer;
    });
    data.scaleAnswers?.forEach(sa => {
      if (sa.category === 'Wrist Circumference') formValues.wrist_answer = sa.answer;
      if (sa.category === 'Height') formValues.height_answer = sa.answer;
      if (sa.category === 'Shoe Size') formValues.shoeSize_answer = sa.answer;
    });
    return formValues;
  };
  
  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(combinedSchema), // Use combinedSchema for the resolver
    defaultValues: {
      shoulders_answer: transformInitialDataToFormValues(initialData).shoulders_answer || undefined,
      waist_answer: transformInitialDataToFormValues(initialData).waist_answer || undefined,
      hips_answer: transformInitialDataToFormValues(initialData).hips_answer || undefined,
      face_answer: transformInitialDataToFormValues(initialData).face_answer || undefined,
      jawline_answer: transformInitialDataToFormValues(initialData).jawline_answer || undefined,
      wrist_answer: transformInitialDataToFormValues(initialData).wrist_answer || undefined,
      height_answer: transformInitialDataToFormValues(initialData).height_answer || undefined,
      shoeSize_answer: transformInitialDataToFormValues(initialData).shoeSize_answer || undefined,
      bodyShape: transformInitialDataToFormValues(initialData).bodyShape || undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    // Removed currentUser and authLoading check, always try to load from localStorage
    const pendingDataString = localStorage.getItem(PENDING_QUESTIONNAIRE_KEY);
    if (pendingDataString) {
      try {
        const pendingData = JSON.parse(pendingDataString) as QuestionnaireData;
        form.reset(transformInitialDataToFormValues(pendingData));
      } catch (e) {
        console.error("Error parsing pending questionnaire data from localStorage:", e);
      }
    }
  }, [form]);

  const getClassification = (bodyPartKey: keyof typeof lineOptions, answer: string): 'straight' | 'curved' => {
    const option = lineOptions[bodyPartKey].find(opt => opt.value === answer);
    return option ? option.classification as 'straight' | 'curved' : 'straight'; 
  };

  const onFinalSubmit = async (data: QuestionnaireFormValues) => {
    setIsLoading(true);
    const lineAnswers: LineAnswer[] = [
      { bodyPart: 'Shoulders', answer: data.shoulders_answer, classification: getClassification('shoulders', data.shoulders_answer) },
      { bodyPart: 'Waist', answer: data.waist_answer, classification: getClassification('waist', data.waist_answer) },
      { bodyPart: 'Hips', answer: data.hips_answer, classification: getClassification('hips', data.hips_answer) },
      { bodyPart: 'Face', answer: data.face_answer, classification: getClassification('face', data.face_answer) },
      { bodyPart: 'Jawline', answer: data.jawline_answer, classification: getClassification('jawline', data.jawline_answer) },
    ];
    const scaleAnswers: ScaleAnswer[] = [
      { category: 'Wrist Circumference', answer: data.wrist_answer },
      { category: 'Height', answer: data.height_answer },
      { category: 'Shoe Size', answer: data.shoeSize_answer },
    ];

    const fullData: QuestionnaireData = { // Preferences removed
      lineAnswers,
      scaleAnswers,
      bodyShape: data.bodyShape as QuestionnaireData['bodyShape'],
    };
    await onSubmit(fullData);
    setIsLoading(false);
  };

  const handleNext = async () => {
    const currentStepSchemaDef = stepSchemas[currentStep];
    let fieldsToValidate: (keyof QuestionnaireFormValues)[] = [];

    if (currentStepSchemaDef && typeof currentStepSchemaDef.shape === 'object' && currentStepSchemaDef.shape !== null) {
      fieldsToValidate = Object.keys(
        currentStepSchemaDef.shape
      ) as (keyof QuestionnaireFormValues)[];
    } else {
      console.warn(`Step schema for step ${currentStep} is not a ZodObject or shape is undefined.`);
    }
    
    if (fieldsToValidate.length === 0 && currentStep < stepSchemas.length) {
        console.warn(`No fields identified for validation for step ${currentStep}. Proceeding or submitting.`);
    }

    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;
    
>>>>>>> master
    if (isValid) {
      if (currentStep < stepSchemas.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
<<<<<<< HEAD
        // This is the final submit
=======
>>>>>>> master
        await form.handleSubmit(onFinalSubmit)();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
<<<<<<< HEAD
  
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

=======

  const progressValue = ((currentStep + 1) / stepSchemas.length) * 100;

  const renderRadioGroup = (fieldName: keyof QuestionnaireFormValues, label: string, options: { value: string, label: string }[], description?: string) => (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-base font-semibold">{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value || ""} 
              className="flex flex-col space-y-2"
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal text-sm">
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

>>>>>>> master
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
<<<<<<< HEAD
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
=======
              <>
                {renderRadioGroup("shoulders_answer", "Shoulders:", lineOptions.shoulders)}
                {renderRadioGroup("waist_answer", "Waist:", lineOptions.waist, "A defined waist is at least 8 inches narrower than the bust and hips, when looking at yourself straight on. Example: Bust: 38 inches, Waist: 28 inches, Hips: 38–40 inches")}
                {renderRadioGroup("hips_answer", "Hips:", lineOptions.hips)}
              </>
            )}
            {currentStep === 1 && (
              <>
                {renderRadioGroup("face_answer", "Face (Lips):", lineOptions.face)}
                {renderRadioGroup("jawline_answer", "Jawline:", lineOptions.jawline)}
              </>
            )}
            {currentStep === 2 && (
              <>
                {renderRadioGroup("wrist_answer", "Circumference of wrist:", scaleOptions.wrist)}
                {renderRadioGroup("height_answer", "Height:", scaleOptions.height)}
                {renderRadioGroup("shoeSize_answer", "Shoe size:", scaleOptions.shoeSize)}
              </>
            )}
            {currentStep === 3 && ( 
>>>>>>> master
              <FormField
                control={form.control}
                name="bodyShape"
                render={({ field }) => (
<<<<<<< HEAD
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
=======
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Select Your Body Shape:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        className="space-y-4"
                      >
                        {bodyShapeOptions.map((option) => (
                          <FormItem key={option.name} className="border p-4 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start space-x-3">
                               <FormControl>
                                <RadioGroupItem value={option.name} id={option.name.replace(/\s+/g, '')} />
                               </FormControl>
                              <div className="flex-1">
                                <FormLabel htmlFor={option.name.replace(/\s+/g, '')} className="font-semibold text-md cursor-pointer">
                                  {option.name}
                                </FormLabel>
                                <Image 
                                  src={`https://placehold.co/200x300.png`} 
                                  alt={option.name} 
                                  data-ai-hint={option.dataAiHint}
                                  width={100} 
                                  height={150} 
                                  className="my-2 rounded-md float-right ml-4 aspect-[2/3] object-cover" 
                                />
                                <p className="text-sm text-muted-foreground mt-1 pr-2">{option.description}</p>
                              </div>
                            </div>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
>>>>>>> master
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
<<<<<<< HEAD
             {/* Hidden submit button to allow form.handleSubmit to be called via Enter key if desired. */}
            {currentStep === stepSchemas.length -1 && <button type="submit" style={{display: "none"}} disabled={isLoading} />}
=======
            {/* This button is only for triggering the form submission logic if using enter key, etc. */}
            {currentStep === stepSchemas.length - 1 && <button type="submit" style={{display: "none"}} disabled={isLoading} />}
>>>>>>> master
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
<<<<<<< HEAD
        ) : (
          <Button type="button" onClick={handleNext} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} className="mr-2"/> : <Send className="mr-2 h-4 w-4" />}
            Submit for Analysis
=======
        ) : ( 
          <Button type="button" onClick={handleNext} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size={20} className="mr-2"/> : <Send className="mr-2 h-4 w-4" />}
            {/* Button text updated */}
            Proceed to Payment
>>>>>>> master
          </Button>
        )}
      </CardFooter>
    </Card>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> master
