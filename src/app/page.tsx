'use client';
import { useDocumentStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import TitleStep from '@/components/TitleStep';
import CriteriaStep from '@/components/CriteriaStep';
import GenerateStep from '@/components/GenerateStep';
import SavedDocuments from '@/components/SavedDocuments';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown } from 'lucide-react';
import { ImportDialog } from '@/components/ImportDialog';

const steps = [
  { title: 'Document Details', component: TitleStep },
  { title: 'Acceptance Criteria', component: CriteriaStep },
  { title: 'Generated Documentation', component: GenerateStep }
];

export default function Home() {
  const { currentStep } = useDocumentStore();
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/10">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Saved Documents</h2>
        </div>
        <SavedDocuments />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 space-y-4">
              <h1 className="text-2xl font-bold">Confluence Documentation Generator</h1>
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-muted/50 p-4 font-semibold hover:bg-muted/70">
                  <span>How It Works</span>
                  <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-b-lg bg-muted/50 p-6 space-y-4">
                  <ol className="space-y-4">
                    <li className="flex gap-4">
                      <span className="font-bold text-primary">1.</span>
                      <div>
                        <p className="font-medium">Input Collection</p>
                        <p className="text-sm text-muted-foreground">Enter document title, description, and optionally add acceptance criteria and test cases.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="font-bold text-primary">2.</span>
                      <div>
                        <p className="font-medium">Documentation Generation</p>
                        <p className="text-sm text-muted-foreground">AI processes your inputs and generates structured documentation with proper formatting.</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="font-bold text-primary">3.</span>
                      <div>
                        <p className="font-medium">Review and Refinement</p>
                        <p className="text-sm text-muted-foreground">Review the generated documentation and provide feedback for improvements if needed.</p>
                      </div>
                    </li>
                  </ol>
                </CollapsibleContent>
              </Collapsible>

              <Progress value={(currentStep + 1) * 33} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            
            {currentStep === 0 && <ImportDialog />}
            
            <div className="bg-background p-6 rounded-lg shadow">
              <CurrentStepComponent />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
