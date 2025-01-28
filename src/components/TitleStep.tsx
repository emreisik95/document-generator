'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentStore } from '@/lib/store';
import { ImportDialog } from './ImportDialog';

export default function TitleStep() {
  const { title, description, setTitle, setDescription, nextStep } = useDocumentStore();

  const handleContinue = () => {
    if (!title.trim()) return;
    nextStep();
  };

  return (
    <div className="space-y-6">
              <ImportDialog />

      <div>
        <label className="block text-sm font-medium mb-2">Document Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description (optional)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose and scope"
          rows={4}
        />
      </div>
      <Button onClick={handleContinue} disabled={!title.trim()} className="w-full">Continue</Button>
    </div>
  );
}
