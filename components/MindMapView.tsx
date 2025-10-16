import * as React from 'react';
import { MindMapNode } from '../types.ts';
import Icon from './Icon.tsx';
import AIProgressBar from './AIProgressBar.tsx';

interface MindMapViewProps {
    mindMap: MindMapNode | null;
    onGenerate: () => void;
    isGenerating: boolean;
}

const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 20;
const PADDING = 40;

interface PositionedNode extends MindMapNode {
    x: number;
    y: number;
    children?: PositionedNode[];
}

const NodeAndConnections: React.FC<{ 
    node: PositionedNode, 
    parent?: PositionedNode, 
    isRoot?: boolean,
    onToggleCollapse: (topic: string) => void,
    collapsedNodes: Record<string, boolean>
}> = ({ node, parent, isRoot = false, onToggleCollapse, collapsedNodes }) => {
    const isCollapsed = collapsedNodes[node.topic] || false;
    
    const nodeColor = isRoot 
        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
        : 'bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow';

    const hasChildren = node.children && node.children.length > 0;

    return (
        <React.Fragment>
            {parent && (
                <path
                    d={`M ${parent.x + NODE_WIDTH},${parent.y + NODE_HEIGHT / 2} C ${parent.x + NODE_WIDTH + HORIZONTAL_SPACING / 2},${parent.y + NODE_HEIGHT / 2} ${node.x - HORIZONTAL_SPACING / 2},${node.y + NODE_HEIGHT / 2} ${node.x},${node.y + NODE_HEIGHT / 2}`}
                    stroke="url(#line-gradient)"
                    strokeWidth="2.5"
                    fill="none"
                />
            )}

            <foreignObject x={node.x} y={node.y} width={NODE_WIDTH} height={NODE_HEIGHT}>
                 <div className={`w-full h-full rounded-lg flex items-center justify-center p-2 text-center text-xs font-semibold ${nodeColor} transition-all relative`}>
                    {node.topic}
                    {hasChildren && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.topic); }} 
                            className="absolute right-[-10px] top-1/2 -translate-y-1/2 bg-white dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors shadow-md"
                        >
                            <Icon name={isCollapsed ? "plusCircle" : "minusCircle"} className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </foreignObject>
            
            {!isCollapsed && node.children?.map((child, index) => (
                <NodeAndConnections key={`${child.topic}-${index}`} node={child} parent={node} onToggleCollapse={onToggleCollapse} collapsedNodes={collapsedNodes} />
            ))}
        </React.Fragment>
    );
};

const MindMapView: React.FC<MindMapViewProps> = ({ mindMap, onGenerate, isGenerating }) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, width: 1, height: 1 });
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const [collapsedNodes, setCollapsedNodes] = React.useState<Record<string, boolean>>({});

    const toggleCollapse = (topic: string) => {
        setCollapsedNodes(prev => ({...prev, [topic]: !prev[topic]}));
    };

    const layout = React.useMemo(() => {
        if (!mindMap) return null;

        const positionNode = (node: MindMapNode, level: number, startY: number): { positioned: PositionedNode, height: number } => {
            const isCollapsed = collapsedNodes[node.topic];
            const children = !isCollapsed ? (node.children || []) : [];
            
            let currentY = startY;
            const positionedChildren: PositionedNode[] = [];
            let childrenTotalHeight = 0;
        
            for (const child of children) {
                const { positioned: positionedChild, height: childHeight } = positionNode(child, level + 1, currentY);
                positionedChildren.push(positionedChild);
                const spacing = childHeight > 0 ? VERTICAL_SPACING : 0;
                currentY += childHeight + spacing;
                childrenTotalHeight += childHeight + spacing;
            }
            if (children.length > 0) childrenTotalHeight -= VERTICAL_SPACING;
        
            let nodeY;
            if (positionedChildren.length > 0) {
                const firstChildY = positionedChildren[0].y;
                const lastChildY = positionedChildren[positionedChildren.length - 1].y;
                nodeY = firstChildY + (lastChildY - firstChildY) / 2;
            } else {
                nodeY = startY;
            }
        
            const positionedNode: PositionedNode = {
                ...node,
                x: level * (NODE_WIDTH + HORIZONTAL_SPACING),
                y: nodeY,
                children: positionedChildren
            };
            
            const height = Math.max(NODE_HEIGHT, childrenTotalHeight);
            
            return { positioned: positionedNode, height };
        }

        const { positioned: root } = positionNode(mindMap, 0, 0);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        function findBounds(node: PositionedNode) {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x + NODE_WIDTH);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y + NODE_HEIGHT);
            (node.children || []).forEach(findBounds);
        }
        findBounds(root);
        
        const width = (maxX - minX) + PADDING * 2;
        const height = (maxY - minY) + PADDING * 2;

        function applyOffset(node: PositionedNode, xOffset: number, yOffset: number): PositionedNode {
            return {
                ...node,
                x: node.x + xOffset,
                y: node.y + yOffset,
                children: (node.children || []).map(child => applyOffset(child, xOffset, yOffset))
            };
        }
        
        const finalRoot = applyOffset(root, -minX + PADDING, -minY + PADDING);

        return { root: finalRoot, width, height };
    }, [mindMap, collapsedNodes]);
    
    React.useEffect(() => {
        if (layout) {
            setViewBox({ x: 0, y: 0, width: layout.width, height: layout.height });
        }
    }, [layout]);
    
    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const CTM = svgRef.current.getScreenCTM();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        if (CTM) {
            return { x: (clientX - CTM.e) / CTM.a, y: (clientY - CTM.f) / CTM.d };
        }
        return { x: 0, y: 0 };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        setPanStart(getPoint(e));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        const point = getPoint(e);
        setViewBox(v => ({
            ...v,
            x: v.x - (point.x - panStart.x),
            y: v.y - (point.y - panStart.y),
        }));
    };

    const handleMouseUp = () => setIsPanning(false);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scale = 1.1;
        const { x, y } = getPoint(e);
        const { width, height } = viewBox;
        const newWidth = e.deltaY > 0 ? width * scale : width / scale;
        const newHeight = e.deltaY > 0 ? height * scale : height / scale;

        setViewBox(v => ({
            width: newWidth,
            height: newHeight,
            x: v.x + (x - v.x) * (1 - newWidth / v.width),
            y: v.y + (y - v.y) * (1 - newHeight / v.height),
        }));
    };

    const resetView = () => {
        if (layout) {
            setViewBox({ x: 0, y: 0, width: layout.width, height: layout.height });
        }
    };

    if (isGenerating) {
        return (
            <AIProgressBar
                title="Criando Mapa Mental..."
                messages={[
                    "Estruturando os tópicos principais...",
                    "Conectando ideias e subtópicos...",
                    "Organizando a hierarquia visualmente...",
                    "Polindo os detalhes do mapa...",
                ]}
                isGenerating={isGenerating}
            />
        );
    }

    if (!mindMap || !layout) {
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
        <div className="w-full flex flex-col items-center relative">
            <button
                onClick={resetView}
                className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-slate-900/50 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-indigo-500 shadow-md"
                title="Centralizar Mapa"
            >
                <Icon name="frame" className="w-5 h-5" />
            </button>
            <div 
                className={`w-full h-[60vh] overflow-hidden border border-slate-200 dark:border-slate-800 rounded-lg cursor-grab ${isPanning ? 'cursor-grabbing' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                 <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}>
                    <defs>
                        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" style={{stopColor: 'rgb(165 180 252)', stopOpacity: 1}} />
                           <stop offset="100%" style={{stopColor: 'rgb(192 132 252)', stopOpacity: 1}} />
                        </linearGradient>
                    </defs>
                    <g>
                        {layout && <NodeAndConnections node={layout.root} isRoot={true} onToggleCollapse={toggleCollapse} collapsedNodes={collapsedNodes} />}
                    </g>
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