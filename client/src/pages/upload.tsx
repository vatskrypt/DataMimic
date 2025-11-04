import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Upload as UploadIcon, FileText, X, CheckCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import uploadEmptyImage from "@assets/generated_images/Upload_empty_state_icon_a3e2f197.png";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
    columns: { name: string; type: 'numeric' | 'categorical'; nullCount: number }[];
    rowCount: number;
  } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('currentDatasetId', data.dataset.id);
      toast({
        title: "Upload successful",
        description: `Dataset "${data.dataset.name}" uploaded successfully`,
      });
      setLocation('/models');
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const parseCSV = useCallback((content: string) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    
    const columns = headers.map((name, index) => {
      const columnValues = dataRows.map(row => row[index]);
      const nullCount = columnValues.filter(v => !v || v === '').length;
      const nonNullValues = columnValues.filter(v => v && v !== '');
      const isNumeric = nonNullValues.every(v => !isNaN(Number(v)));
      
      return {
        name,
        type: isNumeric ? 'numeric' as const : 'categorical' as const,
        nullCount,
      };
    });

    return {
      headers,
      rows: dataRows.slice(0, 10),
      columns,
      rowCount: dataRows.length,
    };
  }, []);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const parsed = parseCSV(content);
        setPreviewData(parsed);
      } catch (error) {
        toast({
          title: "Parse error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(selectedFile);
  }, [parseCSV, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreviewData(null);
  }, []);

  const proceedToModels = useCallback(() => {
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [file, uploadMutation]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Upload Dataset</h1>
        <p className="text-muted-foreground">Upload your CSV dataset to generate synthetic data</p>
      </div>

      {!file ? (
        <Card className="hover-elevate">
          <CardContent className="p-12">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              data-testid="dropzone-upload"
            >
              <div className="flex flex-col items-center gap-4">
                <img src={uploadEmptyImage} alt="Upload" className="w-24 h-24 opacity-40" />
                <div>
                  <p className="text-lg font-medium mb-2">Drag and drop CSV file here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse (max 10MB)</p>
                </div>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                  <Button
                    data-testid="button-browse"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{file.name}</CardTitle>
                    <CardDescription>
                      {(file.size / 1024).toFixed(2)} KB
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={removeFile} data-testid="button-remove-file">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            {previewData && (
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{previewData.rowCount}</div>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{previewData.headers.length}</div>
                    <p className="text-sm text-muted-foreground">Columns</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {previewData.columns.filter(c => c.nullCount === 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Complete Columns</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Column Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {previewData.columns.map((col, index) => (
                      <Badge
                        key={index}
                        variant={col.type === 'numeric' ? 'default' : 'secondary'}
                        className="gap-2"
                        data-testid={`badge-column-${index}`}
                      >
                        {col.name}
                        <span className="text-xs opacity-70">({col.type})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Data Preview</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {previewData.headers.map((header, index) => (
                              <TableHead key={index} className="font-mono text-xs">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="font-mono text-xs">
                                  {cell || <span className="text-muted-foreground">-</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing first 10 rows of {previewData.rowCount}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {previewData && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={removeFile} data-testid="button-cancel" disabled={uploadMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={proceedToModels} data-testid="button-proceed" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Proceed to Model Selection
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
