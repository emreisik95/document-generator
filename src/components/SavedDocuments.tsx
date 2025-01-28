'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Edit } from 'lucide-react';
import { useDocumentStore } from '@/lib/store';

interface SavedDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  timestamp: string;
}

export default function SavedDocuments() {
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const { toast } = useToast();
  const loadSavedDocument = useDocumentStore(state => state.loadSavedDocument);

  useEffect(() => {
    const loadDocuments = () => {
      const savedDocs = JSON.parse(localStorage.getItem('savedDocuments') || '[]');
      setDocuments(savedDocs.sort((a: SavedDocument, b: SavedDocument) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    loadDocuments();
    window.addEventListener('storage', loadDocuments);
    
    return () => {
      window.removeEventListener('storage', loadDocuments);
    };
  }, []);

  const handleDelete = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    localStorage.setItem('savedDocuments', JSON.stringify(updatedDocs));
    setDocuments(updatedDocs);
    toast({
      title: "Document Deleted",
      description: "The document has been removed from saved documents.",
      duration: 3000,
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Documentation has been copied to your clipboard.",
      duration: 3000,
    });
  };

  const handleEdit = (doc: SavedDocument) => {
    loadSavedDocument(doc);
    toast({
      title: "Document Loaded",
      description: "You can now edit and improve the documentation.",
      duration: 3000,
    });
  };

  if (documents.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No saved documents yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-2rem)]">
      <div className="space-y-4 p-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="rounded-lg border bg-card p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium leading-none">{doc.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(doc.timestamp), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(doc)}
                  className="h-8 w-8"
                >
                  <span className="sr-only">Edit document</span>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(doc.content)}
                  className="h-8 w-8"
                >
                  <span className="sr-only">Copy content</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc.id)}
                  className="h-8 w-8 text-destructive"
                >
                  <span className="sr-only">Delete document</span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {doc.description}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 