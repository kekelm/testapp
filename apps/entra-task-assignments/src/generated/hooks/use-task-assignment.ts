import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskAssignmentService } from "../services/task-assignment-service";
import type { TaskAssignment } from "../models/task-assignment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all TaskAssignment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, assignedUserDisplayName, assignedUserEmailOrUPN, assignedUserJobTitle, assignedUserObjectID, description, dueDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useTaskAssignmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["taskAssignment-list", options],
    queryFn: () => TaskAssignmentService.getAll(options),
  });
}

/**
 * Retrieve a single TaskAssignment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useTaskAssignment(id: string) {
  return useQuery({
    queryKey: ["taskAssignment", id],
    queryFn: () => TaskAssignmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new TaskAssignment record.
 * @remarks Form validation: use CreateTaskAssignmentSchema with zodResolver for type-safe create forms
 */
export function useCreateTaskAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TaskAssignment, "id">) => TaskAssignmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["taskAssignment-list"] });
    },
  });
}

/**
 * Update an existing TaskAssignment record.
 * @remarks Form validation: use UpdateTaskAssignmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateTaskAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<TaskAssignment, "id">>;
    }) => TaskAssignmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["taskAssignment-list"] });
      client.invalidateQueries({ queryKey: ["taskAssignment", variables.id] });
    },
  });
}

/**
 * Delete a TaskAssignment record by its unique identifier.
 */
export function useDeleteTaskAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TaskAssignmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["taskAssignment-list"] });
      client.invalidateQueries({ queryKey: ["taskAssignment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const TaskAssignment_DATA_SOURCE_TYPE = 'InMemory' as const;

export { TaskAssignmentSchema, CreateTaskAssignmentSchema, UpdateTaskAssignmentSchema } from "../validators/task-assignment-validator";
export type { TaskAssignmentInput, CreateTaskAssignmentInput, UpdateTaskAssignmentInput } from "../validators/task-assignment-validator";