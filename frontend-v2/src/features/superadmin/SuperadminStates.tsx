import AdminCrudPage, { textColumn, boolColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { statesCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminStates() {
  return (
    <AdminCrudPage<AdminEntity>
      title="States"
      description="Master list of platform-supported states."
      crud={statesCrud}
      columns={[
        textColumn('stateName', 'State'),
        textColumn('stateCode', 'Code'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="stateName"
      formFields={[
        { key: 'stateName', label: 'State Name', kind: 'text', required: true, placeholder: 'e.g. Maharashtra' },
        { key: 'stateCode', label: 'Code',       kind: 'text', placeholder: 'e.g. MH' },
        { key: 'isActive',  label: 'Active',     kind: 'checkbox', placeholder: 'Enable this state' },
      ]}
    />
  )
}
