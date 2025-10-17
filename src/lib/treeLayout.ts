import type { SerializedNode } from './redBlackTree'

export interface PositionedNode extends SerializedNode {
  x: number
  y: number
  depth: number
}

export interface TreeEdge {
  id: string
  sourceId: string
  targetId: string
}

export interface LayoutResult {
  nodes: PositionedNode[]
  edges: TreeEdge[]
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

const NODE_SPACING_X = 90
const NODE_SPACING_Y = 120

export const computeTreeLayout = (nodes: SerializedNode[]): LayoutResult => {
  if (!nodes.length) {
    return {
      nodes: [],
      edges: [],
      bounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
      },
    }
  }

  const byId = new Map<string, SerializedNode>()
  const hasParent = new Set<string>()

  nodes.forEach((node) => {
    byId.set(node.id, node)
    if (node.leftId) {
      hasParent.add(node.leftId)
    }
    if (node.rightId) {
      hasParent.add(node.rightId)
    }
  })

  const root = nodes.find((node) => !node.parentId && !hasParent.has(node.id))
  const rootId = root ? root.id : nodes[0]?.id

  let orderIndex = 0
  const positioned: PositionedNode[] = []

  const assignCoordinates = (nodeId: string | null, depth: number) => {
    if (!nodeId) {
      return
    }
    const node = byId.get(nodeId)
    if (!node) {
      return
    }

    assignCoordinates(node.leftId, depth + 1)

    const x = orderIndex * NODE_SPACING_X
    const y = depth * NODE_SPACING_Y
    positioned.push({
      ...node,
      x,
      y,
      depth,
    })
    orderIndex += 1

    assignCoordinates(node.rightId, depth + 1)
  }

  if (rootId) {
    assignCoordinates(rootId, 0)
  }

  if (!positioned.length) {
    return {
      nodes: [],
      edges: [],
      bounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,
      },
    }
  }

  const minX = positioned.reduce((acc, node) => Math.min(acc, node.x), Infinity)
  const maxX = positioned.reduce((acc, node) => Math.max(acc, node.x), -Infinity)
  const minY = positioned.reduce((acc, node) => Math.min(acc, node.y), Infinity)
  const maxY = positioned.reduce((acc, node) => Math.max(acc, node.y), -Infinity)

  const centerOffset = (minX + maxX) / 2

  const centeredNodes = positioned.map((node) => ({
    ...node,
    x: node.x - centerOffset,
  }))

  const edges: TreeEdge[] = centeredNodes.flatMap((node) => {
    const list: TreeEdge[] = []
    if (node.leftId) {
      list.push({
        id: `${node.id}-${node.leftId}`,
        sourceId: node.id,
        targetId: node.leftId,
      })
    }
    if (node.rightId) {
      list.push({
        id: `${node.id}-${node.rightId}`,
        sourceId: node.id,
        targetId: node.rightId,
      })
    }
    return list
  })

  return {
    nodes: centeredNodes,
    edges,
    bounds: {
      minX: minX - centerOffset,
      maxX: maxX - centerOffset,
      minY,
      maxY,
    },
  }
}

export const layoutConstants = {
  NODE_SPACING_X,
  NODE_SPACING_Y,
}
