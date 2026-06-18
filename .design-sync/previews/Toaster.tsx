import { useEffect } from 'react'
import { toast } from 'sonner'

import { Button, Toaster } from '@workspace/ui'

// Mirrors apps/web/.../ui-kit/ui/feedback-showcase.tsx. `toast()` comes from
// `sonner` (exposed on the bundle via cfg.extraEntries: ["sonner"], so it is
// the SAME instance the kit's <Toaster> renders). Two toasts are fired on
// mount with no auto-dismiss so the card shows them without interaction; the
// buttons demonstrate the live API.
export function Toasts() {
  useEffect(() => {
    const ids = [
      toast.success('Roster sync complete.', { duration: Infinity }),
      toast('Upgrade plan saved.', {
        duration: Infinity,
        description: 'Your campaign energy plan was stored.',
      }),
    ]
    return () => ids.forEach((id) => toast.dismiss(id))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button variant="outline" onClick={() => toast('Upgrade plan saved.')}>
          Default toast
        </Button>
        <Button variant="outline" onClick={() => toast.success('Roster sync complete.')}>
          Success toast
        </Button>
        <Button variant="outline" onClick={() => toast.error('Battle import failed.')}>
          Error toast
        </Button>
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  )
}
