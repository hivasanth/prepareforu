export interface SubAdminRow {
  id: string
  full_name: string
  email: string
  coupon_code: string
  total_referrals: number | null
  status: string | null
  created_at: string
  updated_at: string
  commission_percentage: number | null
}
