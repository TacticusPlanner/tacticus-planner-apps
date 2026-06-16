import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { tableRows } from "../model/ui-kit"
import { DataTableShowcase } from "./data-table-showcase"
import { UiKitShowcaseCard } from "./ui-kit-showcase-card"

export function DataDisplayShowcase() {
  return (
    <div className="flex flex-col gap-4">
      <UiKitShowcaseCard
        description="Static sample rows for component inventory previews."
        title="Basic table"
      >
        <Table data-testid="data-display-table">
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((row) => (
              <TableRow key={row.component}>
                <TableCell className="font-medium">{row.component}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.status}</Badge>
                </TableCell>
                <TableCell>{row.owner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </UiKitShowcaseCard>

      <UiKitShowcaseCard
        description="TanStack Table composition with shadcn controls."
        title="Data table"
      >
        <DataTableShowcase />
      </UiKitShowcaseCard>
    </div>
  )
}
