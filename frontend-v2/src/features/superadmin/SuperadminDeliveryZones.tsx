import AdminCrudPage, { textColumn, boolColumn, numberColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { deliveryZonesCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminDeliveryZones() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Delivery Zones"
      description="Pincode-based delivery zones + per-zone charges + min-order rules."
      crud={deliveryZonesCrud}
      columns={[
        textColumn('zoneName', 'Zone'),
        textColumn('pincode', 'Pincode'),
        numberColumn('deliveryCharge', 'Charge (₹)'),
        numberColumn('minimumOrder', 'Min Order (₹)'),
        numberColumn('freeDeliveryOver', 'Free Over (₹)'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="zoneName"
      formFields={[
        { key: 'zoneName',         label: 'Zone Name',        kind: 'text',   required: true, placeholder: 'e.g. Bandra West' },
        { key: 'pincode',          label: 'Pincode',          kind: 'text',   required: true, placeholder: '400050' },
        { key: 'deliveryCharge',   label: 'Delivery Charge',  kind: 'number', placeholder: '40' },
        { key: 'minimumOrder',     label: 'Minimum Order',    kind: 'number', placeholder: '200' },
        { key: 'freeDeliveryOver', label: 'Free Delivery ≥',  kind: 'number', placeholder: '499' },
        { key: 'estimatedTime',    label: 'ETA (minutes)',    kind: 'number', placeholder: '30' },
        { key: 'isActive',         label: 'Active',           kind: 'checkbox', placeholder: 'Serving this zone' },
      ]}
    />
  )
}
