import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'

import {
  CREDIT_RANGE,
  WORKLOAD_RANGE,
  createDefaultCourseFilters,
  filtersFromQuery,
  filtersToApiParams,
} from '../src/utils/courseFilters.js'
import { dedupeKeywords, INTEREST_KEYWORDS, suggestKeywords } from '../src/utils/profileKeywords.js'
import { safeReturnTarget } from '../src/utils/courseNavigation.js'
import { useCompareStore } from '../src/stores/compare.js'

test('course filter ranges use the requested limits and intervals', () => {
  assert.deepEqual(CREDIT_RANGE, { min: 0, max: 120, step: 15 })
  assert.deepEqual(WORKLOAD_RANGE, { min: 150, max: 1200, step: 150 })
  assert.deepEqual(createDefaultCourseFilters().creditsRange, [0, 120])
  assert.deepEqual(createDefaultCourseFilters().workloadRange, [150, 1200])
  const activeFullRange = createDefaultCourseFilters()
  activeFullRange.creditsRangeActive = true
  activeFullRange.workloadRangeActive = true
  assert.deepEqual(filtersToApiParams(activeFullRange), {
    minCredits: 0, maxCredits: 120, minWorkload: 150, maxWorkload: 1200,
  })
})

test('range filters map to inclusive backend min and max fields', () => {
  const filters = createDefaultCourseFilters()
  filters.creditsRange = [15, 90]
  filters.workloadRange = [300, 900]
  assert.deepEqual(filtersToApiParams(filters), {
    minCredits: 15,
    maxCredits: 90,
    minWorkload: 300,
    maxWorkload: 900,
  })
  assert.deepEqual(filtersFromQuery({
    minCredits: '15', maxCredits: '90', minWorkload: '300', maxWorkload: '900',
  }).workloadRange, [300, 900])
})

test('machine input suggests Machine Learning and custom tags remain valid', () => {
  const suggestions = suggestKeywords('machine', INTEREST_KEYWORDS, [])
  assert.equal(suggestions[0], 'Machine Learning')
  assert.deepEqual(dedupeKeywords(['Machine Learning', 'machine learning', 'My custom topic']), [
    'Machine Learning', 'My custom topic',
  ])
})

test('detail return targets accept only internal application paths', () => {
  assert.equal(safeReturnTarget('/compare?q=ai'), '/compare?q=ai')
  assert.equal(safeReturnTarget('https://example.com'), null)
  assert.equal(safeReturnTarget('//example.com'), null)
})

test('comparison generation uses a store-level duplicate request lock', () => {
  const values = new Map()
  globalThis.window = {
    sessionStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  }
  setActivePinia(createPinia())
  const store = useCompareStore()
  store.addCourse({ id: 1, code: '159.101' })
  store.addCourse({ id: 2, code: '159.201' })
  assert.equal(store.beginGeneration(), true)
  assert.equal(store.beginGeneration(), false)
  assert.equal(store.removeCourse(2), false)
  store.finishGeneration({
    summary: 'The courses form a clear learning sequence.',
    relationships: [],
    learningOrder: [
      { courseId: 1, reason: 'Foundation' },
      { courseId: 2, reason: 'Builds on the foundation' },
    ],
  })
  assert.equal(store.summaryStreaming, true)
  store.completeSummaryStream()
  assert.equal(store.summaryStreaming, false)
  assert.equal(store.removeCourse(2), true)
  delete globalThis.window
})
