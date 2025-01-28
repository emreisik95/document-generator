import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DocumentVersion {
  content: string;
  timestamp: number;
  version: number;
  feedback?: string;
}

type DocumentStore = {
  title: string;
  description: string;
  acceptanceCriteria: string;
  testCases: string;
  generatedContent: string;
  currentStep: number;
  versions: DocumentVersion[];
  currentVersionIndex: number;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setAcceptanceCriteria: (ac: string) => void;
  setTestCases: (tc: string) => void;
  setGeneratedContent: (content: string, feedback?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  addVersion: (content: string, feedback?: string) => void;
  setVersion: (index: number) => void;
  reset: () => void;
  loadSavedDocument: (doc: { title: string; description: string; content: string }) => void;
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      title: '',
      description: '',
      acceptanceCriteria: '',
      testCases: '',
      generatedContent: '',
      currentStep: 0,
      versions: [],
      currentVersionIndex: 0,
      setTitle: (title) => set({ title }),
      setDescription: (description) => set({ description }),
      setAcceptanceCriteria: (acceptanceCriteria) => set({ acceptanceCriteria }),
      setTestCases: (testCases) => set({ testCases }),
      setGeneratedContent: (content, feedback) => 
        set((state) => ({
          generatedContent: content,
          versions: feedback 
            ? [...state.versions, { 
                version: state.versions.length + 1, 
                content, 
                feedback, 
                timestamp: Date.now() 
              }]
            : state.versions,
          currentVersionIndex: feedback 
            ? state.versions.length 
            : state.currentVersionIndex
        })),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),
      addVersion: (content, feedback) => 
        set((state) => {
          const newVersion = {
            content,
            timestamp: Date.now(),
            version: state.versions.length + 1,
            feedback
          };
          return {
            versions: [...state.versions, newVersion],
            currentVersionIndex: state.versions.length,
            generatedContent: content
          };
        }),
      setVersion: (index) =>
        set((state) => ({
          currentVersionIndex: index,
          generatedContent: state.versions[index].content
        })),
      reset: () => {
        localStorage.removeItem('document-storage');
        set(() => ({
          title: '',
          description: '',
          acceptanceCriteria: '',
          testCases: '',
          generatedContent: '',
          currentStep: 0,
          versions: [],
          currentVersionIndex: 0
        }));
      },
      loadSavedDocument: (doc) => set(() => ({
        currentStep: 2, // Go directly to GenerateStep
        title: doc.title,
        description: doc.description,
        generatedContent: doc.content,
        versions: [{
          version: 1,
          content: doc.content,
          timestamp: Date.now()
        }],
        currentVersionIndex: 0
      })),
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({
        title: state.title,
        description: state.description,
        acceptanceCriteria: state.acceptanceCriteria,
        testCases: state.testCases,
        generatedContent: state.generatedContent,
        currentStep: state.currentStep,
        versions: state.versions,
        currentVersionIndex: state.currentVersionIndex
      }),
    }
  )
);
