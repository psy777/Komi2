import { GameTree, GameNode, StoneColor } from '../types';
import { v4 as uuidv4 } from 'uuid';
import pkg from '@sabaki/sgf';

const { parse, stringify } = pkg;

export const parseSGF = (sgfContent: string): GameTree => {
  const rootNodes = parse(sgfContent);
  if (!rootNodes || rootNodes.length === 0) {
    throw new Error("Invalid SGF or empty SGF content");
  }

  const nodes: Record<string, GameNode> = {};
  const rootNodeId = uuidv4();

  // Recursively process sabaki nodes
  const processNode = (sabakiNode: any, parentId: string | null, forceId?: string): string => {
    const nodeId = forceId || uuidv4();
    const node: GameNode = {
      id: nodeId,
      parentId,
      childrenIds: [],
      properties: {},
      chatHistory: [],
    };

    // Process properties mapping sabaki's arrays to our string formats
    if (sabakiNode.data) {
      for (const [key, values] of Object.entries<string[]>(sabakiNode.data)) {
        if (!values || values.length === 0) continue;

        if (values.length === 1) {
          node.properties[key] = values[0];
        } else {
          node.properties[key] = values.join(',');
        }

        if (key === 'B' || key === 'W') {
          const val = values[0] || '';
          if (val === '') {
            node.move = {
              color: key === 'B' ? StoneColor.BLACK : StoneColor.WHITE,
              x: -1,
              y: -1
            };
          } else {
            const x = val.charCodeAt(0) - 97;
            const y = val.charCodeAt(1) - 97;
            node.move = {
              color: key === 'B' ? StoneColor.BLACK : StoneColor.WHITE,
              x,
              y,
            };
          }
        }
        if (key === 'C') {
          node.comment = values.join('\n');
        }
      }
    }

    nodes[nodeId] = node;

    if (sabakiNode.children && sabakiNode.children.length > 0) {
      for (const child of sabakiNode.children) {
        const childId = processNode(child, nodeId);
        nodes[nodeId].childrenIds.push(childId);
      }
    }

    return nodeId;
  };

  // We start the root process
  processNode(rootNodes[0], null, rootNodeId);

  return {
    nodes,
    rootId: rootNodeId,
    currentId: rootNodeId,
  };
};

export const generateSGF = (tree: GameTree): string => {
  // Recursively build sabaki SGF format
  const buildSabakiNode = (nodeId: string): any => {
    const node = tree.nodes[nodeId];
    if (!node) return null;

    const data: Record<string, string[]> = {};

    if (nodeId === tree.rootId) {
      // Root usually needs these if missing
      if (!node.properties['GM']) data['GM'] = ['1'];
      if (!node.properties['FF']) data['FF'] = ['4'];
      if (!node.properties['SZ']) data['SZ'] = ['19'];
    }

    if (node.move && nodeId !== tree.rootId) {
      const colorKey = node.move.color === StoneColor.BLACK ? 'B' : 'W';
      if (node.move.x === -1 && node.move.y === -1) {
        data[colorKey] = ['']; // Pass
      } else {
        const charX = String.fromCharCode(node.move.x + 97);
        const charY = String.fromCharCode(node.move.y + 97);
        data[colorKey] = [`${charX}${charY}`];
      }
    }

    for (const [key, val] of Object.entries(node.properties)) {
      if (['B', 'W', 'SZ', 'GM', 'FF'].includes(key)) {
        // Keep existing properties if they existed (except moves which are handled)
        if (key === 'B' || key === 'W') continue;
      }
      const strVal = val as string;
      if (strVal.includes(',')) {
        data[key] = strVal.split(',');
      } else {
        data[key] = [strVal];
      }
    }

    if (node.comment && !data['C']) {
      data['C'] = [node.comment];
    }

    const children = node.childrenIds
      .map(childId => buildSabakiNode(childId))
      .filter(child => child !== null);

    return {
      data,
      children
    };
  };

  const rootSabakiNode = buildSabakiNode(tree.rootId);
  if (!rootSabakiNode) return "(;)";

  return stringify([rootSabakiNode]);
};
