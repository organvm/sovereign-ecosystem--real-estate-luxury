import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIConciergeService } from '../lib/ai-concierge-service'
import type { Property } from '../lib/types'
import type { UserPreferences } from '../lib/recommendation-engine'

const makeProperty = (overrides: Partial<Property> = {}): Property => ({
  id: `property-${overrides.id ?? '1'}`,
  title: 'Bluefield Residence',
  address: '77 Harbor Rd',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11201',
  price: 1_000_000,
  yearBuilt: 2018,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1_300,
  imageUrl: '/property.jpg',
  isCurated: false,
  complianceFlags: [],
  ...overrides
})

const makePreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  priceRange: { min: 500_000, max: 4_000_000 },
  preferredCities: ['Brooklyn', 'Manhattan'],
  minBedrooms: 2,
  minBathrooms: 1,
  preferredFeatures: ['high ceilings', 'modern finishes'],
  investmentGoals: 'balanced',
  riskTolerance: 'moderate',
  ...overrides,
})

type SparkMock = {
  llmPrompt: (...args: Parameters<typeof String.raw>) => string
  llm: (prompt: string, model: string, jsonMode?: boolean) => Promise<string>
}

function setSparkMock(overrides: Partial<SparkMock> = {}) {
  ;(globalThis as unknown as { spark: SparkMock }).spark = {
    llmPrompt: (strings, ...values) =>
      strings.reduce((output, value, index) => `${output}${value}${String(values[index] ?? '')}`, ''),
    llm: vi.fn(async () => JSON.stringify({})),
    ...overrides,
  }
}

const service = AIConciergeService.getInstance()

describe('AIConciergeService', () => {
  beforeEach(() => {
    setSparkMock()
  })

  it('returns deterministic quick actions for empty data', async () => {
    const actions = await service.generateQuickActions([], [], makePreferences())

    expect(actions).toHaveLength(2)
    expect(actions[0]).toMatchObject({
      label: 'Market overview',
      action: 'analyze:market',
      icon: 'bar-chart'
    })
    expect(actions[1]).toMatchObject({
      label: 'Compare properties',
      action: 'compare:properties',
      icon: 'git-compare'
    })
  })

  it('includes property, portfolio, and lease actions and caps the action count', () => {
    const properties = [
      makeProperty({ price: 1_500_000 }),
      makeProperty({ id: '2', roi: 12, city: 'Manhattan' }),
    ]
    const portfolio = [
      makeProperty({ id: '3', leaseEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() }),
      makeProperty({ id: '4', leaseEndDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString() }),
    ]

    const actions = service.generateQuickActions(properties, portfolio, makePreferences())

    expect(actions).toHaveLength(6)
    expect(actions.map(action => action.action)).toEqual([
      'search:price<2000000',
      'search:location:Brooklyn',
      'search:roi>10',
      'analyze:portfolio',
      'view:expiring-leases',
      'analyze:market'
    ])
    expect(actions[0].label).toBe('Find properties under $2M')
    expect(actions[4].label).toBe('2 leases expiring soon')
  })

  it('calculates investment projections with monotonically growing projections', () => {
    const property = makeProperty()
    const result = service.calculateInvestmentProjection(property, 25_000, 3)

    expect(result.yearlyProjections).toHaveLength(3)
    expect(result.summary.totalReturn).toBeGreaterThanOrEqual(0)
    expect(result.yearlyProjections[1].year).toBe(2)
    expect(result.yearlyProjections[2].year).toBe(3)
    expect(result.yearlyProjections[2].rent).toBeGreaterThan(result.yearlyProjections[1].rent)
    expect(result.summary.totalCashFlow).toBeCloseTo(
      result.yearlyProjections.reduce((sum, step) => sum + step.cashFlow, 0),
      9
    )
    expect(result.summary.totalReturn).toBeCloseTo(
      result.summary.totalCashFlow + result.summary.totalAppreciation,
      9
    )
  })

  it('returns portfolio-health zero-state without invoking LLM', async () => {
    const health = await service.analyzePortfolioHealth([])

    expect(health.overallScore).toBe(0)
    expect(health.strengths).toHaveLength(0)
    expect(health.weaknesses).toEqual(['No properties in portfolio yet'])
    expect(health.metrics).toEqual({
      totalValue: 0,
      avgCapRate: 0,
      avgROI: 0,
      diversificationScore: 0,
      riskScore: 0
    })
  })

  it('throws when compareProperties receives fewer than two properties', async () => {
    const property = makeProperty()
    const result = service.compareProperties([property.id], [property])
    await expect(result).rejects.toThrow('Need at least 2 properties to compare')
  })

  it('returns zero market insight for an unmatched location filter', async () => {
    const result = await service.generateMarketAnalysis([makeProperty({ city: 'Brooklyn' })], 'Miami')

    expect(result.summary).toBe('No properties found in Miami.')
    expect(result.averageMetrics).toEqual({
      price: 0,
      capRate: 0,
      roi: 0,
      pricePerSqft: 0
    })
    expect(result.trends).toEqual([])
    expect(result.risks).toEqual([])
  })

  it('parses analyzeQuery output from spark', async () => {
    const spark = (globalThis as unknown as { spark: SparkMock }).spark
    spark.llm = vi.fn(async () => JSON.stringify({
      intent: 'property-search',
      confidence: 0.91,
      entities: { location: ['Brooklyn'], bedrooms: 2, properties: [] },
      suggestedActions: ['Review short list', 'Set rent range', 'Check financing']
    }))

    const analysis = await service.analyzeQuery('Find two-bedroom homes in Brooklyn', {
      properties: [makeProperty()],
      conversationHistory: [
        { id: '1', role: 'user', content: 'start', timestamp: new Date(), metadata: {} }
      ],
      userPreferences: makePreferences(),
    })

    expect(analysis.intent).toBe('property-search')
    expect(analysis.confidence).toBe(0.91)
    expect(analysis.entities).toMatchObject({ location: ['Brooklyn'], bedrooms: 2 })
    expect(analysis.suggestedActions[0]).toBe('Review short list')
  })

  it('falls back to defaults when spark returns malformed JSON', async () => {
    const spark = (globalThis as unknown as { spark: SparkMock }).spark
    spark.llm = vi.fn(async () => 'not-json')

    const analysis = await service.analyzeQuery('bad format', {
      properties: [makeProperty()],
      conversationHistory: [],
      userPreferences: makePreferences(),
    })

    expect(analysis.intent).toBe('general-question')
    expect(analysis.suggestedActions).toEqual(['Browse properties', 'View market overview', 'Check portfolio'])
  })

  it('maps matching property IDs from spark search results', async () => {
    const spark = (globalThis as unknown as { spark: SparkMock }).spark
    spark.llm = vi.fn(async () => JSON.stringify({
      propertyIds: ['b', 'a'],
      explanation: 'Match by budget and location.'
    }))

    const properties = [
      makeProperty({ id: 'a', price: 900_000 }),
      makeProperty({ id: 'b', city: 'Bronx' }),
      makeProperty({ id: 'c', city: 'Manhattan' }),
    ]

    const result = await service.searchProperties('quiet places', properties, makePreferences())

    expect(result.explanation).toBe('Match by budget and location.')
    expect(result.properties.map(property => property.id)).toEqual(['b', 'a'])
  })

  it('falls back to safe response when searchProperties parse fails', async () => {
    const spark = (globalThis as unknown as { spark: SparkMock }).spark
    spark.llm = vi.fn(async () => '{')

    const result = await service.searchProperties('bad', [makeProperty()], makePreferences())

    expect(result.properties).toHaveLength(0)
    expect(result.explanation).toBe('I had trouble understanding that query. Could you try rephrasing it?')
  })
})
