'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';

export default function CriteriaStep() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { 
    acceptanceCriteria,
    setAcceptanceCriteria,
    testCases,
    setTestCases,
    nextStep,
    title,
    description,
    setGeneratedContent
  } = useDocumentStore();

  // Add progress animation
  useEffect(() => {
    if (isLoading) {
      const startTime = Date.now();
      const duration = 15000; // 15 seconds
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        
        if (newProgress < 100 && isLoading) {
          setProgress(newProgress);
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    } else {
      setProgress(0);
    }
  }, [isLoading]);

  const handleGenerate = async () => {
    if (!title || !description) {
      return;
    }

    setIsLoading(true);
    nextStep();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `
                Please generate comprehensive documentation with the following details:
                Title: ${title}
                Description: ${description}
                ${acceptanceCriteria ? `Acceptance Criteria:\n${acceptanceCriteria}` : ''}
                ${testCases ? `Test Cases:\n${testCases}` : ''}

                Please ensure the documentation:
                1. Is well-structured and easy to understand
                2. Uses proper markdown formatting
                3. Includes all necessary sections
                4. Maintains a professional tone
                5. Is detailed yet concise
              `.trim()
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Error generating documentation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Acceptance Criteria (Optional)
        </label>
        <Textarea
          placeholder="Enter acceptance criteria..."
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          className="h-32"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Test Cases (Optional)
        </label>
        <Textarea
          placeholder="Enter test cases..."
          value={testCases}
          onChange={(e) => setTestCases(e.target.value)}
          className="h-32"
        />
      </div>
      
      {isLoading && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Generating acceptance criteria...</span>
            <span>Please wait</span>
          </div>
          <Progress value={progress} className="h-2 animate-pulse" />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button 
          onClick={handleGenerate} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Documentation'}
        </Button>
      </div>
    </div>
  );
}
