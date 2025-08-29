class GraphVisualizer {
    constructor() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.graph = {};
        this.nodes = {};
        this.edges = [];
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 500;
        this.currentStep = 0;
        this.steps = [];
        
        this.initializeEventListeners();
    }
    updateLegend(algorithm) {
        const legendItems = document.getElementById('legendItems');
        legendItems.innerHTML = '';
        
        const legends = this.getLegendForAlgorithm(algorithm);
        
        legends.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.id = `legend-${item.id}`;
            
            if (item.type === 'node') {
                legendItem.innerHTML = `
                    <div class="legend-color" style="background-color: ${item.color}"></div>
                    <span>${item.label}</span>
                `;
            } else if (item.type === 'edge') {
                legendItem.innerHTML = `
                    <div class="legend-edge" style="background-color: ${item.color}; height: ${item.width || 3}px;"></div>
                    <span>${item.label}</span>
                `;
            }
            
            legendItems.appendChild(legendItem);
        });
    }

    getLegendForAlgorithm(algorithm) {
        const commonNodes = [
            { id: 'unvisited', type: 'node', color: '#666', label: 'Unvisited' },
            { id: 'start', type: 'node', color: '#4CAF50', label: 'Start Node' }
        ];
        
        const commonEdges = [
            { id: 'default', type: 'edge', color: '#666', label: 'Default Edge', width: 2 }
        ];
        
        switch (algorithm) {
            case 'bfs':
            case 'dfs':
                return [
                    ...commonNodes,
                    { id: 'visited', type: 'node', color: '#2196F3', label: 'Visited' },
                    { id: 'queued', type: 'node', color: '#FFC107', label: 'In Queue/Stack' },
                    { id: 'path', type: 'node', color: '#9C27B0', label: 'Final Path' },
                    ...commonEdges,
                    { id: 'exploring', type: 'edge', color: '#FF9800', label: 'Exploring', width: 3 },
                    { id: 'path-edge', type: 'edge', color: '#9C27B0', label: 'Path Edge', width: 4 }
                ];
                
            case 'dijkstra':
            case 'bellman-ford':
                return [
                    ...commonNodes,
                    { id: 'end', type: 'node', color: '#F44336', label: 'End Node' },
                    { id: 'current', type: 'node', color: '#FF9800', label: 'Current Node' },
                    { id: 'updated', type: 'node', color: '#2196F3', label: 'Distance Updated' },
                    { id: 'path', type: 'node', color: '#9C27B0', label: 'Shortest Path' },
                    ...commonEdges,
                    { id: 'relaxing', type: 'edge', color: '#FFC107', label: 'Relaxing Edge', width: 3 },
                    { id: 'path-edge', type: 'edge', color: '#9C27B0', label: 'Shortest Path', width: 4 }
                ];
                
            case 'astar':
                return [
                    ...commonNodes,
                    { id: 'end', type: 'node', color: '#F44336', label: 'Goal Node' },
                    { id: 'current', type: 'node', color: '#FF9800', label: 'Current Node' },
                    { id: 'open', type: 'node', color: '#2196F3', label: 'Open Set' },
                    { id: 'path', type: 'node', color: '#9C27B0', label: 'Optimal Path' },
                    ...commonEdges,
                    { id: 'evaluating', type: 'edge', color: '#FFC107', label: 'Evaluating', width: 3 },
                    { id: 'path-edge', type: 'edge', color: '#9C27B0', label: 'Optimal Path', width: 4 }
                ];
                
            case 'prims':
                return [
                    ...commonNodes,
                    { id: 'mst-node', type: 'node', color: '#2196F3', label: 'In MST' },
                    ...commonEdges,
                    { id: 'mst-edge', type: 'edge', color: '#9C27B0', label: 'MST Edge', width: 4 },
                    { id: 'considering', type: 'edge', color: '#FFC107', label: 'Considering', width: 3 }
                ];
                
            case 'kruskals':
                return [
                    { id: 'unvisited', type: 'node', color: '#666', label: 'Node' },
                    { id: 'mst-node', type: 'node', color: '#2196F3', label: 'In MST' },
                    ...commonEdges,
                    { id: 'examining', type: 'edge', color: '#FFC107', label: 'Examining', width: 3 },
                    { id: 'mst-edge', type: 'edge', color: '#9C27B0', label: 'MST Edge', width: 4 },
                    { id: 'rejected', type: 'edge', color: '#F44336', label: 'Rejected (Cycle)', width: 2 }
                ];
                
            default:
                return [
                    ...commonNodes,
                    ...commonEdges
                ];
        }
    }

    showLegendItem(itemId) {
        const item = document.getElementById(`legend-${itemId}`);
        if (item) {
            item.classList.remove('hidden');
        }
    }

    hideLegendItem(itemId) {
        const item = document.getElementById(`legend-${itemId}`);
        if (item) {
            item.classList.add('hidden');
        }
    }
    initializeEventListeners() {
        document.getElementById('algorithmSelect').addEventListener('change', () => {
            this.updateAlgorithmControls();
            const algorithm = document.getElementById('algorithmSelect').value;
            this.updateLegend(algorithm);
        });
        document.getElementById('renderGraph').addEventListener('click', () => {
            this.renderGraph();  
        });
        document.getElementById('startVisualization').addEventListener('click', () => this.startVisualization());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.speed = 1000 - (e.target.value * 90);
        });
        
        document.getElementById('algorithmSelect').addEventListener('change', () => {
            this.updateAlgorithmControls();
        });
        
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.y;
            
            Object.keys(this.nodes).forEach(nodeId => {
                const pos = this.nodes[nodeId];
                const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                if (distance <= 25) {
                    this.showNodeInfo(nodeId);
                }
            });
        });
        
        this.updateAlgorithmControls();
    }
    
    parseGraphInput(input) {
        const lines = input.trim().split('\n');
        const graph = {};
        const nodes = new Set();
        
        lines.forEach(line => {
            const [node, connections] = line.split(':');
            if (node && connections) {
                const nodeId = node.trim();
                const connList = connections.trim()
                    .replace(/[\[\]]/g, '')
                    .split(',')
                    .map(c => c.trim())
                    .filter(c => c);
                
                graph[nodeId] = connList;
                nodes.add(nodeId);
                connList.forEach(conn => nodes.add(conn));
            }
        });
        
        return { graph, nodes: Array.from(nodes) };
    }
    
    generateNodePositions(nodes) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 80;
        const positions = {};
        
        if (nodes.length === 1) {
            positions[nodes[0]] = { x: centerX, y: centerY };
        } else {
            nodes.forEach((node, index) => {
                const angle = (2 * Math.PI * index) / nodes.length;
                positions[node] = {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                };
            });
        }
        
        return positions;
    }
    
    renderGraph() {
        const input = document.getElementById('graphInput').value;
        if (!input.trim()) return;
        
        try {
            const parsed = this.parseGraphInput(input);
            this.graph = parsed.graph;
            this.nodes = this.generateNodePositions(parsed.nodes);
            
            this.edges = [];
            Object.keys(this.graph).forEach(node => {
                this.graph[node].forEach(neighbor => {
                    this.edges.push({
                        from: node,
                        to: neighbor,
                        weight: 1
                    });
                });
            });
            
            this.drawGraph();
            const algorithm = document.getElementById('algorithmSelect').value;
            this.updateLegend(algorithm);
            document.getElementById('stepInfo').textContent = `Graph rendered with ${Object.keys(this.nodes).length} nodes and ${this.edges.length} edges.`;
        } catch (error) {
            document.getElementById('stepInfo').textContent = `Error parsing graph: ${error.message}`;
        }
    }
    
    drawGraph() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.edges.forEach(edge => {
            const fromPos = this.nodes[edge.from];
            const toPos = this.nodes[edge.to];
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromPos.x, fromPos.y);
            this.ctx.lineTo(toPos.x, toPos.y);
            this.ctx.strokeStyle = edge.color || '#666';
            this.ctx.lineWidth = edge.width || 2;
            this.ctx.stroke();
        });
        
        Object.keys(this.nodes).forEach(nodeId => {
            const pos = this.nodes[nodeId];
            const node = this.nodes[nodeId];
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
            this.ctx.fillStyle = node.color || '#666';
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(nodeId, pos.x, pos.y);
        });
    }
    
    updateNodeColor(nodeId, color) {
        if (this.nodes[nodeId]) {
            this.nodes[nodeId].color = color;
        }
    }
    
    updateEdgeColor(from, to, color, width = 2) {
        const edge = this.edges.find(e => 
            (e.from === from && e.to === to) || 
            (e.from === to && e.to === from)
        );
        if (edge) {
            edge.color = color;
            edge.width = width;
        }
    }
    
    async startVisualization() {
        if (this.isRunning) return;
        
        const algorithm = document.getElementById('algorithmSelect').value;
        const startNode = document.getElementById('startNode').value.trim();
        const endNode = document.getElementById('endNode').value.trim();
        
        if (!this.graph || Object.keys(this.graph).length === 0) {
            document.getElementById('stepInfo').textContent = 'Please render a graph first.';
            return;
        }
        
        if (!startNode || !this.nodes[startNode]) {
            if (algorithm !== 'kruskals') {
                document.getElementById('stepInfo').textContent = 'Please enter a valid start node.';
                return;
            }
        }
        
        this.reset();
        this.isRunning = true;
        
        try {
            switch (algorithm) {
                case 'bfs':
                    await this.breadthFirstSearch(startNode, endNode);
                    break;
                case 'dfs':
                    await this.depthFirstSearch(startNode, endNode);
                    break;
                case 'dijkstra':
                    if (!endNode || !this.nodes[endNode]) {
                        document.getElementById('stepInfo').textContent = 'Please enter a valid end node for Dijkstra.';
                        this.isRunning = false;
                        return;
                    }
                    await this.dijkstraAlgorithm(startNode, endNode);
                    break;
                case 'bellman-ford':
                    if (!endNode || !this.nodes[endNode]) {
                        document.getElementById('stepInfo').textContent = 'Please enter a valid end node for Bellman-Ford.';
                        this.isRunning = false;
                        return;
                    }
                    await this.bellmanFordAlgorithm(startNode, endNode);
                    break;
                case 'astar':
                    if (!endNode || !this.nodes[endNode]) {
                        document.getElementById('stepInfo').textContent = 'Please enter a valid end node for A*.';
                        this.isRunning = false;
                        return;
                    }
                    await this.aStarAlgorithm(startNode, endNode);
                    break;
                case 'prims':
                    await this.primsAlgorithm(startNode);
                    break;
                case 'kruskals':
                    await this.kruskalsAlgorithm();
                    break;
                default:
                    document.getElementById('stepInfo').textContent = 'Algorithm not yet implemented.';
            }
        } catch (error) {
            document.getElementById('stepInfo').textContent = `Error: ${error.message}`;
        }
        
        this.isRunning = false;
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async waitIfPaused() {
        while (this.isPaused && this.isRunning) {
            await this.sleep(100);
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.steps = [];
        document.getElementById('pauseBtn').textContent = 'Pause';
        
        Object.keys(this.nodes).forEach(nodeId => {
            this.nodes[nodeId].color = '#666';
        });
        
        this.edges.forEach(edge => {
            edge.color = '#666';
            edge.width = 2;
        });
        
        this.drawGraph();
        document.getElementById('stepInfo').textContent = 'Ready to start visualization.';
    }
    
    updateAlgorithmControls() {
        const algorithm = document.getElementById('algorithmSelect').value;
        const startNodeInput = document.getElementById('startNode');
        const endNodeInput = document.getElementById('endNode');
        
        if (algorithm === 'prims' || algorithm === 'kruskals') {
            endNodeInput.style.display = 'none';
            if (algorithm === 'kruskals') {
                startNodeInput.style.display = 'none';
            } else {
                startNodeInput.style.display = 'block';
            }
        } else if (algorithm === 'bfs' || algorithm === 'dfs') {
            startNodeInput.style.display = 'block';
            endNodeInput.style.display = 'block';
            endNodeInput.placeholder = 'End Node (optional)';
        } else {
            startNodeInput.style.display = 'block';
            endNodeInput.style.display = 'block';
            endNodeInput.placeholder = 'End Node (required)';
        }
    }
    
    validateInput() {
        const graphInput = document.getElementById('graphInput').value.trim();
        if (!graphInput) {
            document.getElementById('stepInfo').textContent = 'Please enter a graph in the input area.';
            return false;
        }
        return true;
    }
    
    showNodeInfo(nodeId) {
        let info = `Node: ${nodeId}`;
        
        if (this.graph[nodeId]) {
            info += ` | Connections: ${this.graph[nodeId].join(', ')}`;
        }
        
        document.getElementById('stepInfo').textContent = info;
    }
    
    getEdgeWeight(from, to) {
        const edge = this.edges.find(e => 
            (e.from === from && e.to === to) || 
            (e.from === to && e.to === from)
        );
        return edge ? edge.weight : 1;
    }
    
    heuristic(nodeA, nodeB) {
        const posA = this.nodes[nodeA];
        const posB = this.nodes[nodeB];
        return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)) / 50;
    }
    
    async reconstructPath(parent, start, end) {
        const path = [];
        let current = end;
        
        while (current !== undefined) {
            path.unshift(current);
            current = parent[current];
        }
        
        if (path[0] !== start) {
            document.getElementById('stepInfo').textContent = `No path found from ${start} to ${end}`;
            return;
        }
        
        for (let i = 0; i < path.length; i++) {
            this.updateNodeColor(path[i], '#9C27B0');
            
            if (i > 0) {
                this.updateEdgeColor(path[i-1], path[i], '#9C27B0', 4);
            }
            
            this.drawGraph();
            await this.sleep(this.speed);
            await this.waitIfPaused();
        }
        
        document.getElementById('stepInfo').textContent = `Path found: ${path.join(' -> ')} (Length: ${path.length - 1})`;
    }
    
    async reconstructShortestPath(previous, distances, start, end) {
        const path = [];
        let current = end;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }
        
        if (path[0] !== start) {
            document.getElementById('stepInfo').textContent = `No path found from ${start} to ${end}`;
            return;
        }
        
        for (let i = 0; i < path.length; i++) {
            this.updateNodeColor(path[i], '#9C27B0');
            
            if (i > 0) {
                this.updateEdgeColor(path[i-1], path[i], '#9C27B0', 4);
            }
            
            this.drawGraph();
            await this.sleep(this.speed);
            await this.waitIfPaused();
        }
        
        const totalDistance = distances[end];
        document.getElementById('stepInfo').textContent = `Shortest path: ${path.join(' -> ')} (Total distance: ${totalDistance})`;
    }
    
    addEdgesToQueue(node, visited, edgeQueue) {
        if (this.graph[node]) {
            this.graph[node].forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    const weight = this.getEdgeWeight(node, neighbor);
                    const existingEdge = edgeQueue.find(e => 
                        (e.from === node && e.to === neighbor) || 
                        (e.from === neighbor && e.to === node)
                    );
                    
                    if (!existingEdge) {
                        edgeQueue.push({
                            from: node,
                            to: neighbor,
                            weight: weight
                        });
                    }
                }
            });
        }
    }
    
    findRoot(parent, node) {
        if (parent[node] !== node) {
            parent[node] = this.findRoot(parent, parent[node]);
        }
        return parent[node];
    }
}

function loadSample(type) {
    const textarea = document.getElementById('graphInput');
    
    switch(type) {
        case 'simple':
            textarea.value = `A: [B, C]
B: [A, D, E]
C: [A, F]
D: [B]
E: [B, F]
F: [C, E]`;
            break;
        case 'weighted':
            textarea.value = `1: [2, 3, 4]
2: [1, 5]
3: [1, 6]
4: [1, 7]
5: [2, 8]
6: [3, 8]
7: [4, 8]
8: [5, 6, 7]`;
            break;
        case 'tree':
            textarea.value = `root: [A, B]
A: [root, C, D]
B: [root, E, F]
C: [A]
D: [A]
E: [B]
F: [B]`;
            break;
    }
}

let visualizer;