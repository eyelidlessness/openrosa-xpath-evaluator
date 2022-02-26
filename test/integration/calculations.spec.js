const { expect } = require('chai');
const OpenRosaXpath = require('../../src/openrosa-xpath');

const initDoc = (xml) => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const evaluator = OpenRosaXpath();

  return { doc, evaluator };
};

describe.only('Calculations', () => {
  const { doc, evaluator } = initDoc(`<root>
    <item1>1</item1>
    <item2>2</item2>
    <item3>3</item3>
  </root>`);

  /**
   * @param {string} expr
   * @param {(nodes: Node[]) => Node[]} [filterNodes]
   */
  const evaluate = (expr, filterNodes = (nodes) => nodes) => {
    return evaluator.evaluate(expr, doc, null, XPathResult.ANY_TYPE, doc, 1, 1, filterNodes);
  };

  it('evaluates a path to a node', () => {
    const result = evaluate('/root/item1');

    expect(result.resultType).to.equal(XPathResult.UNORDERED_NODE_ITERATOR_TYPE);
    expect(result.snapshotLength).to.equal(1);
    expect(result.singleNodeValue instanceof Node).to.equal(true);
    expect(result.singleNodeValue.nodeName).to.equal('item1');
    expect(result.singleNodeValue.textContent).to.equal('1');
  });

  it('adds two paths', () => {
    const result = evaluate('/root/item1 + /root/item2');

    expect(result.resultType).to.equal(XPathResult.NUMBER_TYPE);
    expect(result.numberValue).to.equal(3);
  });

  it.only('filters nodes matched by subexpressions', () => {
    let noop = document.createElement('noop');

    noop.textContent = 0;

    const result = evaluate('/root/item1 + /root/item2 + /root/item3', (nodes) => (
      nodes.map((node) => (
        node.nodeName === 'item3'
          ? node
          : noop
      ))
    ));

    expect(result.resultType).to.equal(XPathResult.NUMBER_TYPE);
    expect(result.numberValue).to.equal(3);
  });
});
