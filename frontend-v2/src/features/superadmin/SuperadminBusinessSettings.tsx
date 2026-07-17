import AdminCrudPage, { textColumn, boolColumn } from '@/features/superadmin/_shared/AdminCrudPage'
import { businessSettingCrud } from '@/api/queries/superadmin'
import type { AdminEntity } from '@/api/services/superadmin'

export default function SuperadminBusinessSettings() {
  return (
    <AdminCrudPage<AdminEntity>
      title="Business Settings"
      description="Restaurant-specific business configuration (per tenant)."
      crud={businessSettingCrud}
      columns={[
        textColumn('restaurantName', 'Restaurant'),
        textColumn('phone', 'Phone'),
        textColumn('email', 'Email'),
        textColumn('city', 'City'),
        boolColumn('isActive', 'Status'),
      ]}
      searchKey="restaurantName"
      formFields={[
        { key: 'restaurantName',   label: 'Restaurant Name', kind: 'text',     required: true, placeholder: 'Brand display name' },
        { key: 'tagline',          label: 'Tagline',         kind: 'text',     placeholder: 'Short tagline' },
        { key: 'phone',            label: 'Phone',           kind: 'text',     placeholder: '+91 …' },
        { key: 'email',            label: 'Email',           kind: 'text',     placeholder: 'contact@…' },
        { key: 'whatsappNumber',   label: 'WhatsApp',        kind: 'text',     placeholder: '+91 …' },
        { key: 'address',          label: 'Address',         kind: 'textarea', placeholder: 'Full address' },
        { key: 'city',             label: 'City',            kind: 'text' },
        { key: 'aboutUs',          label: 'About Us',        kind: 'textarea' },
        { key: 'ourMission',       label: 'Our Mission',     kind: 'textarea' },
        { key: 'ourVision',        label: 'Our Vision',      kind: 'textarea' },
        { key: 'marqueeText',      label: 'Marquee Text',    kind: 'textarea' },
        { key: 'marqueeIsLive',    label: 'Marquee Live',    kind: 'checkbox', placeholder: 'Show marquee strip' },
        { key: 'isActive',         label: 'Active',          kind: 'checkbox', placeholder: 'Restaurant enabled' },
      ]}
    />
  )
}
