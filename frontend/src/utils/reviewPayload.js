const emptyRating = (value) => value === null || value === undefined || value === '' || Number(value) === 0

export function isWholeRating(value, { required = false } = {}) {
  if (emptyRating(value)) return !required
  const rating = Number(value)
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

export function buildReviewPayload(form) {
  const optionalRating = (value) => emptyRating(value) ? null : Number(value)
  const comment = typeof form.comment === 'string' ? form.comment.trim() : ''

  return {
    overallRating: Number(form.overallRating),
    difficultyRating: Number(form.difficultyRating),
    workloadRating: Number(form.workloadRating),
    teachingRating: optionalRating(form.teachingRating),
    usefulnessRating: optionalRating(form.usefulnessRating),
    assessmentStyle: form.assessmentStyle || null,
    comment: comment || null,
  }
}

export function reviewToForm(review) {
  return {
    overallRating: review?.overallRating ?? 0,
    difficultyRating: review?.difficultyRating ?? 0,
    workloadRating: review?.workloadRating ?? 0,
    teachingRating: review?.teachingRating ?? 0,
    usefulnessRating: review?.usefulnessRating ?? 0,
    assessmentStyle: review?.assessmentStyle ?? '',
    comment: review?.comment ?? '',
  }
}
