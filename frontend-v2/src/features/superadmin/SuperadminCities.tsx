import AdminCrudPage, { textColumn, boolColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { citiesCrud, statesCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminCities() {
  const statesQ = statesCrud.useList()
  const stateOptions = (statesQ.data ?? []).map((s) => ({
    label: String(s.stateName ?? s.name ?? `#${s.id}`),
    value: Number(s.id ?? 0),
  }))

  return (
    <AdminCrudPage<AdminEntity>
      title="Cities"
      description="Master list of cities across all states."
      crud={citiesCrud}
      columns={[
        textColumn('cityName', 'City'),
        textColumn('stateName', 'State'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="cityName"
      formFields={[
        { key: 'cityName', label: 'City Name', kind: 'text', required: true, placeholder: 'e.g. Mumbai' },
        { key: 'stateId',  label: 'State',     kind: 'select', options: stateOptions, required: true },
        { key: 'isActive', label: 'Active',    kind: 'checkbox', placeholder: 'Enable this city' },
      ]}
    />
  )
}
