import { Skeleton } from '@workspace/ui'

export function Card() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
      <Skeleton style={{ height: 160, borderRadius: 16 }} />
      <Skeleton style={{ height: 16, width: '80%' }} />
      <Skeleton style={{ height: 16, width: '60%' }} />
    </div>
  )
}

export function ListItem() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 320 }}>
      <Skeleton style={{ height: 40, width: 40, borderRadius: 999 }} />
      <div style={{ display: 'grid', gap: 8, flex: 1 }}>
        <Skeleton style={{ height: 14, width: '50%' }} />
        <Skeleton style={{ height: 14, width: '75%' }} />
      </div>
    </div>
  )
}
