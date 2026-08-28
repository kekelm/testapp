# Entra task assignment app

## Goal
Build a focused single-page productivity app where the signed-in user searches Microsoft Entra users by display name and assigns tasks to selected people.

## Data sources
- Office 365 Users connection: live directory search by display name and user identity details.
- App-owned data model: Task Assignments.
- No existing Dataverse or SharePoint tables are available; create the app-owned task store.

## App experience
- **Task workspace:** One-page layout with people search, selected assignees, task creation, and current assignments.
- **People search:** Debounced display-name search against Office 365 Users, with clear loading, empty, and error states.
- **Person selection:** Search results show concise identity details and support selecting one assignee per task.
- **Task form:** Capture task title, optional description, due date, and selected Entra user; prevent submission until required values are present.
- **Assignments list:** Show saved tasks with assignee, due date, and status; support status updates and deletion.
- **Feedback:** Confirm successful actions with accessible rich-color notifications and show actionable connector/data errors.

## Data entities
- Task Assignments

## Design direction
- Refined utilitarian workspace with a blue productivity palette, compact cards, strong search affordance, and accessible light/dark semantic tokens.
- No navigation chrome because the app has one page.
- Responsive layout that keeps search and assignment creation prominent on desktop and stacks cleanly on smaller screens.

## Personalization
- Use the current Power Apps user context to identify the signed-in user and personalize the workspace without adding account controls.

## Scope boundaries
- Keep directory data live through Office 365 Users; do not copy Entra users into the app data model.
- Store only the selected user's stable identity and display details needed on each task assignment.
- Do not add email, Teams notifications, recurring tasks, multi-assignee tasks, or extra pages.

## Validation
- Verify connector hook usage, TypeScript, linting, SDK conventions, responsive behavior, form validation, and all task actions.
