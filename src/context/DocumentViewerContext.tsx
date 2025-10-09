import { createContext, useContext, useState, type ReactNode } from 'react'

type DocumentViewerContextType = {
  isViewerOpen: boolean
  currentDocument: { url: string; title: string } | null
  openDocument: (url: string, title: string) => void
  closeDocument: () => void
}

const DocumentViewerContext = createContext<DocumentViewerContextType | undefined>(undefined)

export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<{ url: string; title: string } | null>(null)

  const openDocument = (url: string, title: string) => {
    setCurrentDocument({ url, title })
    setIsViewerOpen(true)
  }

  const closeDocument = () => {
    setIsViewerOpen(false)
    setCurrentDocument(null)
  }

  return (
    <DocumentViewerContext.Provider
      value={{
        isViewerOpen,
        currentDocument,
        openDocument,
        closeDocument,
      }}
    >
      {children}
    </DocumentViewerContext.Provider>
  )
}

export function useDocumentViewer() {
  const context = useContext(DocumentViewerContext)
  if (context === undefined) {
    throw new Error('useDocumentViewer must be used within a DocumentViewerProvider')
  }
  return context
}