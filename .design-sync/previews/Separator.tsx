import { Separator } from '@workspace/ui'

export function Horizontal() {
  return (
    <div style={{ width: 320 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Radix Primitives</div>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
        An open-source UI component library.
      </div>
      <Separator style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', gap: 12, fontSize: 13, alignItems: 'center' }}>
        <span>Blog</span>
        <Separator orientation="vertical" style={{ height: 16 }} />
        <span>Docs</span>
        <Separator orientation="vertical" style={{ height: 16 }} />
        <span>Source</span>
      </div>
    </div>
  )
}
