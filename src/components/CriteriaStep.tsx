'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';

export default function CriteriaStep() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    acceptanceCriteria, 
    testCases,
    title,
    description, 
    setAcceptanceCriteria, 
    setTestCases,
    setGeneratedContent,
    nextStep 
  } = useDocumentStore();

  const handleGenerate = async () => {
    if (!title) {
      console.error('Missing title');
      return;
    }

    setIsGenerating(true);
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
              content: `
                Generate documentation for:
                Title: ${title}
                ${description ? `Description: ${description}` : ''}
                ${acceptanceCriteria ? `Acceptance Criteria:\n${acceptanceCriteria}` : ''}
                ${testCases ? `Test Cases:\n${testCases}` : ''}
              `.trim(),
              role: 'user'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate documentation');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Error generating documentation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Acceptance Criteria (optional)</label>
        <Textarea
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder="List key acceptance criteria"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Test Cases (optional)</label>
        <Textarea
          value={testCases}
          onChange={(e) => setTestCases(e.target.value)}
          placeholder="Describe test scenarios"
          rows={4}
        />
      </div>
      
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Generating documentation...</span>
            <span>Please wait</span>
          </div>
          <Progress value={40} className="h-2 animate-pulse" />
        </div>
      )}

      <Button 
        onClick={handleGenerate} 
        className="w-full"
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Documentation'}
      </Button>
    </div>
  );
}
