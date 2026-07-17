import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { addonsCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminAddons() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Addons"
      description="Menu-item add-on groups (e.g. Extra Cheese, Toppings, Sauces)."
      crud={addonsCrud}
      columns={[
        textColumn('addonName', 'Addon Group'),
        textColumn('description', 'Description'),
        numberColumn('sortOrder', 'Order'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="addonName"
      formFields={[
        { key: 'addonName',   label: 'Addon Group Name', kind: 'text',     required: true, placeholder: 'e.g. Extra Toppings' },
        { key: 'description', label: 'Description',      kind: 'textarea', placeholder: 'Optional' },
        { key: 'sortOrder',   label: 'Sort Order',       kind: 'number',   placeholder: '0' },
        { key: 'isActive',    label: 'Active',           kind: 'checkbox', placeholder: 'Enable' },
      ]}
    />
  )
}
