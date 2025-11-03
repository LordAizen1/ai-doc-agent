import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { jobId, decision } = await request.json();

    // Load existing result
    const outputPath = path.join(process.cwd(), 'public', 'output', `${jobId}.json`);
    const resultData = await fs.readFile(outputPath, 'utf-8');
    const result = JSON.parse(resultData);

    // Update with approval decision
    result.vm_counters.actions[`human_${decision}`] = {
      count: 1,
      timestamps: [new Date().toISOString()]
    };
    result.vm_counters.total_steps += 1;
    result.status = decision === 'approved' ? 'Completed with approval' : 'Rejected by human';
    result.human_decision = decision;

    // Save updated result
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}