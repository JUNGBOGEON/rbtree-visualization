import { useMemo, useRef, useState } from 'react'
import './App.css'
import { ControlPanel } from './components/ControlPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TreeCanvas } from './components/TreeCanvas'
import { RedBlackTree } from './lib/redBlackTree'
import type { OperationRecord, TreeSnapshot } from './lib/redBlackTree'
import { buildChangeChips } from './lib/changeSummary'

function App() {
  const treeRef = useRef(new RedBlackTree())
  const [history, setHistory] = useState<OperationRecord[]>([])
  const [activeOperationIndex, setActiveOperationIndex] = useState<
    number | null
  >(null)
  const [activeSnapshotIndex, setActiveSnapshotIndex] = useState<number | null>(
    null,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState<number | null>(null)

  const activeSnapshot: TreeSnapshot | null = useMemo(() => {
    if (
      activeOperationIndex === null ||
      activeSnapshotIndex === null ||
      !history[activeOperationIndex]
    ) {
      return null
    }
    return (
      history[activeOperationIndex].snapshots[activeSnapshotIndex] ?? null
    )
  }, [history, activeOperationIndex, activeSnapshotIndex])

  const activeLabel =
    activeOperationIndex !== null ? history[activeOperationIndex]?.label : null

  const activeChangeChips = useMemo(() => {
    if (!activeSnapshot) {
      return []
    }
    return buildChangeChips(activeSnapshot.changes)
  }, [activeSnapshot])

  const pushOperation = (operation: OperationRecord) => {
    if (!operation.snapshots.length) {
      return
    }
    setHistory((prev) => {
      const next = [...prev, operation]
      setActiveOperationIndex(next.length - 1)
      setActiveSnapshotIndex(operation.snapshots.length - 1)
      return next
    })
    if (operation.label.includes('취소')) {
      setMessage(operation.snapshots.at(-1)?.description ?? null)
    } else {
      setMessage(null)
    }
    setSelectedNodeId(null)
    setSelectedValue(null)
  }

  const handleInsert = (value: number) => {
    const operation = treeRef.current.insert(value)
    pushOperation(operation)
  }

  const handleInsertRandom = () => {
    const maxAttempts = 30
    let candidate = 0
    let attempts = 0
    do {
      candidate = Math.floor(Math.random() * 99) + 1
      attempts += 1
      if (attempts >= maxAttempts) {
        setMessage('새로운 랜덤 값을 찾지 못했습니다.')
        return
      }
    } while (treeRef.current.has(candidate))
    const operation = treeRef.current.insert(candidate)
    pushOperation(operation)
  }

  const handleDeleteSelected = () => {
    if (selectedValue === null) {
      setMessage('삭제할 노드를 선택하세요.')
      return
    }
    const operation = treeRef.current.delete(selectedValue)
    pushOperation(operation)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Red-Black Tree 시각화</h1>
        </div>
      </header>

      <main className="app-main">
        <section className="visual-column">
          <ControlPanel
            onInsert={handleInsert}
            onReset={() => {
              treeRef.current.reset()
              setHistory([])
              setActiveOperationIndex(null)
              setActiveSnapshotIndex(null)
              setMessage('트리를 초기화했습니다.')
              setSelectedNodeId(null)
              setSelectedValue(null)
            }}
            onInsertRandom={handleInsertRandom}
            message={message}
            onClearMessage={() => setMessage(null)}
            onShowMessage={setMessage}
            selectedValue={selectedValue}
            onDeleteSelected={handleDeleteSelected}
            canDelete={selectedValue !== null}
          />

          <div className="tree-section">
            <div className="tree-section__meta">
              <span className="tree-section__label">
                {activeLabel ?? '최근 상태'}
              </span>
              {activeSnapshot ? (
                <span className="tree-section__description">
                  {activeSnapshot.description}
                </span>
              ) : (
                <span className="tree-section__description">
                  삽입 과정을 선택하면 상세 설명이 표시됩니다.
                </span>
              )}
              {activeSnapshot && activeChangeChips.length ? (
                <span className="tree-section__changes">
                  {activeChangeChips.map((chip) => (
                    <span key={chip.key} className={`change-chip ${chip.kind}`}>
                      {chip.text}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
            <TreeCanvas
              snapshot={activeSnapshot}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId, value) => {
                setSelectedNodeId(nodeId)
                setSelectedValue(value)
                setMessage(null)
              }}
            />
          </div>
        </section>

        <HistoryPanel
          history={history}
          activeOperationIndex={activeOperationIndex}
          activeSnapshotIndex={activeSnapshotIndex}
          onSelect={(operationIndex, snapshotIndex) => {
            setActiveOperationIndex(operationIndex)
            setActiveSnapshotIndex(snapshotIndex)
            setMessage(null)
            setSelectedNodeId(null)
            setSelectedValue(null)
          }}
        />
      </main>
    </div>
  )
}

export default App
