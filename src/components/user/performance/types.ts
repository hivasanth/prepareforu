export interface TrendDataPoint {
  date: string
  sortKey: number
  accuracy: number
  score: number
}

export interface DistributionSlice {
  name: string
  value: number
  color: string
}

export type TimeRange = '7d' | '30d' | 'all'
