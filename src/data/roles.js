// The 3 kinds of users in this app. Using constants (instead of typing the
// raw string 'org_admin' everywhere) means a typo becomes an instant error
// instead of a silent bug.
export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin', // ClickWise's own staff — manages the whole platform
  ORG_ADMIN: 'org_admin', // the person who signed up their company — manages their team
  EMPLOYEE: 'employee', // a regular staff member added by an org admin
};

// Friendly text to display for each role (e.g. on profile badges and tables).
export const ROLE_LABELS = {
  [ROLES.PLATFORM_ADMIN]: 'Platform Admin',
  [ROLES.ORG_ADMIN]: 'Org Admin',
  [ROLES.EMPLOYEE]: 'Employee',
};
