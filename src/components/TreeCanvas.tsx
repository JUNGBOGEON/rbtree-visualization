import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { computeTreeLayout, layoutConstants } from '../lib/treeLayout'
import type { TreeSnapshot } from '../lib/redBlackTree'

const nodeRadius = 22

interface TreeCanvasProps {
  snapshot: TreeSnapshot | null
  selectedNodeId: string | null
  onSelectNode?: (nodeId: string, value: number) => void
}

export const TreeCanvas = ({
  snapshot,
  selectedNodeId,
  onSelectNode,
}: TreeCanvasProps) => {
  const layout = useMemo(() => {
    if (!snapshot) {
      return null
    }
    return computeTreeLayout(snapshot.nodes)
  }, [snapshot])

  const changeTypeByNodeId = useMemo(() => {
    if (!snapshot) {
      return new Map<string, 'added' | 'recolored' | 'moved'>()
    }
    const map = new Map<string, 'added' | 'recolored' | 'moved'>()
    snapshot.changes.added.forEach((node) => map.set(node.id, 'added'))
    snapshot.changes.recolored.forEach((node) =>
      map.set(node.id, 'recolored'),
    )
    snapshot.changes.moved.forEach((node) => {
      if (!map.has(node.id)) {
        map.set(node.id, 'moved')
      }
    })
    return map
  }, [snapshot])

  const autoHighlightIds = useMemo(() => {
    if (!snapshot) {
      return new Set<string>()
    }
    const set = new Set(snapshot.highlightNodeIds)
    snapshot.changes.added.forEach((node) => set.add(node.id))
    snapshot.changes.recolored.forEach((node) => set.add(node.id))
    snapshot.changes.moved.forEach((node) => set.add(node.id))
    return set
  }, [snapshot])

  if (!snapshot || !layout) {
    return (
      <div className="tree-canvas empty">
        <p>노드를 추가하여 트리를 만들어보세요.</p>
      </div>
    )
  }

  const padding = 80
  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]))
  const boundsWidth = Math.max(
    Math.abs(layout.bounds.minX - layout.bounds.maxX) + padding * 2,
    layoutConstants.NODE_SPACING_X * 2,
  )
  const boundsHeight = Math.max(
    layout.bounds.maxY - layout.bounds.minY + padding * 2,
    layoutConstants.NODE_SPACING_Y * 2,
  )
  const viewBox = `${layout.bounds.minX - padding} ${layout.bounds.minY - padding} ${boundsWidth} ${boundsHeight}`

  const transition = {
    type: 'spring',
    stiffness: 180,
    damping: 24,
    mass: 1,
  }

  return (
    <div className="tree-canvas">
      <svg viewBox={viewBox} role="img" aria-label="레드 블랙 트리 시각화">
        <defs>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="rgba(0,0,0,0.25)"
            />
          </filter>
        </defs>
        <AnimatePresence>
          {layout.edges.map((edge) => {
            const source = nodesById.get(edge.sourceId)
            const target = nodesById.get(edge.targetId)
            if (!source || !target) {
              return null
            }
            return (
              <motion.line
                key={edge.id}
                initial={{
                  x1: source.x,
                  y1: source.y,
                  x2: source.x,
                  y2: source.y,
                  opacity: 0,
                }}
                animate={{
                  x1: source.x,
                  y1: source.y,
                  x2: target.x,
                  y2: target.y,
                  opacity: 0.8,
                }}
                exit={{
                  x1: target.x,
                  y1: target.y,
                  x2: target.x,
                  y2: target.y,
                  opacity: 0,
                }}
                transition={transition}
                stroke="#c8d0d9"
                strokeWidth={3}
              />
            )
          })}
        </AnimatePresence>

        <AnimatePresence>
          {layout.nodes.map((node) => {
            const isHighlighted = autoHighlightIds.has(node.id)
            const isSelected = selectedNodeId === node.id
            const changeType = changeTypeByNodeId.get(node.id)

            const highlightColor =
              changeType === 'added'
                ? '#34d399'
                : changeType === 'recolored'
                  ? '#fbbf24'
                  : changeType === 'moved'
                    ? '#818cf8'
                    : '#ffd166'
            const highlightFill =
              changeType === 'added'
                ? 'rgba(52, 211, 153, 0.14)'
                : changeType === 'recolored'
                  ? 'rgba(251, 191, 36, 0.16)'
                  : changeType === 'moved'
                    ? 'rgba(129, 140, 248, 0.18)'
                    : 'rgba(255, 209, 102, 0.12)'

            return (
              <motion.g
                key={node.id}
                initial={false}
                onClick={() => onSelectNode?.(node.id, node.value)}
                style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
                whileHover={
                  onSelectNode
                    ? {
                        scale: 1.025,
                      }
                    : undefined
                }
              >
                {isSelected && (
                  <motion.circle
                    key={`${node.id}-selected`}
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 16}
                    fill="rgba(56, 189, 248, 0.12)"
                    stroke="#38bdf8"
                    strokeDasharray="4 5"
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.65 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
                {isHighlighted && (
                  <motion.circle
                    key={`${node.id}-highlight`}
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 12}
                    fill={highlightFill}
                    stroke={highlightColor}
                    strokeWidth={2}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.45, 0.15] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                <motion.circle
                  initial={{
                    cx: node.x,
                    cy: node.y - 12,
                    opacity: 0,
                    scale: 0.6,
                  }}
                  animate={{
                    cx: node.x,
                    cy: node.y,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    cx: node.x,
                    cy: node.y + 12,
                    opacity: 0,
                    scale: 0.6,
                  }}
                  transition={transition}
                  r={nodeRadius}
                  fill={node.color === 'red' ? '#ff6b6b' : '#1f2933'}
                  stroke={isSelected ? '#38bdf8' : '#0f172a'}
                  strokeWidth={isSelected ? 3 : node.color === 'red' ? 1 : 2}
                  filter="url(#node-shadow)"
                />
                <motion.text
                  initial={{ x: node.x, y: node.y + 4, opacity: 0 }}
                  animate={{ x: node.x, y: node.y + 6, opacity: 1 }}
                  exit={{ x: node.x, y: node.y + 10, opacity: 0 }}
                  transition={transition}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="600"
                  fill={node.color === 'red' ? '#3b0709' : '#ffffff'}
                >
                  {node.value}
                </motion.text>
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>
    </div>
  )
}
