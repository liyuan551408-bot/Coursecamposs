import assert from 'node:assert/strict'
import test from 'node:test'

import { buildReviewPayload, isWholeRating, reviewToForm } from '../src/utils/reviewPayload.js'

test('empty optional review fields are normalized to null', () => {
  assert.deepEqual(buildReviewPayload({
    overallRating: 5,
    difficultyRating: 3,
    workloadRating: 4,
    teachingRating: 0,
    usefulnessRating: 0,
    assessmentStyle: '',
    comment: '   ',
  }), {
    overallRating: 5,
    difficultyRating: 3,
    workloadRating: 4,
    teachingRating: null,
    usefulnessRating: null,
    assessmentStyle: null,
    comment: null,
  })
})

test('whole-rating validation matches the backend integer contract', () => {
  assert.equal(isWholeRating(5, { required: true }), true)
  assert.equal(isWholeRating(0, { required: true }), false)
  assert.equal(isWholeRating(0), true)
  assert.equal(isWholeRating(3.5, { required: true }), false)
  assert.equal(isWholeRating(6), false)
})

test('stored null values become empty form controls', () => {
  assert.deepEqual(reviewToForm({
    overallRating: 4,
    difficultyRating: 2,
    workloadRating: 3,
    teachingRating: null,
    usefulnessRating: null,
    assessmentStyle: null,
    comment: null,
  }), {
    overallRating: 4,
    difficultyRating: 2,
    workloadRating: 3,
    teachingRating: 0,
    usefulnessRating: 0,
    assessmentStyle: '',
    comment: '',
  })
})
