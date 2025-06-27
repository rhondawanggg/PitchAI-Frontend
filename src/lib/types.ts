// File: frontend/src/lib/types.ts

// File: frontend/src/lib/types.ts

export interface Project {
  id: string;
  enterprise_name: string;
  project_name: string;
  description?: string;
  team_members?: string;  // NEW: Team members field
  status: 'pending_review' | 'processing' | 'completed' | 'failed';
  total_score?: number;
  review_result?: 'pass' | 'fail' | 'conditional';
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateData {
  enterprise_name: string;
  project_name: string;
  description?: string;
  team_members?: string;  // NEW: Team members field
}

export interface ProjectListParams {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
}

export interface ProjectListResponse {
  total: number;
  items: Project[];
}

export interface ProjectStatistics {
  pending_review: number;    // 60-79分: 待评审
  completed: number;         // ≥80分: 已完成
  failed: number;            // <60分: 未通过
  processing: number;        // 无评分: 处理中
  needs_info: number;        // DEPRECATED: For backward compatibility, always 0
  recent_projects: Project[];
}

export interface SubDimensionScore {
  sub_dimension: string;
  score: number;
  max_score: number;
  comments?: string;
}

export interface Score {
  dimension: string;
  score: number;
  max_score: number;
  comments?: string;
  sub_dimensions: SubDimensionScore[];
}

export interface ProjectScores {
  dimensions: Score[];
}

export interface MissingInfo {
  id?: string;  // NEW: Optional ID for editing
  dimension: string;
  information_type: string;
  description: string;
  status: string;
  created_at?: string;  // NEW: Optional timestamps
  updated_at?: string;
}

export interface MissingInfoResponse {
  items: MissingInfo[];
}

// NEW: Missing information management interfaces
export interface MissingInfoCreateData {
  dimension: string;
  information_type: string;
  description: string;
  status?: string;
}

export interface MissingInfoUpdateData {
  dimension: string;
  information_type: string;
  description: string;
  status: string;
}

export interface TeamMembersUpdateData {
  team_members: string;
}

// NEW: Bulk operations
export interface BulkMissingInfoOperation {
  action: 'add' | 'delete' | 'update';
  items: MissingInfo[];
}

export interface ScoreUpdateData {
  dimensions: Score[];
}

export interface ScoreSummary {
  project_id: string;
  project_name: string;
  enterprise_name: string;
  total_score: number;
  total_possible: number;
  overall_percentage: number;
  recommendation: string;
  dimension_breakdown: {
    [dimension: string]: {
      score: number;
      max_score: number;
      percentage: number;
    };
  };
  last_updated: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Error response
export interface ApiError {
  code: number;
  message: string;
  errors?: string[];
}

export interface ScoreHistoryItem {
  id: string;
  total_score: number;
  modified_by: string;
  modification_notes: string;
  created_at: string;
  dimensions: {
    [dimensionName: string]: {
      score: number;
      max_score: number;
      comments: string;
      sub_dimensions: SubDimensionScore[];
    };
  };
}

export interface ScoreHistoryResponse {
  project_id: string;
  project_name: string;
  enterprise_name: string;
  history: ScoreHistoryItem[];
}

// Status display utilities
export const STATUS_DISPLAY_MAP = {
  'pending_review': '待评审',
  'processing': '处理中',
  'completed': '已完成',
  'failed': '未通过'
} as const;

export const STATUS_COLOR_MAP = {
  'pending_review': {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: 'fa-clock'
  },
  'processing': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    icon: 'fa-spinner fa-spin'
  },
  'completed': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: 'fa-check-circle'
  },
  'failed': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: 'fa-times-circle'
  }
} as const;

// Helper functions for team members
export const getTeamMembersDisplay = (teamMembers?: string): string => {
  return teamMembers?.trim() || '团队信息待补充';
};

export const validateTeamMembers = (teamMembers: string): string | null => {
  if (teamMembers.length > 1000) {
    return '团队成员信息不能超过1000字符';
  }
  return null;
};

// Helper functions for missing information
export const getMissingInfoStatusDisplay = (status: string): string => {
  const statusMap = {
    'pending': '待处理',
    'provided': '已提供',
    'resolved': '已解决'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

export const getMissingInfoStatusColor = (status: string) => {
  const colorMap = {
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'fa-clock' },
    'provided': { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'fa-info-circle' },
    'resolved': { bg: 'bg-green-100', text: 'text-green-700', icon: 'fa-check-circle' }
  };
  return colorMap[status as keyof typeof colorMap] || colorMap['pending'];
};

export const getStatusDisplay = (status: Project['status']): string => {
  return STATUS_DISPLAY_MAP[status] || '未知';
};

export const getStatusTag = (status: Project['status']) => {
  const colors = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP['processing'];
  const display = getStatusDisplay(status);

  return {
    display,
    className: `inline-block px-3 py-1 rounded-full ${colors.bg} ${colors.text} text-xs`,
    icon: colors.icon
  };
};

// Score-based status calculation (for frontend validation)
export const calculateStatusFromScore = (score: number | null | undefined): Project['status'] => {
  if (score === null || score === undefined) {
    return 'processing';
  } else if (score >= 80) {
    return 'completed';
  } else if (score >= 60) {
    return 'pending_review';
  } else {
    return 'failed';
  }
};

export const getRecommendationFromScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) {
    return '等待评估';
  } else if (score >= 80) {
    return '优秀项目，可考虑给予企业工位';
  } else if (score >= 60) {
    return '符合基本入孵条件，可注册在工研院';
  } else {
    return '暂不符合入孵条件，建议完善后重新提交';
  }
};