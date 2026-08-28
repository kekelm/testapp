import { z } from 'zod';

/**
 * Zod schema for TaskAssignment validation
 */
export const TaskAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  assignedUserDisplayName: z.string().min(1, { message: "Assigned User Display Name is required" }),
  assignedUserEmailOrUPN: z.string().email().min(1, { message: "Assigned User Email or UPN is required" }),
  assignedUserJobTitle: z.string().optional(),
  assignedUserObjectID: z.string().min(1, { message: "Assigned User Object ID is required" }),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Due Date is required" }),
  statusKey: z.enum(['ToDo', 'InProgress', 'Completed']),
});

/**
 * Schema for creating a new TaskAssignment (omits system-generated ID)
 */
export const CreateTaskAssignmentSchema = TaskAssignmentSchema.omit({ id: true });

/**
 * Schema for updating an existing TaskAssignment
 */
export const UpdateTaskAssignmentSchema = TaskAssignmentSchema;

export type TaskAssignmentInput = z.infer<typeof TaskAssignmentSchema>;
export type CreateTaskAssignmentInput = z.infer<typeof CreateTaskAssignmentSchema>;
export type UpdateTaskAssignmentInput = z.infer<typeof UpdateTaskAssignmentSchema>;