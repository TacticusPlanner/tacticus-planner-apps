import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui'

export function Open() {
  return (
    <TooltipProvider>
      <div style={{ paddingTop: 56, display: 'flex', justifyContent: 'center' }}>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Add to library</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
