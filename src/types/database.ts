import { auditLogs, companies, companyUsers, profiles } from "@/db/schema";

export type Company = typeof companies.$inferSelect;

export type NewCompany = typeof companies.$inferInsert;

export type Profile = typeof profiles.$inferSelect;

export type NewProfile = typeof profiles.$inferInsert;

export type CompanyUser = typeof companyUsers.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;
