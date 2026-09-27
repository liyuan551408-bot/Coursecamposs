<!-- @file Provides the shared labelled advanced course-filter layout. -->
<script setup>
import { computed } from 'vue'
import { CREDIT_RANGE, WORKLOAD_RANGE } from '../utils/courseFilters'

const props = defineProps({
  modelValue: { type: Object, required: true },
  subjects: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'apply', 'reset'])

const semesterOptions = [
  ['Semester 1', 'SEMESTER_1'], ['Semester 2', 'SEMESTER_2'], ['Summer', 'SUMMER'],
]
const assessmentOptions = ['EXAM', 'ASSIGNMENT', 'QUIZ', 'PROJECT', 'LAB', 'PRESENTATION']
const creditMarks = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index * 15, String(index * 15)]))
const workloadMarks = Object.fromEntries(Array.from({ length: 8 }, (_, index) => [(index + 1) * 150, String((index + 1) * 150)]))

const creditsLabel = computed(() => `${props.modelValue.creditsRange?.[0] ?? 0}–${props.modelValue.creditsRange?.[1] ?? 120} credits`)
const workloadLabel = computed(() => `${props.modelValue.workloadRange?.[0] ?? 150}–${props.modelValue.workloadRange?.[1] ?? 1200} hours`)

function update(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
    ...(field === 'creditsRange' ? { creditsRangeActive: true } : {}),
    ...(field === 'workloadRange' ? { workloadRangeActive: true } : {}),
  })
}
</script>

<template>
  <div class="advanced-filter-layout" :aria-busy="disabled">
    <div class="filter-field">
      <label>Category / subject</label>
      <el-select :model-value="modelValue.subjectId" clearable placeholder="All subjects" :disabled="disabled" @update:model-value="update('subjectId', $event)">
        <el-option v-for="subject in subjects" :key="subject.id" :label="`${subject.code} — ${subject.name}`" :value="subject.id" />
      </el-select>
    </div>
    <div class="filter-field">
      <label>Course level</label>
      <el-select :model-value="modelValue.level" clearable placeholder="All levels" :disabled="disabled" @update:model-value="update('level', $event)">
        <el-option v-for="level in [100,200,300,400,500,600,700,800,900]" :key="level" :label="`Level ${level}`" :value="level" />
      </el-select>
    </div>
    <div class="filter-field">
      <label>Semester</label>
      <el-select :model-value="modelValue.semester" clearable placeholder="Any semester" :disabled="disabled" @update:model-value="update('semester', $event)">
        <el-option v-for="([label, value]) in semesterOptions" :key="value" :label="label" :value="value" />
      </el-select>
    </div>
    <div class="filter-field">
      <label>Assessment type</label>
      <el-select :model-value="modelValue.assessmentType" clearable placeholder="Any assessment" :disabled="disabled" @update:model-value="update('assessmentType', $event)">
        <el-option v-for="item in assessmentOptions" :key="item" :label="item.toLowerCase().replace('_', ' ')" :value="item" />
      </el-select>
    </div>
    <div class="filter-field filter-field--range">
      <div class="range-heading"><label>Credits</label><span>{{ creditsLabel }}</span></div>
      <el-slider
        :model-value="modelValue.creditsRange"
        range
        show-stops
        :min="CREDIT_RANGE.min"
        :max="CREDIT_RANGE.max"
        :step="CREDIT_RANGE.step"
        :marks="creditMarks"
        :disabled="disabled"
        @update:model-value="update('creditsRange', $event)"
      />
    </div>
    <div class="filter-field filter-field--range">
      <div class="range-heading"><label>Study hours / workload</label><span>{{ workloadLabel }}</span></div>
      <el-slider
        :model-value="modelValue.workloadRange"
        range
        show-stops
        :min="WORKLOAD_RANGE.min"
        :max="WORKLOAD_RANGE.max"
        :step="WORKLOAD_RANGE.step"
        :marks="workloadMarks"
        :disabled="disabled"
        @update:model-value="update('workloadRange', $event)"
      />
    </div>
    <div class="filter-field">
      <label>Minimum rating</label>
      <el-input-number :model-value="modelValue.minRating" :min="1" :max="5" controls-position="right" placeholder="Any rating" :disabled="disabled" @update:model-value="update('minRating', $event)" />
    </div>
    <div class="filter-field">
      <label>Prerequisites</label>
      <el-select :model-value="modelValue.hasPrerequisites" clearable placeholder="Any" :disabled="disabled" @update:model-value="update('hasPrerequisites', $event)">
        <el-option label="Has prerequisites" value="true" />
        <el-option label="No prerequisites" value="false" />
      </el-select>
    </div>
    <div class="filter-actions">
      <el-button :disabled="disabled" @click="emit('reset')">Reset</el-button>
      <el-button type="primary" :disabled="disabled" @click="emit('apply')">Apply filters</el-button>
    </div>
  </div>
</template>

<style scoped>
.advanced-filter-layout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px; }
.filter-field { display: grid; align-content: start; gap: 7px; min-width: 0; }
.filter-field > label, .range-heading label { color: var(--text-h); font-size: 12px; font-weight: 700; }
.filter-field :deep(.el-input-number) { width: 100%; }
.filter-field--range { grid-column: 1 / -1; padding: 4px 8px 16px; }
.range-heading { display: flex; justify-content: space-between; gap: 12px; }
.range-heading span { color: var(--accent); font-size: 12px; font-weight: 650; }
.filter-field--range :deep(.el-slider) { margin: 5px 8px 14px; width: calc(100% - 16px); }
.filter-field--range :deep(.el-slider__marks-text) { color: var(--text-muted); font-size: 10px; white-space: nowrap; }
.filter-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 8px; padding-top: 2px; }
@media (max-width: 680px) { .advanced-filter-layout { grid-template-columns: 1fr; } .filter-field--range, .filter-actions { grid-column: 1; } .filter-field--range :deep(.el-slider__marks-text) { display: none; } }
</style>
