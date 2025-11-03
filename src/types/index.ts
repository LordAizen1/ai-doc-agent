export type SourceType = 'pdf' | 'url';

export interface ProcessInput {
  source: string;
  sourceType: SourceType;
}

export interface VMCounter {
  total_steps: number;
  elapsed_time: string;
  actions: Record<string, {
    count: number;
    timestamps: string[];
  }>;
}

export interface AIAnalysis {
  sensitive_info: {
    emails: string[];
    phones: string[];
    addresses: string[];
    other_pii: string[];
  };
  security_concerns: {
    confidential_markers: string[];
    privacy_issues: string[];
    proprietary_info: string[];
  };
  context: {
    document_type: string;
    intended_audience: string;
    risk_level: number;
  };
  recommendation: {
    requires_human_approval: boolean;
    reasoning: string;
    suggested_action: string;
    external_service: 'compliance_api' | 'security_scanner' | 'logging_service';
  };
  total_red_flags: number;
  summary: string;
}

export interface ProcessResult {
  job_id: string;
  document_source: string;
  ai_analysis: AIAnalysis;
  requires_human_approval: boolean;
  vm_counters: VMCounter;
  status: string;
  elapsed_time: string;
}

export interface ApprovalResult {
  job_id: string;
  decision: 'approved' | 'rejected';
  final_status: string;
  vm_counters: VMCounter;
}