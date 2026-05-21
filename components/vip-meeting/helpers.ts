import * as yup from 'yup'

export type VipMeetingFormFields = {
  guest_name: string
  guest_email: string
  guest_phone: string
  notes: string
}

export const vipMeetingSchema = yup.object({
  guest_name: yup.string().trim().min(2).required(),
  guest_email: yup.string().trim().email().required(),
  guest_phone: yup.string().trim().default(''),
  notes: yup.string().trim().default(''),
})
