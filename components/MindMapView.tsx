import * as React from 'react';
import { MindMapNode } from '../types.ts';
import Icon from './Icon.tsx';

interface MindMapViewProps {
    mindMap: MindMapNode | null;
    onGenerate: () => void;
    isGenerating: boolean;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 80;

interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    children?: PositionedNode[];
}

// Recursive component to render each node and its connections
const NodeAndConnections: React.FC<{ node: PositionedNode, parent?: PositionedNode, isRoot?: boolean }> = ({ node, parent, isRoot = false }) => {
    const nodeColor = isRoot 
        ? 'bg-purple-500 text-white shadow-lg' 
        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md';

    return (
        <React.Fragment>
            {/* Line from parent to current node */}
            {parent && (
                 <path
                    d={`M ${parent.x + NODE_WIDTH / 2},${parent.y + NODE_HEIGHT} C ${parent.x + NODE_WIDTH / 2},${parent.y + NODE_HEIGHT + VERTICAL_SPACING / 2} ${node.x + NODE_WIDTH / 2},${node.y - VERTICAL_SPACING / 2} ${node.x + NODE_WIDTH / 2},${node.y}`}
                    stroke="rgb(203 213 225)"
                    strokeWidth="2"
                    fill="none"
                    className="dark:stroke-slate-700"
                />
            )}

            {/* The node itself */}
            <foreignObject x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT}>
                 <div className={`w-full h-full rounded-lg flex items-center justify-center p-2 text-center text-sm font-semibold ${nodeColor} transition-all`}>
                    {node.topic}
                </div>
            </foreignObject>
            
            {/* Recursively render children */}
            {node.children?.map((child, index) => (
                <NodeAndConnections key={`${child.topic}-${index}`} node={child} parent={node} />
            ))}
        </React.Fragment>
    );
};


const MindMapView: React.FC<MindMapViewProps> = ({ mindMap, onGenerate, isGenerating }) => {
    const layout = React.useMemo(() => {
        if (!mindMap) return null;

        let y = 0;
        let lastXAtLevel: { [level: number]: number } = {};

        function positionNode(node: MindMapNode, level = 0): PositionedNode {
            const children = node.children?.map(child => positionNode(child, level + 1)) || [];
            
            let x;
            if (children.length > 0) {
                const firstChild = children[0];
                const lastChild = children[children.length - 1];
                x = (firstChild.x + lastChild.x) / 2;
            } else {
                 x = (lastXAtLevel[level] || -HORIZONTAL_SPACING - NODE_WIDTH) + NODE_WIDTH + HORIZONTAL_SPACING;
            }
            
            lastXAtLevel[level] = x;
            
            return {
                ...node,
                x,
                y: level * (NODE_HEIGHT + VERTICAL_SPACING),
                children
            };
        }
        
        const positionedRoot = positionNode(mindMap);

        // Center the tree horizontally
        function getMinMaxX(node: PositionedNode): {min: number, max: number} {
            let min = node.x;
            let max = node.x + NODE_WIDTH;
            for(const child of node.children || []) {
                const childBounds = getMinMaxX(child);
                min = Math.min(min, childBounds.min);
                max = Math.max(max, childBounds.max);
            }
            return {min, max};
        }

        const { min, max } = getMinMaxX(positionedRoot);
        const width = max - min;
        const xOffset = -min;

        function applyOffset(node: PositionedNode): PositionedNode {
            return {
                ...node,
                x: node.x + xOffset,
                children: node.children?.map(applyOffset)
            }
        }

        return { root: applyOffset(positionedRoot), width: width, height: (Object.keys(lastXAtLevel).length) * (NODE_HEIGHT + VERTICAL_SPACING) };

    }, [mindMap]);
    
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="loader" className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="mt-2 text-slate-500">IA está desenhando as conexões...</p>
            </div>
        );
    }

    if (!mindMap) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="mindMap" className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Visualize Conceitos em um Mapa Mental</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">Clique no botão abaixo para que a IA crie um mapa mental com base em suas anotações e documentos vinculados.</p>
                <button onClick={onGenerate} className="mt-6 bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2">
                    <Icon name="sparkles" className="w-5 h-5" />
                    <span>Gerar Mapa Mental</span>
                </button>
            </div>
        );
    }
    
    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full overflow-auto p-4">
                 <svg width={layout?.width} height={layout?.height} className="mx-auto">
                    {layout && <NodeAndConnections node={layout.root} isRoot={true} />}
                </svg>
            </div>
             <button onClick={onGenerate} className="mt-8 text-sm font-semibold text-indigo-500 hover:text-indigo-600 flex items-center space-x-1">
                <Icon name="sparkles" className="w-4 h-4" />
                <span>Gerar Novo Mapa</span>
            </button>
        </div>
    );
};

export default MindMapView;
