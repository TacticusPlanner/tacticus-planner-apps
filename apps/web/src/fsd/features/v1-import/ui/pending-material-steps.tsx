import {
  clearPendingMaterialSteps,
  usePendingMaterialSteps,
} from "../model/pending-material-steps"
import { MaterialSteps } from "./material-steps"

/** The last V1 import's material steps, until dismissed — for hosts outside the import report. */
export function PendingMaterialSteps() {
  const steps = usePendingMaterialSteps()
  if (steps.length === 0) return null
  return (
    <div data-testid="v1-import-pending-material-steps">
      <MaterialSteps onDismiss={clearPendingMaterialSteps} steps={steps} />
    </div>
  )
}
