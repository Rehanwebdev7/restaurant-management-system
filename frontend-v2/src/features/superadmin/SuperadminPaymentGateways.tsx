import AdminCrudPage, { textColumn, boolColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { paymentGatewayCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminPaymentGateways() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Payment Gateways"
      description="Configured payment gateways across all restaurants."
      crud={paymentGatewayCrud}
      columns={[
        textColumn('title', 'Title'),
        textColumn('vendorname', 'Vendor'),
        textColumn('paymentMethod', 'Method'),
        boolColumn('status', 'Enabled'),
        boolColumn('allowCod', 'Allow COD'),
      ]}
      searchKey="title"
      formFields={[
        { key: 'title',         label: 'Title',          kind: 'text',     required: true, placeholder: 'Display title' },
        { key: 'vendorname',    label: 'Vendor',         kind: 'text',     placeholder: 'e.g. stripe, razorpay, paypal' },
        { key: 'paymentMethod', label: 'Payment Method', kind: 'text',     placeholder: 'e.g. CARD, UPI, WALLET' },
        { key: 'status',        label: 'Enabled',        kind: 'checkbox', placeholder: 'Gateway active' },
        { key: 'allowCod',      label: 'Allow COD',      kind: 'checkbox', placeholder: 'Cash on delivery enabled' },
      ]}
    />
  )
}
