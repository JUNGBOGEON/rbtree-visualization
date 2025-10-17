import { useState } from 'react'
import type { FormEvent } from 'react'

interface ControlPanelProps {
  onInsert: (value: number) => void
  onReset: () => void
  onInsertRandom: () => void
  message: string | null
  onClearMessage: () => void
  onShowMessage: (message: string) => void
  selectedValue: number | null
  onDeleteSelected: () => void
  canDelete: boolean
}

export const ControlPanel = ({
  onInsert,
  onReset,
  onInsertRandom,
  message,
  onClearMessage,
  onShowMessage,
  selectedValue,
  onDeleteSelected,
  canDelete,
}: ControlPanelProps) => {
  const [input, setInput] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      onShowMessage('값을 입력하세요.')
      return
    }
    const value = Number(trimmed)
    if (!Number.isInteger(value)) {
      onShowMessage('정수만 입력할 수 있습니다.')
      return
    }
    onInsert(value)
    setInput('')
  }

  return (
    <div className="control-panel">
      <form className="control-panel__form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="value-input">삽입 값</label>
          <input
            id="value-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              if (message) {
                onClearMessage()
              }
            }}
            placeholder="예: 42"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
        <div className="actions">
          <button type="submit" className="primary">
            삽입
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onInsertRandom()
              if (message) {
                onClearMessage()
              }
            }}
          >
            랜덤 삽입
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              onReset()
            }}
          >
            초기화
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (!canDelete) {
                onShowMessage('삭제할 노드를 먼저 선택하세요.')
                return
              }
              if (message) {
                onClearMessage()
              }
              onDeleteSelected()
            }}
            disabled={!canDelete}
          >
            선택 삭제
          </button>
        </div>
      </form>
      <div className="selection-indicator">
        <span className="selection-label">선택된 노드</span>
        <span className="selection-value">
          {selectedValue !== null ? selectedValue : '없음'}
        </span>
      </div>
      {message ? (
        <div className="control-panel__message">
          <span>{message}</span>
          <button type="button" onClick={onClearMessage} aria-label="알림 닫기">
            ×
          </button>
        </div>
      ) : null}
    </div>
  )
}
