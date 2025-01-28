'use client';
import MDEditor from '@uiw/react-md-editor';
import { Button } from '@/components/ui/button';
import { useDocumentStore } from '@/lib/store';
import { useChat } from 'ai/react';
import { Progress } from '@/components/ui/progress';
import rehypeSanitize from "rehype-sanitize";
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { HTMLAttributes } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';

type MarkdownProps = HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

type TableCellProps = HTMLAttributes<HTMLTableCellElement> & {
  children?: React.ReactNode;
};

type TableProps = HTMLAttributes<HTMLTableElement> & {
  children?: React.ReactNode;
};

const markdownComponents = {
  h2: ({ children, ...props }: MarkdownProps) => (
    <h2 className="text-xl font-semibold mt-6 mb-4" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: MarkdownProps) => (
    <h3 className="text-lg font-medium mt-4 mb-2" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: MarkdownProps) => (
    <p className="my-2" {...props}>{children}</p>
  ),
  table: ({ children, ...props }: TableProps) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse bg-card text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: TableCellProps) => (
    <th className="border border-border bg-muted/90 px-4 py-2 text-left font-medium text-muted-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: TableCellProps) => (
    <td className="border border-border px-4 py-2 text-foreground bg-muted" {...props}>
      {children}
    </td>
  ),
  pre: ({ children, ...props }: MarkdownProps) => (
    <pre className="my-1 p-3 rounded-lg overflow-x-auto bg-gray-800 text-gray-100 dark:bg-gray-800 dark:text-gray-100" {...props}>
      {children}
    </pre>
  ),
  code: ({ children, className, ...props }: MarkdownProps & { className?: string }) => {
    const isInlineCode = !className;
    return (
      <code
        className={`${className || ''} ${
          isInlineCode 
            ? 'px-1 py-0.5 rounded font-mono text-sm bg-gray-800 text-gray-100 dark:bg-gray-800 dark:text-gray-100'
            : 'block bg-gray-800 text-gray-100 dark:bg-gray-800 dark:text-gray-100'
        }`}
        {...props}
      >
        {children}
      </code>
    );
  },
  ul: ({ children, ...props }: MarkdownProps) => (
    <ul className="my-2 ml-6 list-disc" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: MarkdownProps) => (
    <ol className="my-2 ml-6 list-decimal" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: MarkdownProps) => (
    <li className="my-1" {...props}>{children}</li>
  )
};

export default function GenerateStep() {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  
  const { 
    generatedContent, 
    setGeneratedContent, 
    currentStep,
    title,
    description,
    acceptanceCriteria,
    testCases,
    versions,
    currentVersionIndex,
    setVersion,
    reset
  } = useDocumentStore();

  const { input, handleInputChange, isLoading, setInput } = useChat({
    api: '/api/generate',
    onFinish: (message) => {
      try {
        const data = JSON.parse(message.content);
        setGeneratedContent(data.content, input);
        setError(null);
        // Clear input after successful generation
        setInput('');
      } catch (error) {
        console.error('Error parsing response:', error);
        setError('Failed to parse the generated documentation');
        setGeneratedContent(message.content, input);
      }
    }
  });

  const { toast } = useToast();

  // Add useEffect for progress animation
  useEffect(() => {
    if (!generatedContent) {
      const startTime = Date.now();
      const duration = 15000; // 15 seconds
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        
        if (newProgress < 100) {
          setProgress(newProgress);
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [generatedContent]);

  const handleRegenerateWithFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);
    setIsRegenerating(true);
    
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
                Current documentation:
                ${generatedContent}

                Please refine the above documentation with the following feedback while maintaining its structure and format:
                ${input}

                Original parameters:
                Title: ${title}
                Description: ${description}
                ${acceptanceCriteria ? `Acceptance Criteria:\n${acceptanceCriteria}` : ''}
                ${testCases ? `Test Cases:\n${testCases}` : ''}
              `.trim()
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate documentation');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content, input);
      setError(null);
      // Clear input after successful regeneration
      setInput('');
    } catch (error) {
      console.error('Error regenerating documentation:', error);
      setError(error instanceof Error ? error.message : 'Failed to regenerate documentation');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    const savedDocs = JSON.parse(localStorage.getItem('savedDocuments') || '[]');
    const newDoc = {
      id: crypto.randomUUID(),
      title,
      description,
      content: generatedContent,
      timestamp: new Date().toISOString(),
    };
    savedDocs.push(newDoc);
    localStorage.setItem('savedDocuments', JSON.stringify(savedDocs));
    toast({
      title: "Documentation Saved",
      description: "Your documentation has been saved to local storage.",
      duration: 3000,
    });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied to clipboard",
      description: "Documentation has been copied to your clipboard.",
    });
  };

  const handleStartOver = () => {
    setShowStartOverDialog(true);
  };

  const handleConfirmStartOver = () => {
    reset();
    setShowStartOverDialog(false);
    window.location.href = '/';
  };

  if (!generatedContent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Step {currentStep + 1}: Generated Documentation</h2>
          <Button variant="destructive" className='bg-rose-500 hover:bg-rose-600' onClick={handleStartOver}>
            Start Over
          </Button>
        </div>

        <div className="text-center py-12 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Generating documentation...</span>
              <span>Please wait</span>
            </div>
            <Progress value={progress} className="h-2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Step {currentStep + 1}: Generated Documentation</h2>
        <Button variant="destructive" className='bg-rose-500 hover:bg-rose-600' onClick={handleStartOver}>
          Start Over
        </Button>
      </div>

      {generatedContent && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </Button>
        </div>
      )}

      {!generatedContent ? (
        <div className="text-center py-12 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Generating documentation...</span>
              <span>Please wait</span>
            </div>
            <Progress value={progress} className="h-2 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          <Dialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This will reset all your progress and start over from the beginning.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowStartOverDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" className='bg-rose-500 hover:bg-rose-600' onClick={handleConfirmStartOver}>
                  Start Over
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {versions.length > 1 && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Version History</h3>
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={version.timestamp}
                    className={`p-2 rounded cursor-pointer hover:bg-accent ${
                      index === currentVersionIndex ? 'bg-accent' : ''
                    }`}
                    onClick={() => setVersion(index)}
                  >
                    <div className="flex justify-between text-sm">
                      <span>Version {version.version}</span>
                      <span className="text-muted-foreground">
                        {format(version.timestamp, 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {version.feedback && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Feedback: {version.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Generating documentation...</span>
                <span>Please wait</span>
              </div>
              <Progress value={progress} className="h-2 animate-pulse" />
            </div>
          )}

          <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none dark:prose-invert bg-background rounded-lg p-6">
            <MDEditor.Markdown 
              source={generatedContent} 
              rehypePlugins={[rehypeSanitize]}
              style={{ 
                backgroundColor: 'transparent',
                color: 'inherit',
                fontFamily: 'inherit'
              }}
              components={markdownComponents}
            />
          </div>
        
          <form onSubmit={handleRegenerateWithFeedback} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Feedback/Edits
              </label>
              <textarea
                className="w-full p-2 border rounded-md h-32 disabled:opacity-50"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter your feedback to improve the documentation..."
                disabled={isRegenerating}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="submit" 
                variant="secondary" 
                disabled={isRegenerating || !input.trim()}
                className="min-w-[200px]"
              >
                {isRegenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Regenerating...
                  </div>
                ) : (
                  'Regenerate with Feedback'
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
