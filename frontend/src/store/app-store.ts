import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type AppState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  uploadDialogOpen: boolean
  setUploadDialogOpen: (open: boolean) => void
  pendingFile: File | null
  setPendingFile: (file: File | null) => void
  pendingAttachments: File[]
  setPendingAttachments: (files: File[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),
      closeSidebar: () => set({ sidebarOpen: false }),
      uploadDialogOpen: false,
      setUploadDialogOpen: (open) => set({ uploadDialogOpen: open }),
      pendingFile: null,
      setPendingFile: (file) => set({ pendingFile: file }),
      pendingAttachments: [],
      setPendingAttachments: (files) => set({ pendingAttachments: files }),
    }),
    {
      name: "meet-ink-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        uploadDialogOpen: state.uploadDialogOpen,
      }),
    }
  )
)
