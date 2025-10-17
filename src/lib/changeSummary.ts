import type { NodeColor, SnapshotChanges } from './redBlackTree'

export type ChangeChipKind = 'added' | 'removed' | 'recolored' | 'moved'

export interface ChangeChip {
  key: string
  kind: ChangeChipKind
  text: string
}

const colorLabelMap: Record<NodeColor, string> = {
  red: '빨강',
  black: '검정',
}

const formatValues = (values: number[]) => {
  if (values.length === 0) {
    return ''
  }
  if (values.length <= 3) {
    return values.join(', ')
  }
  return `${values.slice(0, 3).join(', ')} 외 ${values.length - 3}`
}

export const buildChangeChips = (changes: SnapshotChanges): ChangeChip[] => {
  const chips: ChangeChip[] = []

  if (changes.added.length) {
    chips.push({
      key: `added-${changes.added.map((item) => item.id).join('-')}`,
      kind: 'added',
      text: `+ ${formatValues(changes.added.map((item) => item.value))}`,
    })
  }

  if (changes.removed.length) {
    chips.push({
      key: `removed-${changes.removed.map((item) => item.id).join('-')}`,
      kind: 'removed',
      text: `- ${formatValues(changes.removed.map((item) => item.value))}`,
    })
  }

  if (changes.recolored.length) {
    const text = changes.recolored
      .slice(0, 3)
      .map(
        (item) =>
          `${item.value}: ${colorLabelMap[item.from]}→${colorLabelMap[item.to]}`,
      )
      .join(', ')
    const suffix =
      changes.recolored.length > 3
        ? ` 외 ${changes.recolored.length - 3}`
        : ''
    chips.push({
      key: `recolored-${changes.recolored.map((item) => item.id).join('-')}`,
      kind: 'recolored',
      text: `색상 ${text}${suffix}`,
    })
  }

  if (changes.moved.length) {
    chips.push({
      key: `moved-${changes.moved.map((item) => item.id).join('-')}`,
      kind: 'moved',
      text: `균형 ${formatValues(changes.moved.map((item) => item.value))}`,
    })
  }

  return chips
}
