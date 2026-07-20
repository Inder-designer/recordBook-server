export const MEMBER_ROLE = {
  OWNER: 1,
  ADMIN: 2,
  EDITOR: 3,
  VIEWER: 4,
} as const;

export type MemberRole =
  (typeof MEMBER_ROLE)[keyof typeof MEMBER_ROLE];