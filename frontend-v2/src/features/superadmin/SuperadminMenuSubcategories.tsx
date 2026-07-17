import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { menuSubcategoryCrud, menuCategoryCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminMenuSubcategories() {
  const catsQ = menuCategoryCrud.useList()
  const categoryOptions = (catsQ.data ?? []).map((c) => ({
    label: String(c.categoryName ?? c.name ?? `#${c.id}`),
    value: Number(c.id ?? 0),
  }))

  return (
    <AdminCrudPage<AdminEntity>
      title="Menu Subcategories"
      description="Second-level menu groupings under a parent category."
      crud={menuSubcategoryCrud}
      columns={[
        textColumn('subcategoryName', 'Subcategory'),
        textColumn('categoryName', 'Parent category'),
        numberColumn('sortOrder', 'Order'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="subcategoryName"
      formFields={[
        { key: 'subcategoryName', label: 'Subcategory Name', kind: 'text',     required: true, placeholder: 'e.g. Veg Starters' },
        { key: 'categoryId',      label: 'Parent Category',  kind: 'select',   required: true, options: categoryOptions },
        { key: 'description',     label: 'Description',      kind: 'textarea', placeholder: 'Optional' },
        { key: 'sortOrder',       label: 'Sort Order',       kind: 'number',   placeholder: '0' },
        { key: 'isActive',        label: 'Active',           kind: 'checkbox', placeholder: 'Enable this subcategory' },
      ]}
    />
  )
}
