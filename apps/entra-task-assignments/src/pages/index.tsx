import { useEffect, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { User } from '@/generated/models/Office365UsersModel';
import type { TaskAssignmentStatusKey } from '@/generated/models/task-assignment-model';
import {
  HAS_IN_MEMORY_TABLES,
  useCreateTaskAssignment,
  useDeleteTaskAssignment,
  useTaskAssignmentList,
  useUpdateTaskAssignment,
} from '@/generated/hooks';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { usePeopleSearch } from '@/hooks/use-people-search';
import { useUser } from '@/hooks/use-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const statusLabels: Record<TaskAssignmentStatusKey, string> = {
  ToDo: 'To do',
  InProgress: 'In progress',
  Completed: 'Completed',
};

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase();

export default function HomePage() {
  const { data: currentUser } = useUser();
  const { data: tasks = [], isLoading: tasksLoading } = useTaskAssignmentList({ orderBy: ['dueDate asc'] });
  const createTask = useCreateTaskAssignment();
  const updateTask = useUpdateTaskAssignment();
  const deleteTask = useDeleteTaskAssignment();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<User>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const peopleSearch = usePeopleSearch(debouncedQuery);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPerson || !title.trim() || !dueDate) return;
    const email = selectedPerson.Mail ?? selectedPerson.UserPrincipalName;
    if (!email) {
      toast.error('The selected person has no email or user principal name.');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        statusKey: 'ToDo',
        assignedUserObjectID: selectedPerson.Id,
        assignedUserDisplayName: selectedPerson.DisplayName ?? email,
        assignedUserEmailOrUPN: email,
        assignedUserJobTitle: selectedPerson.JobTitle,
      });
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setSelectedPerson(undefined);
      setQuery('');
      toast.success('Task assigned successfully.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Task could not be assigned.');
    }
  };

  const handleStatus = async (id: string, statusKey: TaskAssignmentStatusKey) => {
    try {
      await updateTask.mutateAsync({ id, changedFields: { statusKey } });
      toast.success('Task status updated.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Status could not be updated.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task removed.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Task could not be removed.');
    }
  };

  const openCount = tasks.filter((task) => task.statusKey !== 'Completed').length;
  const completedCount = tasks.filter((task) => task.statusKey === 'Completed').length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." />

      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' as const }} className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"><ClipboardList className="size-4" /> Assignment workspace</div>
          <h1 className="text-2xl font-semibold tracking-tight">Entra task assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search the live directory, select a colleague, and assign clear work.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{openCount} open</Badge>
          <Badge variant="outline">{completedCount} completed</Badge>
          {currentUser?.fullName ? <Badge>{currentUser.fullName}</Badge> : null}
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Assign a task</CardTitle>
            <CardDescription>Find one person by display name, then add task details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="people-search">Search Entra</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input id="people-search" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedPerson(undefined); }} placeholder="Type a display name" className="pl-9" autoComplete="off" />
                </div>
                {debouncedQuery.trim().length >= 2 && !selectedPerson ? (
                  <div className="max-h-64 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-sm">
                    {peopleSearch.isLoading ? <div className="flex items-center gap-2 p-4 text-sm"><LoaderCircle className="size-4 animate-spin" /> Searching directory…</div> : null}
                    {peopleSearch.isError ? <div className="p-4"><Alert variant="destructive"><AlertTitle>Directory unavailable</AlertTitle><AlertDescription>{peopleSearch.error.message}</AlertDescription></Alert></div> : null}
                    {!peopleSearch.isLoading && !peopleSearch.isError && peopleSearch.data?.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No people match that display name.</p> : null}
                    {peopleSearch.data?.filter((person: User) => person.Id && person.DisplayName).map((person: User) => (
                      <button key={person.Id} type="button" onClick={() => { setSelectedPerson(person); setQuery(person.DisplayName ?? ''); }} className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Avatar><AvatarFallback>{initials(person.DisplayName ?? 'User')}</AvatarFallback></Avatar>
                        <span className="min-w-0"><span className="block truncate text-sm font-medium">{person.DisplayName}</span><span className="block truncate text-xs">{person.JobTitle ?? person.Department ?? person.Mail ?? person.UserPrincipalName}</span></span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {selectedPerson ? <div className="flex items-center gap-3 rounded-lg bg-accent p-3 text-accent-foreground"><Avatar><AvatarFallback>{initials(selectedPerson.DisplayName ?? 'User')}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedPerson.DisplayName}</p><p className="truncate text-xs">{selectedPerson.Mail ?? selectedPerson.UserPrincipalName}</p></div><CheckCircle2 className="size-5" /></div> : null}
              </div>

              <div className="space-y-2"><Label htmlFor="task-title">Task title</Label><Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" /></div>
              <div className="space-y-2"><Label htmlFor="task-description">Description <span className="text-muted-foreground">(optional)</span></Label><Textarea id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context or expected outcome" rows={3} /></div>
              <div className="space-y-2"><Label>Due date</Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}><CalendarIcon className="mr-2 size-4" />{dueDate ? format(dueDate, 'PPP') : 'Pick a date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} disabled={{ before: new Date() }} initialFocus /></PopoverContent></Popover></div>
              <Button className="w-full" type="submit" disabled={!selectedPerson || !title.trim() || !dueDate || createTask.isPending}>{createTask.isPending ? <LoaderCircle className="animate-spin" /> : <UserRound />} Assign task</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current assignments</CardTitle>
            <CardDescription>{tasks.length} tasks ordered by due date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksLoading ? <div className="flex items-center gap-2 py-10 text-sm"><LoaderCircle className="size-4 animate-spin" /> Loading assignments…</div> : null}
            {!tasksLoading && tasks.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center"><ClipboardList className="mx-auto mb-3 size-8" /><p className="font-medium">No assignments yet</p><p className="mt-1 text-sm text-muted-foreground">Search for a colleague to create the first task.</p></div> : null}
            {tasks.map((task) => (
              <article key={task.id} className={cn('rounded-lg border-l-4 bg-card p-4 text-card-foreground shadow-sm', task.statusKey === 'Completed' ? 'border-l-accent-foreground' : 'border-l-primary')}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium">{task.title}</h2><p className="mt-1 text-sm text-muted-foreground">{task.description || 'No description provided.'}</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Delete ${task.title}`}><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove this task?</AlertDialogTitle><AlertDialogDescription>This will remove “{task.title}” from the assignment list.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void handleDelete(task.id)}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Avatar className="size-8"><AvatarFallback>{initials(task.assignedUserDisplayName)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{task.assignedUserDisplayName}</p><p className="text-xs text-muted-foreground">Due {format(new Date(`${task.dueDate}T00:00:00`), 'MMM d, yyyy')}</p></div></div><Select value={task.statusKey} onValueChange={(value) => void handleStatus(task.id, value as TaskAssignmentStatusKey)} disabled={updateTask.isPending}><SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(statusLabels) as Array<[TaskAssignmentStatusKey, string]>).filter(([value]) => value).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
