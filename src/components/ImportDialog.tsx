'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useDocumentStore } from '@/lib/store';

export function ImportDialog() {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [existingDoc, setExistingDoc] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const setGeneratedContent = useDocumentStore(state => state.setGeneratedContent);
  const setTitle = useDocumentStore(state => state.setTitle);
  const setDescription = useDocumentStore(state => state.setDescription);
  const setStep = useDocumentStore(state => state.setStep);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingDoc.trim() || !importFeedback.trim()) return;

    setIsImporting(true);
    
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
                Here's an existing Confluence documentation:
                ${existingDoc}

                Please improve this documentation with the following requirements/feedback:
                ${importFeedback}

                Make sure to:
                1. Maintain proper markdown formatting
                2. Keep the useful information from the original
                3. Address all feedback points
                4. Improve clarity and structure
                5. Add any missing sections that would be valuable

                Also, please provide a concise title and description for this documentation in the following format:
                TITLE: <one line title>
                DESCRIPTION: <one paragraph description>
                
                Then provide the full documentation after that.
              `.trim()
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve documentation');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Extract title and description from the content
      const content = data.content;
      const titleMatch = content.match(/TITLE:\s*(.+)/);
      const descriptionMatch = content.match(/DESCRIPTION:\s*(.+?)(?=\n\n|\n#|\n$)/);
      
      // Set title and description if found
      if (titleMatch) {
        setTitle(titleMatch[1].trim());
      }
      if (descriptionMatch) {
        setDescription(descriptionMatch[1].trim());
      }

      // Remove the title and description lines from the content
      const cleanContent = content
        .replace(/TITLE:\s*.+\n/, '')
        .replace(/DESCRIPTION:\s*.+\n\n?/, '')
        .trim();

      setGeneratedContent(cleanContent, importFeedback);
      setStep(2); // Move to the Generate step
      setShowImportDialog(false);
      setExistingDoc('');
      setImportFeedback('');
      
      toast({
        title: "Documentation Improved",
        description: "Your existing documentation has been enhanced based on the feedback.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error improving documentation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to improve documentation',
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="pt-4 flex justify-center">
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="lg">
            Use Existing Documentation
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Existing Documentation</DialogTitle>
            <DialogDescription>
              Paste your existing Confluence documentation and provide feedback for improvements.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Existing Documentation
              </label>
              <Textarea
                placeholder="Paste your existing Confluence documentation here..."
                value={existingDoc}
                onChange={(e) => setExistingDoc(e.target.value)}
                className="h-48"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Improvement Requirements
              </label>
              <Textarea
                placeholder="Describe how you want to improve the documentation..."
                value={importFeedback}
                onChange={(e) => setImportFeedback(e.target.value)}
                className="h-32"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowImportDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!existingDoc.trim() || !importFeedback.trim() || isImporting}
              >
                {isImporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Improving...
                  </div>
                ) : (
                  'Improve Documentation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 