import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { sectionCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminSections() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Sections"
      description="Restaurant dining sections (indoor / outdoor / rooftop etc.)."
      crud={sectionCrud}
      columns={[
        textColumn('sectionName', 'Section'),
        textColumn('description', 'Description'),
        numberColumn('capacity', 'Capacity'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="sectionName"
      formFields={[
        { key: 'sectionName', label: 'Section Name', kind: 'text',     required: true, placeholder: 'e.g. Rooftop' },
        { key: 'description', label: 'Description',  kind: 'textarea', placeholder: 'Optional' },
        { key: 'capacity',    label: 'Capacity',     kind: 'number',   placeholder: '0' },
        { key: 'isActive',    label: 'Active',       kind: 'checkbox', placeholder: 'Enable this section' },
      ]}
    />
  )
}
