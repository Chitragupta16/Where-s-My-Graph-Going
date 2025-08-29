GraphVisualizer.prototype.breadthFirstSearch = async function(startNode, endNode = null) {
    const queue = [startNode];
    const visited = new Set();
    const parent = {};
    let step = 1;
    
    this.updateNodeColor(startNode, '#4CAF50');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step ${step}: Starting BFS from node ${startNode}`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    while (queue.length > 0 && this.isRunning) {
        const current = queue.shift();
        
        if (visited.has(current)) continue;
        visited.add(current);
        this.updateNodeColor(current, '#2196F3');
        
        if (current !== startNode) {
            step++;
            document.getElementById('stepInfo').textContent = `Step ${step}: Visiting node ${current}`;
        }
        
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        if (endNode && current === endNode) {
            document.getElementById('stepInfo').textContent = `Step ${step + 1}: Found target node ${endNode}! Reconstructing path...`;
            await this.reconstructPath(parent, startNode, endNode);
            return;
        }
        
        if (this.graph[current]) {
            for (const neighbor of this.graph[current]) {
                if (!visited.has(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                    parent[neighbor] = current;
                    
                    this.updateEdgeColor(current, neighbor, '#FF9800', 3);
                    this.updateNodeColor(neighbor, '#FFC107');
                    
                    step++;
                    document.getElementById('stepInfo').textContent = `Step ${step}: Added ${neighbor} to queue from ${current}`;
                    this.drawGraph();
                    await this.sleep(this.speed);
                    await this.waitIfPaused();
                }
            }
        }
        
        this.updateNodeColor(current, '#2196F3');
        this.drawGraph();
    }
    
    if (endNode && !visited.has(endNode)) {
        document.getElementById('stepInfo').textContent = `BFS completed. Target node ${endNode} not reachable from ${startNode}.`;
    } else {
        document.getElementById('stepInfo').textContent = `BFS completed. Visited ${visited.size} nodes.`;
    }
};

GraphVisualizer.prototype.depthFirstSearch = async function(startNode, endNode = null) {
    const visited = new Set();
    const parent = {};
    let step = 1;
    
    const dfsRecursive = async (node) => {
        if (!this.isRunning) return false;
        
        visited.add(node);
        this.updateNodeColor(node, '#2196F3');
        
        document.getElementById('stepInfo').textContent = `Step ${step}: Visiting node ${node}`;
        step++;
        
        this.drawGraph();
        await this.sleep(this.speed);
        await this.waitIfPaused();
        
        if (endNode && node === endNode) {
            document.getElementById('stepInfo').textContent = `Step ${step}: Found target node ${endNode}! Reconstructing path...`;
            await this.reconstructPath(parent, startNode, endNode);
            return true;
        }
        
        if (this.graph[node]) {
            for (const neighbor of this.graph[node]) {
                if (!visited.has(neighbor)) {
                    parent[neighbor] = node;
                    
                    this.updateEdgeColor(node, neighbor, '#FF9800', 3);
                    this.updateNodeColor(neighbor, '#FFC107');
                    
                    document.getElementById('stepInfo').textContent = `Step ${step}: Exploring edge ${node} -> ${neighbor}`;
                    step++;
                    
                    this.drawGraph();
                    await this.sleep(this.speed);
                    await this.waitIfPaused();
                    
                    if (await dfsRecursive(neighbor)) {
                        return true;
                    }
                }
            }
        }
        
        this.updateNodeColor(node, '#2196F3');
        this.drawGraph();
        return false;
    };
    
    this.updateNodeColor(startNode, '#4CAF50');
    this.drawGraph();
    document.getElementById('stepInfo').textContent = `Step 1: Starting DFS from node ${startNode}`;
    await this.sleep(this.speed);
    await this.waitIfPaused();
    
    const found = await dfsRecursive(startNode);
    
    if (endNode && !found) {
        document.getElementById('stepInfo').textContent = `DFS completed. Target node ${endNode} not reachable from ${startNode}.`;
    } else if (!endNode) {
        document.getElementById('stepInfo').textContent = `DFS completed. Visited ${visited.size} nodes.`;
    }
};