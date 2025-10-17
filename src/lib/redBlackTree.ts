export type NodeColor = 'red' | 'black'

export interface SerializedNode {
  id: string
  value: number
  color: NodeColor
  parentId: string | null
  leftId: string | null
  rightId: string | null
}

export interface TreeSnapshot {
  id: string
  description: string
  nodes: SerializedNode[]
  highlightNodeIds: string[]
  changes: SnapshotChanges
}

export interface OperationRecord {
  id: string
  label: string
  snapshots: TreeSnapshot[]
}

export interface SnapshotChanges {
  added: Array<{ id: string; value: number }>
  removed: Array<{ id: string; value: number }>
  recolored: Array<{ id: string; value: number; from: NodeColor; to: NodeColor }>
  moved: Array<{ id: string; value: number }>
}

interface RBNode {
  id: string
  value: number
  color: NodeColor
  left: RBNode | null
  right: RBNode | null
  parent: RBNode | null
}

const compact = (...ids: (string | null | undefined)[]) =>
  ids.filter((id): id is string => Boolean(id))

const cloneNodes = (nodes: SerializedNode[]) =>
  nodes.map((node) => ({ ...node }))

const diffSnapshots = (
  previous: SerializedNode[],
  current: SerializedNode[],
): SnapshotChanges => {
  const prevMap = new Map(previous.map((node) => [node.id, node]))
  const currentMap = new Map(current.map((node) => [node.id, node]))

  const added: SnapshotChanges['added'] = []
  const removed: SnapshotChanges['removed'] = []
  const recolored: SnapshotChanges['recolored'] = []
  const moved: SnapshotChanges['moved'] = []

  current.forEach((node) => {
    const prevNode = prevMap.get(node.id)
    if (!prevNode) {
      added.push({ id: node.id, value: node.value })
      return
    }
    if (prevNode.color !== node.color) {
      recolored.push({
        id: node.id,
        value: node.value,
        from: prevNode.color,
        to: node.color,
      })
    }
    if (
      prevNode.parentId !== node.parentId ||
      prevNode.leftId !== node.leftId ||
      prevNode.rightId !== node.rightId
    ) {
      moved.push({ id: node.id, value: node.value })
    }
  })

  previous.forEach((node) => {
    if (!currentMap.has(node.id)) {
      removed.push({ id: node.id, value: node.value })
    }
  })

  return { added, removed, recolored, moved }
}

export class RedBlackTree {
  private root: RBNode | null = null
  private nodeCounter = 0

  insert(value: number): OperationRecord {
    const snapshots: TreeSnapshot[] = []
    let previousNodes = cloneNodes(this.serializeTree())
    const record = (description: string, highlightNodeIds: string[] = []) => {
      const nodes = this.serializeTree()
      const presentIds = new Set(nodes.map((node) => node.id))
      const validHighlights = highlightNodeIds.filter((id) => presentIds.has(id))
      const changes = diffSnapshots(previousNodes, nodes)
      const snapshotId = `snap-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${snapshots.length}`
      snapshots.push({
        id: snapshotId,
        description,
        nodes,
        highlightNodeIds: validHighlights,
        changes,
      })
      previousNodes = cloneNodes(nodes)
    }

    const existing = this.find(value)
    if (existing) {
      record(`${value} 이미 트리에 존재합니다.`, [existing.id])
      return {
        id: `op-${Date.now()}`,
        label: `${value} 삽입 취소`,
        snapshots,
      }
    }

    const newNode: RBNode = {
      id: `node-${this.nodeCounter++}`,
      value,
      color: 'red',
      left: null,
      right: null,
      parent: null,
    }

    let parent: RBNode | null = null
    let current = this.root
    while (current) {
      parent = current
      if (value < current.value) {
        current = current.left
      } else {
        current = current.right
      }
    }

    newNode.parent = parent
    if (!parent) {
      this.root = newNode
      record(`${value}를 루트로 삽입`, [newNode.id])
    } else if (value < parent.value) {
      parent.left = newNode
      record(`${value}를 ${parent.value}의 왼쪽 자식으로 삽입`, [
        newNode.id,
        parent.id,
      ])
    } else {
      parent.right = newNode
      record(`${value}를 ${parent.value}의 오른쪽 자식으로 삽입`, [
        newNode.id,
        parent.id,
      ])
    }

    this.fixInsert(newNode, record)
    if (this.root) {
      this.root.color = 'black'
      record(`루트를 검은색으로 유지`, [this.root.id])
    }

    return {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: `${value} 삽입`,
      snapshots,
    }
  }

  reset() {
    this.root = null
    this.nodeCounter = 0
  }

  has(value: number): boolean {
    return Boolean(this.find(value))
  }

  delete(value: number): OperationRecord {
    const snapshots: TreeSnapshot[] = []
    let previousNodes = cloneNodes(this.serializeTree())
    const record = (description: string, highlightNodeIds: string[] = []) => {
      const nodes = this.serializeTree()
      const presentIds = new Set(nodes.map((node) => node.id))
      const validHighlights = highlightNodeIds.filter((id) => presentIds.has(id))
      const changes = diffSnapshots(previousNodes, nodes)
      const snapshotId = `snap-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}-${snapshots.length}`
      snapshots.push({
        id: snapshotId,
        description,
        nodes,
        highlightNodeIds: validHighlights,
        changes,
      })
      previousNodes = cloneNodes(nodes)
    }

    const target = this.find(value)
    if (!target) {
      record(`${value} 값을 갖는 노드를 찾지 못했습니다.`)
      return {
        id: `op-${Date.now()}`,
        label: `${value} 삭제 취소`,
        snapshots,
      }
    }

    record(`${value} 노드를 삭제합니다.`, [target.id])

    let z = target
    let y = z
    let yOriginalColor: NodeColor = y.color
    let x: RBNode | null = null
    let xParent: RBNode | null = null

    if (!z.left) {
      x = z.right
      xParent = z.parent
      this.transplant(z, z.right)
      record(
        `${value}의 오른쪽 자식으로 대체`,
        compact(z.id, z.right?.id, z.parent?.id),
      )
    } else if (!z.right) {
      x = z.left
      xParent = z.parent
      this.transplant(z, z.left)
      record(
        `${value}의 왼쪽 자식으로 대체`,
        compact(z.id, z.left?.id, z.parent?.id),
      )
    } else {
      y = this.minimum(z.right)
      yOriginalColor = y.color
      x = y.right

      if (y.parent === z) {
        xParent = y
        if (x) {
          x.parent = y
        }
      } else {
        xParent = y.parent
        this.transplant(y, y.right)
        record(
          `${y.value}를 오른쪽 서브트리에서 끌어올림`,
          compact(y.id, y.right?.id, y.parent?.id),
        )
        y.right = z.right
        if (y.right) {
          y.right.parent = y
        }
      }

      this.transplant(z, y)
      y.left = z.left
      if (y.left) {
        y.left.parent = y
      }
      y.color = z.color

      record(
        `${value} 대신 ${y.value}로 대체`,
        compact(y.id, y.left?.id, y.right?.id),
      )
    }

    if (yOriginalColor === 'black') {
      this.fixDelete(x, xParent, record)
    }

    if (this.root) {
      this.root.color = 'black'
      record(`루트를 검은색으로 유지`, [this.root.id])
    } else {
      record(`트리가 비어 있습니다.`)
    }

    return {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: `${value} 삭제`,
      snapshots,
    }
  }

  private fixInsert(
    node: RBNode,
    record: (description: string, highlightNodeIds?: string[]) => void,
  ) {
    while (node !== this.root && node.parent?.color === 'red') {
      const parent = node.parent
      const grandParent = parent.parent
      if (!grandParent) {
        break
      }

      if (parent === grandParent.left) {
        const uncle = grandParent.right
        if (uncle?.color === 'red') {
          parent.color = 'black'
          uncle.color = 'black'
          grandParent.color = 'red'
          record(
            `부모(${parent.value})와 삼촌(${uncle.value})이 빨강이므로 재색칠`,
            [parent.id, uncle.id, grandParent.id],
          )
          node = grandParent
        } else {
          if (node === parent.right) {
            node = parent
            this.rotateLeft(node)
            record(
              `왼쪽 회전 (축: ${node.value})`,
              compact(node.id, node.parent?.id),
            )
          }
          parent.color = 'black'
          grandParent.color = 'red'
          this.rotateRight(grandParent)
          record(
            `오른쪽 회전 (축: ${grandParent.value})`,
            compact(parent.id, grandParent.id, parent.parent?.id),
          )
        }
      } else {
        const uncle = grandParent.left
        if (uncle?.color === 'red') {
          parent.color = 'black'
          uncle.color = 'black'
          grandParent.color = 'red'
          record(
            `부모(${parent.value})와 삼촌(${uncle.value})이 빨강이므로 재색칠`,
            [parent.id, uncle.id, grandParent.id],
          )
          node = grandParent
        } else {
          if (node === parent.left) {
            node = parent
            this.rotateRight(node)
            record(
              `오른쪽 회전 (축: ${node.value})`,
              compact(node.id, node.parent?.id),
            )
          }
          parent.color = 'black'
          grandParent.color = 'red'
          this.rotateLeft(grandParent)
          record(
            `왼쪽 회전 (축: ${grandParent.value})`,
            compact(parent.id, grandParent.id, parent.parent?.id),
          )
        }
      }
    }
  }

  private fixDelete(
    node: RBNode | null,
    parent: RBNode | null,
    record: (description: string, highlightNodeIds?: string[]) => void,
  ) {
    let current = node
    let currentParent = parent

    const isBlack = (target: RBNode | null) => !target || target.color === 'black'

    while (
      current !== this.root &&
      (current === null || current.color === 'black')
    ) {
      if (current === (currentParent?.left ?? null)) {
        let sibling = currentParent?.right ?? null
        if (!sibling) {
          current = currentParent
          currentParent = currentParent?.parent ?? null
          continue
        }

        if (sibling.color === 'red') {
          sibling.color = 'black'
          if (currentParent) {
            currentParent.color = 'red'
            record(
              `형제가 빨강이므로 왼쪽 회전 준비`,
              compact(
                currentParent.id,
                sibling.id,
                sibling.left?.id,
                sibling.right?.id,
              ),
            )
            this.rotateLeft(currentParent)
            record(
              `왼쪽 회전 (축: ${currentParent.value})`,
              compact(
                sibling.id,
                currentParent.id,
                currentParent.parent?.id,
                sibling.left?.id,
                sibling.right?.id,
              ),
            )
          }
          sibling = currentParent?.right ?? null
        }

        if (
          isBlack(sibling?.left ?? null) &&
          isBlack(sibling?.right ?? null)
        ) {
          if (sibling) {
            sibling.color = 'red'
            record(
              `형제와 그 자식이 모두 검정 -> 형제를 빨강으로`,
              compact(sibling.id, currentParent?.id),
            )
          }
          current = currentParent
          currentParent = currentParent?.parent ?? null
        } else {
          if (isBlack(sibling?.right ?? null)) {
            if (sibling?.left) {
              sibling.left.color = 'black'
            }
            if (sibling) {
              sibling.color = 'red'
              record(
                `형제의 왼쪽 자식이 빨강 -> 오른쪽 회전`,
                compact(sibling.id, sibling.left?.id, sibling.right?.id),
              )
              this.rotateRight(sibling)
            }
            sibling = currentParent?.right ?? null
          }

          if (sibling) {
            sibling.color = currentParent?.color ?? 'black'
            if (sibling.right) {
              sibling.right.color = 'black'
            }
          }
          if (currentParent) {
            currentParent.color = 'black'
            record(
              `형제의 오른쪽 자식이 빨강 -> 왼쪽 회전`,
              compact(
                currentParent.id,
                sibling?.id,
                sibling?.right?.id,
                sibling?.left?.id,
              ),
            )
            this.rotateLeft(currentParent)
          }
          current = this.root
          break
        }
      } else {
        let sibling = currentParent?.left ?? null
        if (!sibling) {
          current = currentParent
          currentParent = currentParent?.parent ?? null
          continue
        }

        if (sibling.color === 'red') {
          sibling.color = 'black'
          if (currentParent) {
            currentParent.color = 'red'
            record(
              `형제가 빨강이므로 오른쪽 회전 준비`,
              compact(
                currentParent.id,
                sibling.id,
                sibling.left?.id,
                sibling.right?.id,
              ),
            )
            this.rotateRight(currentParent)
            record(
              `오른쪽 회전 (축: ${currentParent.value})`,
              compact(
                sibling.id,
                currentParent.id,
                currentParent.parent?.id,
                sibling.left?.id,
                sibling.right?.id,
              ),
            )
          }
          sibling = currentParent?.left ?? null
        }

        if (
          isBlack(sibling?.right ?? null) &&
          isBlack(sibling?.left ?? null)
        ) {
          if (sibling) {
            sibling.color = 'red'
            record(
              `형제와 그 자식이 모두 검정 -> 형제를 빨강으로`,
              compact(sibling.id, currentParent?.id),
            )
          }
          current = currentParent
          currentParent = currentParent?.parent ?? null
        } else {
          if (isBlack(sibling?.left ?? null)) {
            if (sibling?.right) {
              sibling.right.color = 'black'
            }
            if (sibling) {
              sibling.color = 'red'
              record(
                `형제의 오른쪽 자식이 빨강 -> 왼쪽 회전`,
                compact(sibling.id, sibling.left?.id, sibling.right?.id),
              )
              this.rotateLeft(sibling)
            }
            sibling = currentParent?.left ?? null
          }

          if (sibling) {
            sibling.color = currentParent?.color ?? 'black'
            if (sibling.left) {
              sibling.left.color = 'black'
            }
          }
          if (currentParent) {
            currentParent.color = 'black'
            record(
              `형제의 왼쪽 자식이 빨강 -> 오른쪽 회전`,
              compact(
                currentParent.id,
                sibling?.id,
                sibling?.left?.id,
                sibling?.right?.id,
              ),
            )
            this.rotateRight(currentParent)
          }
          current = this.root
          break
        }
      }
    }

    if (current) {
      current.color = 'black'
      record(`마지막으로 검정색으로 설정`, [current.id])
    }
  }

  private rotateLeft(x: RBNode) {
    const y = x.right
    if (!y) {
      return
    }
    x.right = y.left
    if (y.left) {
      y.left.parent = x
    }
    y.parent = x.parent
    if (!x.parent) {
      this.root = y
    } else if (x === x.parent.left) {
      x.parent.left = y
    } else {
      x.parent.right = y
    }
    y.left = x
    x.parent = y
  }

  private rotateRight(x: RBNode) {
    const y = x.left
    if (!y) {
      return
    }
    x.left = y.right
    if (y.right) {
      y.right.parent = x
    }
    y.parent = x.parent
    if (!x.parent) {
      this.root = y
    } else if (x === x.parent.right) {
      x.parent.right = y
    } else {
      x.parent.left = y
    }
    y.right = x
    x.parent = y
  }

  private find(value: number): RBNode | null {
    let current = this.root
    while (current) {
      if (value === current.value) {
        return current
      }
      current = value < current.value ? current.left : current.right
    }
    return null
  }

  private serializeTree(): SerializedNode[] {
    const nodes: SerializedNode[] = []

    const traverse = (node: RBNode | null) => {
      if (!node) {
        return
      }
      nodes.push({
        id: node.id,
        value: node.value,
        color: node.color,
        parentId: node.parent ? node.parent.id : null,
        leftId: node.left ? node.left.id : null,
        rightId: node.right ? node.right.id : null,
      })
      traverse(node.left)
      traverse(node.right)
    }

    traverse(this.root)
    return nodes
  }

  private transplant(u: RBNode, v: RBNode | null) {
    if (!u.parent) {
      this.root = v
    } else if (u === u.parent.left) {
      u.parent.left = v
    } else {
      u.parent.right = v
    }
    if (v) {
      v.parent = u.parent
    }
  }

  private minimum(node: RBNode): RBNode {
    let current = node
    while (current.left) {
      current = current.left
    }
    return current
  }
}
