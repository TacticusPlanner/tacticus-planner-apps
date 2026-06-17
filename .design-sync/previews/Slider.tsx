import { Slider } from '@workspace/ui'

export function Default() {
  return <Slider defaultValue={[50]} max={100} step={1} style={{ width: 320 }} />
}

export function Range() {
  return <Slider defaultValue={[25, 75]} max={100} step={1} style={{ width: 320 }} />
}

export function Stepped() {
  return (
    <div style={{ display: 'grid', gap: 6, width: 320 }}>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Volume</span>
      <Slider defaultValue={[40]} max={100} step={10} />
    </div>
  )
}
