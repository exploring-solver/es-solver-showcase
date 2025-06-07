"use client"

import * as React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface FileUploadProps {
  conversationId: string
  onUploadComplete: (document: any) => void
}

export function FileUpload({ conversationId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast("Unsupported file format",{        
        description: "Please upload a PDF, TXT, CSV, or DOCX file.",
      })
      return
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast("File too large",{
        description: "Please upload a file smaller than 10MB.",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("conversationId", conversationId)
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 100)
      
      const response = await fetch("/api/chatbot/upload", {
        method: "POST",
        body: formData,
      })
      
      clearInterval(progressInterval)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload file")
      }
      
      setUploadProgress(100)
      
      const data = await response.json()
      
      toast("File uploaded successfully",{
        description: `${file.name} has been uploaded and processed.`,
      })
      
      onUploadComplete(data.document)
    } catch (error: any) {
      toast.error("Upload failed",{
        description: error.message || "An error occurred while uploading the file.",
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="w-full">
      <input
        type="file"
        id="file-upload"
        className="sr-only"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt,.csv,.docx"
        disabled={uploading}
      />
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Upload document"}
        </Button>
        
        {uploading && (
          <div className="w-full space-y-2">
            <Progress value={uploadProgress} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress < 100 
                ? "Processing document..." 
                : "Finalizing..."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}