// Model types
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string | null;
  role: "STAFF" | "ADMIN";
  user_image: string | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
}

export interface Unit {
  id: string
  name: string
  type: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CheckItem {
  id: string
  code: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  is_deleted: boolean
  deleted_at: string
}

export interface Workcheck {
  id: string
  unit_id: string
  hours_meter: number
  is_submitted: boolean
  created_at: string
  unit: Unit
  WorkcheckItems: WorkcheckItem[]
  isSubmitted: boolean
  hasVehicleSelected?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  rejectionComment?: string | null
}

export interface WorkcheckItem {
  id: string
  item_id: string
  actions: string[]
  note: string
  images: string[]
  checkItem: CheckItem
}

// Custom types
export interface WorkcheckWithUser {
  id: string;
  checker_id: string;
  unit_id: string;
  hours_meter: number | null;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean;
  Checker: {
    first_name: string;
    last_name: string;
    username: string;
  };
  Unit: {
    name: string;
    type: string;
  };
  Approval: {
    is_approved: boolean | null;
    comments: string | null;
    approved_at: string | null;
    Approver: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export interface WorkcheckDetails {
  id: string;
  checker_id: string;
  unit_id: string;
  hours_meter: number | null;
  created_at: string | null;
  Checker: {
    first_name: string;
    last_name: string;
    username: string;
  };
  Unit: {
    name: string;
    type: string;
  };
  Approval: {
    is_approved: boolean | null;
    comments: string | null;
    approved_at: string | null;
    Approver: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
  WorkcheckItems: {
    id: string;
    workcheck_id: string | null;
    item_id: string | null;
    actions: string[]
    note: string | null;
    CheckItem: {
      code: string;
      label: string | null;
      sort_order: number | null;
    } | null;
    Images: {
      id: string;
      file_name: string | null;
      uploaded_at: string | null;
    }[];
  }[];
}

// Form types
export interface CreateUserForm {
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  role: "STAFF" | "ADMIN";
  temporary_password: string;
}

export interface UpdateUserForm {
  first_name: string;
  last_name: string;
  username: string;
  phone_number: string;
  role: "STAFF" | "ADMIN";
  reset_password: boolean;
  new_password: string;
}

// Filter types
export interface WorkcheckFilters {
  search: string;
  status: string;
  date: string;
}