GraphVisualizer.prototype.dijkstraAlgorithm = async function(startNode, endNode) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    let step = 1;
    
    Object.keys(this.nodes).forEach(node => {
        distances[node] = node === startNode ? 0 : Infinity;
        previous[node] = null;
        unvisited.add(node);
    });
    
    this.updateNodeColor(startNode, '#4CAF50');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step ${step}: Initialize distances. Start: ${startNode} (distance: 0)`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    while (unvisited.size > 0 && this.isRunning) {
        let current = null;
        let minDistance = Infinity;
        
        for (const node of unvisited) {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                current = node;
            }
        }
        
        if (current === null || distances[current] === Infinity) break;
        
        unvisited.delete(current);
        this.updateNodeColor(current, '#FF9800');
        
        step++;
        document.getElementById('stepInfo').textContent = `Step ${step}: Processing node ${current} (distance: ${distances[current]})`;
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        if (current === endNode) {
            document.getElementById('stepInfo').textContent = `Step ${step + 1}: Reached target! Reconstructing shortest path...`;
            await this.reconstructShortestPath(previous, distances, startNode, endNode);
            return;
        }
        
        if (this.graph[current]) {
            for (const neighbor of this.graph[current]) {
                if (unvisited.has(neighbor)) {
                    const alt = distances[current] + this.getEdgeWeight(current, neighbor);
                    
                    this.updateEdgeColor(current, neighbor, '#FFC107', 3);
                    this.drawGraph();
                    
                    step++;
                    if (alt < distances[neighbor]) {
                        distances[neighbor] = alt;
                        previous[neighbor] = current;
                        this.updateNodeColor(neighbor, '#2196F3');
                        document.getElementById('stepInfo').textContent = `Step ${step}: Updated ${neighbor} distance to ${alt} via ${current}`;
                    } else {
                        document.getElementById('stepInfo').textContent = `Step ${step}: No improvement for ${neighbor} (current: ${distances[neighbor]}, via ${current}: ${alt})`;
                    }
                    
                    await this.sleep(this.speed);
                    await this.waitIfPaused();
                }
            }
        }
        
        this.updateNodeColor(current, '#666');
        this.drawGraph();
    }
    
    document.getElementById('stepInfo').textContent = `Dijkstra completed. No path found to ${endNode}.`;
};

GraphVisualizer.prototype.bellmanFordAlgorithm = async function(startNode, endNode) {
    const distances = {};
    const previous = {};
    const nodes = Object.keys(this.nodes);
    let step = 1;
    
    nodes.forEach(node => {
        distances[node] = node === startNode ? 0 : Infinity;
        previous[node] = null;
    });
    
    this.updateNodeColor(startNode, '#4CAF50');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step ${step}: Initialize distances for Bellman-Ford`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    for (let i = 0; i < nodes.length - 1 && this.isRunning; i++) {
        let updated = false;
        
        step++;
        document.getElementById('stepInfo').textContent = `Step ${step}: Iteration ${i + 1} - Relaxing all edges`;
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        for (const edge of this.edges) {
            const { from, to } = edge;
            const weight = this.getEdgeWeight(from, to);
            
            if (distances[from] !== Infinity) {
                const newDist = distances[from] + weight;
                
                this.updateEdgeColor(from, to, '#FFC107', 3);
                this.drawGraph();
                
                if (newDist < distances[to]) {
                    distances[to] = newDist;
                    previous[to] = from;
                    updated = true;
                    this.updateNodeColor(to, '#2196F3');
                    
                    step++;
                    document.getElementById('stepInfo').textContent = `Step ${step}: Updated ${to} distance to ${newDist} via ${from}`;
                } else {
                    step++;
                    document.getElementById('stepInfo').textContent = `Step ${step}: No update needed for edge ${from} -> ${to}`;
                }
                
                await this.sleep(this.speed);
                await this.waitIfPaused();
                
                this.updateEdgeColor(from, to, '#666', 2);
            }
        }
        
        if (!updated) {
            document.getElementById('stepInfo').textContent = `Step ${step + 1}: No updates in iteration ${i + 1}, algorithm converged early`;
            break;
        }
    }
    
    step++;
    document.getElementById('stepInfo').textContent = `Step ${step}: Checking for negative cycles...`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    for (const edge of this.edges) {
        const { from, to } = edge;
        const weight = this.getEdgeWeight(from, to);
        
        if (distances[from] !== Infinity && distances[from] + weight < distances[to]) {
            document.getElementById('stepInfo').textContent = `Negative cycle detected! Algorithm terminated.`;
            return;
        }
    }
    
    if (endNode && distances[endNode] !== Infinity) {
        document.getElementById('stepInfo').textContent = `Step ${step + 1}: Bellman-Ford completed. Reconstructing path...`;
        await this.reconstructShortestPath(previous, distances, startNode, endNode);
    } else {
        document.getElementById('stepInfo').textContent = `Bellman-Ford completed. No path to ${endNode} or node unreachable.`;
    }
};

GraphVisualizer.prototype.aStarAlgorithm = async function(startNode, endNode) {
    if (!endNode || !this.nodes[endNode]) {
        document.getElementById('stepInfo').textContent = 'A* requires a valid end node';
        return;
    }
    
    const openSet = new Set([startNode]);
    const closedSet = new Set();
    const gScore = {};
    const fScore = {};
    const previous = {};
    let step = 1;
    
    Object.keys(this.nodes).forEach(node => {
        gScore[node] = node === startNode ? 0 : Infinity;
        fScore[node] = node === startNode ? this.heuristic(startNode, endNode) : Infinity;
        previous[node] = null;
    });
    
    this.updateNodeColor(startNode, '#4CAF50');
    this.updateNodeColor(endNode, '#F44336');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step ${step}: A* initialized. Start: ${startNode}, Goal: ${endNode}`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    while (openSet.size > 0 && this.isRunning) {
        let current = null;
        let lowestF = Infinity;
        
        for (const node of openSet) {
            if (fScore[node] < lowestF) {
                lowestF = fScore[node];
                current = node;
            }
        }
        
        if (current === endNode) {
            step++;
            document.getElementById('stepInfo').textContent = `Step ${step}: Goal reached! Reconstructing optimal path...`;
            await this.reconstructShortestPath(previous, gScore, startNode, endNode);
            return;
        }
        
        openSet.delete(current);
        closedSet.add(current);
        this.updateNodeColor(current, '#FF9800');
        
        step++;
        document.getElementById('stepInfo').textContent = `Step ${step}: Processing ${current} (f=${fScore[current].toFixed(1)}, g=${gScore[current]})`;
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        if (this.graph[current]) {
            for (const neighbor of this.graph[current]) {
                if (closedSet.has(neighbor)) continue;
                
                const tentativeG = gScore[current] + this.getEdgeWeight(current, neighbor);
                
                this.updateEdgeColor(current, neighbor, '#FFC107', 3);
                this.drawGraph();
                
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                    this.updateNodeColor(neighbor, '#2196F3');
                }
                
                if (tentativeG < gScore[neighbor]) {
                    previous[neighbor] = current;
                    gScore[neighbor] = tentativeG;
                    fScore[neighbor] = gScore[neighbor] + this.heuristic(neighbor, endNode);
                    
                    step++;
                    document.getElementById('stepInfo').textContent = `Step ${step}: Updated ${neighbor} - g=${gScore[neighbor]}, f=${fScore[neighbor].toFixed(1)}`;
                } else {
                    step++;
                    document.getElementById('stepInfo').textContent = `Step ${step}: No improvement for ${neighbor}`;
                }
                
                await this.sleep(this.speed);
                await this.waitIfPaused();
            }
        }
        
        if (current !== startNode && current !== endNode) {
            this.updateNodeColor(current, '#666');
        }
        this.drawGraph();
    }
    
    document.getElementById('stepInfo').textContent = `A* completed. No path found to ${endNode}.`;
};