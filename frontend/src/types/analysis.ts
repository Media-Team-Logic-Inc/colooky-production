export interface AnalysisJob {
  id: string;
  repository: string;
  files: string[];
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  files_analyzed: number;
  total_files: number;
  error_message?: string;
  result?: AnalysisResult;
  created_at: Date;
}

export interface AnalysisResult {
  id: string;
  repository: string;
  visualization: any;
  summary: {
    total_files: number;
    supported_files: number;
    functions: number;
    classes: number;
    imports: number;
    complexity_score: number;
    main_language: string;
    file_types: { [key: string]: number };
  };
  elements?: Array<{
    id: string;
    name: string;
    type: 'function' | 'class' | 'import';
    file: string;
    line: number;
    language: string;
    content?: string;
  }>;
  dependencies?: Array<{
    from: string;
    to: string;
    type: string;
    line: number;
    detail: string;
  }>;
}

declare global {
  var analysisJobs: Map<string, AnalysisJob> | undefined;
}

export {};