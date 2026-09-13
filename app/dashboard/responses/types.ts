export interface FormMetaItem {
  formId: string
  title: string
  versionNumber: number
  versionLabel: string
}

export interface DistMetaItem {
  distributionId: string
  code: string
  title: string
  ownerName?: string
  ownerType?: string
  formId?: string
}

export interface PersonAuthorOption {
  ownerKey: string
  ownerName: string
  ownerType: string
  codes: string[]
  count: number
}
