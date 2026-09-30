## REMOVED Requirements

### Requirement: Bulk pause and resume for a project

**Reason**: Removed by decision: the project detail route that hosted it is gone, and `project-management` already forbade a project-wide pause/resume control; this requirement contradicted it. The client no longer calls `POST me/projects/{projectId}/goals/status`.
**Migration**: Pause and resume remain per-goal row actions ("Pause and resume are primary row actions"). No surface offers a bulk variant (`project-management` "No bulk pause/resume on Projects").
