"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Image, Archive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatFileSize } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface FileUploadProps {
  onFileUpload: (files: File[]) => void
  isUploading: boolean
  uploadProgress: { [key: string]: number }
  uploadedFiles: { [key: string]: 'success' | 'error' }
  maxFiles?: number
  maxSize?: number // in bytes
  acceptedFileTypes?: string[]
  disabled?: boolean
  className?: string
}

const defaultAcceptedTypes = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />
  if (fileType.includes('sheet') || fileType.includes('csv')) return <FileText className="h-5 w-5 text-green-500" />
  if (fileType.includes('text')) return <FileText className="h-5 w-5 text-gray-500" />
  if (fileType.includes('image')) return <Image className="h-5 w-5 text-purple-500" />
  if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />
  return <File className="h-5 w-5 text-muted-foreground" />
}

const getFileTypeLabel = (fileType: string) => {
  if (fileType.includes('pdf')) return 'PDF'
  if (fileType.includes('word') || fileType.includes('document')) return 'DOCX'
  if (fileType.includes('sheet')) return 'XLSX'
  if (fileType.includes('csv')) return 'CSV'
  if (fileType.includes('text')) return 'TXT'
  return fileType.split('/')[1]?.toUpperCase() || 'FILE'
}

export function FileUpload({ 
  onFileUpload, 
  isUploading, 
  uploadProgress, 
  uploadedFiles,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = defaultAcceptedTypes,
  disabled = false,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles)
    }

    // Add accepted files to the list
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }))

    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      return combined.slice(0, maxFiles) // Limit to maxFiles
    })
  }, [maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    multiple: true,
    maxSize,
    disabled: disabled || isUploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setFiles([])
  }

  const handleUpload = () => {
    if (files.length > 0) {
      const filesToUpload = files.map(f => f.file)
      onFileUpload(filesToUpload)
    }
  }

  // Update file progress and status based on props
  React.useEffect(() => {
    setFiles(prev => prev.map(fileItem => {
      const progress = uploadProgress[fileItem.file.name] || 0
      const status = uploadedFiles[fileItem.file.name]
      
      let newStatus: FileWithProgress['status'] = fileItem.status
      if (isUploading && progress > 0) {
        newStatus = progress >= 100 ? 'success' : 'uploading'
      } else if (status === 'success') {
        newStatus = 'success'
      } else if (status === 'error') {
        newStatus = 'error'
      }

      return {
        ...fileItem,
        progress,
        status: newStatus
      }
    }))
  }, [uploadProgress, uploadedFiles, isUploading])

  const pendingFiles = files.filter(f => f.status === 'pending').length
  const successFiles = files.filter(f => f.status === 'success').length
  const errorFiles = files.filter(f => f.status === 'error').length

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
              isDragActive || dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25',
              disabled && 'opacity-50 cursor-not-allowed',
              isUploading && 'pointer-events-none'
            )}
          >
            <input {...getInputProps()} />
            
            <motion.div
              animate={{ 
                scale: isDragActive ? 1.1 : 1,
                rotate: isDragActive ? 5 : 0 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            </motion.div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {acceptedFileTypes.slice(0, 4).map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {getFileTypeLabel(type)}
                  </Badge>
                ))}
                {acceptedFileTypes.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{acceptedFileTypes.length - 4} more
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Max {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                Files ({files.length})
              </h3>
              <div className="flex items-center space-x-2">
                {successFiles > 0 && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    {successFiles} uploaded
                  </Badge>
                )}
                {errorFiles > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorFiles} failed
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={isUploading}
                  className="text-xs h-7"
                >
                  Clear all
                </Button>
              </div>
            </div>

            {/* File Items */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileItem, index) => (
                <motion.div
                  key={`${fileItem.file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(fileItem.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {fileItem.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(fileItem.file.size)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(fileItem.file.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Progress & Status */}
                    {fileItem.status === 'uploading' && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <Progress value={fileItem.progress} className="w-16 h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {fileItem.progress}%
                        </span>
                      </div>
                    )}
                    
                    {fileItem.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    )}
                    
                    {fileItem.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    
                    {fileItem.status === 'pending' && !isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-7 w-7 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {isUploading && fileItem.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Upload Button */}
            {pendingFiles > 0 && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || pendingFiles === 0}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading {files.length} file{files.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingFiles} file{pendingFiles > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}