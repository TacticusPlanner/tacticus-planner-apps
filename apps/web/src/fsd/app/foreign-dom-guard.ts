/**
 * Google Translate and some extensions re-parent the text nodes React renders (wrapping them in
 * `<font>`), so React's commit phase later calls insertBefore/removeChild against a parent that no
 * longer holds the node. The DOM throws NotFoundError there, outside any error boundary, and the
 * whole tree unmounts. Skip those two calls instead of throwing (facebook/react#11538).
 */
export function installForeignDomGuard(proto: Node = Node.prototype) {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- always invoked via .call(this)
  const { insertBefore, removeChild } = proto

  proto.insertBefore = function <T extends Node>(
    this: Node,
    node: T,
    child: Node | null
  ): T {
    if (child && child.parentNode !== this) return node
    return insertBefore.call(this, node, child) as T
  }

  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      child.parentNode?.removeChild(child)
      return child
    }
    return removeChild.call(this, child) as T
  }

  return () => {
    proto.insertBefore = insertBefore
    proto.removeChild = removeChild
  }
}
