export function stronglyConnectedComponents(nodes, edges) {
    const adjacency = new Map();
    for (const n of nodes)
        adjacency.set(n, []);
    for (const e of edges) {
        adjacency.get(e.from)?.push(e.to);
    }
    let index = 0;
    const stack = [];
    const onStack = new Set();
    const indices = new Map();
    const lowlink = new Map();
    const sccs = [];
    function strongConnect(v) {
        indices.set(v, index);
        lowlink.set(v, index);
        index++;
        stack.push(v);
        onStack.add(v);
        for (const w of adjacency.get(v) ?? []) {
            if (!indices.has(w)) {
                strongConnect(w);
                lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
            }
            else if (onStack.has(w)) {
                lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
            }
        }
        if (lowlink.get(v) === indices.get(v)) {
            const component = [];
            while (true) {
                const w = stack.pop();
                onStack.delete(w);
                component.push(w);
                if (w === v)
                    break;
            }
            sccs.push(component);
        }
    }
    for (const v of nodes) {
        if (!indices.has(v))
            strongConnect(v);
    }
    return sccs;
}
