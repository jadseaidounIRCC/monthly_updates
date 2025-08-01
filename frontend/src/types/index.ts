// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

// Reporting Period Types
export interface ReportingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Benefit Types
export interface BenefitDetail {
  applicable: 'yes' | 'no' | '';
  details: string;
}

export interface Benefits {
  fteSavings: BenefitDetail;
  costSavings: BenefitDetail;
  programIntegrity: BenefitDetail;
  clientService: BenefitDetail;
  other: BenefitDetail;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  businessLead?: string;
  initiator?: string;
  devTeamLead?: string;
  projectStartDate?: string;
  currentProjectStage?: 'prototype' | 'poc' | 'pilot' | '';
  currentAiStage?: 'planning-design' | 'data-collection' | 'model-building' | 'testing-validation' | 'deployment' | 'monitoring' | '';
  targetNextStageDate?: string;
  targetCompletionDate?: string;
  budget?: string;
  
  // Content fields
  summaryOfWork?: string;
  keyAccomplishments?: string;
  challengesFaced?: string;
  progressNotes?: string;
  currentRisks?: string;
  mitigationStrategies?: string;
  dependencies?: string;
  escalationNeeded?: string;
  keyRisks?: string;
  keyUpdates?: string;
  
  // Benefits
  benefits: Benefits;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Next Step Types
export interface NextStep {
  id: string;
  projectId: string;
  periodId: string;
  description: string;
  owner: string;
  dueDate?: string;
  status: 'not-started' | 'in-progress' | 'ongoing' | 'blocked' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Comment Types
export interface Comment {
  id: string;
  projectId: string;
  periodId: string;
  fieldReference: string; // e.g., "benefits.fteSavings.applicable", "keyRisks", etc.
  authorName: string;
  content: string;
  isResolved: boolean;
  parentId?: string; // For threaded replies
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Field Reference Type (for comment targeting)
export type FieldReference = 
  | 'businessLead'
  | 'initiator' 
  | 'devTeamLead'
  | 'projectStartDate'
  | 'currentProjectStage'
  | 'currentAiStage'
  | 'targetNextStageDate'
  | 'targetCompletionDate'
  | 'budget'
  | 'summaryOfWork'
  | 'keyAccomplishments'
  | 'challengesFaced'
  | 'progressNotes'
  | 'currentRisks'
  | 'mitigationStrategies'
  | 'dependencies'
  | 'escalationNeeded'
  | 'keyRisks'
  | 'keyUpdates'
  | 'benefits.fteSavings.applicable'
  | 'benefits.fteSavings.details'
  | 'benefits.costSavings.applicable'
  | 'benefits.costSavings.details'
  | 'benefits.programIntegrity.applicable'
  | 'benefits.programIntegrity.details'
  | 'benefits.clientService.applicable'
  | 'benefits.clientService.details'
  | 'benefits.other.applicable'
  | 'benefits.other.details'
  | `nextSteps.${string}.description`
  | `nextSteps.${string}.owner`
  | `nextSteps.${string}.dueDate`
  | `nextSteps.${string}.status`;

// Component Props Types
export interface ProjectPageProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
}

export interface NavigationProps {
  projects: Project[];
  activeProject: Project | null;
  theme: 'light' | 'dark';
  onProjectSelect: (project: Project) => void;
  onProjectCreate: () => void;
  onThemeToggle: () => void;
}

export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldRef: string;
  fieldDisplayName: string;
  projectId: string;
  periodId: string;
  comments: Comment[];
  onAddComment: (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => Promise<void>;
  onEditComment: (commentId: string, updates: { content: string }) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onResolveComment: (commentId: string, resolved: boolean) => Promise<void>;
  onAddReply: (parentId: string, replyData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) => Promise<void>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
}