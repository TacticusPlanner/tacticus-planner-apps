import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui'

export function Default() {
  return (
    <Tabs defaultValue="overview" style={{ width: 420 }}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          A high-level summary of your workspace activity this month.
        </p>
      </TabsContent>
      <TabsContent value="analytics">
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Detailed charts and engagement metrics.
        </p>
      </TabsContent>
      <TabsContent value="reports">
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
          Scheduled and exported reports.
        </p>
      </TabsContent>
    </Tabs>
  )
}
