GraphVisualizer.prototype.primsAlgorithm = async function(startNode) {
    const mstEdges = [];
    const visited = new Set();
    const edgeQueue = [];
    let step = 1;
    let totalWeight = 0;
    
    visited.add(startNode);
    this.updateNodeColor(startNode, '#4CAF50');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step ${step}: Starting Prim's algorithm from node ${startNode}`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    this.addEdgesToQueue(startNode, visited, edgeQueue);
    
    while (edgeQueue.length > 0 && visited.size < Object.keys(this.nodes).length && this.isRunning) {
        edgeQueue.sort((a, b) => a.weight - b.weight);
        const minEdge = edgeQueue.shift();
        
        if (visited.has(minEdge.to)) continue;
        
        visited.add(minEdge.to);
        mstEdges.push(minEdge);
        totalWeight += minEdge.weight;
        
        this.updateNodeColor(minEdge.to, '#2196F3');
        this.updateEdgeColor(minEdge.from, minEdge.to, '#9C27B0', 4);
        
        step++;
        document.getElementById('stepInfo').textContent = `Step ${step}: Added edge ${minEdge.from} -> ${minEdge.to} (weight: ${minEdge.weight}) to MST`;
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        this.addEdgesToQueue(minEdge.to, visited, edgeQueue);
        
        step++;
        document.getElementById('stepInfo').textContent = `Step ${step}: Updated edge queue from node ${minEdge.to}`;
        await this.sleep(this.speed);
        await this.waitIfPaused();
    }
    
    step++;
    document.getElementById('stepInfo').textContent = `Step ${step}: Prim's MST completed! Total weight: ${totalWeight}, Edges: ${mstEdges.length}`;
    
    for (const edge of mstEdges) {
        this.updateEdgeColor(edge.from, edge.to, '#9C27B0', 4);
    }
    this.drawGraph();
};

GraphVisualizer.prototype.kruskalsAlgorithm = async function() {
    const allEdges = [];
    const mstEdges = [];
    const parent = {};
    let step = 1;
    let totalWeight = 0;
    
    Object.keys(this.nodes).forEach(node => {
        parent[node] = node;
    });
    
    this.edges.forEach(edge => {
        allEdges.push({
            from: edge.from,
            to: edge.to,
            weight: this.getEdgeWeight(edge.from, edge.to)
        });
    });
    
    allEdges.sort((a, b) => a.weight - b.weight);
    
    document.getElementById('stepInfo').textContent = `Step ${step}: Starting Kruskal's algorithm. Sorted ${allEdges.length} edges by weight`;
    this.drawGraph();
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    for (const edge of allEdges) {
        if (!this.isRunning) break;
        
        step++;
        this.updateEdgeColor(edge.from, edge.to, '#FFC107', 3);
        document.getElementById('stepInfo').textContent = `Step ${step}: Examining edge ${edge.from} -> ${edge.to} (weight: ${edge.weight})`;
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        const rootFrom = this.findRoot(parent, edge.from);
        const rootTo = this.findRoot(parent, edge.to);
        
        if (rootFrom !== rootTo) {
            parent[rootTo] = rootFrom;
            mstEdges.push(edge);
            totalWeight += edge.weight;
            
            this.updateEdgeColor(edge.from, edge.to, '#9C27B0', 4);
            this.updateNodeColor(edge.from, '#2196F3');
            this.updateNodeColor(edge.to, '#2196F3');
            
            step++;
            document.getElementById('stepInfo').textContent = `Step ${step}: Added edge to MST. Components merged. MST edges: ${mstEdges.length}`;
        } else {
            this.updateEdgeColor(edge.from, edge.to, '#F44336', 2);
            step++;
            document.getElementById('stepInfo').textContent = `Step ${step}: Edge creates cycle, rejected. Nodes ${edge.from} and ${edge.to} already connected`;
        }
        
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        if (mstEdges.length === Object.keys(this.nodes).length - 1) {
            break;
        }
        
        if (rootFrom === rootTo) {
            this.updateEdgeColor(edge.from, edge.to, '#666', 2);
        }
    }
    
    step++;
    document.getElementById('stepInfo').textContent = `Step ${step}: Kruskal's MST completed! Total weight: ${totalWeight}, Edges: ${mstEdges.length}`;
    
    for (const edge of mstEdges) {
        this.updateEdgeColor(edge.from, edge.to, '#9C27B0', 4);
    }
    
    Object.keys(this.nodes).forEach(node => {
        if (mstEdges.some(e => e.from === node || e.to === node)) {
            this.updateNodeColor(node, '#2196F3');
        }
    });
    
    this.drawGraph();
};