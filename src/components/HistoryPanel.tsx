import type { OperationRecord } from '../lib/redBlackTree'
import { buildChangeChips } from '../lib/changeSummary'

interface HistoryPanelProps {
  history: OperationRecord[]
  activeOperationIndex: number | null
  activeSnapshotIndex: number | null
  onSelect: (operationIndex: number, snapshotIndex: number) => void
}

export const HistoryPanel = ({
  history,
  activeOperationIndex,
  activeSnapshotIndex,
  onSelect,
}: HistoryPanelProps) => {
  return (
    <aside className="history-panel">
      <h2>히스토리</h2>
      {history.length === 0 ? (
        <p className="history-panel__empty">
          삽입 연산이 기록되면 여기에서 순서대로 확인할 수 있습니다.
        </p>
      ) : (
        history.map((operation, opIndex) => {
          const isActiveOperation = activeOperationIndex === opIndex
          return (
            <div
              key={operation.id}
              className={`history-panel__operation ${
                isActiveOperation ? 'active' : ''
              }`}
            >
              <div className="operation-header">
                <span className="operation-title">{operation.label}</span>
                <span className="operation-meta">
                  {operation.snapshots.length} 단계
                </span>
              </div>
              <div className="operation-steps">
                {operation.snapshots.map((snapshot, snapIndex) => {
                  const isActiveStep =
                    isActiveOperation && activeSnapshotIndex === snapIndex
                  const chips = buildChangeChips(snapshot.changes)
                  return (
                    <button
                      key={snapshot.id}
                      type="button"
                      className={`operation-step ${
                        isActiveStep ? 'active' : ''
                      }`}
                      onClick={() => onSelect(opIndex, snapIndex)}
                    >
                      <span className="step-index">{snapIndex + 1}</span>
                      <span className="step-description">
                        {snapshot.description}
                      </span>
                      {chips.length ? (
                        <span className="operation-step__changes">
                          {chips.map((chip) => (
                            <span
                              key={chip.key}
                              className={`change-chip ${chip.kind}`}
                            >
                              {chip.text}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </aside>
  )
}
