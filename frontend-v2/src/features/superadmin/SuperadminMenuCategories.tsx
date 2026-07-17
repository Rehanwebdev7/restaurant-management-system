import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { menuCategoryCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminMenuCategories() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Menu Categories"
      description="Top-level menu categories across all restaurants."
      crud={menuCategoryCrud}
      columns={[
        textColumn('categoryName', 'Category'),
        textColumn('description', 'Description'),
        numberColumn('sortOrder', 'Order'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="categoryName"
      formFields={[
        { key: 'categoryName', label: 'Category Name', kind: 'text',     required: true, placeholder: 'e.g. Starters' },
        { key: 'description',  label: 'Description',   kind: 'textarea', placeholder: 'Optional description' },
        { key: 'sortOrder',    label: 'Sort Order',    kind: 'number',   placeholder: '0' },
        { key: 'isActive',     label: 'Active',        kind: 'checkbox', placeholder: 'Enable this category' },
      ]}
    />
  )
}
