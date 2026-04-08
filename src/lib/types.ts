export type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DailyReportSummary = {
  date: string;
  hrName: string;
  calls: {
    total: number;
    interested: number;
    followUp: number;
    notInterested: number;
    joined: number;
    conversionRate: number;
  };
  attendance: {
    presentCount: number;
    absentCount: number;
    employees: string[];
    absentEmployees: string[];
    locations: string[];
  };
  tasks: {
    completed: string[];
    pending: string[];
  };
  notes: string[];
  selfTasks: string[];
  overallNotes: string;
};
