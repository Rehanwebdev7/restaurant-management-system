import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { diningTablesCrud, sectionCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminDiningTables() {
  const sectionsQ = sectionCrud.useList()
  const sectionOptions = (sectionsQ.data ?? []).map((s) => ({
    label: String(s.sectionName ?? s.name ?? `#${s.id}`),
    value: Number(s.id ?? 0),
  }))

  return (
    <AdminCrudPage<AdminEntity>
      title="Dining Tables"
      description="Physical tables mapped to sections for reservations + QR ordering."
      crud={diningTablesCrud}
      columns={[
        textColumn('tableName', 'Table'),
        textColumn('sectionName', 'Section'),
        numberColumn('seats', 'Seats'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="tableName"
      formFields={[
        { key: 'tableName', label: 'Table Name/No.', kind: 'text',     required: true, placeholder: 'e.g. T-01' },
        { key: 'sectionId', label: 'Section',        kind: 'select',   required: true, options: sectionOptions },
        { key: 'seats',     label: 'Seats',          kind: 'number',   placeholder: '4' },
        { key: 'isActive',  label: 'Active',         kind: 'checkbox', placeholder: 'Table available' },
      ]}
    />
  )
}
