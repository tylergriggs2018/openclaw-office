import { OFFICE_ROLES, OFFICE_ROLE_KEY_IDS, type OfficeRoleKey } from "@/lib/agent-office-roles";

export interface SeedOfficeAgent {
  id: string;
  name: string;
  roleKey: OfficeRoleKey;
  description: string;
  zone: string;
}

export const SEEDED_OFFICE_AGENTS: SeedOfficeAgent[] = [
  {
    id: OFFICE_ROLE_KEY_IDS["master-researcher"],
    name: OFFICE_ROLES["master-researcher"].name,
    roleKey: "master-researcher",
    description: OFFICE_ROLES["master-researcher"].description,
    zone: OFFICE_ROLES["master-researcher"].zone,
  },
  {
    id: OFFICE_ROLE_KEY_IDS["master-coder"],
    name: OFFICE_ROLES["master-coder"].name,
    roleKey: "master-coder",
    description: OFFICE_ROLES["master-coder"].description,
    zone: OFFICE_ROLES["master-coder"].zone,
  },
  {
    id: OFFICE_ROLE_KEY_IDS["project-manager"],
    name: OFFICE_ROLES["project-manager"].name,
    roleKey: "project-manager",
    description: OFFICE_ROLES["project-manager"].description,
    zone: OFFICE_ROLES["project-manager"].zone,
  },
  {
    id: OFFICE_ROLE_KEY_IDS["finance-department"],
    name: OFFICE_ROLES["finance-department"].name,
    roleKey: "finance-department",
    description: OFFICE_ROLES["finance-department"].description,
    zone: OFFICE_ROLES["finance-department"].zone,
  },
];
