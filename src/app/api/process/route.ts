import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VMCounter } from '@/lib/vm-counter';
import { extractText } from '@/lib/extractor';
import { DocumentReviewAgent } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  const jobId = uuidv4();
  const vmCounter = new VMCounter();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    let text: string | null = null;
    let documentSource = '';
    let sourceType: 'pdf' | 'url' = 'pdf';

    // Check if it's a file upload or URL
    if (file) {
      // Handle PDF file
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const fileName = `${jobId}_${file.name}`;
      const filePath = path.join(uploadsDir, fileName);
      
      const bytes = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(bytes));

      documentSource = file.name;
      sourceType = 'pdf';
      text = await extractText(filePath, sourceType, vmCounter);
    } else if (url) {
      // Handle URL
      documentSource = url;
      sourceType = 'url';
      text = await extractText(url, sourceType, vmCounter);
    } else {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Failed to extract text' }, { status: 500 });
    }

    // AI Analysis
    const agent = new DocumentReviewAgent(vmCounter);
    const analysis = await agent.analyzeDocument(text, documentSource);

    if (!analysis) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    // External API call
    const service = agent.decideExternalService(analysis);
    await callExternalService(service, jobId, analysis, vmCounter);

    // Check if human approval needed
    const requiresApproval = analysis.recommendation.requires_human_approval;

    if (requiresApproval) {
      vmCounter.increment('human_approval_requested');
    } else {
      vmCounter.increment('auto_approved_by_ai');
    }

    // Save result
    const result = {
      job_id: jobId,
      document_source: documentSource,
      source_type: sourceType,
      ai_analysis: analysis,
      requires_human_approval: requiresApproval,
      vm_counters: vmCounter.getSummary(),
      status: requiresApproval ? 'Awaiting human approval' : 'Completed - Auto-approved',
      elapsed_time: vmCounter.getElapsedTime()
    };

    const outputDir = path.join(process.cwd(), 'public', 'output');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, `${jobId}.json`),
      JSON.stringify(result, null, 2)
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function callExternalService(
  service: string,
  jobId: string,
  analysis: any,
  vmCounter: VMCounter
) {
  const endpoints: Record<string, string> = {
    'compliance_api': process.env.WEBHOOK_COMPLIANCE || '',
    'security_scanner': process.env.WEBHOOK_SECURITY || '',
    'logging_service': process.env.WEBHOOK_LOGGING || ''
  };

  try {
    vmCounter.increment(`external_api_${service}_called`);
    
    await fetch(endpoints[service], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        service,
        risk_level: analysis.context.risk_level,
        summary: analysis.summary
      })
    });

    vmCounter.increment('external_api_success');
  } catch (error) {
    vmCounter.increment('external_api_error');
  }
}
