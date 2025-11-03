'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2, Link as LinkIcon } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'file' && !file) {
      setError('Please select a file');
      return;
    }
    
    if (activeTab === 'url' && !url) {
      setError('Please enter a URL');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      
      if (activeTab === 'file' && file) {
        formData.append('file', file);
      } else if (activeTab === 'url') {
        formData.append('url', url);
      }

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Processing failed');

      const result = await response.json();
      router.push(`/result/${result.job_id}`);

    } catch (err) {
      setError('Failed to process document. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            🤖 AI Document Review Agent
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Powered by Claude 3.5 Haiku
          </p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload Document or URL
            </CardTitle>
            <CardDescription>
              Upload a PDF document or paste a URL for AI-powered security analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">
                    <Upload className="w-4 h-4 mr-2" />
                    PDF File
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    URL
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      disabled={isProcessing}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {file ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Click to change file
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-slate-500">
                            PDF files only
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="mt-4">
                  <div className="space-y-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/document.html"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError('');
                      }}
                      disabled={isProcessing}
                      className="text-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Enter the URL of a webpage to analyze
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isProcessing || (activeTab === 'file' ? !file : !url)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    {activeTab === 'file' ? (
                      <Upload className="mr-2 h-4 w-4" />
                    ) : (
                      <LinkIcon className="mr-2 h-4 w-4" />
                    )}
                    Analyze {activeTab === 'file' ? 'Document' : 'URL'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p className="font-medium">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>AI extracts and analyzes document content</li>
                  <li>Identifies sensitive information and security risks</li>
                  <li>Provides risk score (0-10) with reasoning</li>
                  <li>Routes to appropriate external service</li>
                  <li>Requests human approval if high-risk detected</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
