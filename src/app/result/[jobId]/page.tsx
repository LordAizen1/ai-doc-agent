'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, XCircle, AlertTriangle, Download, 
  Clock, Activity, Mail, Phone, Lock 
} from 'lucide-react';
import { ProcessResult } from '@/types';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadResult();
  }, [jobId]);

  const loadResult = async () => {
    try {
      const response = await fetch(`/output/${jobId}.json`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (decision: 'approved' | 'rejected') => {
    setApproving(true);
    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, decision })
      });

      const updatedResult = await response.json();
      setResult(updatedResult);
    } catch (error) {
      console.error('Approval failed');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🤖</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">
          <AlertDescription>Result not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { ai_analysis, requires_human_approval, vm_counters, status } = result;
  const riskLevel = ai_analysis.context.risk_level;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              🤖 AI Agent Review
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Job ID: {jobId}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            ← Back
          </Button>
        </div>

        {/* Status Banner */}
        <Card className={
          status.includes('Completed') ? 'bg-green-50 dark:bg-green-950 border-green-200' :
          status.includes('Rejected') ? 'bg-red-50 dark:bg-red-950 border-red-200' :
          'bg-yellow-50 dark:bg-yellow-950 border-yellow-200'
        }>
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status.includes('Completed') && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                {status.includes('Rejected') && <XCircle className="w-6 h-6 text-red-600" />}
                {status.includes('Awaiting') && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
                <div>
                  <p className="font-semibold text-lg">{status}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {result.document_source}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                <a href={`/api/download/${jobId}`} download>
                  Download JSON
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 AI Agent Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Risk Level</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-3xl font-bold ${
                        riskLevel >= 7 ? 'text-red-600' :
                        riskLevel >= 4 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {riskLevel}/10
                      </span>
                      <Badge variant={
                        riskLevel >= 7 ? 'destructive' :
                        riskLevel >= 4 ? 'default' :
                        'secondary'
                      }>
                        {riskLevel >= 7 ? 'High Risk' :
                         riskLevel >= 4 ? 'Medium Risk' :
                         'Low Risk'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-16" />
                  
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Document Type</p>
                    <p className="font-semibold">{ai_analysis.context.document_type}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    AI Recommendation
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {ai_analysis.recommendation.reasoning}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Summary
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {ai_analysis.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Findings */}
            <Card>
              <CardHeader>
                <CardTitle>🚩 Findings</CardTitle>
                <CardDescription>
                  {ai_analysis.total_red_flags} red flags detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sensitive" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sensitive">Sensitive Info</TabsTrigger>
                    <TabsTrigger value="security">Security Concerns</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sensitive" className="space-y-4 mt-4">
                    {ai_analysis.sensitive_info.emails.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Emails ({ai_analysis.sensitive_info.emails.length})
                        </p>
                        <div className="space-y-1">
                          {ai_analysis.sensitive_info.emails.map((email, i) => (
                            <div key={i} className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ai_analysis.sensitive_info.phones.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Numbers ({ai_analysis.sensitive_info.phones.length})
                        </p>
                        <div className="space-y-1">
                          {ai_analysis.sensitive_info.phones.map((phone, i) => (
                            <div key={i} className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded">
                              {phone}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="security" className="space-y-4 mt-4">
                    {ai_analysis.security_concerns.confidential_markers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Confidential Markers
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ai_analysis.security_concerns.confidential_markers.map((marker, i) => (
                            <Badge key={i} variant="outline">
                              {marker}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Approval Section */}
            {requires_human_approval && !status.includes('Completed') && !status.includes('Rejected') && (
              <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Human Approval Required
                  </CardTitle>
                  <CardDescription>
                    The AI agent has flagged this document as high-risk. Please review and make a decision.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproval('approved')}
                      disabled={approving}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve Document
                    </Button>
                    <Button
                      onClick={() => handleApproval('rejected')}
                      disabled={approving}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* VM Counters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5" />
                  VM Counter Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Steps</span>
                    <span className="font-semibold">{vm_counters.total_steps}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Elapsed Time
                    </span>
                    <span className="font-mono text-xs">{vm_counters.elapsed_time}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-3">Actions:</p>
                  <div className="space-y-2">
                    {Object.entries(vm_counters.actions).map(([action, data]) => (
                      <div key={action} className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-mono">
                          {action}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Service */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📡 External Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI decided to route to:
                  </p>
                  <Badge className="text-sm px-3 py-1">
                    {ai_analysis.recommendation.external_service}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}