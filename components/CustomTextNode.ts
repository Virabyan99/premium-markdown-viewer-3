import { TextNode as LexicalTextNode, NodeKey } from 'lexical';

export class CustomTextNode extends LexicalTextNode {
  __className: string;

  constructor(text: string, className: string, key?: NodeKey) {
    super(text, key);
    this.__className = className;
  }

  static getType(): string {
    return 'custom-text';
  }

  static clone(node: CustomTextNode): CustomTextNode {
    return new CustomTextNode(node.__text, node.__className, node.__key);
  }

  createDOM(config: any): HTMLElement {
    const dom = super.createDOM(config);
    if (this.__className) {
      dom.classList.add(...this.__className.split(' '));
    }
    return dom;
  }

  updateDOM(prevNode: CustomTextNode, dom: HTMLElement, config: any): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    if (this.__className !== prevNode.__className) {
      dom.classList.remove(...prevNode.__className.split(' '));
      dom.classList.add(...this.__className.split(' '));
      return true;
    }
    return updated;
  }

  static importJSON(serializedNode: any): CustomTextNode {
    const node = new CustomTextNode(serializedNode.text, serializedNode.className);
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'custom-text',
      className: this.__className,
    };
  }
}

export function $createCustomTextNode(text: string, className: string): CustomTextNode {
  return new CustomTextNode(text, className);
}

export function $isCustomTextNode(node: any): node is CustomTextNode {
  return node instanceof CustomTextNode;
}